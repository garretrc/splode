/***

LOCAL CODE

The section below contains the local code that is executed at the program's
start-up. This is a mix of global variables (which must come before the
function defintions, and perhaps in the future the class declarations, I think)
and initial settings for the graphs.

***/

/*

Global Variables

*/

// Blank node's player
var empty = new Player("empty", "#444444", "0000");

// Need to initialize this
var splodeTime = 0;

// color of the edges
var edgeColor = "#000000";

// milliseconds between splodes.
var splodeConstant = 500;

// Proportion for bottom margin
var bottomMargin = .9;


/*

Set Players

*/
var p1 = new Player("Bob", "#D35400", "ouxr");
var p2 = new Player("Rob", "#27AE60", "pifr");
var players = [p1, p2];


/*

Set the Graph

*/

var testGraph = new HexGraph(4, players);

/*

Set Colors

*/
var possibleColors = ["#8E44AD", "#2ECC71", "#3498DB", "#D35400", "#F74C3C", "#F1C40F", "#17202A", "#73C6B6"]
var colorCount = 0;










/***

RUN-TIME FUNCTIONS

The code below contains all the functions that are required during the gameplay.
This includes various drawing functions, scaling functions, a click handler,
and the main function.

***/

/*

The following are draw functions.

*/
function drawBox(xPos, yPos, xSize, ySize, color) {
	ctx.beginPath();
	ctx.rect(xPos, yPos, xSize, ySize);
	ctx.fillStyle = color;
	ctx.fill();
	ctx.closePath();
}

