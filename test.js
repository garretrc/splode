/***

CLASSES

The following section of code contains the definition of all classes that we
find useful. Most fundamental are the Node, Graph, and Player classes. There
are several subclasses of the Graph class which create specific (parameterized)
boards but do not change the functionality of the Graph class. Further
description can be found near the classes themselves.

***/


/*

The Node class is the fundamental element of the game, represented as a circle
when drawn. A node is specified by its coordinates and radius (which are
properly scaled along with other nodes to fit on to the screen during gameplay).
A node also keep track of how many dots are in it, what it's neighbors are, and
which player owns it. There are two methods: one to add a neighbor, one to see
if a given coordinate is contained within the node.

*/
class Node
{
    constructor(x, y, r)
    {
        this.neighbors = [];
        this.neighbors.push(this);
        this.player = empty;
        this.count = 0;
        this.x=x;
        this.y=y;
        this.r=r;
    }

    addNeighbor(node)
    {
        this.neighbors.push(node);
    }

    contains(xCoord, yCoord)
    {
    	var dx = xCoord - this.x;
    	var dy = yCoord - this.y;
    	return (Math.sqrt(dx*dx + dy*dy) <= this.r);
    }
}

/*

The Graph class is where the action is. A graph consists of an array of nodes,
and the nodes keep track of adjacency to other nodes. The Graph class also
contains and keeps track of the full set of players and their current score
(how many spaces they occupy), as well as a bounding box for drawing the graph
and a queue for sploding nodes. The Graph class has methods to add and remove
nodes, to determine its boundaries once new nodes have been added (this is NOT
enforces upon adding new nodes), to splode, and to determine if there is a
winner.

All predefined (parameterized) boards should be extensions of the Graph class.
See RectGraph for a good example of how to extend the Graph class. Most
importantly, once all nodes and edges have been placed, be sure to call
determineBoundaries(). This class contains the function of the game, but in
general the graphs themselves should be created using an extension of this
class.

Note: the graph should be a symmetric digraph, that is, if node A sees node B as
its neighbor, then node B should see node A as its neighbor. This is not
necessary to the function of the game but is to the current implementation.
Future implementations may expands on this.

Note: the coordinates of each node are important as relative to one another.
Scaling is done to fit the graph onto the actual screen. Thus, when extending
this class to make other graphs, choose whatever coordinates are convenient
for you.

*/
class Graph
{
	// Feed the Graph constructor the array of players for the game
    constructor(players)
    {
		this.nodes = [];

		// The following keeps track of the players
		// Use a map for assigning players to the number of nodes they occupy
		this.players = players;
		this.currIndex = 0;
		this.currPlayer = this.players[this.currIndex]; console.log(this.currPlayer);
		this.playerCounts = new Map();
		for(var i = 0; i < players.length; i++) {
			this.playerCounts.set(this.players[i], 0);
		}

		// The following keeps track of the graph's bounds
		this.maxX = -10000;
		this.maxY = -10000;
		this.minX = 10000;
		this.minY = 10000;
		this.width = 0;
		this.height = 0;

		// The following is for the sploding functionality
		this.toProcess = [];
		this.overflow = 0;

		// The following is for the undo feature. We store the previous graph.
		this.prev = null;

    // Added by Nick Roach, this keeps track of height and width of graph if
    // rectangle, null otherwise. See RectGraph for use.
    this.nodeWidth = null;
    this.nodeHeight = null;
    this.size = null;
    }

    addNode(node)
    {
        this.nodes.push(node);
    }

    // Removes a node from the graph, and removes it from it's neighbors' lists
	rmNode(node)
	{
		this.nodes.splice(this.nodes.indexOf(node),1);
		node.neighbors.splice(0,1);
		for(let newNode of node.neighbors){
			newNode.neighbors.splice(newNode.neighbors.indexOf(node),1);
		}
	}

	// Determines a buffered bounding box for the graph to be displayed.
	determineBoundaries()
	{
		for (let node of this.nodes) {
			if(this.maxX < node.x + 2*node.r) {
				this.maxX = node.x + 2*node.r;
			}
			if(this.maxY < node.y + 2*node.r) {
				this.maxY = node.y + 2*node.r;
			}
			if(this.minX > node.x - 2*node.r) {
				this.minX = node.x - 2*node.r;
			}
			if(this.minY > node.y - 2*node.r) {
				this.minY = node.y - 2*node.r;
			}
		}
		this.width = this.maxX - this.minX;
		this.height = this.maxY - this.minY;
	}

