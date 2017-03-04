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
	    //find my snake
	    snakes.forEach((s)=>{
		if (mySnake.snakeId === s.id) {
		    mySnake.len = s.coords.length;
		}
	    })

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

            if(withinCentre_(pos[0], pos[1], grid.width, grid.height, mySnake)){
                enemySnakes.withinCentre.push(pos);
            }

		});
        if (mySnake.snakeId === s.Id) {
		  grid.setWalkableAt(mySnake.coords[mySnake.len-1][0], mySnake.coords[mySnake.len-1][1], true);
        }
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
      distanceGrid[i] = new Array(grid.width);
    }
    return distanceGrid;
}

//need to pass in grid copy
//returns path from farthest point
function findFarthestPointPath(mySnake, grid) {
    var gridCopy = grid.clone();
    var start = [mySnake.head[0], mySnake.head[1]];
    var queue = [];
    grid.setWalkableAt(start[0],start[1], true);
    var currentNode = grid.getNodeAt(start[0],start[1]);
    console.log(currentNode); 
    var distanceGrid = buildDistanceGrid(grid);
    var farthest = {node: currentNode, distance: 0};

    queue.push(currentNode);
    while(queue.length){
        //visit node at front of queue
        currentNode = queue.shift();
        if(grid.isWalkableAt(currentNode.x, currentNode.y)){
            distanceGrid[currentNode.x, currentNode.y] = findDistance([currentNode.x, currentNode.y], start);
            //set farthest node
            var farthestDistance = Math.max(farthest.distance, distanceGrid[currentNode.x, currentNode.y]);
            if(farthestDistance != farthest.distance){
                farthest = {node: currentNode, distance: farthestDistance};
            }
		var neighbours = grid.getNeighbors(currentNode, pf.DiagonalMovement.Never); // gives me nodes
		for(var k = 0; k < neighbours.length; k++){
		    var neighbour = neighbours[k];
		    queue.push(neighbour);
		}
		    grid.setWalkableAt(currentNode.x, currentNode.y, false);
        }

    }

    var path = shortestPath_(mySnake, [farthest.node.x, farthest.node.y], gridCopy);
    console.log(path);
    console.trace();
    console.log("Path to farthest point:");
    console.log(path[0],path[path.length - 1]);
    console.log("I worked.");
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
var findBestFoodPathPos_ = function(closestFoodInOrder, enemySnakes, mySnake, grid, foodArray){

    var posChanged = false;
    for(var i = 0; i < closestFoodInOrder.length; i++){
        for(var j = 0; j < enemySnakes.head.length; j++) {
            var snakehead = enemySnakes.head[j];
            //distance between enemy snake to current best food
            var distance = findDistance(snakehead, closestFoodInOrder[i][closestFoodInOrder[i].length - 1]);
            if((distance < closestFoodInOrder[i].length) ||
                (distance === closestFoodInOrder[i].length && enemySnakes.len[j] >= mySnake.len)){
                //TODO: eat snake
                var snakesClosestFoods = findClosestFoodPathsInOrder_(foodArray, {head: enemySnakes.head[j]}, grid.clone());
                if(snakesClosestFoods.length > 0){
                    var topFoodPath = snakesClosestFoods[0];
                    var topFoodPathPos = topFoodPath[topFoodPath.length - 1];
                    if((topFoodPathPos[0] === closestFoodInOrder[i][0]) && (topFoodPathPos[1] === closestFoodInOrder[i][1])){
                        posChanged = true;
                        break;
                    }
                }
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

function makeCenterDistanceStack(startx, starty, width, height, enemySnakes){

    var distanceStack = [];
    for(var i = starty; i < height; i++){
        for(var j = startx; j < width; j++){
            var distanceToSnake = 0;
            for(var k = 0; k < enemySnakes.withinCentre.length; k++){
                distanceToSnake += findDistance([i, j], enemySnakes.withinCentre[k]);
            }
            if(distanceStack.length === 0){
                distanceStack.push({pos: [i,j], distance: distanceToSnake});
            }            
            else{
               distanceStack.push({pos: [i,j], distance: distanceToSnake});
            }
        }
    }

    distanceStack.sort((a,b)=>{
        return b.distance - a.distance;
    });
    return distanceStack;
}

var goToCentre_ = function(mySnake, gridCopy, enemySnakes){

    var width = gridCopy.width;
    var height = gridCopy.height;
    var centre = [ Math.round(width/2), Math.round(height/2) ];
    var xmin = centre[0] - Math.min(Math.max(Math.round(mySnake.len/4),2), Math.round(width/4));
    var xmax = centre[0] + Math.min(Math.max(Math.round(mySnake.len/4),2), Math.round(width/4));
    var ymin = centre[1] - Math.min(Math.max(Math.round(mySnake.len/4),2), Math.round(height/4));
    var ymax = centre[1] + Math.min(Math.max(Math.round(mySnake.len/4),2), Math.round(height/4));

    //find safe spot in centre
    var distanceStack = makeCenterDistanceStack(xmin, ymin, width, height, enemySnakes);

    //find best pos in centre
    for(var i = 0; i < distanceStack.length; i++){
        var toCentre = shortestPath_(mySnake, distanceStack[i].pos, gridCopy.clone());
        if(toCentre.length > 1){
            return toCentre;
        }
    }

    //if no body in centre
    if(distanceStack.length === 0){
        var toCentre = shortestPath_(mySnake, centre, gridCopy.clone());
        if(toCentre.length > 1){
            return toCentre;
        }
    }

    console.log("No space in centre found.");
    var cornerPath = findFarthestPointPath(mySnake, gridCopy);
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
    
    var x = tail[0];
    var y = tail[1];
    var offsetFromTail = 2;
    if(mySnake.len >= 35){
        offsetFromTail = 1;
    }


    if (grid.isInside(x,y+offsetFromTail) && grid.isWalkableAt(x,y+offsetFromTail)) {
        var toTail = shortestPath_(mySnake, [x,y+offsetFromTail], grid.clone());
        if(toTail.length>1) return toTail;
    }

    if (grid.isInside(x,y-offsetFromTail) && grid.isWalkableAt(x,y-offsetFromTail)) {
        var toTail = shortestPath_(mySnake, [x,y-offsetFromTail], grid.clone());
        if(toTail.length>1) return toTail;
    }

    if (grid.isInside(x+offsetFromTail,y) && grid.isWalkableAt(x+offsetFromTail,y))  {
        var toTail = shortestPath_(mySnake, [x+offsetFromTail,y], grid.clone());
        if(toTail.length>1) return toTail;
    }

    if (grid.isInside(x-offsetFromTail,y) && grid.isWalkableAt(x-offsetFromTail,y)) {
        var toTail = shortestPath_(mySnake, [x-offsetFromTail,y], grid.clone());
        if(toTail.length>1) return toTail;
    }


    grid.setWalkableAt(x,y, true);
    if (grid.isInside(x,y) && grid.isWalkableAt(x,y)) {
        var toTail = shortestPath_(mySnake, [x,y], grid.clone());
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
        else {
            console.log("Corner ");
            console.log([x,y]);
            console.log(" is not walkable.");
        }
    }

    console.log("No empty corners found. No path to tail found.");
    return [[]]
}

function nextStepTail_(mySnake, grid){
    var gridCopy = grid.clone();
    var tailPath = getSafeTail_(mySnake, gridCopy, mySnake.tail);

    console.log("TAILPATH IN nextStepTail_:");

    if(tailPath.length > 1){
        return findDirection_(mySnake.head, tailPath[1]);
    } else {
        //no path to tail
        console.log("no path to tail");
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
    console.log("CAN RETURN FROM POINT?");
    var gridCopy = grid.clone();
    var foodPathCopy = JSON.parse(JSON.stringify(foodPath));
    var mySnakeCopy = JSON.parse(JSON.stringify(mySnake));
    for (var i = 1; i < foodPathCopy.length; i++) {
        var tail = mySnakeCopy.coords.pop();
        gridCopy.setWalkableAt(tail[0], tail[1], true);
        var newHead = foodPathCopy[i];
        console.log(newHead);
        mySnakeCopy.coords.unshift(newHead);
        gridCopy.setWalkableAt(newHead[0], newHead[1], false);
    }

    console.log("Shifted snake successfully.");
    mySnakeCopy.tail = mySnakeCopy.coords[mySnakeCopy.coords.length-1];
    mySnakeCopy.head = mySnakeCopy.coords[0];
    var pathToTail = goToTail_(mySnakeCopy, gridCopy);
    //check next condition
    var pathToCorner= checkForEmptyCorners(gridCopy.clone(), mySnakeCopy);
    if((pathToTail && pathToTail.length > 1) && (pathToCorner && pathToCorner.length > 2) ) {
        console.log("YES, I CAN")
        return true;
    } else {
        console.log("NO, I CANNOT")
        return false;
    }
}

function goToTail_(mySnake, grid) {
    var safeToTailPath = getSafeTail_(mySnake, grid.clone(), mySnake.tail);

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
