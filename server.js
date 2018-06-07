var express = require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var cheerio = require("cheerio");
var request = require("request");
var logger = require("morgan");

// Require all models
var db = require("./models");

var PORT = process.env.PORT || 3001;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
//app.use(express.static("public"));

// Set Handlebars.
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");


// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/savedArticles");

/////// Routes ////////

app.get("/", function(req, res) {
  res.render("index");
});

// A GET route for scraping the ksl website.
app.get("/scrape", function (req, res) {
	// Counter to keep track of how many articles are scrapped.
	let scrapped = 0;

	request("http://www.ksl.com", function (error, response, html) {

		// Load the HTML into cheerio and save it to a variable
		// '$' becomes a shorthand for cheerio's selector commands, much like jQuery's '$'
		const $ = cheerio.load(html);

		$("div.queue_story").each(function (i, element) {
			// An empty array to save the data that we'll scrape
			let result = {};

			result.title = $(element).children("div.headline").children("h2").children().text();
			result.link = $(element).children("div.headline").children("h2").children().attr("href");
			result.postedBy = $(element).children("div.headline").children("h4").children().text();
			result.description = $(element).children("div.headline").children("h5").text();
			result.picture = $(element).children("figure.image_box").children("a").children("picture").children("img").attr("data-srcset");

			db.Article.create(result)
				.then(function (dbArticle) {
					scrapped = scrapped + 1;
					// see the Article just added to the database.
					console.log('database scraped articles', dbArticle)
					console.log('scrapped', scrapped);
				})
				.catch(function (error) {
					return res.json(error);
				})
		});
	});
	// TODO: figure out how to get the count to work properly. It sends this before finishing the scrape.
	res.send('Scrap Complete. ' + scrapped + ' Articles Scrapped.');
	// end of scrap request
});

//Route to get all articles from the database.
app.get("/articles", function (req, res) {
	// Grabs everything from the Article database with an open find filter.
	db.Article.find({})
		.then(function (dbArticle) {
			// Sends found articles in JSON format.
			res.json(dbArticle);
		})
		.catch(function (error) {
			res.json(error);
		});
});


// Route for getting an Article by id and showing any associated notes.
app.get("/articles/:id", function (req, res) {
	// Uses the article id to search for the specific article.
	db.Article.findOne({ _id: req.params.id })
		// populate the associated notes.
		.populate("note")
		.then(function (dbArticle) {

			res.json(dbArticle);
		})
		.catch(function (error) {
			// if an error happens, send it to user.
			res.json(err);
		});
});


// Route for saving and updating an associated note to an Article.
app.post("/articles/:id", function (req, res) {
	// Create a new note and use the body of the note form.
	console.log('note body', req.body);
	db.Note.create(req.body)
		.then(function (dbNote) {
			// Once the note is created successfully, it will look up the Article id and update it with the associated note.
			return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
		})
		.then(function (dbArticle) {
			// Send back the article if sucessfully updated.
			res.json(dbArticle);
		})
		.catch(function (error) {
			res.json(error);
		});
});


// Start the server
app.listen(PORT, function () {
	console.log("App running on port " + PORT + "!");
});