// Grab the articles as a json
$.getJSON("/articles", function(data) {
	console.log(data);
  // For each one
  for (var i = 0; i < data.length; i++) {
		// Display the apropos information on the page
		const div = $("<div>");
		div.append("<img src=" + data[i].image + "><p data-id='" + data[i]._id + "'>" + data[i].title + "<br />" + data[i].link + "<br />" + data[i].description + "</p>");
		div.addClass("scrapped-articles").attr("data-id=" + data[i]._id);
    $("#articles").append(div);
  }
});