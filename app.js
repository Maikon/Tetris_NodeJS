var express = require('express');
var app = express();
var Board = require('sirtet').Board;
var parseCookie = express.cookieParser('some secret');
var MemoryStore = express.session.MemoryStore;
var middleware = require('./middleware');
var routes = require('./routes');
var server = app.listen(process.env.PORT || 3000);
var Scores = require('./scores');
var scores = new Scores();
var speed = 800;
var store = new MemoryStore();
var WebSocketServer = require('ws').Server;
var webSocketServer;
var speedMultiplier = 1;
var paused = false;

app.set('view engine', 'ejs');

app.use(express.bodyParser({ keepExtensions: true, uploadDir: '/tmp' }));
app.use(express.methodOverride());
app.use(parseCookie);
app.use(express.session({ store: store, secret: 'some secret' }));
app.use(express.static(__dirname + '/public'));

// Sessions
app.get('/session/new', routes.session.new);
app.post('/session', routes.session.create);
app.del('/session', routes.session.delete);

// Scores
app.get('/scores', routes.scores.index);

// Game
app.get('/', middleware.requiresUser, routes.board.index);
app.get('/board', middleware.requiresUser, routes.board.index);

webSocketServer = new WebSocketServer({ server: server });

function sendBoard(ws, board) {
  ws.send(JSON.stringify({
    type: 'board',
    data: board.cells,
    width: board.width,
    height: board.height
  }));
}

function sendShape(ws, shape, messageType) {
  ws.send(JSON.stringify({
    type: messageType,
    colour: shape.colour,
    x: shape.x,
    y: shape.y,
    data: shape.data,
    name: shape.name
  }));
}

function handleMove(ws, board, move) {
  var shape = board.currentShape;

  if (move === 'right') {
    shape.moveRight();
  } else if (move === 'left') {
    shape.moveLeft();
  } else if (move === 'down') {
    shape.moveDown();
  } else if (move === 'rotate' && board.checkRotation()) {
    shape.rotate();
  } else if (move === 'speedUp') {
    speedMultiplier += 1;
  } else if (move === 'slowDown') {
    speedMultiplier -= 1;
  } else if (move === 'pause' ) {
    paused = !paused;
  } else if (move === 'dropDown') {
    while(!shape.atBottom()) {
      shape.moveDown();
    }
  }

  sendShape(ws, board.currentShape, 'shape');
}

webSocketServer.on('connection', function(ws) {
  // TODO: I might move this
  var board = new Board(14, 20);
  var boardUpdateId;

  sendBoard(ws, board);

  board.on('shape', function() {
    sendBoard(ws, board);
  });

  board.on('score', function(score) {
    ws.send(JSON.stringify({ type: 'score', value: score }));
  });

  board.on('gameover', function() {
    parseCookie(ws.upgradeReq, null, function(err) {
      var sid = ws.upgradeReq.signedCookies['connect.sid'];

      store.get(sid, function(err, session) {
        if (err) console.error('Error loading session:', err);
        scores.save({ name: session.user.name, score: board.score }, function(err) {
          if (err) console.error('Error saving score:', err);
          ws.send(JSON.stringify({ type: 'gameover' }));
        });
      });
    });
  });

  board.on('nextshape', function(shape) {
    sendShape(ws, shape, 'nextshape');
  });

  sendShape(ws, board.nextShape, 'nextshape');

  boardUpdateId = setInterval(function() {
    if (!board.running) return;
    if (paused) return;
    for (var i = 0; i < speedMultiplier; i++) {
      board.currentShape.moveDown();
    }
    sendShape(ws, board.currentShape, 'shape');
  }, speed);

  ws.on('close', function() {
    clearInterval(boardUpdateId);
  });

  ws.on('message', function(data, flags) {
    var message = JSON.parse(data);

    if (message.type === 'move') {
      handleMove(ws, board, message.move);
    } else {
      ws.send('Unknown command');
    }
  });
});
