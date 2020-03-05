var mongoose = require("mongoose");
var Park = require("./models/park");
var Comment = require("./models/comment");

var data  = [
	{
		name: "Banzai Skate Park",
		image: "https://i.ytimg.com/vi/YjmqvNu9yjk/maxresdefault.jpg",
		description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book."
	},
	{
		name: "North Beach",
		image: "https://www.skateboard.com.au/images/nbdurban1.jpg",
		description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book."
	},
	{
		name: "Crantock",
		image: "https://i.ytimg.com/vi/cmeiR_TRdEM/hqdefault.jpg",
		description: "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book."
	}
]

function seedDB(){
	//remove all parks
	Park.deleteMany({}, function(err){
		if(err){
			console.log(err);
		}
		console.log("removed parks");
		data.forEach(function(seed){
			Park.create(seed, function(err, park){
				if(err){
					console.log(err);
				} else {
					console.log("added a park");
					//create a comment
					Comment.create({
						text: "This place is great but wish it had internet", 
						author: "Homer"
					}, function(err, comment){
						if(err){
							console.log(err);
						} else {
							park.comments.push(comment);
							park.save();
							console.log("created new park");
						}				
					});
				}
			});	
		});

	});	
	//add a few parks
	
	

	//add a few comments
}

module.exports = seedDB;
