// Vagabond Game Manager

function VagabondGameManager(actuator, ignoreActuate, isCopy) {
	this.gameLogText = '';
	this.isCopy = isCopy;

	this.actuator = actuator;

	this.tileManager = new VagabondTileManager();

	this.setup(ignoreActuate);
}

// Set up the game
VagabondGameManager.prototype.setup = function (ignoreActuate) {

	this.board = new VagabondBoard();

	// Update the actuator
	if (!ignoreActuate) {
		this.actuate();
	}
};

// Sends the updated board to the actuator
VagabondGameManager.prototype.actuate = function () {
	if (this.isCopy) {
		return;
	}
	this.actuator.actuate(this.board, this.tileManager);
	setGameLogText(this.gameLogText);
};

VagabondGameManager.prototype.runNotationMove = function(move, withActuate) {
	debug("Running Move: " + move.fullMoveText);

	if (move.moveType === DEPLOY) {
		// Just placing tile on board
		var tile = this.tileManager.grabTile(move.player, move.tileType);
		this.board.placeTile(tile, move.endPoint);

		this.buildDeployGameLogText(move, tile);
	} else if (move.moveType === MOVE) {
		var moveDetails = this.board.moveTile(move.player, move.startPoint, move.endPoint);

		this.buildMoveGameLogText(move, moveDetails);
	}

	if (move.moveType === DRAW_ACCEPT) {
		this.gameHasEndedInDraw = true;
	}

	if (withActuate) {
		this.actuate();
	}
};

VagabondGameManager.prototype.buildDeployGameLogText = function(move, tile) {
	this.gameLogText = move.player + ' placed ' + VagabondTile.getTileName(tile.code) + ' at ' + move.endPoint.pointText;
};
VagabondGameManager.prototype.buildMoveGameLogText = function(move, moveDetails) {
	this.gameLogText = move.player + ' moved ' + VagabondTile.getTileName(moveDetails.movedTile.code) + ' from ' + move.startPoint.pointText + ' to ' + move.endPoint.pointText;
	if (moveDetails.capturedTile) {
		this.gameLogText += ' and captured ' + getOpponentName(move.player) + '\'s ' + VagabondTile.getTileName(moveDetails.capturedTile.code);
	}
};

VagabondGameManager.prototype.hasEnded = function() {
	return this.getWinResultTypeCode() > 0;
};

VagabondGameManager.prototype.revealPossibleMovePoints = function(boardPoint, ignoreActuate) {
	if (!boardPoint.hasTile()) {
		return;
	}
	this.board.setPossibleMovePoints(boardPoint);
	
	if (!ignoreActuate) {
		this.actuate();
	}
};

VagabondGameManager.prototype.hidePossibleMovePoints = function(ignoreActuate) {
	this.board.removePossibleMovePoints();
	this.tileManager.removeSelectedTileFlags();
	if (!ignoreActuate) {
		this.actuate();
	}
};

VagabondGameManager.prototype.revealDeployPoints = function(player, tileCode, ignoreActuate) {
	this.board.setDeployPointsPossibleMoves(player, tileCode);
	
	if (!ignoreActuate) {
		this.actuate();
	}
};

VagabondGameManager.prototype.getWinner = function() {
	if (this.board.winners.length === 1) {
		return this.board.winners[0];
	}
};

VagabondGameManager.prototype.getWinReason = function() {
	return " has captured the White Lotus and won the game!";
};

VagabondGameManager.prototype.getWinResultTypeCode = function() {
	if (this.board.winners.length === 1) {
		return 1;	// Standard win is 1
	} else if (this.gameHasEndedInDraw) {
		return 4;	// Tie/Draw is 4
	}
};

VagabondGameManager.prototype.getCopy = function() {
	var copyGame = new VagabondGameManager(this.actuator, true, true);
	copyGame.board = this.board.getCopy();
	copyGame.tileManager = this.tileManager.getCopy();
	return copyGame;
};
