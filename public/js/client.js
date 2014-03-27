(function() {
  var shapeSize = 20;
  var svgBoard = d3.select('#board')
            .append('svg')
            .attr('width', 400)
            .attr('height', 600);

  var svgNext = d3.select('#nextshape')
            .append('svg');

  var keys = {
    d: 68,
    a: 65,
    s: 83,
    left: 37,
    right: 39,
    down: 40,
    p: 80,
    space: 32,
    j: 74,
    k: 75,
    enter: 13
  };

  function nextShapeX(name) {
    switch (name) {
      case 'O':
        return 0.5;

      case 'I':
        return 0.5;

      default:
        return 1;
    }
  }

  var host = window.document.location.host.replace(/:.*/, '');
  var ws = new WebSocket('ws://' + host + ':3000');

  ws.onmessage = function(event) {
    var data = JSON.parse(event.data);

    switch (data.type) {
      case 'shape':
        drawShape(svgBoard, data);
      break;

      case 'board':
        drawBoard(data);
      break;

      case 'score':
        updateScore(data);
      break;

      case 'gameover':
        gameOver();
      break;

      case 'nextshape':
        data.x = nextShapeX(data.name);
        data.y = data.data.length === 3 ? 1 : 0;
        drawShape(svgNext, data);
      break;
    }
  };

  function updateScore(message) {
    $('#score').html(message.value);
  }

  function gameOver(message) {
    $('#status').html('Game Over <a href="/board">New game</a>');
  }

  function drawBoard(board) {
    shapeSize = svgBoard.attr('width') / board.width;
    svgBoard.selectAll('rect').remove();
    var colour;

    svgNext
      .attr('width', shapeSize * 5)
      .attr('height', shapeSize * 4);

    for (var y = 0; y < board.height; y++) {
      for (var x = 0; x < board.width; x++) {
        colour = board.data[y][x];

        if (colour !== 0) {
          svgBoard.append('rect')
            .attr('x', function(d, i) {
              return x * shapeSize;
            })
            .attr('y', function(d) {
              return (y + 1) * shapeSize;
            })
            .attr('width', shapeSize)
            .attr('height', shapeSize)
            .attr('fill', function(d, i) {
              return colour === 1 ? '#999999' : colour;
            });
        }
      }
    }
  }

  function drawShape(svg, shape) {
    svg.selectAll('rect.shape').remove();
    var line;

    for (var i = 0; i < shape.data.length; i++) {
      line = shape.data[i];
      for (var j = 0; j < line.length; j++) {
        if (line[j] !== 0) {
          svg.append('rect')
            .attr('class', 'shape')
            .attr('x', (shape.x * shapeSize) + (shapeSize * j))
            .attr('y', (shape.y * shapeSize) + (shapeSize * i))
            .attr('width', shapeSize)
            .attr('height', shapeSize)
            .attr('fill', shape.colour);
        }
      }
    }
  }

  function handleKey(key) {
    var message;

    if (key === keys.d || key === keys.right) {
      message = { move: 'right' };
    } else if (key === keys.a || key === keys.left) {
      message = { move: 'left' };
    } else if (key === keys.s || key === keys.down) {
      message = { move: 'down' };
    } else if (key === keys.space) {
      message = { move: 'rotate' };
    } else if (key === keys.p) {
      message = { move: 'pause' };
    } else if (key === keys.j) {
      message = { move: 'slowDown'};
    } else if (key === keys.k) {
      message = { move: 'speedUp'};
    } else if (key === keys.enter) {
      message = { move: 'dropDown' };
    }

    if (message) {
      message.type = 'move';
      ws.send(JSON.stringify(message));
      return true;
    }
  }

  $(document).keydown(function(e) {
    if (handleKey(e.which)) {
      e.preventDefault();
    }
  });
}());
