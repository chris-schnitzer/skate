var express = require("express");
var router = express.Router({mergeParams: true});
var Park = require("../models/park");
var Review = require("../models/review");
var middleware = require("../middleware");

// Reviews Index
router.get("/", function (req, res) {
    Park.findById(req.params.id).populate({
        path: "reviews",
        options: {sort: {createdAt: -1}} // sorting the populated reviews array to show the latest first
    }).exec(function (err, park) {
        if (err || !park) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("reviews/index", {park: park});
    });
});





// Reviews New
router.get("/new", middleware.isLoggedIn, middleware.checkReviewExistence, function (req, res) {
    // middleware.checkReviewExistence checks if a user already reviewed the park, only one review per user is allowed
    Park.findById(req.params.id, function (err, park) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("reviews/new", {park: park});
    });
});

// Reviews Create
router.post("/", middleware.isLoggedIn, middleware.checkReviewExistence, function (req, res) {
    //lookup park using ID
    Park.findById(req.params.id).populate("reviews").exec(function (err, park) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        Review.create(req.body.review, function (err, review) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            //add author username/id and associated park to the review
            review.author.id = req.user._id;
            review.author.username = req.user.username;
            review.park = park;
            //save review
            review.save();
            park.reviews.push(review);
            // calculate the new average review for the park
            park.rating = calculateAverage(park.reviews);
            //save park
            park.save();
            req.flash("success", "Your review has been successfully added.");
            res.redirect('/parks/' + park._id);
        });
    });
});

// Reviews Edit
router.get("/:review_id/edit", middleware.checkReviewOwnership, function (req, res) {
    Review.findById(req.params.review_id, function (err, foundReview) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("reviews/edit", {park_id: req.params.id, review: foundReview});
    });
});

// Reviews Update
router.put("/:review_id", middleware.checkReviewOwnership, function (req, res) {
    Review.findByIdAndUpdate(req.params.review_id, req.body.review, {new: true}, function (err, updatedReview) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        Park.findById(req.params.id).populate("reviews").exec(function (err, park) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            // recalculate park average
            park.rating = calculateAverage(park.reviews);
            //save changes
            park.save();
            req.flash("success", "Your review was successfully edited.");
            res.redirect('/parks/' + park._id);
        });
    });
});

// Reviews Delete
router.delete("/:review_id", middleware.checkReviewOwnership, function (req, res) {
    Review.findByIdAndRemove(req.params.review_id, function (err) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        Park.findByIdAndUpdate(req.params.id, {$pull: {reviews: req.params.review_id}}, {new: true}).populate("reviews").exec(function (err, campground) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            // recalculate park average
            // park.rating = calculateAverage(park.reviews);
            // //save changes
            // park.save();
            req.flash("success", "Your review was deleted successfully.");
            res.redirect("/parks/" + req.params.id);
        });
    });
});

function calculateAverage(reviews) {
    if (reviews.length === 0) {
        return 0;
    }
    var sum = 0;
    reviews.forEach(function (element) {
        sum += element.rating;
    });
    return sum / reviews.length;
}

module.exports = router;