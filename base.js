/***

BASE CLASSES

This file contains the fundamental classes behind the working of backend of
the game. This include the NODE, GRAPH, and PLAYER classes. These classes
interact with each other and are present in every game. Each class should
not be edited and should be treated like a black box; only the methods
should be used to access their contents (javascript doesn't have scoping).

This file should be loaded first. Only edit if you know what you are doing.
Several utilities are built in to the GRAPH class for making new boards.

If you have any questions about the implementation, ask Bob Krueger.

***/

/*

The NODE class is the fundamental element of the game, represented as a circle
when drawn. A node is specified by its coordinates and radius (which are
properly scaled along with other nodes to fit on to the screen during gameplay).
A node also keeps track of how many dots are in it, who it's neighbors are, and
which player owns it. Note that a node is its own neighbor.

There are a few methods that should be used to access the contents of the class:
isNeighbor: checks if node is in it's neighbor list
addNeighbor: adds a node to it's neighbor list
rmNeighbor: removes a node from it's neighbor list
contains: sees if a given coordinate is contained within the node

*/

class Node
{
	// Creates an empty node with given coordinates; add itself to its neighborhood
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

	isNeighbor(node)
	{
		for(let neigh of this.neighbors) {
			if(node == neigh) {
				return true;
			}
		}
		return false;
	}

	// This is the only place where neighbors.push should be used
	addNeighbor(node)
	{
		// Check to see if node is already a neighbor
		if(!this.isNeighbor(node)) {
			this.neighbors.push(node);
		}

		// Adds itself to node's neighborhood to keep symmetry
		if(!node.isNeighbor(this)) {
			node.neighbors.push(this);
		}
	}

	// This is the only place where neighbors.splice should be used
	rmNeighbor(node)
	{
		// Removes node from it's neighbor list
		if(this.isNeighbor(node)) {
			this.neighbors.splice(this.neighbors.indexOf(node),1);
		}

		// Removes itself from node's neighbor list
		if(node.isNeighbor(this)) {
			node.neighbors.splice(node.neighbors.indexOf(this),1);
		}
	}

	contains(xCoord, yCoord)
	{
		var dx = xCoord - this.x;
		var dy = yCoord - this.y;
		return (Math.sqrt(dx*dx + dy*dy) <= this.r);
	}
}

/*

The GRAPH class is where the action is. A graph consists of an array of nodes,
and the nodes keep track of adjacency to other nodes. The Graph class also
contains and keeps track of the full set of players and their current score
(how many spaces they occupy), as well as a bounding box for drawing the graph
and a queue for sploding nodes. This class should be treated as a black box;
all functionality should happen through its methods, not directly manipulating
its properties.

All predefined or parameterized boards should be extensions of the Graph class.
These boards should be coded into boards.js. See RectGraph for a good example
of how to extend the Graph class. Most importantly, once all nodes and edges
have been placed, be sure to call determineBoundaries(). This class contains
the function of the game, but in general the graphs themselves should be
created using an extension of this class.

Note: the graph should be a symmetric digraph, that is, if node A sees node B as
its neighbor, then node B should see node A as its neighbor. This is not
necessary to the function of the game but is to the current implementation.
This can be easily acheived by strict adherence to the node.addNeighbor method.

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
		this.turnCount = 0;

		// The following keeps track of the players
		this.players = players;
		this.currPlayer = this.players[0]; console.log(this.currPlayer);

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
	}

	addNode(node)
	{
		this.nodes.push(node);
	}

    // Removes a node from the graph, and removes it from it's neighbors' lists
	rmNode(node)
	{
		while(!(node.neighbors.size == 0)) {
			node.rmNeighbor(node.neighbors[0]);
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
	stillProcessing()
	{
		if(this.toProcess.length == 0) {
			this.overflow = 0;
		}
		return this.toProcess.length != 0;
	}

    // This should only be called when the splode queue toProcess is nonempty.
    // This method then takes the next node of the queue and splodes it, if
    // possible. Returns if node was sploded or not.
    splode()
    {
    	// get next node to process
    	var current = this.toProcess.pop();
    	this.overflow++;
    	console.log("Overflow: " + this.overflow);
    	console.log(current.neighbors.length);
		// check for winner; if so, clear queue
		if(this.hasWinner()) {
			this.toProcess = [];
			console.log("WINNER!");
		}
		if(current.neighbors.length <= current.count) {
			console.log("HEY");
			current.count = current.count - current.neighbors.length;
			// increment neighbors and change their player, pushing them into
			// the queue toProcess
			for (let newNode of current.neighbors) {
				newNode.count = newNode.count + 1;
				if(newNode.player.ID != this.currPlayer.ID) {
					if(newNode.player.ID != "empty") {
						newNode.player.occupancy--;
					}
					this.currPlayer.occupancy++;
					newNode.player = this.currPlayer;
				}
				this.toProcess.push(newNode);
			}
			// want to return if splosion actually occured
			return true;
		}
		return false;
	}

	// Determines if there is a winner, that is, some player that occupies
	// every node.
	hasWinner()
	{
		for(let p of this.players) {
			if(p.occupancy >= this.nodes.length)
				return true;
		}
		return false;
	}

	// Determines if all the nodes have been taken
	isFull()
	{
		var occupied = 0;
		for(let p of this.players) {
			occupied = occupied + p.occupancy;
		}
		return occupied == this.nodes.length;
	}

	// Give the next turn to the next player
	nextTurn()
	{
		for(let p of this.players) {
			if(p.ID == this.currPlayer.ID) {
				p.scores.push(p.getScore()+p.occupancy);
			} else {
				p.scores.push(p.getScore());
			}
			console.log(p);
			console.log(p.scores);
		}
		do {
			this.currPlayer = this.players[(this.players.indexOf(this.currPlayer)+1)%this.players.length];
			console.log(this.currPlayer.ID);
		} while(this.currPlayer.occupancy == 0 && this.isFull());
	}

    // Duplicates the graph to save it for the undo feature.
    duplicate()
    {
    	if(this.toProcess.length == 0) {
			var newGraph = new Graph(players);j
			newGraph.turnCount = this.turnCount+1;

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
    				if(i != j && this.nodes[i].isNeighbor(this.nodes[j])) {
    					newGraph.nodes[i].addNeighbor(newGraph.nodes[j]);
    				}
    			}
    		}

    		// Copy the player information
    		newGraph.players = this.players;
    		newGraph.currPlayer = this.currPlayer;

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

	// Use this method to move to the previous move of the game
	undo()
	{
		// Must set back graph before calling undo.

		// Scale Back player scores and occupancy levels
		for(let p of this.players) {
			p.scores.pop();
			p.occupancy = 0;
		}
		for(let n of this.nodes) {
			n.player.occupancy++;
		}
	}

	playerString()
	{
		var str = ""
		for(let p of this.players) {
			str = str + p.name + ": " + p.getScore() + "   ";
		}
		return str;
	}

}

/*

The Player class is used to keep track of players. For now, it only contains
a username and color, but in the future it may keep track of statistics.

*/

class Player
{
	constructor(name, color, ID)
	{
		this.name = name;
		this.color = color;
		this.ID = ID;
		this.scores = [0];
		this.occupancy = 0;
	}

	getScore()
	{
		return this.scores[this.scores.length-1];
	}
}