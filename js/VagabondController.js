/* Vagabond Pai Sho specific UI interaction logic */

function VagabondController() {
	document.getElementById('hostTilesContainer').innerHTML = this.getHostTilesContainerDivs();
	document.getElementById('guestTilesContainer').innerHTML = this.getGuestTilesContainerDivs();

	document.querySelector(".svgContainer").classList.add("vagabondBoardRotate");

	this.resetGameManager();
	this.resetNotationBuilder();
	this.resetGameNotation();

	this.hostAccentTiles = [];
	this.guestAccentTiles = [];
}

VagabondController.prototype.resetGameManager = function() {
	this.theGame = new VagabondGameManager();
};

VagabondController.prototype.resetNotationBuilder = function() {
	this.notationBuilder = new VagabondNotationBuilder();
};

VagabondController.prototype.resetGameNotation = function() {
	this.gameNotation = new VagabondGameNotation();
};

VagabondController.prototype.getHostTilesContainerDivs = function() {
	return '<div class="HC"></div> <div class="HS"></div> <div class="HB"></div> <div class="HW"></div> <br class="clear" /> <div class="HF"></div> <div class="HD"></div> <div class="H_empty"></div> <div class="HL"></div>';
}

VagabondController.prototype.getGuestTilesContainerDivs = function() {
	return '<div class="GC"></div> <div class="GS"></div> <div class="GB"></div> <div class="GW"></div> <br class="clear" /> <div class="GF"></div> <div class="GD"></div> <div class="G_empty"></div> <div class="GL"></div>';
};

VagabondController.prototype.resetMove = function(first_argument) {
	if (this.notationBuilder.status === BRAND_NEW) {
		// Remove last move
		this.gameNotation.removeLastMove();
	} else if (this.notationBuilder.status === READY_FOR_BONUS) {
		// Just rerun
	}

	rerunAll();
};

VagabondController.prototype.getDefaultHelpMessageText = function() {
	return "<h4>Vagabond Pai Sho</h4> <p> <p>Vagabond Pai Sho is the Pai Sho variant seen in the fanfiction story <a href='https://www.fanfiction.net/s/7849861/1/Gambler-and-Vagabond'>Gambler and Vagabond</a>.</p> <p><strong>You win</strong> if you capture your opponent's White Lotus tile.</p> <p><strong>On a turn</strong>, you may either deploy a tile or move a tile.</p> <p><strong>You can't capture Flower tiles</strong> until your White Lotus has been deployed.<br /> <strong>You can't capture Non-Flower tiles</strong> until both players' White Lotus tiles have been deployed.</p> <p><strong>Hover</strong> over any tile to see how it works.<br /> <strong>Make a move</strong> and send the generated link to your opponents!</p> </p> <p>Select tiles to learn more or <a href='https://skudpaisho.wordpress.com/vagabond-pai-sho/' target='_blank'>view the rules</a>.</p>";
};

VagabondController.prototype.getAdditionalMessage = function() {
	var msg = "";
	
	if (this.gameNotation.moves.length === 0) {
		if (onlinePlayEnabled && gameId < 0 && userIsLoggedIn()) {
			msg += "<strong>Real-time gameplay is enabled!</strong> Click <em>Join Game</em> above to join another player's game. Or, you can start a game that other players can join by making a move. <br />";
		} else {
			msg += "Sign in to enable real-time gameplay. Or, start playing a local game by making a move.";
		}
	}

	return msg;
};



VagabondController.prototype.getExtraHarmonyBonusHelpText = function() {
	return "";
}

VagabondController.prototype.showHarmonyBonusMessage = function() {
	// 
}


VagabondController.prototype.unplayedTileClicked = function(tileDiv) {
	if (this.theGame.board.winners.length > 0 && this.notationBuilder.status !== READY_FOR_BONUS) {
		return;
	}
	if (!myTurn()) {
		return;
	}
	if (currentMoveIndex !== this.gameNotation.moves.length) {
		debug("Can only interact if all moves are played.");
		return;
	}

	var divName = tileDiv.getAttribute("name");	// Like: GW5 or HL
	var tileId = parseInt(tileDiv.getAttribute("id"));
	var playerCode = divName.charAt(0);
	var tileCode = divName.substring(1);

	var player = GUEST;
	if (playerCode === 'H') {
		player = HOST;
	}

	var tile = this.theGame.tileManager.peekTile(player, tileCode, tileId);

	if (tile.ownerName !== getCurrentPlayer()) {
		// debug("That's not your tile!");
		return;
	}

	if (this.notationBuilder.status === BRAND_NEW) {
		// new Deploy turn
		tile.selectedFromPile = true;

		this.notationBuilder.moveType = DEPLOY;
		this.notationBuilder.tileType = tileCode;
		this.notationBuilder.status = WAITING_FOR_ENDPOINT;

		this.theGame.revealDeployPoints(getCurrentPlayer(), tileCode);
	} else {
		this.theGame.hidePossibleMovePoints();
		this.resetNotationBuilder();
	}
}

