var config      = require('./config.json');
var bodyParser  = require('body-parser');
var express     = require('express');
var logger      = require('morgan');
var app         = express();
var routes      = require('./routes');
var cors        = require('cors');
var ai          = require('./ai.js');
var pf          = require('pathfinding');


app.set('port', (process.env.PORT || config.port));
// For deployment to Heroku, the port needs to be set using ENV, so
// we check for the port number in process.env before going to config.

app.enable('verbose errors');

app.use(cors());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(routes);

app.use('*',function (req, res, next) {
  if (req.url === '/favicon.ico') {
    // Short-circuit favicon requests
    res.set({'Content-Type': 'image/x-icon'});
    res.status(200);
    res.end();
    next();
  } else {
    // Reroute all 404 routes to the 404 handler
    var err = new Error();
    err.status = 404;
    next(err);
  }

  return;
});

// 404 handler middleware, respond with JSON only
app.use(function (err, req, res, next) {
  if (err.status !== 404) {
    return next(err);
  }

  res.status(404);
  res.send({
    status: 404,
    error: err.message || 'no snakes here'
  });

  return;
});

// 500 handler middleware, respond with JSON only
app.use(function (err, req, res, next) {

  console.log(err);
  console.log(err.stack);

  console.log("FAILED ALL MOVES. IN ERROR HANDLE.");
  var body = req.body;
  var enemySnakes = {head:[], len:[]};
  var snakes = body.snakes;
  var mySnake = {coords: []};
  mySnake.snakeId = body.you;
  var grid = new pf.Grid(body.width, body.height);

  // init me, board, enemy tiles -- args(snakes, grid, mySnake, enemySnakeHeads)
  ai.initSelfGridSnakeHeads(snakes, grid, mySnake, enemySnakes);

  var first = ai.getSafeTail(mySnake, grid, mySnake.tail);
  var win = ai.findDirection(mySnake.head, first);
  // var win = "north";
  var data = {
    move: win, // one of: ["north", "east", "south", "west"]
    taunt: config.snake.taunt.move
  };

  return res.json(data);

});

var server = app.listen(app.get('port'), function () {
  console.log('Server listening at http://%s:%s', config.host, app.get('port'));
});