function drawCircle(xPos, yPos, r, color) {
    ctx.beginPath();
    ctx.arc(xPos, yPos, r, 0, Math.PI*2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
}

// Used for drawing edges (drawn underneath the nodes)
function drawLine(xStart, yStart, xEnd, yEnd, color) {
	ctx.beginPath();
	ctx.strokeStyle = color;
	ctx.moveTo(xStart,yStart);
	ctx.lineTo(xEnd,yEnd);
	ctx.stroke();
	ctx.closePath();
}

// Draws the node and the dots on top
// Draws up to nine dots on a node
function drawDice(xPos, yPos, size, color, num) {
    drawCircle(xPos, yPos, size,color);
    ctx.fillStyle = "#ffffff";
    var dotRadius = size / 9;
    var dotPos = .3*size;
    if (num % 2 == 1)
        drawCircle(xPos, yPos, dotRadius);
    if (num >= 2) {
        drawCircle(xPos - dotPos, yPos + dotPos, dotRadius);
        drawCircle(xPos + dotPos, yPos - dotPos, dotRadius);
    }
    if (num >= 4) {
        drawCircle(xPos - dotPos, yPos - dotPos, dotRadius);
        drawCircle(xPos + dotPos, yPos + dotPos, dotRadius);
    }
    if (num >= 6) {
        drawCircle(xPos - dotPos, yPos, dotRadius);
        drawCircle(xPos + dotPos, yPos, dotRadius);
    }
    if (num >= 8) {
        drawCircle(xPos, yPos - dotPos, dotRadius);
        drawCircle(xPos, yPos + dotPos, dotRadius);
    }
}

function drawGraph(testGraph, width, height) {
	// Draw edges first
	for (let node of testGraph.nodes) {
		for (let neigh of node.neighbors) {
			var sNode = scale(width, height, testGraph, node);
			var sNeigh = scale(width, height, testGraph, neigh);
			drawLine(sNode.x, sNode.y, sNeigh.x, sNeigh.y, edgeColor);
		}
	}

	// Draw nodes on top
	for (let node of testGraph.nodes) {
		var sNode = scale(width, height, testGraph, node);
		drawDice(sNode.x, sNode.y, sNode.r, node.player.color, node.count);
	}
}




/*

The following two methods scale between the graph's coordinates and the
screen's coordinates.

*/
function scale(width, height, graph, node) {
	var scale = Math.min(width/graph.width, height/graph.height);
	return {
		x: (node.x - graph.minX)*scale,
		y: (node.y - graph.minY)*scale,
		r: node.r*scale
	};
}

function scaleBack(width, height, graph, x, y) {
	var scale = Math.max(graph.width/width, graph.height/height);
	return {
		x: x*scale + graph.minX,
		y: y*scale + graph.minY
	};
}





/*

This clickHandler is activated in the HTML. It notices a click, determines what
nodes it was in (if any) and then does the appropriate action. If the color of
the node is the same as the current player (or blank) then we increase the
number of dots in that node and at it to the graph's toProcess list.

*/
function clickHandler(evt) {
	//console.log("Click!");
	// Get coordinates in graph-space
	var coord = getMousePos(canvas, evt);
	if(coord.y >= canvas.height*bottomMargin && testGraph.prev != null) {
		testGraph = testGraph.prev;
		testGraph.undo();
	}
	var mousePos = scaleBack(canvas.width, canvas.height*bottomMargin, testGraph, coord.x, coord.y);
	for (let node of testGraph.nodes) {
		// For each node, see if the click was in it, and if the colors agree,
		// and if the time is okay to click.
		if(!testGraph.stillProcessing() && node.contains(mousePos.x, mousePos.y) && (node.player.ID == testGraph.currPlayer.ID || node.player == empty)) {
			testGraph = testGraph.duplicate();
			node = testGraph.nodes[testGraph.prev.nodes.indexOf(node)];
			console.log(node.count + " " + node.neighbors.length + " " + node.neighbors.length);
			node.count = node.count + 1;
			if(node.player.ID != testGraph.currPlayer.ID) {
				if(node.player != empty) {
					node.player.occupancy--;
				}
				testGraph.currPlayer.occupancy++;
				node.player = testGraph.currPlayer;
			}
			testGraph.toProcess = [];
			testGraph.toProcess.push(node);

			console.log(testGraph.toProcess);
		}
	}
}




/*

This method is what's called by the HTML repeatedly. It draws the graph and
associated elements, and controls the splode rate. It controls the splode rate
by waiting splodeTime if a splosion occured.

*/
function loop(time, width, height) {
	// Print Who's playing
	ctx.font = 30 + "px Arial";
	ctx.fillStyle = testGraph.currPlayer.color;
	ctx.fillText((!testGraph.hasWinner() ? (testGraph.currPlayer.name + "'s turn " + testGraph.currPlayer.getScore()) : "Game over"), 10, textSize + (bottomMargin-.04)*height);

	// Splode timing
	if(testGraph.stillProcessing() && splodeTime < time && testGraph.overflow < 30000) {
		var didSplode = testGraph.splode();
		splodeTime = time + (didSplode ? splodeConstant/Math.pow(testGraph.overflow, .5) + 50 : 0);
		if(!testGraph.stillProcessing()) {
			testGraph.nextTurn();
		}
		console.log(testGraph.time);
	}

	// Draw graphs
	drawGraph(testGraph, width, height*bottomMargin);
}

/* Random color generator for each new player created; not random anymore */
function getRandomColor() {
  if(colorCount < possibleColors.length) {
  	colorCount = colorCount + 1;
  	return possibleColors[colorCount-1];
  }
  var letters = '0123456789ABCDEF';
  var color = '#';
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}


/* Changes the number of players and resets the game */
function changeNumPlayers(num) {
	let newPlayers = [];
		colorCount = 0;
	for (let i = 0; i < num; i++) {
		var color = getRandomColor();
		let player = new Player(`Player ${i + 1}`, color, color);
		newPlayers.push(player);
	}
	players = newPlayers;

	testGraph.players = players;
	testGraph.currPlayer = testGraph.players[0];

	// Clear the graph
	for(let n of testGraph.nodes) {
		n.count = 0;
		n.player = empty;
	}
}


/* Prompt for changing number of players */
const numPlayersSelect = document.querySelector('.num-players-dropdown');
numPlayersSelect.addEventListener('click', () => {
  let numPlayers = prompt("Please enter total number of players", );
  if (numPlayers != null) changeNumPlayers(numPlayers);
  else changeNumPlayers(2);
});


/* Change graph type functions. In order to add a new graph to the selection,
add the name of your choice to the 'graphs' array and add a similar case to the
other cases in the switch statement of the chooseGraph() function */
const graphSelector = document.querySelector('.graph-selector');
const graphChangeButton = document.querySelector('.change-graph-button');
const graphNames = document.querySelectorAll('.graph-name');
graphChangeButton.addEventListener('click', () => {
  graphSelector.classList.toggle('graph-selector-open');
});

let graphs = ["Rectangle", "Square", "Cycle", "Path", "Wheel", "Complete", "Diamond", "Triangle", "Hexagon", "Bob's Graph"]

for (let graph of graphs) {
  graphSelector.innerHTML += `<div class='graph-name'>${graph}</div>`
}



function chooseGraph(e) {
  let size = 0;
  // Reset player stats
  for(let p of players) {
  	p.scores = [0];
  	p.occupancy = 0;
  }
  switch(this.textContent) {
    case "Rectangle":
      let width = parseInt(prompt("Choose width",));
      let height = parseInt(prompt("Choose height",));
      testGraph = new RectGraph([width, height], players);
      break;
    case "Square":
      size = parseInt(prompt("Choose size",));
      testGraph = new SquareGraph(size, players);
      break;
    case "Cycle":
      size = parseInt(prompt("Choose size",));
      testGraph = new CycleGraph(size, players);
      break;
    case "Path":
      size = parseInt(prompt("Choose size",));
      testGraph = new PathGraph(size, players);
      break;
    case "Wheel":
      size = parseInt(prompt("Choose size",));
      testGraph = new WheelGraph(size, players);
      break;
    case "Complete":
      size = parseInt(prompt("Choose size",));
      testGraph = new CompleteGraph(size, players);
      break;
    case "Diamond":
      size = parseInt(prompt("Choose size",));
      testGraph = new DiamondGraph(size, players);
      break;
    case "Triangle":
      size = parseInt(prompt("Choose size",));
      testGraph = new TriangleGraph(size, players);
      break;
    case "Hexagon":
      size = parseInt(prompt("Choose size",));
      testGraph = new HexGraph(size, players);
      break;
    case "Bob's Graph":
      testGraph = new BobGraph(players);
      break;
  }
  graphSelector.classList.remove('graph-selector-open');
}

var graphButtons = graphSelector.querySelectorAll('.graph-name');

graphButtons.forEach(graphButton => {
  graphButton.addEventListener('click', chooseGraph);
  graphButton.style.height = `${100/graphs.length}%`
});
