var pf = require('pathfinding');
var config  = require('./config.json');
var finder = new PF.AStarFinder();

//finds direction to go from head to destination
var findDirection_ = function(start, dest) {
    var xdif = dest[0] - start[0];
    var ydif = dest[1] - start[1];
    if (xdif === 1) {
        return 'east';
    } else if (xdif === -1) {
        return 'west';
    } else if (ydif === 1){
        return 'north';
    }
    else if (ydif === -1){
        return 'south';
    }
};

var initSelfGridSnakeHeads_ = function(snakes, grid, mySnake, enemySnakeHeads){

	snakes.forEach((s)=>{
		if(config.snake.id === s.id){
			// find our snake
			mySnake.head = s.coords[0];
			mySnake.health = s.health;
		}
		else{
			enemySnakeHeads.push(s.coords[0]);
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

//returns null when no path to any food exists
var findClosestFoodPathsInOrder_ = function(foodArray, mySnake, gridCopy){

	var foodPaths = [];
	foodArray.forEach((food) => {
		var path = shortestPath_(mySnake, food, gridCopy);
		if(path.length > 0){
			foodPaths.push(path);
		}
	});

	foodPaths.sort((a,b)=>{
		return a.length - b.length;
	});

	return foodPaths;
}

// returns int greater than input array length if no best path exists
var findBestFoodPathPos_ = function(closestFoodInOrder, enemySnakeHeads){

    var bestPathPos = 0;
    var posChanged = false;
    for(var i = 0; i < closestFoodInOrder.length; i++){
        for(var j = 0; j < enemySnakeHeads.length; j++) {
            var snakehead = enemySnakeHeads[j];
            //distance between enemy snake to current best food
            var distance = findDistance(snakehead, closestFoodInOrder[i][closestFoodInOrder[i].length - 1]);
            if(distance <= closestFoodInOrder[i].length){
                //TODO: eat snake
                bestPathPos++;
                posChanged = true;
                break;
            }
        }
        if(!posChanged){
            break;
        }
    }

    return bestPathPos; 
}

function findDistance(start, destination){
    return ( Math.abs(start[0] - destination[0]) + Math.abs(start[1]-destination[1]) );
};

var api = {
	initSelfGridSnakeHeads: initSelfGridSnakeHeads_,
	shortestPath: shortestPath_,
	findClosestFoodPathsInOrder: findClosestFoodPathsInOrder_,
	findBestFoodPathPos: findBestFoodPathPos_,
	findDirection: findDirection_
}

module.exports = api;