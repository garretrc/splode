class Node
{
    constructor(x, y, r)
    {
        this.neighbors = [];
        this.neighbors.push(this);
        this.edges = 1;
        this.player = empty;
        this.count = 0;
        this.x=x;
        this.y=y;
        this.r=r;
    }
    
    addNeighbor(node)
    {
        this.neighbors.push(node);
        this.edges = this.edges+1;
    }

    contains(xCoord, yCoord)
    {
    	var dx = xCoord - this.x;
    	var dy = yCoord - this.y;
    	return (Math.sqrt(dx*dx + dy*dy) <= this.r);
    }
}

class Graph
{
    constructor(players)
    {
        this.nodes = [];
        this.order = 0;
        this.players = players;
        this.currIndex = 0;
        this.currPlayer = this.players[this.currIndex];
        this.playerCounts = new Map();
        for(var i = 0; i < players.length; i++) {
        	this.playerCounts.set(this.players[i], 0);
        }
        this.maxX = -10000;
        this.maxY = -10000;
        this.minX = 10000;
        this.minY = 10000;
    }

    addNode(node)
    {
        this.nodes.push(node);
        this.order = this.order + 1;
    }

	rmNode(node)
	{
		this.nodes.splice(this.nodes.indexOf(node),1);
		node.neighbors.splice(0,1);
		for(let newNode of node.neighbors){
			newNode.neighbors.splice(newNode.neighbors.indexOf(node),1);
			newNode.edges -= 1;
		}
		this.order -= 1;
	}

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

    splode(node)
    {	
    	console.log(node.count + " " + node.neighbors.length + " " + node.edges);
        node.count = node.count + 1;
        if(node.player != this.currPlayer) {
        	if(node.player != empty) {
        		this.playerCounts.set(node.player, this.playerCounts.get(node.player)-1);
        	}
        	this.playerCounts.set(this.currPlayer, this.playerCounts.get(this.currPlayer)+1);
        	node.player = this.currPlayer;
        }
        var toProcess = [];
        toProcess.push(node);
        var overflow = 0;
        while(toProcess.length != 0 && overflow < 100000000000) {
        	overflow = overflow + 1;
            var current = toProcess.pop();
            console.log(toProcess.length);
            if(this.hasWinner()) {
            	toProcess = [];
            	console.log("WINNER!");
            }
            if(current.edges <= current.count) {
                current.count = current.count - current.edges;
                for (let newNode of current.neighbors) {
                    newNode.count = newNode.count + 1;
			        if(newNode.player != this.currPlayer) {
			        	if(newNode.player != empty) {
			        		this.playerCounts.set(newNode.player, this.playerCounts.get(newNode.player)-1);
			        	}
			        	this.playerCounts.set(this.currPlayer, this.playerCounts.get(this.currPlayer)+1);
			        	newNode.player = this.currPlayer;
			        }
                    toProcess.push(newNode);
                }
            }
        }
        this.currIndex = (this.currIndex + 1) % this.players.length;
        this.currPlayer = this.players[this.currIndex];
    }

    hasWinner()
    {
    	for(let p of this.players) {
    		if(this.playerCounts.get(p) == this.order)
    			return true;
    	}
    	return false;
    }
}

