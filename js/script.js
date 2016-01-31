////////////////////////////////////////////////////////////
//////////////////////// Set-up ////////////////////////////
////////////////////////////////////////////////////////////

var screenWidth = $(window).innerWidth(),
	screenHeight = ( $(window).innerHeight() > 160 ? $(window).innerHeight() : screenWidth );
    mobileScreen = (screenWidth > 500 ? false : true);

var margin = {left: 0, top: 0, right: 0, bottom: 0},
	width = screenWidth - margin.left - margin.right - 15,
	height = (mobileScreen ? 300 : screenHeight) - margin.top - margin.bottom - 25;
	
var maxSize = Math.min(width, height) / 2,
	resetRandom = true;
	
var colors = ["#00AC93", "#EC0080", "#FFE763"];	
var numColors = 3;
var startColor = getRandomNumber(0,numColors); //Loop through the colors, but the starting color is random
	
//Set initial random spirograph parameters
var spiroParameters = {};
	spiroParameters["Duration"] = 20; //seconds
	spiroParameters["Outer radius"] = getRandomNumber(60, maxSize);
	spiroParameters["Inner radius"] = getRandomNumber(40, (spiroParameters["Outer radius"] * 0.75));
	spiroParameters["rho"] = getRandomNumber(25, spiroParameters["Inner radius"]);
	spiroParameters.l = function() {
		return this["rho"]/this["Inner radius"];
	};
	spiroParameters.k = function() {
		return this["Inner radius"]/this["Outer radius"];
	};
	spiroParameters["Add spiro"] = addSpiro;
	spiroParameters["Add dashed spiro"] = addDashedSpiro;
	spiroParameters["Remove last"] = removeLastSpiro;
	spiroParameters["Reset"] = resetSpiro;
		
//Basic line function
var line = d3.svg.line()
	.x(function(d) { return d.x; })
	.y(function(d) { return d.y; });
					
//Create the SVG	
var svg = d3.select("#chart").append("svg")
			.attr("width", (width + margin.left + margin.right))
			.attr("height", (height + margin.top + margin.bottom))
		  .append("g").attr("class", "wrapper")
			.attr("transform", "translate(" + (width / 2 + margin.left) + "," + (height / 2 + margin.top) + ")");

////////////////////////////////////////////////////////////
////////////////// Spirograph functions ////////////////////
////////////////////////////////////////////////////////////
		
function drawSpiro(doDash) {
	var path = svg.append("path")
		.attr("class", "spirograph")
		.attr("d", line(plotSpiroGraph()) )
		.style("stroke", colors[startColor]);
		//.style("stroke", "hsla(" + startColor/numColors * 360 + ", 100%, 50%, " + 0.9 + ")");	
		
	var totalLength = path.node().getTotalLength();	
	  
	if (doDash) {
		//Adjusted from http://stackoverflow.com/questions/24021971/animate-the-drawing-of-a-dashed-svg-line
		var dashing = getRandomNumber(2,10) + ", " + getRandomNumber(2,10);  //Create random dash pattern
		console.log("Dash pattern is: " + dashing);
		//This returns the length of adding all of the numbers in dashing (the length of one pattern in essense)
		var dashLength = 
			dashing
				.split(/[\s,]/)
				.map(function (a) { return parseFloat(a) || 0 })
				.reduce(function (a, b) { return a + b });
		
	    var dashCount = Math.ceil( totalLength / dashLength );	//How many of these dash patterns will fit inside the entire path?
	    var newDashes = new Array(dashCount).join( dashing + " " );	//Create array that holds the pattern so it will fill the path
		//Then add one more dash pattern, namely with a visible part of length 0 (so nothing) and a white part
		//that is the same length as the entire path
		var dashArray = newDashes + " 0, " + totalLength;
	} else {
		//For a solid looking line, create a dash pattern with a visible part and a white part
		//that are the same length as the entire path
		var dashArray = totalLength + " " + totalLength;
	}
	
	//Animate the path by offsetting the path so all you see is the white last bit of dashArray 
	//and then setting this to 0 in a transition
	path
	  	.attr("stroke-dasharray", dashArray)
	  	.attr("stroke-dashoffset", totalLength)
	  	.transition().duration(spiroParameters["Duration"] * 1000).ease("linear")
		.attr("stroke-dashoffset", 0);
		
}//function drawSpiro
			
