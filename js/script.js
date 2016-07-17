////////////////////////////////////////////////////////////
//////////////////////// Set-up ////////////////////////////
////////////////////////////////////////////////////////////

var screenWidth = $(window).innerWidth(),
	screenHeight = ( $(window).innerHeight() > 160 ? $(window).innerHeight() : screenWidth );
    mobileScreen = (screenWidth > 500 ? false : true);

var margin = {left: 0, top: 0, right: 0, bottom: 0},
	width = screenWidth - margin.left - margin.right - 15,
	height = (mobileScreen ? 300 : screenHeight) - margin.top - margin.bottom - 25;

//Create the SVG	
var svg = d3.select("#chart").append("svg")
			.attr("width", (width + margin.left + margin.right))
			.attr("height", (height + margin.top + margin.bottom))
			.style("isolation", "isolate")
		  .append("g").attr("class", "wrapper")
			.attr("transform", "translate(" + (width / 2 + margin.left) + "," + (height / 2 + margin.top) + ")");

//If the viewer clicks anywhere and the screen then draw a spiro
//Mainly meant for the mobile viewers
d3.select("#chart").on("click", function() {
	addRandomSpiro(); //Boolean(Math.floor(Math.random() * 2)) ? addSpiro() : addDashedSpiro() 
});

////////////////////////////////////////////////////////////
////////////// Spirograph initial settings /////////////////
////////////////////////////////////////////////////////////

var maxSize = 200,
	colorReset = true,
	colorCounter = 1,
	maxRadiusScreenFirstSpiro = Math.min(width, height) / 2 * 0.6;

var colors = ["#EC0080", "#00AC93", "#FFE763"];	
var numColors = colors.length;
	
//Set initial random spirograph parameters
var spiroParameters = {};
	//Drawing controls
	spiroParameters["Add spiro"] = addSpiro;
	spiroParameters["Add dashed spiro"] = addDashedSpiro;
	spiroParameters["Add random spiro"] = addRandomSpiro;
	spiroParameters["Remove last"] = removeLastSpiro;
	spiroParameters["Reset"] = resetSpiro;
	//Parameter controls
	spiroParameters["Duration"] = 4; //in seconds
	spiroParameters["Outer wheel"] = 96;
	spiroParameters["Inner wheel"] = 56;
	spiroParameters["% inner wheel"] = 0.8;
	spiroParameters[eval('"\\u03B1"')] = 0.05;
	spiroParameters["Start"] = 0;
	spiroParameters["Steps"] = 10000;
	spiroParameters["Line width"] = 2;
	spiroParameters["Color mode"] = "screen";
	spiroParameters["Color"] = "#EC0080";
	spiroParameters["Background"] = "#101420";
	//Make the first spirograph fit nicely in the screen
	spiroParameters["Scale"] = Math.round(maxRadiusScreenFirstSpiro / spiroParameters["Outer wheel"] * 10)/10;
	
//Basic line function
var line = d3.svg.line()
	.x(function(d) { return d.x; })
	.y(function(d) { return d.y; });
					
////////////////////////////////////////////////////////////
////////////////// Spirograph functions ////////////////////
////////////////////////////////////////////////////////////
		
function drawSpiro(doDash) {

	var path = svg.append("path")
		.attr("class", "spirograph")
		.attr("d", line(plotSpiroGraph()) )
		//.attr("transform", "scale(" + spiroParameters["Scale"] + ")")
		.style("mix-blend-mode", spiroParameters["Color mode"])
		.style("stroke", spiroParameters["Color"])
		.style("stroke-width", spiroParameters["Line width"]);
		
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

    var R = spiroParameters["Scale"] * spiroParameters["Outer wheel"];
    var r = spiroParameters["Scale"] * spiroParameters["Inner wheel"];
    var rho = spiroParameters["% inner wheel"];
    var alpha = spiroParameters[eval('"\\u03B1"')];
    alpha = alpha * Math.PI / 180;
    var start = spiroParameters["Start"];
    var steps = spiroParameters["Steps"];
    
    var x0 = 5e5, 
    	y0 = 5e5;

    //Create the x and y coordinates for the spirograph and put these in a variable
	var lineData = [];
    for(var theta = start; theta < (start + steps); theta += 1){
        var t = (Math.PI / 180) * theta ;
        var x = (R-r) * Math.cos(t + alpha) + rho * r * Math.cos( (R-r)/r * t - alpha ) ;
        var y = (R-r) * Math.sin(t + alpha) - rho * r * Math.sin( (R-r)/r * t - alpha) ;
		
        lineData.push({x: x, y: y});   

        //Break out of the loop when you reach the starting location again
        //no use to run over the same loop again
        if( Math.abs(x - x0) < 1e-1 && Math.abs(y - y0) < 1e-1 && theta > start + 100 ) {
        	//console.log(theta);
        	break;
        }//if

        //Set the start location
        if(theta === start) {
        	x0 = x;
        	y0 = y;
        }//if

    }//for theta 
	
	//Output the variables of this spiro         
	console.log("Spirograph parameters: Outer wheel: " + spiroParameters["Outer wheel"] + ", Inner wheel: " + spiroParameters["Inner wheel"] + 
		", % of inner wheel: " + Math.round(rho*1000)/1000 + ", alpha: " + alpha + ", start: " + start + ", steps: " + (theta-start) + 
		", color: " + spiroParameters["Color"] + ", scale: " + spiroParameters["Scale"] + ", line width: " + spiroParameters["Line width"] );
	
	return lineData;
}//function plotSpiroGraph

