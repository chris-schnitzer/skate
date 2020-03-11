var express = require("express");
var router  = express.Router();
var Park   = require("../models/park");
var Comment = require("../models/comment");
var middleware = require("../middleware");
var NodeGeocoder = require("node-geocoder");
var Review = require("../models/review");

var multer = require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
var imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
var upload = multer({ storage: storage, fileFilter: imageFilter})

var cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: 'dwiw2yuib', 
  api_key: 123324629533855, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

var options = {
	provider: "google",
	httpAdapter: "https",
	apiKey: process.env.GEOCODER_API_KEY,
	formatter: null
};

var geocoder = NodeGeocoder(options);

//INDEX - Show all Parks
router.get("/", function(req, res){
	var noMatch = null;
	if(req.query.search){
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		//Get all parks from db
		Park.find({location: regex}, function(err, allParks){
			if(err){
				console.log(err);
			} else {
				if(allParks.length < 1){
					noMatch = "No parks match your search, please try again";
				}
				res.render("parks/index",{parks:allParks, page: "parks", noMatch: noMatch}); 
			}
		});
	} else {
	//Get all parks from db
		Park.find({}, function(err, allParks){
			if(err){
				console.log(err);
			} else {
				res.render("parks/index",{parks:allParks, page: "parks", noMatch: noMatch}); 
			}
		});
	}	
});

//CREATE - Add new park to DB
router.post("/", middleware.isLoggedIn, upload.single('image'), function(req, res) {
	//get data from form and add to parks array
	var name = req.body.name;
	var image = req.body.image;
	var desc = req.body.park.description;
	console.log(desc + " !!!!!!!!!!!!!!!!!!!!!!!");
	var author = {
		id: req.user._id,
		username: req.user.username
	}
	var level = req.body.level;


	geocoder.geocode(req.body.location, function(err, data) {
		if(err || !data.length) {
			req.flash("error", "Invalid address");
			return res.redirect("back");
		}

		cloudinary.v2.uploader.upload(req.file.path, function(error, result) {
			console.log(result, error);
  			// add cloudinary url for the image to the park object under image property
  			req.body.park.image = result.secure_url;
  			// add author to park
  			req.body.park.author = {
    			id: req.user._id,
    			username: req.user.username
  			}


			var lat = data[0].latitude;
			var lng = data[0].longitude;
			var location = data[0].formattedAdress;

			var newPark = {name: name, image: req.body.park.image, level: level, description: desc, author: author, location: req.body.location, lat: lat, lng: lng};
			//Create a new Park and save to DB
			Park.create(newPark, function(err, newlyCreated){
				if(err){
					req.flash("error", err.message);
					return res.redirect("back");
					console.log(err);
				} else {
					console.log(newlyCreated);

					//redirect back to parks
					res.redirect("/parks");
				}
			});
		});
	});
});

//NEW - SHOW form to create new park
router.get("/new", middleware.isLoggedIn, function(req, res){
	res.render("parks/new");
});

//SHOW - shows more info about one park
router.get("/:id", function(req, res){
	//find the park with the required ID
	Park.findById(req.params.id).populate("comments").populate({
		path: "reviews",
		options: {sort: {createdAt: -1}}
	}).exec(function(err, foundPark){
		if(err || !foundPark){
			console.log(err);
			req.flash("error", "Spot not found");
			res.redirect("back");
		} else {
			console.log(foundPark);
			//render show template with that park
			res.render("parks/show", {park: foundPark});
		}
	});
	
});

//Edit park route
router.get("/:id/edit", middleware.checkParkOwnership, function(req, res){
	Park.findById(req.params.id, function(err, foundPark){
		res.render("parks/edit", {park: foundPark});
	});
});

//Update park route
router.put("/:id", middleware.checkParkOwnership, upload.single('image'), function(req, res){
	// delete req.body.park.rating;
	var image = req.body.image;

	geocoder.geocode(req.body.location, function (err, data) {
	    if (err || !data.length) {
	      req.flash('error', 'Invalid address');
	      return res.redirect('back');
	    }
    	req.body.park.lat = data[0].latitude;
    	req.body.park.lng = data[0].longitude;
    	req.body.park.location = data[0].formattedAddress;


		    Park.findByIdAndUpdate(req.params.id, req.body.park, req.body.park.image, function(err, park){
		        if(err){
		            req.flash("error", err.message);
		            res.redirect("back");
		        } else {
		            req.flash("success","Successfully Updated!");
		            res.redirect("/parks/" + park._id);
		        }
		    });
		
  	});
});

//Destroy park route
router.delete("/:id", middleware.checkParkOwnership, function(req, res){

	Park.findByIdAndRemove(req.params.id, function(err, park){
		if(err){
			res.redirect("/parks");
		} else {
			//delete all comments with associated parks
			Comment.deleteOne({"_id": {$in: park.comments}}, function (err) {
			 	if (err) {
                    console.log(err);
                    return res.redirect("/parks");
             	}
            // deletes all reviews associated with the park
                Review.deleteOne({"_id": {$in: park.reviews}}, function (err) {
                    if (err) {
                        console.log(err);
                        return res.redirect("/parks");
                    }
                    //  delete the park
                    park.deleteOne();
                    req.flash("success", "spot deleted successfully!");
                    res.redirect("/parks"); 
                });    
			});
		}
	});
});



function escapeRegex(text){
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};



module.exports = router;