VagabondController.prototype.pointClicked = function(htmlPoint) {
	if (this.theGame.board.winners.length > 0) {
		return;
	}
	if (!myTurn()) {
		return;
	}
	if (currentMoveIndex !== this.gameNotation.moves.length) {
		debug("Can only interact if all moves are played.");
		return;
	}

	var npText = htmlPoint.getAttribute("name");

	var notationPoint = new NotationPoint(npText);
	var rowCol = notationPoint.rowAndColumn;
	var boardPoint = this.theGame.board.cells[rowCol.row][rowCol.col];

	if (this.notationBuilder.status === BRAND_NEW) {
		if (boardPoint.hasTile()) {
			if (boardPoint.tile.ownerName !== getCurrentPlayer()) {
				debug("That's not your tile!");
				return;
			}

			if (!boardPoint.tile.canMove()) {
				return;
			}

			this.notationBuilder.status = WAITING_FOR_ENDPOINT;
			this.notationBuilder.moveType = MOVE;
			this.notationBuilder.startPoint = new NotationPoint(htmlPoint.getAttribute("name"));

			this.theGame.revealPossibleMovePoints(boardPoint);
		}
	} else if (this.notationBuilder.status === WAITING_FOR_ENDPOINT) {
		if (boardPoint.isType(POSSIBLE_MOVE)) {
			// They're trying to move there! And they can! Exciting!
			// Need the notation!
			this.theGame.hidePossibleMovePoints();
			this.notationBuilder.endPoint = new NotationPoint(htmlPoint.getAttribute("name"));
			
			var move = this.gameNotation.getNotationMoveFromBuilder(this.notationBuilder);
			this.theGame.runNotationMove(move);

			// Move all set. Add it to the notation!
			this.gameNotation.addMove(move);
			if (onlinePlayEnabled && this.gameNotation.moves.length === 1) {
				createGameIfThatIsOk(GameType.VagabondPaiSho.id);
			} else {
				if (playingOnlineGame()) {
					callSubmitMove();
				} else {
					finalizeMove();
				}
			}
		} else {
			this.theGame.hidePossibleMovePoints();
			this.resetNotationBuilder();
		}
	}
}

VagabondController.prototype.skipHarmonyBonus = function() {
	var move = this.gameNotation.getNotationMoveFromBuilder(this.notationBuilder);
	this.gameNotation.addMove(move);
	if (playingOnlineGame()) {
		callSubmitMove();
	} else {
		finalizeMove();
	}
}

VagabondController.prototype.getTheMessage = function(tile, ownerName) {
	var message = [];

	var tileCode = tile.code;

	var heading = VagabondTile.getTileName(tileCode);

	if (tileCode === 'L') {
		heading = "White Lotus";
		message.push("Flower Tile");
		message.push("Can move 1 space");
	} else if (tileCode === 'S') {
		heading = "Sky Bison";
		message.push("Deployed on the point inside of the small red triangles in the corners of the board");
		message.push("Can move up to six spaces, turning any number of times");
		message.push("Cannot move if a Chrysanthemum tile is adjacent to it");
		message.push("Can capture other tiles");
		message.push("A Sky Bison has a territorial zone the size of the area the tile can move within. No other Sky Bison is allowed in this zone once the Sky Bison has moved out of its starting position.");
	} else if (tileCode === 'B') {
		heading = "Badgermole";
		message.push("Can move only one space in any direction OR move directly adjacent to a Flower Tile if that Flower Tile is in the Badgermole's \"line of sight\" (meaning, the tiles lie on the same line with no other tiles in between)");
		message.push("Flower Tiles adjacent to a Badgermole are protected from capture");
	} else if (tileCode === 'W') {
		heading = "Wheel";
		message.push("Can move any number of spaces forwards, backwards, left, or right across the spaces of the board as opposed to diagonally on the lines");
		message.push("Can capture other tiles");
	} else if (tileCode === 'C') {
		heading = "Chrysanthemum";
		message.push("Flower Tile");
		message.push("Cannot move");
		message.push("Freezes opponent's Sky Bison tiles in place when adjacent");
	} else if (tileCode === 'F') {
		heading = "Fire Lily";
		message.push("Flower Tile");
		message.push("Cannot move");
		message.push("Enables deployment of White Dragon");
	} else if (tileCode === 'D') {
		heading = "White Dragon";
		message.push("Can be deployed in a 5-space area around the Fire Lily");
		message.push("Can move anywhere inside that 5-space Fire Lily zone");
		message.push("Can capture other tiles");
	}

	return {
		heading: heading,
		message: message
	}

	// if (message.length > 1) {
	// 	setMessage(toHeading(heading) + toBullets(message));
	// } else {
	// 	setMessage(toHeading(heading) + toMessage(message));
	// }
}

VagabondController.prototype.getTileMessage = function(tileDiv) {
	var divName = tileDiv.getAttribute("name");	// Like: GW5 or HL
	var tileId = parseInt(tileDiv.getAttribute("id"));

	var tile = new VagabondTile(divName.substring(1), divName.charAt(0));

	var ownerName = HOST;
	if (divName.startsWith('G')) {
		ownerName = GUEST;
	}

	return this.getTheMessage(tile, ownerName);
}

VagabondController.prototype.getPointMessage = function(htmlPoint) {
	var npText = htmlPoint.getAttribute("name");

	var notationPoint = new NotationPoint(npText);
	var rowCol = notationPoint.rowAndColumn;
	var boardPoint = this.theGame.board.cells[rowCol.row][rowCol.col];

	if (boardPoint.hasTile()) {
		return this.getTheMessage(boardPoint.tile, boardPoint.tile.ownerName);
	} else {
		return null;
	}
}

VagabondController.prototype.playAiTurn = function(finalizeMove) {
	// 
};

VagabondController.prototype.startAiGame = function(finalizeMove) {
	// 
};

VagabondController.prototype.getAiList = function() {
	return [];
}

VagabondController.prototype.getCurrentPlayer = function() {
	if (this.gameNotation.moves.length % 2 === 0) {
		return HOST;
	} else {
		return GUEST;
	}
};

VagabondController.prototype.cleanup = function() {
	document.querySelector(".svgContainer").classList.remove("vagabondBoardRotate");
};




