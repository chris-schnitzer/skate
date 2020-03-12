require("dotenv").config();
var express    = require("express"),
	app        = express(),
	bodyParser = require("body-parser"),
	mongoose   = require("mongoose"),
	flash 	   = require("connect-flash"), 
	passport   = require("passport"),
	LocalStrategy = require("passport-local"),
	methodOverride = require("method-override"),
	Park 	   = require("./models/park"),
	Comment    = require("./models/comment"),
	User       = require("./models/user"),
	seedDB 	   = require("./seeds");

//requiring routes
var commentRoutes = require("./routes/comments"),
	reviewRoutes  = require("./routes/reviews"),
	parkRoutes    = require("./routes/parks"),
	indexRoutes   = require("./routes/index");	

console.log(process.env.DATABASEURL);

mongoose.connect(process.env.DATABASEURL, { useNewUrlParser: true });
//mongoose.connect("mongodb+srv://cschnitzer:kaifinny@cluster0-4rway.mongodb.net/test?retryWrites=true&w=majority", { useNewUrlParser: true });
process.env.databaseURL
mongoose.set('useFindAndModify', false);
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
//seedDB(); //seed the database

app.locals.moment = require("moment");

//PASSPORT CONFIGURATION
app.use(require("express-session")({
	secret: "Kai and Finny are the best",
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
});

app.use("/", indexRoutes);
app.use("/parks", parkRoutes);
app.use("/parks/:id/comments", commentRoutes);
app.use("/parks/:id/reviews", reviewRoutes);


// app.listen(3000, function(){
// 	console.log("The SkateHunt Server Has Started");
// });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Our app is running on port ${ PORT }`);
});






































