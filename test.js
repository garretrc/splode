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
		this.currPlayer = this.players[this.currIndex];
		this.playerCounts = new Map();
		for(var i = 0; i < players.length; i++) {
			this.playerCounts.set(this.players[i], 0);
		}

		// The following keeps track of the graph's bounds
		this.maxX = -10000;
		this.maxY = -10000;
		this.minX = 10000;
		this.minY = 10000;

		// The following is for the sploding functionality
		this.toProcess = [];
		this.overflow = 0;
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


/*

Set Players

*/
var p1 = new Player("Bob", "#D35400");
var p2 = new Player("Rob", "#27AE60");
var players = [p1, p2];


/*

Set the Graph

*/

var testGraph = new WheelGraph(10, players);










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
	console.log("Click!");
	// Get coordinates in graph-space
	var coord = getMousePos(canvas, evt);
	var mousePos = scaleBack(canvas.width, canvas.height, testGraph, coord.x, coord.y);
	for (let node of testGraph.nodes) {
		// For each node, see if the click was in it, and if the colors agree,
		// and if the time is okay to click.
		if(!testGraph.stillProcessing() && node.contains(mousePos.x, mousePos.y) && (node.player == testGraph.currPlayer || node.player == empty)) {
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
	ctx.font = 20 + "px Arial";
	ctx.fillStyle = testGraph.currPlayer.color;
	ctx.fillText((!testGraph.hasWinner() ? (testGraph.currPlayer.name + "'s turn") : "Game over"), 10, textSize + 10);

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
	drawGraph(testGraph, width, height);
}
