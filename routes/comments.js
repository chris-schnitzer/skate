var express = require("express");
var router = express.Router({mergeParams: true});
var Park = require("../models/park");
var Comment = require("../models/comment");
var middleware = require("../middleware");

//comments new
router.get("/new", middleware.isLoggedIn, function(req, res){
	//find park by id
	Park.findById(req.params.id, function(err, park){
		if(err){
			console.log(err);
		} else {
			res.render("comments/new", {park: park});
		}
	})
	
});

//comments create
router.post("/", middleware.isLoggedIn, function(req, res){
	//lookup park using id
	Park.findById(req.params.id, function(err, park){
		if(err){
			console.log(err);
			req.flash("error", "Something went wrong");
			res.redirect("/parks")
		} else {
			Comment.create(req.body.comment, function(err, comment){
				if(err){
					console.log(err);
				} else {
					//add username and id to comment
					comment.author.id = req.user._id;
					comment.author.username = req.user.username;
					//save comment
					comment.save();
					park.comments.push(comment);
					park.save();
					console.log("comment");
					req.flash("success", "successfully added comment");
					res.redirect('/parks/' + park._id);
				}
			});
		}
	});
});
//comment edit route
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res){
	Park.findById(req.params.id, function(err, foundPark){
		if (err){
			req.flash("error", "Spot not found");
			return res.redirect("back");
		}
		Comment.findById(req.params.comment_id, function(err, foundComment){
			if(err){
				res.redirect("back");
			} else {
				res.render("comments/edit", {park_id: req.params.id, comment: foundComment});
			}
		});
	});
});

//comment update
router.put("/:comment_id", middleware.checkCommentOwnership, function(req, res){
	Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
		if(err) {
			res.redirect("back");
		} else {
			res.redirect("/parks/" + req.params.id);
		}
	});
});

//comments destroy route
router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res){
	//findbyidandremove
	Comment.findByIdAndRemove(req.params.comment_id, function(err){
		if(err){
			res.redirect("back");
		} else {
			req.flash("error", "Comment deleted");
			res.redirect("/parks/" + req.params.id);
		}
	});
});

module.exports = router;