	// Creates the edges of the graph via a geometric graph model, that is,
	// all nodes within a certain distance of one another will be adjacent.
	geometric(dist)
	{
		for(let n1 of this.nodes) {
			for(let n2 of this.nodes) {
				if((Math.sqrt((n1.x-n2.x)*(n1.x-n2.x) + (n1.y-n2.y)*(n1.y-n2.y)) <= dist) && n1 != n2) {
					n1.addNeighbor(n2);
				}
			}
		}
	}

	// Sees if the splode queue is empty or not
    stillProcessing() {
    	if(this.toProcess.length == 0) {
    		this.overflow = 0;
    	}
    	return this.toProcess.length != 0;
    }

    // This should only be called when the splode queue toProcess is nonempty.
    // This method then takes the next node of the queue and splodes it, if
    // possible. Returns if node was sploded or not.
    splode() {
    	// get next node to process
		var current = this.toProcess.pop();
		this.overflow++;
		// check for winner; if so, clear queue
		if(this.hasWinner()) {
			this.toProcess = [];
			console.log("WINNER!");
		}
		// want to return if splosion actually occured
		var didSplode = false;
		if(current.neighbors.length <= current.count) {
			didSplode = true;
		    current.count = current.count - current.neighbors.length;
		    // increment neighbors and change their player, pushing them into
		    // the queue toProcess
		    for (let newNode of current.neighbors) {
		        newNode.count = newNode.count + 1;
		        if(newNode.player != this.currPlayer) {
		        	if(newNode.player != empty) {
		        		this.playerCounts.set(newNode.player, this.playerCounts.get(newNode.player)-1);
		        	}
		        	this.playerCounts.set(this.currPlayer, this.playerCounts.get(this.currPlayer)+1);
		        	newNode.player = this.currPlayer;
		        }
		        this.toProcess.push(newNode);
		    }
		}
		return didSplode
    }

    // Determines if there is a winner, that is, some player that occupies
    // every node.
    hasWinner()
    {
    	for(let p of this.players) {
    		if(this.playerCounts.get(p) == this.nodes.length)
    			return true;
    	}
    	return false;
    }

    // Duplicates the graph to save it for the undo feature.
    duplicate()
    {
    	if(this.toProcess.length == 0) {
    		var newGraph = new Graph(players);

        // Added by Nick Roach, preserves RectGraph dupliication data
        newGraph.nodeWidth = this.nodeWidth;
        newGraph.nodeHeight = this.nodeHeight;
    		// Make copy of nodes
    		var newNode;
    		for(let node of this.nodes) {
    			newNode = new Node(node.x, node.y, node.r);
    			newNode.player = node.player;
    			newNode.count = node.count;
    			newGraph.addNode(newNode);
    		}

    		// Make copy of edges
    		for(var i = 0; i < this.nodes.length; i++) {
    			for(var j = 0; j < this.nodes.length; j++) {
    				if(i != j && this.nodes[i].neighbors.includes(this.nodes[j])) {
    					newGraph.nodes[i].addNeighbor(newGraph.nodes[j]);
    				}
    			}
    		}

    		// Copy the player information
			newGraph.players = this.players;
			newGraph.currIndex = this.currIndex;
			newGraph.currPlayer = this.currPlayer;
			newGraph.playerCounts = new Map();
			for(var i = 0; i < players.length; i++) {
				newGraph.playerCounts.set(newGraph.players[i], this.playerCounts.get(this.players[i]));
			}

			// The following keeps track of the graph's bounds
			newGraph.maxX = this.maxX;
			newGraph.maxY = this.maxY;
			newGraph.minX = this.minX;
			newGraph.minY = this.minY;
			newGraph.width = this.width;
			newGraph.height = this.height;

			// The following is for the undo feature. We store the previous graph.
			newGraph.prev = this;

			// Now we set the current graph to this new graph.
			return newGraph;
    	}
    }
}

