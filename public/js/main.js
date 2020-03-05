$(document).ready(function () {
  	$("#menu_button").click(function() {
  		$("nav").toggleClass("toggle-nav");
  		$("body").toggleClass("no-overflow");
  		$("nav").toggleClass("overflow");
	});
});