function plotSpiroGraph() {
    //Function adjusted from: https://github.com/rho2k/HTML5Demos/blob/master/Canvas/spiroGraph.html
	
    var R = spiroParameters["Outer radius"];
    var r = spiroParameters["Inner radius"];
    var rho = spiroParameters["rho"];
    var l = spiroParameters.l(); //rho / r;
    var k = spiroParameters.k(); //r / R;
    
    //Create the x and y coordinates for the spirograph and put these in a variable
	var lineData = [];
    for(var theta=1; theta<=20000; theta += 1){
        var t = ((Math.PI / 180) * theta);
        var ang = ((l-k)/k) * t;
        var x = R * ((1-k) * Math.cos(t) + ((l*k) * Math.cos(ang)));
        var y = R * ((1-k) * Math.sin(t) - ((l*k) * Math.sin(ang)));
		
        lineData.push({x: x, y: y});                               
    }  
	
	//Output the variables of this spiro         
	console.log("R: " + R + ", r: " + r + ", rho: " + rho + ", l: " + l + ", k: " + k);
	
	return lineData;
}//function plotSpiroGraph

////////////////////////////////////////////////////////////
//////////////////////// Functions /////////////////////////
////////////////////////////////////////////////////////////

//Add a property to D3 to select the first/last spiro drawn
//From http://stackoverflow.com/questions/25405359/how-can-i-select-last-child-in-d3-js
d3.selection.prototype.first = function() {
  return d3.select(this[0][0]);
};
d3.selection.prototype.last = function() {
  var last = this.size() - 1;
  return d3.select(this[0][last]);
};

function getRandomNumber(start, end) {
    return (Math.floor((Math.random() * (end-start))) + start);
}//function getRandomNumber

//Take random numbers for the spirograph variables
function doRandomValues() {
	spiroParameters["Outer radius"] = getRandomNumber(40, maxSize);
	spiroParameters["Inner radius"] = getRandomNumber(20, (spiroParameters["Outer radius"] * 0.9));
	spiroParameters["rho"] = getRandomNumber(15, spiroParameters["Inner radius"] * 0.9);
	changeOuterRadius(spiroParameters["Outer radius"]);
	changeInnerRadius(spiroParameters["Inner radius"]);
	resetRandom = true;
}//function doRandomValues

//If the viewer clicks anywhere and the screen then draw a spiro
//Mainly meant for the mobile viewers
d3.select("#chart").on("click", function() {
	Boolean(Math.floor(Math.random() * 2)) ? addSpiro() : addDashedSpiro() 
});

//Add a normal solid line spirograph
function addSpiro() {
	//If the controls have not been changed, take random values
	if ( resetRandom ) doRandomValues();
	//Move the color one further
	startColor = (startColor+1)%numColors;
	//Create and draw a spiro
	drawSpiro(false);
}//function addSpiro

//Add a dashed line spirograph
function addDashedSpiro() {
	//If the controls have not been changed, take random values
	if ( resetRandom ) doRandomValues();
	//Move the color one further
	startColor = (startColor+1)%numColors;		
	//Create and draw a dashed spiro
	drawSpiro(true);
}//function addDashedSpiro

//Remove all spirographs
function resetSpiro() {
	//Remove all spiros
	d3.selectAll(".spirograph").remove();
	//Set new start color
	startColor = getRandomNumber(0,numColors);
	resetRandom = true;
}//function resetSpiro

//Remove only the last drawn spirograph
function removeLastSpiro() {
	//Remove the last drawn spiro
	d3.selectAll(".spirograph").last().remove();
	//Move the color one back
	var newColor = (startColor-1)%numColors;
	startColor = (newColor < 0 ? newColor+3 : newColor);
	resetRandom = true;
}//function removeLastSpiro