/*

The RectGraph class is the prime example of a particular parameterized board.
This class extends graph with the arguments width and height, and uses these
to construct the board, its nodes and edges. All the work in subclasses like
this should be done in the constructor, with helper methods as necessary. (Feel
free to add helpers to Node and Graph if they seem widely applicable.) Most
importantly, at the end, call determineBoundaries() to set the size of the
graph for display purposes.

*/
class RectGraph extends Graph
{
    constructor(width, height, players)
    {
    	// Call super to configure everything
    	super(players);
      // Added by Nick Roach, assign width and height
      this.nodeWidth = width;
      this.nodeHeight = height;
    	// Make Nodes, with their coordinates
        for(var i = 0; i < width; i++) {
            for(var j = 0; j < height; j++) {
                this.addNode(new Node(i*100, j*100, 35));
            }
        }

        // Make edges
        for( i = 0; i < this.nodes.length; i++){
            var current = this.nodes[i];
            if(i >= height)
                current.addNeighbor(this.nodes[i - height]);
            if(i%height != height-1)
                current.addNeighbor(this.nodes[i + 1]);
            if(i < (width-1)*height)
                current.addNeighbor(this.nodes[i + height]);
            if(i%height != 0)
                current.addNeighbor(this.nodes[i - 1]);
        }

        // Very Important!!! Compute Boundaries
        this.determineBoundaries();
    }
}

/*

SquareGraph extends RectGraph in the obvious way.

*/
class SquareGraph extends RectGraph
{
	constructor(width, players)
	{
		super(width, width, players);
	}
}

/*

Cycle is a graph cycle with n nodes.

*/
class CycleGraph extends Graph
{
	constructor(size, players)
	{
		super(players);
		// Make Nodes
		var dist = Math.sqrt(Math.pow(100*Math.cos(2*Math.PI/size) - 100, 2) + Math.pow(100*Math.sin(2*Math.PI/size), 2));
		for(var i = 0; i < size; i++) {
			this.addNode(new Node(100*Math.cos(2*Math.PI*i/size), 100*Math.sin(2*Math.PI*i/size), .35*dist))
		}

		// Make Edges
		this.geometric(dist+1);

		this.determineBoundaries();
	}
}

/*

Path Graph

*/
class PathGraph extends RectGraph
{
	constructor(width, players)
	{
		super(width, 1, players);
	}
}

/*

Wheel is a cycle and a star

*/
class WheelGraph extends Graph
{
	constructor(size, players)
	{
		super(players);

		// Make Outer Nodes
		var dist = Math.sqrt(Math.pow(100*Math.cos(2*Math.PI/size) - 100, 2) + Math.pow(100*Math.sin(2*Math.PI/size), 2));
		for(var i = 0; i < size; i++) {
			this.addNode(new Node(100*Math.cos(2*Math.PI*i/size), 100*Math.sin(2*Math.PI*i/size), .35*dist))
		}

		// Make Outer Edges
		this.geometric(dist+1);

		// Make Center
		this.addNode(new Node(0, 0, .35*dist));

		// Make Spokes
		for(var i = 0; i < size; i++) {
			this.nodes[size].addNeighbor(this.nodes[i]);
			this.nodes[i].addNeighbor(this.nodes[size]);
		}

		this.determineBoundaries();
	}
}

/*

Complete Graph

*/
class CompleteGraph extends Graph
{
	constructor(size, players)
	{
		super(players);

		// Make Nodes
		var dist = Math.sqrt(Math.pow(100*Math.cos(2*Math.PI/size) - 100, 2) + Math.pow(100*Math.sin(2*Math.PI/size), 2));
		for(var i = 0; i < size; i++) {
			this.addNode(new Node(100*Math.cos(2*Math.PI*i/size), 100*Math.sin(2*Math.PI*i/size), .35*dist))
		}

		// Make Edges
		for(let n1 of this.nodes) {
			for(let n2 of this.nodes) {
				if(n1 != n2) {
					n1.addNeighbor(n2);
				}
			}
		}

		this.determineBoundaries();
	}
}

/*

Diamond Graph

*/
class DiamondGraph extends Graph
{
	constructor(size, players)
	{
    	super(players);

    	// Make Nodes, with their coordinates
        for(var i = 0; i < size; i++) {
            for(var j = 0; j < size; j++) {
            	if((i+j)%2 == 0) {
                	this.addNode(new Node(i*100, j*100, 50));
                }
            }
        }

        // Make edges
        this.geometric(100*Math.sqrt(2)+10);

        // Very Important!!! Compute Boundaries
        this.determineBoundaries();
	}
}

