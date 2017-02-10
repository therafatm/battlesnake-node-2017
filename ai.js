var pf = require('pathfinding');
var config  = require('./config.json');
var finder = new PF.AStarFinder();

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

var markSelfAndUnwalkable_ = function(snakes, grid, mySnake){

	snakes.forEach((s)=>{
		if(config.snake.id === s.id){
			// find our snake
			mySnake.head = s.coords[0];
			mySnake.health = s.health;
		}
		// set unwalkable squares - other snake body  
		s.coords.forEach((pos)=>{
		  grid.setWalkableAt(pos[0], pos[1], false);
		});
	});
}

//finds shortest path from head to target
var shortestPath_ = function(mySnake, target, grid){

	// use A* to find the shortest path to target item
    var path = finder.findPath(mySnake.head[0], mySnake.head[1], target[0], target[1], grid);
    console.log("Current Path:");
    console.log(path);
	return path;
};

var findClosestFoodPath_ = function(foodArray, mySnake, gridCopy){

	var closestFoodPath = null;
	foodArray.forEach((food) => {
		var path = shortestPath_(mySnake, food, gridCopy);
		if (closestFoodPath === null) {
		    closestFoodPath = path;
		} else if (path.length < closestFoodPath.length) {
			closestFoodPath = path;
		}
	});

	return closestFoodPath;
}

var api = {
	markSelfAndUnwalkable: markSelfAndUnwalkable_,
	shortestPath: shortestPath_,
	findClosestFoodPath: findClosestFoodPath_
}

module.exports = api;