////////////////////////////////////////////////////////////
//////////////////// Control functions /////////////////////
////////////////////////////////////////////////////////////
		
// Create an instance, which also creates a UI pane
//https://github.com/dataarts/dat.gui
var gui = new dat.GUI();

//Create a folder with drawing buttons
var folder1 = gui.addFolder('Drawing');

folder1.add(spiroParameters, "Add spiro");
folder1.add(spiroParameters, "Add dashed spiro");
folder1.add(spiroParameters, "Remove last");
folder1.add(spiroParameters, "Reset");
//Open the drawing options by default
folder1.open();
	
//Create a folder with spirograph setting parameters
var folder2 = gui.addFolder('Parameters');
		
var durationContr = folder2.add(spiroParameters, "Duration").min(1).max(120).step(1).listen();
durationContr.onChange(function(newValue) { 
	spiroParameters["Duration"] = newValue; 
});

var outerRadiusContr = folder2.add(spiroParameters, "Outer radius").min(1).max(maxSize).step(1).listen();
outerRadiusContr.onChange(function(newValue) { changeOuterRadius(newValue); });

var innerRadiusContr = folder2.add(spiroParameters, "Inner radius").min(1).max(spiroParameters["Outer radius"]).step(1).listen();
innerRadiusContr.onChange(function(newValue) { changeInnerRadius(newValue); })

var rhoContr = folder2.add(spiroParameters, "rho").min(1).max(spiroParameters["Inner radius"]).step(1).listen();
rhoContr.onChange(function(newValue) { changeRho(newValue); })

//Close the controls if the person is on mobile
if(mobileScreen) gui.close();

function changeOuterRadius(newValue) { 
	spiroParameters["Outer radius"] = newValue;
	innerRadiusContr.max(spiroParameters["Outer radius"]);
	//Make sure that you can never have r > R
	if ( spiroParameters["Outer radius"] <= spiroParameters["Inner radius"] ) {
		spiroParameters["Inner radius"] = spiroParameters["Outer radius"];
		//Make sure that you can never have that rho > r
		rhoContr.max(spiroParameters["Inner radius"]);
		if ( spiroParameters["Inner radius"] <= spiroParameters["rho"] ) {
			spiroParameters["rho"] = spiroParameters["Inner radius"];
		}//if
	}//if
	
	resetRandom = false;
}//function changeOuterRadius

function changeInnerRadius(newValue) { 
	spiroParameters["Inner radius"] = newValue;
	rhoContr.max(spiroParameters["Inner radius"]);
	//Make sure that you can never have that rho > r
	if ( spiroParameters["Inner radius"] <= spiroParameters["rho"] ) {
		spiroParameters["rho"] = spiroParameters["Inner radius"];
	}//if
	
	resetRandom = false;
}//function changeInnerRadius

function changeRho(newValue) { 
	spiroParameters["rho"] = newValue; 
	resetRandom = false;
}//function changeRho

////////////////////////////////////////////////////////////
///////////////// Spiro icon below info text ///////////////
////////////////////////////////////////////////////////////

//Only draw the extra spiro icon around the info box when not viewed on mobile
if(!mobileScreen) {
	//Draw a spiro icon in the center
	var ImageWidth = 300;
	var infoImage = svg.append("svg:image")
		.attr("class", "infoImage")
		.attr("xlink:href", "images/startSpiro.svg")
		.attr("x", -width/2 - 45)
		.attr("y", height/2 - 110)
		.attr("width", 160)
		.attr("height", 160)
		.style("text-anchor", "middle");
}//if

//Set the click functionality of the info button
d3.select("#info").on("click", function() {
	//Open the modal
	$('#myModal').modal('show');
});	

////////////////////////////////////////////////////////////
////////////////////////// Start ///////////////////////////
////////////////////////////////////////////////////////////
	
$(document).ready(function() {
	//Create the image pop-up functionality in the info box
    $("#spiro-parameters").fancybox({
          helpers: {
              title : { type : 'float' }
          }
    });
		
	//Start drawing one spirograph after 1.5 second after reload
	setTimeout(function() {
		drawSpiro(false);
	}, 1000);
  });