const sock = io();

let gameJson;

window.onload = function() {

  document.getElementById("queen").checked = true;

  var previousMoveCounter = 1;
  var moveCounter = 1;
  var currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  var turnColor = currentFen.split(' ')[1];
  var board = null
  var game = null;
  var $status = $('#status')
  var $moveCounter = $('#moveCounter')

  sock.emit('request');
  sock.on('update', obj => {
    gameJson = obj;
    previousMoveCounter = gameJson.previousMoveCounter;
    moveCounter = gameJson.moveCounter;
    currentFen = gameJson.fen;
    turnColor = currentFen.split(' ')[1];
    game = new Chess(currentFen);
    updateStatus(false);
  })

  
  function onDragStart (source, piece, position, orientation) {
    // do not pick up pieces if the game is over
    if (game.game_over()) return false

    // only pick up pieces for the side to move
    if ((turnColor === 'w' && piece.search(/^b/) !== -1) ||
        (turnColor === 'b' && piece.search(/^w/) !== -1)) {
      return false
    }

    return ((turnColor === 'w' && sessionStorage.who == 'whitePlayer') || 
       (turnColor === 'b' && sessionStorage.who == 'blackPlayer')) 
  }

  function onDrop (source, target) {
    // see if the move is legal
    var move = game.move({
      from: source,
      to: target,
      promotion: promotionPiece() 
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
    updateStatus(true)
  }

  function updateStatus (write) {

    var config = {
      draggable: true,
      position: currentFen,
      onDragStart: onDragStart,
      onDrop: onDrop,
      onSnapEnd: onSnapEnd
    }
    board = Chessboard('myBoard', config)

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
      moveCounter = 0;
    }

    // game still on
    else {
      status = moveColor + ' to move'

      // check?
      if (game.in_check()) {
        status += ', ' + moveColor + ' is in check'
      }
    }

    gameJson.moveCounter = moveCounter;
    gameJson.previousMoveCounter = previousMoveCounter;
    gameJson.fen = currentFen;

    $status.html(status)
    $moveCounter.html(moveCounter);

    loadButtons();

    if(sessionStorage.who == 'blackPlayer')
      board.orientation('black')
    else
      board.orientation('white');

    if(write) {
      sock.emit('write', gameJson);
      sock.emit('updateAll');
    }

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
    }
  }

  document.getElementById('newScottish').onclick = function() {
    if(sessionStorage.who == 'whitePlayer' || sessionStorage.who == 'blackPlayer') {
      previousMoveCounter = 1;
      moveCounter = 1;
      turnColor = 'w';
      currentFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
      board.position('start');
      game = new Chess()

      gameJson.blackPlayer = false;
      gameJson.whitePlayer = false;
      sessionStorage.who = 'spectator';

      updateStatus(true);
    }
  }

  document.getElementById('joinBlack').onclick = function() {
    if(sessionStorage.who === undefined || sessionStorage.who !== 'blackPlayer') {
      if(sessionStorage.who == 'whitePlayer')
        gameJson.whitePlayer = false;
      sessionStorage.who = 'blackPlayer';
      gameJson.blackPlayer = true;
    } else {
      sessionStorage.who = 'spectator';
      gameJson.blackPlayer = false;
    }
    updateStatus(true);
  }

  document.getElementById('joinWhite').onclick = function() {
    if(sessionStorage.who === undefined || sessionStorage.who !== 'whitePlayer') {
      if(sessionStorage.who == 'blackPlayer')
        gameJson.blackPlayer = false;
      sessionStorage.who = 'whitePlayer';
      gameJson.whitePlayer = true;  
    } else {
      sessionStorage.who = 'spectator';
      gameJson.whitePlayer = false;
    }
    updateStatus(true);
  }

  function loadButtons() {
    let joinBlackButton = document.getElementById('joinBlack');
    let joinWhiteButton = document.getElementById('joinWhite');
  
    if(gameJson.blackPlayer) {
      if(sessionStorage.who == 'blackPlayer')
        joinBlackButton.innerHTML = 'Leave';
      else {
        joinBlackButton.disabled = true;
        joinBlackButton.innerHTML = 'Occupied';
      }
    } else {
      joinBlackButton.disabled = false;
      joinBlackButton.innerHTML = 'Join Black'
    }   
  
    if(gameJson.whitePlayer) {
      if(sessionStorage.who == 'whitePlayer')
        joinWhiteButton.innerHTML = 'Leave';
      else {
        joinWhiteButton.disabled = true;
        joinWhiteButton.innerHTML = 'Occupied';
      }
    } else {
      joinWhiteButton.disabled = false;
      joinWhiteButton.innerHTML = 'Join White'
    } 
  
    if(sessionStorage.who != 'whitePlayer' && sessionStorage.who != 'blackPlayer') {
      document.getElementById('newScottish').disabled = true;
    } else {
      document.getElementById('newScottish').disabled = false;
    }
  }

  function loadButtons() {
    let joinBlackButton = document.getElementById('joinBlack');
    let joinWhiteButton = document.getElementById('joinWhite');
  
    if(gameJson.blackPlayer) {
      if(sessionStorage.who == 'blackPlayer')
        joinBlackButton.innerHTML = 'Leave';
      else {
        joinBlackButton.disabled = true;
        joinBlackButton.innerHTML = 'Occupied';
      }
    } else {
      joinBlackButton.disabled = false;
      joinBlackButton.innerHTML = 'Join Black'
    }   
  
    if(gameJson.whitePlayer) {
      if(sessionStorage.who == 'whitePlayer')
        joinWhiteButton.innerHTML = 'Leave';
      else {
        joinWhiteButton.disabled = true;
        joinWhiteButton.innerHTML = 'Occupied';
      }
    } else {
      joinWhiteButton.disabled = false;
      joinWhiteButton.innerHTML = 'Join White'
    } 
  
    if(sessionStorage.who != 'whitePlayer' && sessionStorage.who != 'blackPlayer') {
      document.getElementById('newScottish').disabled = true;
    } else {
      document.getElementById('newScottish').disabled = false;
    }
  }

  function promotionPiece() {
    let radioGroup = document.querySelectorAll('input[name="promotion_piece"]');
    for (const rb of radioGroup) {
      if (rb.checked) {
          return rb.value;
      }
    }
  }  
}