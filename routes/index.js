var config  = require('../config.json');
var express = require('express');
var router  = express.Router();
var pf = require('pathfinding');
var ai = require('../ai.js');

// Handle GET request to '/'
router.get(config.routes.info, function (req, res) {
  // Response data
  var data = {
    color: config.snake.color,
    head_url: config.snake.head_url,
  };

  return res.json(data);
});

// Handle POST request to '/start'
router.post(config.routes.start, function (req, res) {
  // Do something here to start the game
  // Response data
  console.log(req.body);
  var data = {
    taunt: config.snake.taunt.start
  };

  return res.json(data);
});

// Handle POST request to '/move'
router.post(config.routes.move, function (req, res) {
  // Do something here to generate your move

  console.time("Move");
  var body = req.body;
  console.dir(body, {
    depth: null,
    colors: true
  });
  var win = 'north';
  var enemySnakes = {head:[], len:[]};
  var snakes = body.snakes;
  var mySnake = {};
  mySnake.snakeId = body.you;
  var foodArray = body.food;
  var foodPath;
  var grid = new pf.Grid(body.width, body.height);
  var foodToGetPos = 0;

  // init me, board, enemy tiles -- args(snakes, grid, mySnake, enemySnakeHeads)
  ai.initSelfGridSnakeHeads(snakes, grid, mySnake, enemySnakes);
  // find closest food list -- args(foodArray, mySnake, gridCopy)
  console.log("My Snake");
  console.log(mySnake);

  var closestFoodPaths = ai.findClosestFoodPathsInOrder(foodArray, mySnake, grid.clone());
  if(closestFoodPaths.length && enemySnakes.head.length){
    foodToGetPos = ai.findBestFoodPathPos(closestFoodPaths, enemySnakes, mySnake);

    if (foodToGetPos !== -1 ) {
      var start = {
        head: closestFoodPaths[foodToGetPos][1]
      };
      var safeToTail = ai.getSafeTail(grid.clone(), mySnake.tail);
      var toTail = ai.shortestPath(start, safeToTail, grid.clone());
      if (toTail.length < 1) foodToGetPos = -1;
    }
  }

  // //Can't reach any food faster than others
  if(closestFoodPaths.length === 0 || foodToGetPos === -1){
    //TODO: GO INTO SAFE MODE
    console.log("SAFE MODE");

    var safeToTail = ai.getSafeTail(grid.clone(), mySnake.tail);
    safeToTail = ai.getSafeTail(grid.clone(), safeToTail);
    console.log("Safe tail Pos");
    console.log(safeToTail);
    var toTail = ai.shortestPath(mySnake, safeToTail, grid.clone());
    console.log("Path To tail");
    console.log(toTail);
    if(toTail.length > 1){
      win = ai.findDirection(mySnake.head, toTail[1]);
    }
    else{
    //TODO: HANDLE NO PATH TO TAIL
      var safeZonesInOrder = ai.findSafeZones(mySnake, grid);
      var bestSafeZoneIndex = ai.findBestSafeZone(mySnake, safeZonesInOrder);
      if(bestSafeZoneIndex >= 0){
        win = ai.findDirection(mySnake.head, safeZonesInOrder[bestSafeZoneIndex].path[1]);
      }

      else{
        console.log("this is some weird shit.");
      }

      console.error("Win: ");
      console.log(win);

    }
  }

  else{
    //TODO: GO TOWARDS FOOD
    var foodToGet = closestFoodPaths[foodToGetPos];
    var safeToTail = ai.getSafeTail(grid.clone(), mySnake.tail);
    safeToTail = ai.getSafeTail(grid.clone(), safeToTail);    
    var toTail = ai.shortestPath({head: foodToGet[1]}, safeToTail, grid.clone());
    if(toTail.length){
      //if path to tail from next block, go for food
      win = ai.findDirection(mySnake.head, foodToGet[1]);
    }
    else{
      
      toTail = ai.shortestPath(mySnake, safeToTail, grid.clone());
      if(toTail.length){
        win = ai.findDirection(mySnake.head, toTail[1]);
      }
      else{
        console.log("oh fugg");
      }
    }

    console.log("Safe tail Pos");
    console.log(safeToTail);

  }

  // Response data
  var data = {
    move: win, // one of: ["north", "east", "south", "west"]
    taunt: config.snake.taunt.move
  };

  console.timeEnd("Move");
  return res.json(data);
});

// Handle POST request to '/end'
router.post(config.routes.end, function (req, res) {
  // Do something here to end your snake's session

  // We don't need a response so just send back a 200
  res.status(200);
  res.end();
  return;
});


module.exports = router;
