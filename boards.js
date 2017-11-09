/***

CLASSES

The following section of code contains the definition of all classes that we
find useful. Most fundamental are the Node, Graph, and Player classes. There
are several subclasses of the Graph class which create specific (parameterized)
boards but do not change the functionality of the Graph class. Further
description can be found near the classes themselves.

***/




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

Bob's Graph: Bob's custom graph

*/
class BobGraph extends Graph
{
	constructor(players)
	{
		super(players);
		// Make Nodes, with their coordinates
        for(var i = 0; i < 9; i++) {
            for(var j = 0; j < 9; j++) {
                this.addNode(new Node(i*100, j*100, 35));
            }
        }

        // Make edges
        for( i = 0; i < this.nodes.length; i++){
            var current = this.nodes[i];
            if(!(i < 9) && !(i < 4*9 && i > 3*9-1 && i != 31 && i != 28 && i != 34) && !(i < 7*9 && i > 6*9-1 && i != 55 && i != 58 && i != 61))
                current.addNeighbor(this.nodes[i - 9]);
            if(!(i%9 == 9-1) && !(i%9 == 6-1 && i!=14 && i!=41 && i!=68) && !(i%9 == 3-1 && i!=11 && i!=38 && i!=65))
                current.addNeighbor(this.nodes[i + 1]);
            if(!(i >= (9-1)*9) && !(i >= (6-1)*9 && i < (7-1)*9 && i != 49 && i != 52 && i != 46) && !(i >= (3-1)*9 && i < (4-1)*9 && i != 22 && i != 19 && i != 25))
                current.addNeighbor(this.nodes[i + 9]);
            if(!(i%9 == 0) && !(i%9 == 3 && i!=12 && i!=39 && i!=66) && !(i%9 == 6 && i!=15 && i!=42 && i!=69))
                current.addNeighbor(this.nodes[i - 1]);
        }

        // Very Important!!! Compute Boundaries
        this.determineBoundaries();

	}
}

/*

Triangle Graph: regular triangle tiling

*/
class TriangleGraph extends Graph
{
	constructor(size, players)
	{
		super(players)

		for(var i = 0; i < size+1; i++) {
			for(var j = -i/2; j < i/2; j++) {
			    this.addNode(new Node(j*100, i*86, 35));
			}
        }

/*		for(var i = 0; i < 2*size-1; i++) {
            if(i < size)
            {
				for(var j = -size - Math.floor(i/2); j < size + Math.floor(i/2); j++) {
				    this.addNode(new Node(j*100 + (i%2)*50, i*86, 35));
				}
        	}
        	else {
				for(var j = size - Math.floor(i/2); j < 2*size - Math.floor(i/2); j++) {
				    this.addNode(new Node(j*100 + (i%2)*50, i*86, 35));
				}
        	}
        }*/

        this.geometric(100+10);

		this.determineBoundaries();
	}
}

/*

Hexagonal Graph: regular hexagonal tiling

*/
class HexGraph extends Graph
{
	constructor(size, players)
	{
		super(players)

		for(var i = 1; i < size+2+1; i++) {
			for(var j = -i/2; j < i/2; j++) {
				if(!(i==1) && !(i==size+2 && (j==-i/2 || j==i/2-1))) {
					this.addNode(new Node(j*200, i*172 - 55, 40));
				}
			    if(!(i==size+2)) {
			    	this.addNode(new Node(j*200, i*172 + 55, 40));
			    }
			}
        }

        this.geometric(125);

        this.determineBoundaries();
	}
}

/*

Rocket Ship!!!

*/
class RocketGraph extends Graph
{
	constructor(size, players)
	{
		super(players)

		for(var i = 0; i < size+1; i++) {
			for(var j = -i/2; j < i/2; j++) {
			    this.addNode(new Node(j*100, i*172 - 50, 35));
			    this.addNode(new Node(j*100, i*172 + 50, 35));
			}
        }

        this.geometric(100+10);

        this.determineBoundaries();
	}
}