////////////////////////////////////////////////////////////
//////////// Spirograph control functions //////////////////
////////////////////////////////////////////////////////////

//Take random numbers for the spirograph variables
function doRandomValues() {
	spiroParameters["Outer wheel"] = getRandomNumber(60, maxSize);
	outerRadiusContr.updateDisplay();

	spiroParameters["Inner wheel"] = getRandomNumber(30, (spiroParameters["Outer wheel"] * 0.99));
	//Check that r < R
	changeOuterRadius(spiroParameters["Outer wheel"]);

	spiroParameters["% inner wheel"] = Math.min( Math.random() + 0.2, 1);
	rhoContr.updateDisplay();
}//function doRandomValues

//Rotate to another color of no other color was picked
function pickNewColor() {
	spiroParameters["Color"] = colors[colorCounter % numColors];
	colorContr.updateDisplay();
	colorCounter++;
	colorReset = true;
}//pickNewColor

//Add a normal solid line spirograph
function addSpiro() {
	//Create and draw a spiro
	drawSpiro(false);
	//Pick a new color if no other color has been set
	if ( colorReset ) pickNewColor();
}//function addSpiro

//Add a dashed line spirograph
function addDashedSpiro() {	
	//Create and draw a dashed spiro
	drawSpiro(true);
	//Pick a new color if no other color has been set
	if ( colorReset ) pickNewColor();
}//function addDashedSpiro

//Add a normal solid line spirograph
function addRandomSpiro() {
	//Take random values
	doRandomValues();
	//Create and draw a spiro
	drawSpiro(false);
	//Pick a new color if no other color has been set
	if ( colorReset ) pickNewColor();
}//function addRandomSpiro

//Remove only the last drawn spirograph
function removeLastSpiro() {
	//Remove the last drawn spiro
	d3.selectAll(".spirograph").last().remove();
	//Move the color one back
	colorCounter = colorCounter - 2;
	if ( colorReset ) pickNewColor();
}//function removeLastSpiro

//Remove all spirographs
function resetSpiro() {
	//Remove all spiros
	d3.selectAll(".spirograph").remove();
}//function resetSpiro

////////////////////////////////////////////////////////////
///////////////// Drawing control functions ////////////////
////////////////////////////////////////////////////////////
		
// Create an instance, which also creates a UI pane
//https://github.com/dataarts/dat.gui
var gui = new dat.GUI();

//Create a folder with drawing buttons
var folder1 = gui.addFolder('Drawing');

folder1.add(spiroParameters, "Add spiro");
folder1.add(spiroParameters, "Add dashed spiro");
folder1.add(spiroParameters, "Add random spiro");
folder1.add(spiroParameters, "Remove last");
folder1.add(spiroParameters, "Reset");
//Open the drawing options by default
folder1.open();

////////////////////////////////////////////////////////////
/////////////// Parameter control functions ////////////////
////////////////////////////////////////////////////////////

//Create a folder with spirograph setting parameters
var folder2 = gui.addFolder('Parameters');	

var outerRadiusContr = folder2.add(spiroParameters, "Outer wheel").min(1).max(maxSize).step(1);
outerRadiusContr.onChange(function(newValue) { changeOuterRadius(newValue); });
function changeOuterRadius(newValue) { 
	spiroParameters["Outer radius"] = newValue;
	
	//Set the maximum of the inner wheel to the maximum of the outer fixed one
	innerRadiusContr.max(spiroParameters["Outer wheel"]);

	//Make sure that you can never have r > R
	if ( spiroParameters["Outer wheel"] <= spiroParameters["Inner wheel"] ) {
		spiroParameters["Inner wheel"] = spiroParameters["Outer wheel"];
	}//if

	innerRadiusContr.updateDisplay();
}//function changeOuterRadius

var innerRadiusContr = folder2.add(spiroParameters, "Inner wheel").min(1).max(spiroParameters["Outer wheel"]).step(1);
innerRadiusContr.onChange(function(newValue) { spiroParameters["Inner wheel"] = newValue; });

var rhoContr = folder2.add(spiroParameters, "% inner wheel").min(0).max(1).step(0.05);
rhoContr.onChange(function(newValue) { spiroParameters["% inner wheel"] = newValue; });

