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
    color: "green",
    head_url: "http://i.imgur.com/qM6KaEy.gif",
    name: "Rat Snake",
    taunt: "Hisss..."
  };

  return res.json(data);
});

// Handle POST request to '/move'
router.post(config.routes.move, function (req, res) {
  // Do something here to generate your move

  console.time("Move");
  var body = req.body;
  // console.dir(body, {
  //   depth: null,
  //   colors: true
  // });
  console.log("TURN: " + body.turn);
  var win = 'up';
  var enemySnakes = {head:[], len:[], withinCentre: []};
  var snakes = body.snakes;
  var mySnake = {coords: [], 
		            len: 0,
                topLeftQuadrantFilled: 0,
                topRightQuadrantFilled: 0,
                bottomLeftQuadrantFilled: 0, 
                bottomRightQuadrantFilled: 0,
              };

  mySnake.snakeId = body.you;
  var foodArray = body.food;
  var foodPath;
  var grid = new pf.Grid(body.width, body.height);
  var foodToGetPos = -1;

  // init me, board, enemy tiles -- args(snakes, grid, mySnake, enemySnakeHeads)
  ai.initSelfGridSnakeHeads(snakes, grid, mySnake, enemySnakes, false);
  // find closest food list -- args(foodArray, mySnake, gridCopy)
  console.log("My Snake");
  console.log(mySnake);

  var healthOffset = 85;
  if(mySnake.len > 45){
    healthOffset = 70;
  }
  
  var closestFoodPaths = ai.findClosestFoodPathsInOrder(foodArray, mySnake, grid.clone());
  if(closestFoodPaths.length && enemySnakes.head.length && mySnake.health <= healthOffset){
    console.log("Prioritizing Food.");
    foodToGetPos = ai.findBestFoodPathPos(closestFoodPaths, enemySnakes, mySnake, grid, foodArray);
  }
    console.log("Food to get pos:");
    console.log(foodToGetPos);


  //Can't reach any food faster than others
  if(closestFoodPaths.length === 0 || foodToGetPos === -1){
    //TODO: GO INTO SAFE MODE
    console.log("SAFE MODE");

    //if not at centre, go to centre
      if(!ai.withinCentre(mySnake.head[0], mySnake.head[1], body.width, body.height, mySnake)
          && (mySnake.len <= (body.width * 1.5)) 
      ){
      console.log("im not within centre");
      var shortestPathToCentre = ai.goToCentre(mySnake, grid, enemySnakes);
      if (shortestPathToCentre.length > 1) {
        // can Return from centre
        if (ai.canReturnFromPoint(mySnake, grid.clone(), shortestPathToCentre)) {      
          win = ai.findDirection(mySnake.head, shortestPathToCentre[1]);
        }
        //no path to tail from next pos to centre 
        else {
          console.log("no path to tail from next pos to centre");
          win = ai.nextStepTail(mySnake, grid);
        }
      } else {
        // no path to centre
        console.log("no path to centre. following tail.");        
        win = ai.nextStepTail(mySnake, grid);
      }
    }
    else {
      console.log("I'm within centre. following tail");      
      win = ai.nextStepTail(mySnake, grid);
    }
  }

  else{
    //TODO: GO TOWARDS FOOD
    var foodToGet = closestFoodPaths[foodToGetPos];
    console.log("Food to get:");
    console.log(foodToGet);
    win = ai.findDirection(mySnake.head, foodToGet[1]);
  }

  // Response data
  var data = {
    move: win, // one of: ["north", "east", "south", "west"]
    taunt: config.snake.taunt.move
  };

  console.log(win);
  if(!win) {
	throw new Error();
  }
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
