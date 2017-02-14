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
  var enemySnakeHeads = [];
  var snakes = body.snakes;
  var mySnake = {};
  mySnake.snakeId = body.you;
  var foodArray = body.food;
  var foodPath;
  var grid = new pf.Grid(body.width, body.height);
  var foodToGetPos = 0;

  // init me, board, enemy tiles -- args(snakes, grid, mySnake, enemySnakeHeads)
  ai.initSelfGridSnakeHeads(snakes, grid, mySnake, enemySnakeHeads);
  // find closest food list -- args(foodArray, mySnake, gridCopy)

  var closestFoodPaths = ai.findClosestFoodPathsInOrder(foodArray, mySnake, grid.clone());
  if(closestFoodPaths.length && enemySnakeHeads.length){
    foodToGetPos = ai.findBestFoodPathPos(closestFoodPaths, enemySnakeHeads);
  }

  //Can't reach any food faster than others
  if(closestFoodPaths.length === 0 || foodToGetPos === -1){
    //TODO: GO INTO SAFE MODE
    console.log("SAFE MODE");
    var toTail = ai.shortestPath(mySnake, mySnake.tail, grid.clone());
    if(toTail.length > 0){
      win = ai.findDirection(mySnake[0], toTail[0]);
    }
    else{
    //TODO: HANDLE NO PATH TO TAIL
      var safeZonesInOrder = ai.findSafeZones(grid.clone());
      var bestSafeZoneIndex = ai.findBestSafeZone(mySnake, safeZonesInOrder);
      win = ai.findDirection(mySnake[0], safeZonesInOrder[bestSafeZoneIndex].pos);
      //console.error("No path to tail");
    }
  }

  else{
    //TODO: GO TOWARDS FOOD
    var foodToGet = closestFoodPaths[foodToGetPos];
    win = ai.findDirection(mySnake.head, foodToGet[1]);
  }

  // Response data
  var data = {
    move: win, // one of: ["north", "east", "south", "west"]
    taunt: config.snake.taunt.move
  };

  console.log(win);
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