var alphaContr = folder2.add(spiroParameters, eval('"\\u03B1"')).min(-180).max(180).step(0.05);
alphaContr.onChange(function(newValue) { spiroParameters[eval('"\\u03B1"')] = newValue; });

var startContr = folder2.add(spiroParameters, "Start").min(0).max(20e3).step(50);
startContr.onChange(function(newValue) { spiroParameters["Start"] = newValue; });

var stepContr = folder2.add(spiroParameters, "Steps").min(0).max(20e3).step(50);
stepContr.onChange(function(newValue) { spiroParameters["Steps"] = newValue; });

var scaleContr = folder2.add(spiroParameters, "Scale").min(0.1).max(5).step(0.1);
scaleContr.onChange(function(newValue) { spiroParameters["Scale"] = newValue; });

var durationContr = folder2.add(spiroParameters, "Duration").min(1).max(20).step(1);
durationContr.onChange(function(newValue) { spiroParameters["Duration"] = newValue; });

var widthContr = folder2.add(spiroParameters, "Line width").min(0).max(30).step(0.5);
widthContr.onChange(function(newValue) { spiroParameters["Line width"] = newValue; });

var blendContr = folder2.add(spiroParameters, "Color mode", { Screen: "screen", Multiply: "multiply", None: "none" } );
blendContr.onChange(function(newValue) { spiroParameters["Color mode"] = newValue; });

var colorContr = folder2.addColor(spiroParameters, "Color");
colorContr.onChange(function(newValue) { 
	spiroParameters["Color"] = newValue; 
	colorReset = false;
});

var backColorContr = folder2.addColor(spiroParameters, "Background");
backColorContr.onChange(function(newValue) { 
	spiroParameters["Background"] = newValue; 
	d3.select("body").style("background", newValue);
});

//Open the parameter options by default
folder2.open();


//Close the controls if the person is on mobile
if(mobileScreen) gui.close();

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
		
	//Start drawing a spirograph combination 1 second after reload
	setTimeout(function() {

		//var colors = ["#170E5E", "#2A85C8", "#88C425", "#2A85C8", "#3ac0de"],
		var colors = ["#170E5E", "#2A85C8", "#88C425", "#2A85C8", "#00AC93"],
			background = spiroParameters["Background"],
			thick = 3,
			step = 0.05,
			offset = 3.75,
			startRho = 0.8,
			steps = 2600,
			scale = Math.round(maxRadiusScreenFirstSpiro / 96 * 10)/10;
			
		//R, r, rho, alpha, start, steps, duration, width, blendmode, color, background, scale
		changeParameters(96, 56, startRho, 0, 0, steps, 4, thick, "screen", colors[0], background, scale, false);
		drawSpiro(false);
		for(var i = 1; i <=3; i++) {
			changeParameters(96, 56, startRho - i*step, i*offset, 0, steps, 4, thick, "screen", colors[i], background, scale, false);
			drawSpiro(false);
			
			changeParameters(96, 56, startRho - i*step, -i*offset, 0, steps, 4, thick, "screen", colors[i], background, scale, false);
			drawSpiro(false);
		}//for i
		changeParameters(96, 56, startRho - 4*step, 4*offset, 0, steps, 4, thick, "screen", colors[colors.length-1], background, scale, true);
		drawSpiro(false);
		
	}, 1000);
  });

//Change all the parameters at once
function changeParameters(R, r, rho, alpha, start, steps, duration, width, blendmode, color, background, scale, update) {
	if(typeof R !== "undefined") spiroParameters["Outer wheel"] = R;
	if(typeof r !== "undefined") spiroParameters["Inner wheel"] = r;
	if(typeof rho !== "undefined") spiroParameters["% inner wheel"] = rho;
	if(typeof alpha !== "undefined") spiroParameters[eval('"\\u03B1"')] = alpha;
	if(typeof start !== "undefined") spiroParameters["Start"] = start;
	if(typeof steps !== "undefined") spiroParameters["Steps"] = steps;
	if(typeof duration !== "undefined") spiroParameters["Duration"] = duration;
	if(typeof width !== "undefined") spiroParameters["Line width"] = width;
	if(typeof blendmode !== "undefined") spiroParameters["Color mode"] = blendmode;
	if(typeof color !== "undefined") spiroParameters["Color"] = color;
	if(typeof background !== "undefined") spiroParameters["Background"] = background;
	if(typeof scale !== "undefined") spiroParameters["Scale"] = scale;
	
	if(update) {
		//Update the control box with the new parameters
		for (var i in folder2.__controllers) {
		    folder2.__controllers[i].updateDisplay();
		}//for i
	}//if
}//changeParameters

////////////////////////////////////////////////////////////
//////////////////// Helper Functions //////////////////////
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
