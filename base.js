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

    // Determines if all the nodes have been taken
    isFull()
    {
    	var occupied = 0;
    	for(let p of this.players) {
    		occupied = occupied + this.playerCounts.get(p);
    	}
    	return occupied == this.nodes.length;
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

    // Give the next turn to the next player
    nextTurn()
    {
		do {
			this.currIndex = (this.currIndex+1)%this.players.length;
			this.currPlayer = this.players[this.currIndex];
			console.log(this.currIndex);
		} while(this.playerCounts.get(this.currPlayer) == 0 && this.isFull());
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