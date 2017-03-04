var pf = require('pathfinding');
var finder = new pf.JumpPointFinder({diagonalMovement: pf.DiagonalMovement.Never});

var findEmptyNeighbour_ = function(mySnake, grid){
    var headNode = new pf.Node(mySnake.head[0], mySnake.head[1], false);
    console.log("headNode");
    console.log(headNode);
    var neighbours = grid.getNeighbors(headNode, pf.DiagonalMovement.Never);
    console.log("neighbours");
    console.log(neighbours);
    var dest = neighbours[0];

    return findDirection_(mySnake.head, [dest.x, dest.y]);
}

//finds direction to go from head to destination
var findDirection_ = function(start, dest) {
    console.log("start:");
    console.log(start);
    console.log("end:");
    console.log(dest);
    var xdif = dest[0] - start[0];
    var ydif = dest[1] - start[1];
    console.log('xdif');
    console.log(xdif);
    console.log('ydif');
    console.log(ydif);    
    if (xdif === 1) {
        return 'right';
    } else if (xdif === -1) {
        return 'left';
    } else if (ydif === 1){
        return 'down';
    } else if (ydif === -1){
        return 'up';
    }
};

var countQuadrantEmptyness_ = function(i,j, grid, mySnake){

    if(i< grid.width/2 && j < grid.height/2){
        if(!grid.isWalkableAt(i,j)){
            mySnake.topLeftQuadrantFilled++;
            return;
        }
    }

    if(i< grid.width/2 && j >= grid.height/2){
        if(!grid.isWalkableAt(i,j)){
            mySnake.bottomLeftQuadrantFilled++;
            return;
        }
    }

    if(i > grid.width/2 && j < grid.height/2){
        if(!grid.isWalkableAt(i,j)){
            mySnake.topRightQuadrantFilled++;
            return;
        }
    }

    if(i > grid.width/2 && j >= grid.height/2){
        if(!grid.isWalkableAt(i,j)){
            mySnake.bottomRightQuadrantFilled++;
            return;
        }
    }        
}

var initSelfGridSnakeHeads_ = function(snakes, grid, mySnake, enemySnakes, failsafe){

	snakes.forEach((s)=>{
		if(mySnake.snakeId === s.id){
			// find our snake
            mySnake.head = s.coords[0];
            if(s.coords.length > 1){
                mySnake.tail = s.coords[s.coords.length - 1];
                s.coords.forEach( (c) => {
                    mySnake.coords.push(c);
                });
            }
            mySnake.health = s.health_points;
            mySnake.len = s.coords.length;

		}
		else{
            enemySnakes.head.push(s.coords[0]);
            if (!failsafe && mySnake.len < 15)
                markEnemySides_(s.coords[0],grid);
            enemySnakes.len.push(s.coords.length);
		}

		// set unwalkable squares - other snake body
		s.coords.forEach((pos)=>{
          if(grid === undefined){
            console.log("GRID IS UNDEFINED\n!");
          }
		  grid.setWalkableAt(pos[0], pos[1], false);
          countQuadrantEmptyness_(pos[0], pos[1], grid, mySnake);
		});
	});
};

var markEnemySides_ = function(head, grid) {
    var x = head[0];
    var y = head[1];

    if (grid.isInside(x,y+1)) {
        grid.setWalkableAt(x,y+1, false);
    }
    if (grid.isInside(x,y-1)) {
      grid.setWalkableAt(x,y-1, false);
    }
    if (grid.isInside(x+1,y))  {
      grid.setWalkableAt(x+1,y,false);
    }
    if (grid.isInside(x-1,y)) {
      grid.setWalkableAt(x-1,y,false);
    }

}

function buildDistanceGrid (grid){
    var distanceGrid = new Array(grid.height);
    for (var i = 0; i < distanceGrid.length; i++) {
      distance[i] = new Array(grid.width);
    }
    return distanceGrid;
}

//need to pass in grid copy
//returns path from farthest point
function findFarthestPointPath(mySnake, grid) {
    var gridCopy = grid.clone();
    var start = [mySnake.head[0], mySnake.head[1]];
    var queue = [];
    var currentNode = grid.getNodeAt(start[0],start[1]);
    currentNode.setWalkableAt(start[0],start[1], true);
    var distanceGrid = buildDistanceGrid(grid);
    var farthest = {node: currentNode, distance: 0};

    queue.push(currentNode);
    while(queue.length){
        //visit node at front of queue
        currentNode = queue.shift();
        if(grid.isWalkableAt(currentNode.x, currentNode.y)){
            grid.setWalkableAt(currentNode.x, currentNode.y, false);
            distanceGrid[currentNode.x, currentNode.y] = findDistance([currentNode.x, currentNode.y], start);
            //set farthest node
            var farthestDistance = Math.max(farthest.distance, distanceGrid[currentNode.x, currentNode.y]);
            if(farthestDistance != farthest.distance){
                farthest = {node: currentNode, distance: farthestDistance};
            }
        }

        var neighbours = grid.getNeighbors(currentNode, pf.DiagonalMovement.Never); // gives me nodes
        for(var k = 0; k < neighbours.length; k++){
            var neighbour = neighbours[k];
            queue.push(neighbour);
        }
    }

    var path = shortestPath_(mySnake, [farthest.node.x, farthest.node.y], gridCopy);
    return path;
}

