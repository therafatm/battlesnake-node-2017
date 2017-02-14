var pf = require('pathfinding');
var config  = require('./config.json');
var finder = new pf.AStarFinder();

//finds direction to go from head to destination
var findDirection_ = function(start, dest) {
    if(start === undefined){
        console.log(start);
    }

    if(dest === undefined){
        console.log(dest);
    }

    var xdif = dest[0] - start[0];
    var ydif = dest[1] - start[1];
    if (xdif === 1) {
        return 'east';
    } else if (xdif === -1) {
        return 'west';
    } else if (ydif === 1){
        return 'north';
    } else if (ydif === -1){
        return 'south';
    }
};

var initSelfGridSnakeHeads_ = function(snakes, grid, mySnake, enemySnakeHeads){

	snakes.forEach((s)=>{
		if(mySnake.snakeId === s.id){
			// find our snake	
            mySnake.head = s.coords[0];
            if(s.coords.length > 1){
                mySnake.tail = s.coords[s.coords.length - 1];                   
            }
            mySnake.health = s.health_points;
		}
		else{
			enemySnakeHeads.push(s.coords[0]);
		}

		// set unwalkable squares - other snake body
		s.coords.forEach((pos)=>{
		  grid.setWalkableAt(pos[0], pos[1], false);
		});
	});
};

//finds shortest path from head to target
var shortestPath_ = function(mySnake, target, grid){
    // use A* to find the shortest path to target item
    var path = finder.findPath(mySnake.head[0], mySnake.head[1], target[0], target[1], grid);
    console.log("Current Path:");
    console.log(path);
	return path;
};

//returns empty array when no path to any food exists
var findClosestFoodPathsInOrder_ = function(foodArray, mySnake, gridCopy){

	var foodPaths = [];
	foodArray.forEach((food) => {
		// gridCopy is a clone. No need to clone.
        var path = shortestPath_(mySnake, food, gridCopy);
		if(path.length > 0){
			foodPaths.push(path);
		}
	});

	foodPaths.sort((a,b)=>{
		return a.length - b.length;
	});

	return foodPaths;
};


//TODO: review this method
// returns -1 if no best path exists
var findBestFoodPathPos_ = function(closestFoodInOrder, enemySnakeHeads){

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
            return i;
        }
    }

    return -1;
};

var findBestSafeZone_ = function(mySnake, safeZones){
    for(var i = 0; i < safeZones.length; i++){
        var distance = findDistance(mySnake.head, safeZones[i].pos);
        if(distance != null || distance > 0){
            return i;    
        }
    }
    return -1;
}

function findDistance(start, destination){
    return ( Math.abs(start[0] - destination[0]) + Math.abs(start[1]-destination[1]) );
};

var findSafeZones_ = function(gridCopy) {

    var safeZones = [];
    var count = 0;
    var n = gridCopy.height;
    if (n == 0) return -1;
    var m = gridCopy[0].width;
    for (var i = 0; i < n; i++){
        for (var j = 0; j < m; j++)
            if (gridCopy.nodes[i][j] == '1') {
                var size = DFSMarking(gridCopy, i, j);
                if(size >= 9){
                    safeZones.push({ pos: [i,j], size: size});
                }
            }
    }

    if(safeZones.length === 0){
        console.log("No safeZones found. Something wrong here.");
    }

    safeZones.sort((a,b)=>{
        return a.size - b.size;
    });

    return safeZones;
}

function DFSMarking(grid, i, j) {
    var size = 0;    
    if (i < 0 || j < 0 || i >= n || j >= m || !grid.nodes[i][j].walkable) return size;
    grid.nodes[i][j].walkable = false;
    size += 1;
    size += DFSMarking(grid, i + 1, j);
    size += DFSMarking(grid, i - 1, j);
    size += DFSMarking(grid, i, j + 1);
    size += DFSMarking(grid, i, j - 1);
    return size;
}

var api = {
	initSelfGridSnakeHeads: initSelfGridSnakeHeads_,
	shortestPath: shortestPath_,
	findClosestFoodPathsInOrder: findClosestFoodPathsInOrder_,
	findBestFoodPathPos: findBestFoodPathPos_,
	findDirection: findDirection_,
    findSafeZones: findSafeZones_,
    findBestSafeZone: findBestSafeZone_
};

module.exports = api;