class RectGraph extends Graph
{
    constructor(width, height, players)
    {
    	super(players);
        for(var i = 0; i < width; i++) {
            for(var j = 0; j < height; j++) {
                this.addNode(new Node(i*100, j*100, 35));
            }
        }

        for( i = 0; i < this.order; i++){
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
        this.determineBoundaries();
    }
}

class SquareGraph extends RectGraph
{
	constructor(width, players)
	{
		super(width, width, players);
	}
}

class Player
{
	constructor(name, color)
	{
		this.name = name;
		this.color = color;
	}
}

var empty = new Player("empty", "#444444");


var p1 = new Player("John","#8A2BE3");
var p3 = new Player("Robbie","1919ff");
var p4 = new Player("Bob", "#D35400");
var p2 = new Player("Rob", "#27AE60");

var players = [p1, p2,p3,p4];

/*var testGraph = new Graph(players);
var node1 = new Node(200, 200, 40);
var node2 = new Node(200, 400, 40);
var node3 = new Node(400, 200, 40);
var node4 = new Node(400, 400, 40);

node1.addNeighbor(node2);
node1.addNeighbor(node3);
node1.addNeighbor(node4);

node2.addNeighbor(node1);
node2.addNeighbor(node4);
node3.addNeighbor(node1);
node3.addNeighbor(node4);

node4.addNeighbor(node1);
node4.addNeighbor(node2);
node4.addNeighbor(node3);

testGraph.addNode(node1);
testGraph.addNode(node2);
testGraph.addNode(node3);
testGraph.addNode(node4);

testGraph.determineBoundaries();
console.log(testGraph.width);
console.log(testGraph.height);*/



var testGraph = new SquareGraph(3, players);

var testGraph = new SquareGraph(7,players);
testGraph.rmNode(testGraph.nodes[32]);
//testGraph.rmNode(testGraph.nodes[31]);
testGraph.rmNode(testGraph.nodes[30]);
//testGraph.rmNode(testGraph.nodes[25]);
testGraph.rmNode(testGraph.nodes[24]);
//testGraph.rmNode(testGraph.nodes[23]);
testGraph.rmNode(testGraph.nodes[18]);
//testGraph.rmNode(testGraph.nodes[17]);
testGraph.rmNode(testGraph.nodes[16]);


//var testGraph = new DiamondGraph(5,players);
//testGraph.rmNode(testGraph.nodes[6]);
//var testGraph = new SquareGraph(3, players);

function drawBox(xPos, yPos, xSize, ySize, color) {
	ctx.beginPath();
	ctx.rect(xPos, yPos, xSize, ySize);
	ctx.fillStyle = color;
	ctx.fill();
	ctx.closePath();
}

function drawDice(xPos, yPos, size, color, num) {
    drawCircle(xPos, yPos, size,color);
    ctx.fillStyle = "#ffffff";
    var dotRadius = size / 9;
    var dotPos = .2*size;
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

function drawCircle(xPos, yPos, r, color) {
    ctx.beginPath();
    ctx.arc(xPos, yPos, r, 0, Math.PI*2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
}

function drawLine(xStart, yStart, xEnd, yEnd, color) {
	ctx.beginPath();
	ctx.strokeStyle = color;
	ctx.moveTo(xStart,yStart);
	ctx.lineTo(xEnd,yEnd);
	ctx.stroke();
	ctx.closePath();
}

/*// Does nothing with color
function drawCircle(xPos, yPos, r) {
	ctx.beginPath();
	ctx.arc(xPos, yPos, r, 0, Math.PI*2);
	//ctx.fillStyle = "#0095DD";
	ctx.fill();
	ctx.closePath();
}*/






function drawSpaces(width, height) {
	
}



// time is a float number of milliseconds since the page was loaded (?)
function loop(time, width, height) {
	ctx.font = 20 + "px Arial";
	ctx.fillStyle = testGraph.currPlayer.color;
	ctx.fillText((!testGraph.hasWinner() ? (testGraph.currPlayer.name + "'s turn") : "Game over"), 10, textSize + 10);

	for (let node of testGraph.nodes) {
		for (let neigh of node.neighbors) {
			var scaledNode = scale(width, height, testGraph, node);
			var scaledNeigh = scale(width, height, testGraph, neigh);
			drawLine(scaledNode.x, scaledNode.y, scaledNeigh.x, scaledNeigh.y, "#000000");
		}
	}
	for (let node of testGraph.nodes) {
		var scaledNode = scale(width, height, testGraph, node);
		drawDice(scaledNode.x, scaledNode.y, scaledNode.r, node.player.color, node.count);
	}
}

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

function clickHandler(evt) {
	console.log("Click!");
	var coord = getMousePos(canvas, evt);
	var mousePos = scaleBack(canvas.width, canvas.height, testGraph, coord.x, coord.y);
	for (let node of testGraph.nodes) {
		if(node.contains(mousePos.x, mousePos.y) && (node.player == testGraph.currPlayer || node.player == empty)) {
			testGraph.splode(node);
		}
	}

/*	var mousePos = getMousePos(canvas, evt);
	var dicex = Math.floor((mousePos.x - originx) * n / playAreaSize);
	var dicey = Math.floor((mousePos.y - originy) * n / playAreaSize);
	if (allowMove && dicex >= 0 && dicex < n && dicey >= 0 && dicey < n) {
		var spaceIndex = dicex + dicey * n
		if (spaces[spaceIndex].whichPlayer == -1 || spaces[spaceIndex].whichPlayer == playerTurn)
			makeMove(spaceIndex, playerTurn);
	}*/
}