//finds shortest path from head to target
var shortestPath_ = function(mySnake, target, grid){
    // use A* to find the shortest path to target item
    console.log("my head:");
    console.log(mySnake.head);
    console.log("target:");
    console.log(target);
    var path = finder.findPath(mySnake.head[0], mySnake.head[1], target[0], target[1], grid);
	return path;
};

//returns empty array when no path to any food exists
var findClosestFoodPathsInOrder_ = function(foodArray, mySnake, gridCopy){
	var foodPaths = [];
	foodArray.forEach((food) => {
		// gridCopy is a clone. No need to clone.
    var gcopy = gridCopy.clone();
    var path = shortestPath_(mySnake, food, gcopy);
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
            if(mySnake.health >= 20){
                var distance = findDistance(snakehead, closestFoodInOrder[i][closestFoodInOrder[i].length - 1]);
                if((distance < closestFoodInOrder[i].length) ||
                    (distance === closestFoodInOrder[i].length && enemySnakes.len[j] >= mySnake.len)){
                    //TODO: eat snake
                    posChanged = true;
                    break;
                }                
            }
            else {
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

function findDistance(start, destination){
    return ( Math.abs(start[0] - destination[0]) + Math.abs(start[1]-destination[1]) );
};

var goToCentre_ = function(mySnake, gridCopy){

    var width = gridCopy.width;
    var height = gridCopy.height;
    var centre = [ Math.round(width/2), Math.round(height/2) ];
    var xmin = centre[0] - Math.min(Math.max(Math.round(mySnake.len/3),2), Math.round(width/3));
    var xmax = centre[0] + Math.min(Math.max(Math.round(mySnake.len/3),2), Math.round(width/3));
    var ymin = centre[1] - Math.min(Math.max(Math.round(mySnake.len/3),2), Math.round(height/3));
    var ymax = centre[1] + Math.min(Math.max(Math.round(mySnake.len/3),2), Math.round(height/3));


    //find safe spot in centre
    for(var i = xmin; i <= xmax; i++){
        for(var j = ymin; j <= ymax; j++){
            if(gridCopy.isWalkableAt(i,j)){
                var toCenter = shortestPath_(mySnake, [i,j], gridCopy.clone());
                if(toCenter.length>1) return toCenter;                
            }
        } 
    }

    console.log("No space in centre found.");
    var cornerPath = findFarthestPointPath(mySnakeCopy, gridCopy);
    return cornerPath;
    //if no corner path, idk what to do
}

function withinCentre_(x,y,width, height, mySnake){

    var centre = [ Math.round(width/2), Math.round(height/2) ];
    var xmin = centre[0] - Math.min(Math.max(Math.round(mySnake.len/3),2), Math.round(width/3));
    var xmax = centre[0] + Math.min(Math.max(Math.round(mySnake.len/3),2), Math.round(width/3));
    var ymin = centre[1] - Math.min(Math.max(Math.round(mySnake.len/3),2), Math.round(height/3));
    var ymax = centre[1] + Math.min(Math.max(Math.round(mySnake.len/3),2), Math.round(height/3));

    return x <= xmax && x >= xmin && y <= ymax && y >= ymin;
}

function getSafeTail_(mySnake, grid, tail) {

    if(!tail){
        return findFarthestPointPath(mySnake, grid.clone());
    }

    var x = tail[0];
    var y = tail[1];

    if (grid.isInside(x,y+2) && grid.isWalkableAt(x,y+2)) {
        var toTail = shortestPath_(mySnake, [x,y+2], grid.clone());
        if(toTail.length>1) return toTail;
    }

    if (grid.isInside(x,y-2) && grid.isWalkableAt(x,y-2)) {
        var toTail = shortestPath_(mySnake, [x,y-2], grid.clone());
        if(toTail.length>1) return toTail;
    }

    if (grid.isInside(x+2,y) && grid.isWalkableAt(x+2,y))  {
        var toTail = shortestPath_(mySnake, [x+2,y], grid.clone());
        if(toTail.length>1) return toTail;
    }

    if (grid.isInside(x-2,y) && grid.isWalkableAt(x-2,y)) {
        var toTail = shortestPath_(mySnake, [x-2,y], grid.clone());
        if(toTail.length>1) return toTail;
    }

    //Edge case??
    console.log("No safe path to tail found.");
    return [];
}

//returns path to empty corner
function checkForEmptyCorners(grid, mySnake){

    if(!grid){console.log("grid is not valid.")} 

    var cornerEmptyNess = [];
    cornerEmptyNess.push(["topLeft", mySnake.topLeftQuadrantFilled, [0,0] ]);
    cornerEmptyNess.push(["topRight", mySnake.topRightQuadrantFilled, [0,grid.width-1] ]);
    cornerEmptyNess.push([ "bottomLeft", mySnake.bottomLeftQuadrantFilled, [grid.height-1, 0]]);
    cornerEmptyNess.push([ "bottomRight",  mySnake.bottomRightQuadrantFilled, [grid.width-1, grid.height-1]]);

    cornerEmptyNess.sort((a,b) => {
        return (a[1] < b[1]); 
    });

    for(var i = cornerEmptyNess.length - 1; i >= 0; i--){
        var corner = cornerEmptyNess[i];
        var x = corner[2][0];
        var y = corner[2][1];

        console.log("Sorted corners:");
        console.log(cornerEmptyNess);

        if(grid.isWalkableAt(x,y)){
            var toCorner = shortestPath_(mySnake, [x, y], grid.clone());
            if(toCorner.length>1) {
                console.log("Sending path to corner " + corner[0]);
                console.log(toCorner);
                return toCorner;
            }
        }
    }

    console.log("No empty corners found. No path to tail found.");
    return [[]]
}

function nextStepTail_(mySnake, grid){
    var gridCopy = grid.clone();
    var tailPath = getSafeTail_(mySnake, gridCopy, mySnake.tail);

    console.log("TAILPATH IN nextStepTail_:");
    console.log(tailPath);

    if( tailPath.length > 2 && canReturnFromPoint_(mySnake, gridCopy, tailPath)){
        return findDirection_(mySnake.head, tailPath[1]);
    } else {
        //no path to tail
        var farthestPointPath = findFarthestPointPath(mySnake, gridCopy.clone()); 
        if(farthestPointPath && farthestPointPath.length > 1){
            return findDirection_(mySnake.head, farthestPointPath[1]); 
        }
        else {
            //I'm constricted
            //find farthest corner from itself
            console.assert(true, "Should never happen.");
        }
    }
}

function canReturnFromPoint_(mySnake, grid, foodPath) {
    console.log("CAN RETURN FROM POINT");
    var gridCopy = grid.clone();
    var foodPathCopy = JSON.parse(JSON.stringify(foodPath));
    var mySnakeCopy = JSON.parse(JSON.stringify(mySnake));
    for (var i = 1; i < foodPathCopy.length; i++) {
        var tail = mySnakeCopy.coords.pop();
        gridCopy.setWalkableAt(tail[0], tail[1], true);
        mySnakeCopy.coords.unshift(foodPathCopy[i]);
        gridCopy.setWalkableAt(foodPathCopy[i][0], foodPathCopy[i][1], true);
    }

    mySnakeCopy.tail = mySnakeCopy.coords[mySnakeCopy.coords.length-1];
    mySnakeCopy.head = mySnakeCopy.coords[0];
    var pathToTail = goToTail_(mySnakeCopy, gridCopy);
    console.log(pathToTail);
    //check next condition
    if(pathToTail && pathToTail.length > 2) {
        console.log("YES, I CAN")
        return true;
    } else {
        console.log("NO, I CANNOT")
        return false;
    }
}

function goToTail_(mySnake, grid) {
    var safeToTailPath = getSafeTail_(mySnake, grid.clone(), mySnake.tail);
    if(safeToTailPath.length <= 2){
        safeToTailPath = findFarthestPointPath(mySnake, grid.clone());
        console.log("Corner Path found:");
    }

    else{
        console.log("Safe to tail path found:");
    }

    console.log(safeToTailPath);
    return safeToTailPath;
}

var api = {
    initSelfGridSnakeHeads: initSelfGridSnakeHeads_,
    shortestPath: shortestPath_,
    findClosestFoodPathsInOrder: findClosestFoodPathsInOrder_,
    findBestFoodPathPos: findBestFoodPathPos_,
    findDirection: findDirection_,
    getSafeTail : getSafeTail_,
    withinCentre : withinCentre_,
    goToCentre : goToCentre_,
    goToTail : goToTail_,
    nextStepTail : nextStepTail_,
    canReturnFromPoint : canReturnFromPoint_,
    findEmptyNeighbour : findEmptyNeighbour_
};

module.exports = api;
