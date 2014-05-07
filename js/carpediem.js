var countryCode;
var lifeExpectancy;
var sex;

$(document).ready(function () {
		$('input[type=checkbox]').tooltip();
});


$(function () {
	$("#birthday").datepicker({
		changeMonth: true,
		changeYear: true,
		defaultDate: "-25Y",
		minDate: new Date(1890, 10 - 1, 25),
		yearRange: '1880:2013',
		maxDate: 0
	});
});

// the world bank api returns jsonp objects with a lowercase prefix, this works around that
function world_bank_api_hack() {
	$.ajaxSetup({
	  beforeSend: function(xhr, settings) {
	      var origCallback = settings.jsonpCallback;
	      settings.url = settings.url.replace(/=jQuery/, "=jquery");
	      window[origCallback.toLowerCase()] = function() {
	          window[origCallback].apply(this, arguments);
	      }
	  }
	});
}

function days_between(date1, date2) {

	// The number of milliseconds in one day
	var ONE_DAY = 1000 * 60 * 60 * 24

	// Convert both dates to milliseconds
	var date1_ms = date1.getTime()
	var date2_ms = date2.getTime()

	// Calculate the difference in milliseconds
	var difference_ms = Math.abs(date1_ms - date2_ms)

	// Convert back to days and return
	return Math.round(difference_ms / ONE_DAY)

}

function draw(radius, multiplierTotal, multiplierElapsed, perspective) {

	

	timeSpan = multiplierTotal * lifeExpectancy;

	perspectiveTimeSpan = timeSpan;

	// Store the current date and time
	var current_date = new Date()

	// Store the date of the next New Year's Day
	var birthday = $("#birthday").datepicker("getDate");

	if (birthday == null) {
		alert("Enter your birthday or this won't work. At all.");
		$("#birthday").focus();
		return 0;
	}
	// Call the days_between function

	var timeSpanElapsed = Math.round(days_between(current_date, birthday) / multiplierElapsed);


	var timeWastedTotal = 0;
	var timeWastedElapsed = 0;
	$("input[name=timewaster]:checked").each(function () {


		timeWastedTotal = timeWastedTotal + Math.round($(this).val() * timeSpan);
		timeWastedElapsed = timeWastedElapsed + Math.round($(this).val() * timeSpanElapsed);

	});

	var timeLeftCaption;
	if (multiplierTotal == 52) {
		timeLeftCaption = "Week";
	}
	if (multiplierTotal == 12) {
		timeLeftCaption = "Month";
	}
	if (multiplierTotal == 1) {
		timeLeftCaption = "Year";
	}

	var plural;
	if ((timeSpan - timeSpanElapsed > 1)) {
		plural = "s"
	}

	$("#timeLeft").html(Math.round((timeSpan - timeSpanElapsed)) + " " + timeLeftCaption + plural + " left.");

	$("#legend").html("&#9679; " + "1 " + timeLeftCaption);


	var canvas = document.getElementById('weeks');
	if (canvas.getContext) {


		var context = canvas.getContext('2d');

		//clear canvas
		context.clearRect(0, 0, canvas.width, canvas.height);

		var centerX = canvas.width / 2;
		var centerY = canvas.height / 2;


		var margin = 2 * radius;

		//how many circles fit into a line
		var totalCirclesPerLine = Math.round(canvas.width / (margin + radius));

		// ceiling, last line can be partial 
		var totalLines = Math.ceil(timeSpan / totalCirclesPerLine);

		Y = margin;
		week = 0;

		counter = 0;

		timeSpanCheck = timeSpan - timeSpanElapsed;
		

		var lastCircleInLine;
		while (timeSpan > 0) {
			var X = margin + radius;
			i = 1;
			while (i <= totalCirclesPerLine && timeSpan > 0) {

				i++;
				timeSpan--;

				if (timeSpan > timeSpanCheck) {
					if (timeWastedElapsed != null && timeWastedElapsed > 0) {
						timeWastedElapsed--;
						color = '#0088CC';
					} else {
						color = '#DEDEDE';
					}
				} else {
					if (timeWastedTotal != null && timeWastedTotal > 0) {
						timeWastedTotal--;
						color = '#006496';
					} else {
						color = 'black';
					}
				}


				counter++;

				context.beginPath();
				context.arc(X, Y, radius, 0, 2 * Math.PI, false);
				context.fillStyle = color;
				context.fill();
				context.closePath();

				X = X + margin + radius;
				lastCircleInLine = i;

			}
			Y = Y + margin + radius;

		}
		
		//draw perspectives

		// substract lifetime from perspective time
		perspective = perspective - perspectiveTimeSpan;

		color = "#FF8800"
		while (perspective > 0) {


			//figure out if we are continuing a line of dots
			if (lastCircleInLine > 0) {
				i = lastCircleInLine;

				//reset coordinates
				Y = Y - (margin + radius);

				//reset last dot counter
				lastCircleInLine = 0;
			} else {
				i = 1;
				X = margin + radius;
			}

			while (i <= totalCirclesPerLine && perspective > 0) {

				i++;
				perspective--;
		
				counter++;

				context.beginPath();
				context.arc(X, Y, radius, 0, 2 * Math.PI, false);
				context.fillStyle = color;
				context.fill();
				context.closePath();

				X = X + margin + radius;

			}
			Y = Y + margin + radius;

		}

	};

}

function init(radius, multiplierTotal, multiplierElapsed, perspective) {

	timeWaster = $("input[name=timewaster]:checked").val();

	if (lifeExpectancy == null || (sex != $("#sex").val())) {
		var url = "http://www.geoplugin.net/json.gp?jsoncallback=?";
		var urlWorldBank;
		sex = $("#sex").val();
		if (sex == "M") {
			qsex = "MA";
		} else {
			qsex = "FE";
		}

		$.when($.getJSON(url, function (data) {

			if (data['geoplugin_status'] == '200') {
				countryCode = data['geoplugin_countryCode'];
				urlWorldBank = "http://api.worldbank.org/countries/" + countryCode + "/indicators/SP.DYN.LE00." + qsex + ".IN?per_page=1&date=2010&format=jsonP&prefix=?";
			}
		})

		).then(function () {
			//hack to work around world bank api returning lower case prefixes
			world_bank_api_hack();

			$.when(
				$.getJSON(urlWorldBank, function (data2, status, xhr) {
				if ( xhr.status == 200 ) {
					lifeExpectancy = data2[1][0].value;
				} else {
					alert("API unavailable, using fallback data (US)");
					if (sex == "M") {
						lifeExpectancy = 78.2;
					} else {
						lifeExpectancy = 81.1;
					}
				}

			})).then(function () {

				draw(radius, multiplierTotal, multiplierElapsed, perspective);

			});
		});
	} else {
		draw(radius, multiplierTotal, multiplierElapsed, perspective);
	}
}