/*

The Player class is used to keep track of players. For now, it only contains
a username and color, but in the future it may keep track of statistics.

*/
class Player
{
	constructor(name, color)
	{
		this.name = name;
		this.color = color;
	}
}








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
var empty = new Player("empty", "#444444");

// Need to initialize this
var splodeTime = 0;

// color of the edges
var edgeColor = "#000000";

// milliseconds between splodes; will make variable soon.
var splodeConstant = 500;

// Proportion for bottom margin
var bottomMargin = .9;


/*

Set Players

*/
var p1 = new Player("Bob", "#D35400");
var p2 = new Player("Rob", "#27AE60");
var players = [p1, p2];


/*

Set the Graph

*/

var testGraph = new RectGraph(5, 5, players);










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
	}
	var mousePos = scaleBack(canvas.width, canvas.height*bottomMargin, testGraph, coord.x, coord.y);
	for (let node of testGraph.nodes) {
		// For each node, see if the click was in it, and if the colors agree,
		// and if the time is okay to click.
		if(!testGraph.stillProcessing() && node.contains(mousePos.x, mousePos.y) && (node.player == testGraph.currPlayer || node.player == empty)) {
			testGraph = testGraph.duplicate();
			node = testGraph.nodes[testGraph.prev.nodes.indexOf(node)];
			console.log(node.count + " " + node.neighbors.length + " " + node.neighbors.length);
			node.count = node.count + 1;
			if(node.player != testGraph.currPlayer) {
				if(node.player != empty) {
					testGraph.playerCounts.set(node.player, testGraph.playerCounts.get(node.player)-1);
				}
				testGraph.playerCounts.set(testGraph.currPlayer, testGraph.playerCounts.get(testGraph.currPlayer)+1);
				node.player = testGraph.currPlayer;
			}
			testGraph.toProcess = [];
			testGraph.toProcess.push(node);
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
	ctx.fillText((!testGraph.hasWinner() ? (testGraph.currPlayer.name + "'s turn") : "Game over"), 10, textSize + bottomMargin*height);

	// Splode timing
	if(testGraph.stillProcessing() && splodeTime < time && testGraph.overflow < 30000) {
		var didSplode = testGraph.splode();
		splodeTime = time + (didSplode ? splodeConstant : 0);
		if(!testGraph.stillProcessing()) {
			testGraph.currIndex = (testGraph.currIndex+1)%testGraph.players.length;
			testGraph.currPlayer = testGraph.players[testGraph.currIndex];
		}
	}

	// Draw graphs
	drawGraph(testGraph, width, height*bottomMargin);
}

/* Random color generator for each new player created */
function getRandomColor() {
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
  for (let i = 0; i < num; i++) {
    let player = new Player(`Player ${i + 1}`, getRandomColor());
    newPlayers.push(player);
  }
  players = newPlayers;
  // If it's a rectangle
  if (testGraph.nodeWidth != null) {
    testGraph = new RectGraph(testGraph.nodeWidth, testGraph.nodeHeight, players);
  }
  else {
    let len = testGraph.nodes.length;
    testGraph = new testGraph.constructor(len, players);
    console.log(testGraph.currPlayer);
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
graphChangeButton.addEventListener('click', () => {
  graphSelector.classList.toggle('graph-selector-open');
});

let graphs = ["Rectangle", "Square", "Cycle", "Path", "Wheel", "Complete", "Diamond"]

for (let graph of graphs) {
  graphSelector.innerHTML += `<div class='graph-name'>${graph}</div>`
}

function chooseGraph(e) {
  let size = 0;
  switch(this.textContent) {
    case "Rectangle":
      let width = parseInt(prompt("Choose width",));
      let height = parseInt(prompt("Choose height",));
      testGraph = new RectGraph(width, height, players);
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
  }
  graphSelector.classList.remove('graph-selector-open');
}

var graphButtons = graphSelector.querySelectorAll('.graph-name');

graphButtons.forEach(graphButton => {
  graphButton.addEventListener('click', chooseGraph);
});
