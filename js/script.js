window.onload = function() {

  var previousMoveCounter = 1;
  var moveCounter = 1;
  var turnColor = 'w';
  var currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
  var board = null
  var game = new Chess()
  var $status = $('#status')
  var $fen = $('#fen')
  var $moveCounter = $('#moveCounter')

  function onDragStart (source, piece, position, orientation) {
    // do not pick up pieces if the game is over
    if (game.game_over()) return false

    // only pick up pieces for the side to move
    if ((turnColor === 'w' && piece.search(/^b/) !== -1) ||
        (turnColor === 'b' && piece.search(/^w/) !== -1)) {
      return false
    }
  }

  function onDrop (source, target) {
    // see if the move is legal
    var move = game.move({
      from: source,
      to: target,
      promotion: 'q' // NOTE: always promote to a queen for example simplicity
    })
    // illegal move
    if (move === null) return 'snapback'
    
    updateTurn();
    
  }

  // update the board position after the piece snap
  // for castling, en passant, pawn promotion
  function onSnapEnd () {
    function rewriteFenForProgressive(fen) {
      let fenArray= fen.split(' ');
      fenArray[1] = turnColor;
      if(moveCounter != previousMoveCounter)
        fenArray[3] = '-';
      return fenArray.join(' ');
    }

    currentFen = rewriteFenForProgressive(game.fen())
    game = new Chess(currentFen)
    board.position(currentFen)
    updateStatus()
  }

  function updateStatus () {
    var status = ''

    var moveColor = 'White'
    if (turnColor === 'b') {
      moveColor = 'Black'
    }

    // checkmate?
    if (game.in_checkmate()) {
      status = 'Game over, ' + moveColor + ' is in checkmate.'
      moveCounter = 0;
    }

    // draw?
    else if (game.in_draw()) {
      status = 'Game over, drawn position'
    }

    // game still on
    else {
      status = moveColor + ' to move'

      // check?
      if (game.in_check()) {
        status += ', ' + moveColor + ' is in check'
      }
    }

    $status.html(status)
    $fen.html(currentFen)
    $moveCounter.html(moveCounter);
  }

  function updateTurn() {
    moveCounter--;
    if(moveCounter == 0 || game.in_check()) {
      moveCounter = previousMoveCounter + 1;
      previousMoveCounter = previousMoveCounter + 1;
      if(turnColor === 'w')
        turnColor = 'b';
      else
        turnColor = 'w';
      //board.orientation('flip');
    }
  }

  document.getElementById('newScottish').onclick = function() {
    previousMoveCounter = 1;
    moveCounter = 1;
    turnColor = 'w';
    currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    board.position('start');
    game = new Chess()

    updateStatus();
  }

  var config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
  }
  board = Chessboard('myBoard', config)

  updateStatus()
}