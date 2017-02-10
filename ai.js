var pf = require('pathfinding');
var config  = require('./config.json');

//finds direction to go from head to destination
var findDirection = function(head, dest) {
    var xdif = dest[0] - head[0];
    var ydif = dest[1] - head[1];
    if (xdif === 1) {
        return 'east';
    } else if (xdif === -1) {
        return 'west';
    } else if (ydif === 1){
        return 'south';
    }
    else if (ydif === -1){
        return 'north';
    }
};

function markSnakes(snake, mySnake){
	return 1;
}

//finds shortest path from head to target
var shortestPath = function(body, target){
	var snakes = body.snakes;
	var walls = body.walls;
	//console.log("TARGET POS: " + target);
    var grid = new pf.Grid(body.width, body.height);

    snakes.map(markSnakes);
    for(var i = 0; i < snakes.length; i++){
		// find our snake's head
		if (config.snake.id === snakes[i].id) {
		    mySnake.head = snakes[i].coords[0];
			mySnake.health = snakes[i].health;
		}

		// set unwalkable squares - snake's tails
		for (var j = 0; j < snakes[i].coords.length; j++) {
		    grid.setWalkableAt(snakes[i].coords[j][0], snakes[i].coords[j][1], false);
		}
    }
	
	// set unwalkable squares - walls
	if(walls){
		for (var i = 0; i < walls.length; i++) {
			grid.setWalkableAt(walls[i][0], walls[i][1], false);
		}
	}

	// use A* algorithm to find the shortest path to target item
    var finder = new PF.AStarFinder();
    var path = finder.findPath(mySnake.head[0], mySnake.head[1], target[0], target[1], grid);

    console.log("Current Path:");
    console.log(path);
	return path;
};