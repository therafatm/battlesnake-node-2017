var pf = require('pathfinding');
var config  = require('./config.json');
var finder = new pf.AStarFinder();

//finds direction to go from head to destination
var findDirection_ = function(start, dest) {
    console.log(start);
    console.log(dest);
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

var initSelfGridSnakeHeads_ = function(snakes, grid, mySnake, enemySnakes){

	snakes.forEach((s)=>{
		if(mySnake.snakeId === s.id){
			// find our snake
            mySnake.head = s.coords[0];
            if(s.coords.length > 1){
                mySnake.tail = s.coords[s.coords.length - 1];
            }
            mySnake.health = s.health_points;
            mySnake.len = s.coords.length;
		}
		else{
            enemySnakes.head.push(s.coords[0]);
            enemySnakes.len.push(s.coords.length);
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
    console.log(mySnake.head);
    console.log(target);
    var path = finder.findPath(mySnake.head[0], mySnake.head[1], target[0], target[1], grid);
	return path;
};

//returns empty array when no path to any food exists
var findClosestFoodPathsInOrder_ = function(foodArray, mySnake, gridCopy){
	var foodPaths = [];
	foodArray.forEach((food) => {
		// gridCopy is a clone. No need to clone.
    var path = shortestPath_(mySnake, food, gridCopy.clone());
		if(path.length > 0){
			foodPaths.push(path);
		}
	});

	foodPaths.sort((a,b)=>{
		return a.length - b.length;
	});

	return foodPaths;
};


// returns -1 if no best path exists
var findBestFoodPathPos_ = function(closestFoodInOrder, enemySnakes, mySnake){

    var posChanged = false;
    for(var i = 0; i < closestFoodInOrder.length; i++){
        for(var j = 0; j < enemySnakes.head.length; j++) {
            var snakehead = enemySnakes.head[j];
            //distance between enemy snake to current best food
            var distance = findDistance(snakehead, closestFoodInOrder[i][closestFoodInOrder[i].length - 1]);
            if((distance < closestFoodInOrder[i].length) ||
                (distance === closestFoodInOrder[i].length && enemySnakes.len[j] >= mySnake.len)){
                //TODO: eat snake
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
    var m = gridCopy.width;
    for (var i = 0; i < n; i++){
        for (var j = 0; j < m; j++)
            if (gridCopy.nodes[i][j].walkable) {
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
};

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

function withinBounds(x,y,grid){
    return x < grid.width && x > 0 && y < grid.height && y > 0;
}

function getSafeTail_(grid, tail) {
    var x = tail[0];
    var y = tail[1];

    if (withinBounds(x,y+1,grid) && grid.isWalkableAt(x,y+1)) {
       return [x,y+1];
    } else if (withinBounds(x,y-1,grid) && grid.isWalkableAt(x,y-1)) {
      return [x,y-1];
    } else if (withinBounds(x+1,y, grid) && grid.isWalkableAt(x+1,y))  {
      return [x+1,y];
    } else if (withinBounds(x-1,y, grid) && grid.isWalkableAt(x-1,y)) {
      return [x-1,y];
    }

    //Edge case??
    return [0,0];
}

var api = {
	initSelfGridSnakeHeads: initSelfGridSnakeHeads_,
	shortestPath: shortestPath_,
	findClosestFoodPathsInOrder: findClosestFoodPathsInOrder_,
	findBestFoodPathPos: findBestFoodPathPos_,
	findDirection: findDirection_,
  findSafeZones: findSafeZones_,
  findBestSafeZone: findBestSafeZone_,
  getSafeTail : getSafeTail_
};

module.exports = api;
