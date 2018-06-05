var Game = {};
var socket // Socket connection
var settings;
var land;
var level;
var map;
var base;
var road;
var layer_4,layer_3,layer_2,layer_1;
var player;
var finishLine;
var racers;
var username;
var user;
var currentSpeed = 0;
var cursors;
var button;
var readyPlayerBtn
var readyPlayerText;
var lapCounter = 1;
var countDownText;
var gridMove= true;
var checkBool = true;
var finishBool = false;
var exclude  = [24407,57873,56833,36866,36867,37210];
var scoreboardText;
var player1Score;
var player2Score;
var player3Score;
var player4Score;
var playerScores = [player1Score,player2Score,player3Score,player4Score];
var gridPos;
var ListOfBox = [];
var box;
var gameGo = false;
var maxspeed = 400;
Game.preload = function() {
  game.load.spritesheet('playerSprite', 'assets/car.png', 137, 73);
  game.load.spritesheet('player0', 'assets/player1.png', 39, 65);
  game.load.spritesheet('player1', 'assets/player2.png', 39, 65);
  game.load.spritesheet('player2', 'assets/player3.png', 39, 65);
  game.load.spritesheet('player3', 'assets/player4.png', 39, 65);
  game.load.spritesheet('ship0', 'assets/ship1.png', 198, 188);
  game.load.spritesheet('ship1', 'assets/ship2.png', 198, 188);
  game.load.spritesheet('ship2', 'assets/ship3.png', 198, 188);
  game.load.spritesheet('ship3', 'assets/ship4.png', 198, 188);
  game.load.spritesheet('enemy', 'assets/car.png', 137, 73);
  game.load.spritesheet('finish', 'assets/finish.png', 338, 133);
  game.load.spritesheet('box', 'assets/box.png', 150, 150);
  game.load.spritesheet('checkpoint', 'assets/checkpoint.png',210,20);
  game.load.tilemap('lobby', 'assets/maps/lobby.json', null, Phaser.Tilemap.TILED_JSON);
  game.load.tilemap('race1', 'assets/maps/track1.json', null, Phaser.Tilemap.TILED_JSON);
  game.load.tilemap('race2', 'assets/maps/track2.json', null, Phaser.Tilemap.TILED_JSON);
  game.load.tilemap('race3', 'assets/maps/track3.json', null, Phaser.Tilemap.TILED_JSON);
  game.load.tilemap('black', 'assets/maps/black.json', null, Phaser.Tilemap.TILED_JSON);
  game.load.image('tiles', 'assets/spritesheet_tiles.png');
  game.load.image('wall', 'assets/invisibleWalls.png');
  game.load.image('objects', 'assets/objects.png');
  game.load.image('space', 'assets/space.png');
  game.load.image('black', 'assets/black.jpg');
  game.load.json('settings', 'assets/settings.json'); //setting to change levels
  game.time.advancedTiming = true;
  game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

}

Game.create = function () {
  socket = io.connect();
  settings = game.cache.getJSON('settings'); //get setting from the settings file
  // create game lobby settup
  map = game.add.tilemap('lobby');
  map.addTilesetImage('spritesheet_tiles', 'tiles');
  map.addTilesetImage('invisibleWalls', 'wall');
  map.addTilesetImage('objects', 'objects');
  map.addTilesetImage('space', 'space');
  map.addTilesetImage('black', 'black');
  map.scaleMode = Phaser.ScaleManager.SHOW_ALL;
  layer_1 = map.createLayer('Tile Layer 1');
  layer_2 = map.createLayer('Tile Layer 2');
  layer_3 = map.createLayer('Tile Layer 3');
  layer_4 = map.createLayer('Tile Layer 4');
  layer_1.resizeWorld();
  layer_2.resizeWorld();
  layer_3.resizeWorld();
  layer_4.resizeWorld();
  layer_4.alpha = 0;
  map.setCollision(exclude, true, layer_4);

  var startX = Math.round(Math.random() * (1000) - 500);
  var startY = Math.round(Math.random() * (1000) - 500);
  player = game.add.sprite(startX, startY, 'playerSprite')
  player.anchor.setTo(0.5, 0.5);
  game.physics.enable(player, Phaser.Physics.ARCADE);
  //player.body.maxVelocity.setTo(400, 400)
  player.body.setSize(50,50);
  player.body.collideWorldBounds = true;

  //add finish line and checkpoint as spites - needed as sprites for hit detection.
  finishLine = game.add.sprite(400,750,'finish');
  finishLine.anchor.setTo(0.5,0.5);
  game.physics.enable(finishLine, Phaser.Physics.ARCADE);
  finishLine.body.collideWorldBounds = true;

  checkpoint = game.add.sprite(1480,750,'checkpoint');
  checkpoint.anchor.setTo(0.5,0.5);
  game.physics.enable(checkpoint, Phaser.Physics.ARCADE);
  checkpoint.body.collideWorldBounds = true

  racers = []; //array for other players
  player.bringToTop();
  cursors = game.input.keyboard.createCursorKeys();

  // button to start game
  readyPlayerBtn = game.add.bitmapData(600, 200);
  readyPlayerBtn.ctx.beginPath();
  readyPlayerBtn.ctx.rect(0, 0, 600, 200);
  readyPlayerBtn.ctx.fillStyle = '#212D39';
  readyPlayerBtn.ctx.fill();
  readyPlayerBtn = game.add.button(game.width/2, game.canvas.height-100, readyPlayerBtn, readyPlayerGo, this);
  readyPlayerBtn.anchor.setTo(0.5, 0.5);

  readyPlayerBtn.fixedToCamera = true;
  readyPlayerText = game.add.text(game.width/2, game.canvas.height-100, "Click to ready", {
      font: "50px Arial",
      fill: "#FFFFFF",
      align: "center"
  });
  readyPlayerText.anchor.setTo(0.5,0.5);
  readyPlayerText.fixedToCamera = true;

  // 3,2,1,GO!
  countDownText = game.add.text(game.camera.width/2, game.camera.height/2, "", {
      font: "250px Arial",
      fill: "#FFFFFF",
      align: "center",
      backgroundColor:'#212D39'
  });
  countDownText.anchor.setTo(0.5,0.5);

  lapCounterText = game.add.text(game.camera.width-200,25, lapCounter+"/3", {
      font: "100px Arial",
      fill: "#ffffff",
      align: "center",
      backgroundColor:'#212D39'
  });
  lapCounterText.fixedToCamera=true;

// where player came
  lapPositionText = game.add.text(game.camera.width/2, game.camera.height/2, "",{
      font: "250px Arial",
      fill: "#FFFFFF",
      align: "center",
      backgroundColor:'#212D39'
  });
  lapPositionText.anchor.setTo(0.5,0.5);

  username = game.add.text(game.camera.width/2, 100, "",{
      font: "180px Arial",
      fill: "#FFFFFF",
      align: "center",
      backgroundColor:'#212D39'
  });
  username.anchor.setTo(0.5,0.5);

  scoreboardText = game.add.text(game.camera.width/2, 400, "",{
      font: "120px Arial",
      fill: "#FFFFFF",
      align: "center",
      background:'#212D39'
  });
  username.anchor.setTo(0.5,0.5);

  this.setEventHandlers();
}

Game.setEventHandlers = function () {
  //respose from server - setup next game for next race
  socket.on('response', this.response);
  // Socket connection successful
  socket.on('connect', this.onSocketConnected);
  // Socket disconnection
  socket.on('disconnect', this.onSocketDisconnect);
  // New player message received
  socket.on('new player', this.onNewPlayer);
  // Player move message received
  socket.on('move player', this.onMovePlayer);
  // Player removed message received
  socket.on('remove player', this.onRemovePlayer);
  // Player removed message received
  socket.on('new state', this.newState);
  // countdown
  socket.on('countdown', this.countdown);
  //player has done a lap
  socket.on('lap',this.lap);
  //player is ready
  socket.on('ready',this.ready);
  //player has finished their race, show where they came
  socket.on('finished',this.finished);
  //display scoreboard
  socket.on('scoreboard',this.scoreboard);
  //game over, show end scoreboard
  socket.on('endGame',this.endGame);
  //restart game variables
  socket.on('restart',this.restart);
  // player has hit a box, deal with powerup
  socket.on('box',this.powerUp);
}


// Socket connected
Game.onSocketConnected = function () {
  console.log('Connected to socket server')
  // Reset racers on reconnect
  racers.forEach(function (cars) {
    cars.player.kill()
  })
  racers = []
  // Send local player data to the game server
  socket.emit('new player', { x: player.x, y: player.y, angle: player.angle })
}

// Socket disconnected
Game.onSocketDisconnect =function() {
  console.log('Disconnected from socket server')
}

// New player
Game.onNewPlayer = function(data) {
  console.log('New player connected:', data.id)
  // Avoid possible duplicate players
  var duplicate = playerById(data.id)
  if (duplicate) {
    console.log('Duplicate player!')
    return
  }
  // Add new player to the remote players array
  racers.push(new RemotePlayer(data.id, game, player, data.x, data.y, data.angle))
}


// Move player
Game.onMovePlayer = function (data) {
  var movePlayer = playerById(data.id)
  // Player not found
  if (!movePlayer) {
    console.log('Player not found: ', data.id)
    return
  }
  // Update player position
  movePlayer.player.x = data.x
  movePlayer.player.y = data.y
  movePlayer.player.angle = data.angle
}

// Remove player
Game.onRemovePlayer = function(data) {
  var removePlayer = playerById(data.id)
  // Player not found
  if (!removePlayer) {
    console.log('Player not found: ', data.id)
    return
  }
  removePlayer.player.kill()
  // Remove player from array
  racers.splice(racers.indexOf(removePlayer), 1)
}


Game.update = function() {
  game.physics.arcade.collide(player, layer_4); //collide player with play area bounds
  if (gameGo) {

    ListOfBox.forEach(function(box,index)   {
        if (game.physics.arcade.intersects(box.box.body,player.body)) {
          var id = index;
          ListOfBox[index].box.visible = false;
          ListOfBox[index].box.destroy;
          ListOfBox.splice(index,1);
          socket.emit("hit box",{socket:socket.id,box:id});
        }
      });
    }
    for (var i = 0; i < racers.length; i++) {
      if (racers[i].alive) {
        racers[i].update()
        //update racers
        game.physics.arcade.collide(player, racers[i].player)
      }
    }

    //moving player
    if (cursors.left.isDown) {
      player.angle -= 2.5;
      socket.emit('move player', { x: player.x, y: player.y, angle: player.angle });

    } else if (cursors.right.isDown) {
      player.angle += 2.5;
      socket.emit('move player', { x: player.x, y: player.y, angle: player.angle });

    }
    if (cursors.up.isDown) {
       // The speed we'll travel at
      currentSpeed=maxspeed;
      socket.emit('move player', { x: player.x, y: player.y, angle: player.angle });

    } else {
      if (currentSpeed > 0) {
        currentSpeed -= 100;
        socket.emit('move player', { x: player.x, y: player.y, angle: player.angle });
      }
    }
    game.physics.arcade.velocityFromRotation(player.rotation, currentSpeed, player.body.velocity);

    // end of moving player

    //stop player when on the grid
    if (!gridMove) {
      game.input.enabled = false;
    }else {
      game.input.enabled = true;
    }


  //for determining if player has completed a lap
  //  player hits checkBool
      if(checkBool){
        if (game.physics.arcade.intersects(checkpoint.body,player.body)) {
          checkBool = false;
          finishBool = true;
        }
    }
    if (finishBool) {
      if (game.physics.arcade.intersects(finishLine.body,player.body)) {
        finishBool = false;
        checkBool = true;
        console.log(user);
        socket.emit('new lap',{player:user,id:socket.id});
      }
    }

}

Game.render = function () {
}

// respose function for setting up race
Game.response = function(data) {
  if (socket.id == data.player) { // set race up for specifc game
    //new race beginxs
    var race = data.race; // get race map from server
    //get rid of old map and map layers
    map.destroy();
    layer_1.destroy();
    layer_2.destroy();
    layer_3.destroy();
    layer_4.destroy();

    //level clean up
    lapCounter  = 1;
    //new params
    var newRace = settings[race].level;
    map = game.add.tilemap(newRace);
    map.addTilesetImage('spritesheet_tiles', 'tiles');
    map.addTilesetImage('invisibleWalls', 'wall');
    map.addTilesetImage('objects', 'objects');
    map.addTilesetImage('space', 'space');
    map.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    layer_1 = map.createLayer('Tile Layer 1');
    layer_2 = map.createLayer('Tile Layer 2');
    layer_3 = map.createLayer('Tile Layer 3');
    layer_4 = map.createLayer('Tile Layer 4');
    layer_1.resizeWorld();
    layer_2.resizeWorld();
    layer_3.resizeWorld();
    layer_4.resizeWorld();
    layer_4.alpha =0;
    map.setCollision(exclude, true, layer_4);

    //bring players on top of map
    player.bringToTop();
    for (var i = 0; i < racers.length; i++) {
      racers[i].player.bringToTop();
      if (race == "race1" || race == "race3") {
        racers[i].player.loadTexture("player"+i);
        racers[i].player.scale.setTo(1,1);
      }else if (race == "race2") {
        racers[i].player.loadTexture("ship"+i);
        racers[i].player.scale.setTo(0.5,0.5);

      }
    }
    finishLine.bringToTop();
    //finishLine.visible = false;
    checkpoint.bringToTop();
    //checkpoint.visible = false;
    countDownText.bringToTop();
    lapCounterText.bringToTop();
    lapCounterText.setText(lapCounter+"/3")
    lapPositionText.bringToTop();
    lapPositionText.setText("");
    username.bringToTop();
    scoreboardText.bringToTop();
    scoreboardText.setText("");
    gridMove= false;

    var race = data.race;
    gridPos = data.gridPos;

    //first race, set players into position
    player.x = settings[race].gridPosX[gridPos];
    player.y = settings[race].gridPosY[gridPos];
    player.angle = 90;
    socket.emit('move player', { x: player.x, y: player.y, angle: player.angle });
    finishLine.position.x = settings[race].finishLine[0];
    finishLine.position.y = settings[race].finishLine[1];
    checkpoint.position.x = settings[race].checkpoint[0];
    checkpoint.position.y = settings[race].checkpoint[1];
    user = data.username;
    username.setText(data.username);

    if (race == "race1" || race == "race3") {
      player.loadTexture("player"+gridPos);
      player.scale.setTo(1,1);
    }else if (race == "race2") {
      player.loadTexture("ship"+gridPos);
      player.scale.setTo(0.5,0.5);
    }
      gridMove= false;
      readyPlayerText.visible = false;
      readyPlayerBtn.visible = false;

    for (var i = 0; i < 4; i++) { // add slimes to the floor to slow the player
      var x = settings[race].boxPosX[i];
      var y = settings[race].boxPosY[i];
      ListOfBox.push(new Box(game,box, x, y ));
    }
    gameGo = true;
  }
  readyPlayerText.setText(data.response); // change text on button
}

// count down text take from server
Game.countdown = function(data){
  countDownText.setText(data.count);
  gridMove = data.canMove;
}

//scoreboard - display scores
Game.scoreboard = function(data) {
  setScreenBlack(); // black screen
  var currentScoreboard = data.scoreboard;
  var sorting = [];
  var Scoreheight = 800;

  for (var player in currentScoreboard) {
      sorting.push([player, currentScoreboard[player]]);
  }
  //sort scoreboard
  sorting.sort(function(a, b) {
    return b[1]-a[1];
  });

  scoreboardText.setText("Scoreboard");
  scoreboardText.anchor.setTo(0.5,0.5);
  for (var i = 0; i < sorting.length; i++) {
    playerScores[i] = game.add.text(game.camera.width/2, Scoreheight,sorting[i][0]+"  "+sorting[i][1],{
      font: "120px Arial",
      fill: "#FFFFFF",
      align: "center",
      background:'#212D39'
      });
      playerScores[i].anchor.setTo(0.5,0.5);
      Scoreheight = Scoreheight+200;
  }
  }

// power up from server
Game.powerUp = function(data){
    var boxNum = data.data;
    var playerContext = data.user;
    var powerCode = data.code;
    // get rid of box that was hit
    if (playerContext != socket.id) {
      console.log("removed");
      ListOfBox[boxNum].box.visible= false;
      ListOfBox[boxNum].box.destroy;
      ListOfBox.splice(boxNum,1);
    }

    if (powerCode == 1) {
      // slow all players but the player who hit the box
      if (playerContext == socket.id) {
        // it was you who hit the box
      }else {
        //you're slowed
        maxspeed =0;
        freeze(2);
      }
    }

    if (powerCode == 2) {
     // speed player up that hit the box
      if (playerContext == socket.id) {
        // it was you who hit the box
        maxspeed = 800;
        speedup(2);
      }else {
        //no speed bost for you
      }
    }

    if (powerCode == 3) {
      //slow player that hit the box
      if (playerContext == socket.id) {
        // it was you who hit the box
        maxspeed = 0;
        freeze();
      }else {
      }
    }
  }


Game.restart = function(data){
    // clean up game
    player.x = game.rnd.integerInRange(200, 1000);
    player.y = game.rnd.integerInRange(200, 1000);
    player.angle = 90;
    socket.emit('move player', { x: player.x, y: player.y, angle: player.angle });
    username.setText("");
    readyPlayerText.visible = true;
    readyPlayerBtn.visible = true;

    map.destroy();
    layer_1.destroy();
    layer_2.destroy();
    layer_3.destroy();
    layer_4.destroy();

    //level clean up
    lapCounter  = 1;
    //new params
    map = game.add.tilemap("lobby");
    map.addTilesetImage('spritesheet_tiles', 'tiles');
    map.addTilesetImage('invisibleWalls', 'wall');
    map.addTilesetImage('objects', 'objects');
    map.addTilesetImage('space', 'space');
    map.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    layer_1 = map.createLayer('Tile Layer 1');
    layer_2 = map.createLayer('Tile Layer 2');
    layer_3 = map.createLayer('Tile Layer 3');
    layer_4 = map.createLayer('Tile Layer 4');
    layer_1.resizeWorld();
    layer_2.resizeWorld();
    layer_3.resizeWorld();
    layer_4.resizeWorld();
    layer_4.alpha = 0;
    // map.setCollision(exclude, true, layer_4);
    finishLine.visible = false;
    checkpoint.visible = false;
    //bring players on top of map
    player.bringToTop();
    for (var i = 0; i < racers.length; i++) {
      racers[i].player.bringToTop();
    }
    readyPlayerBtn.bringToTop();
    readyPlayerText.bringToTop();
    countDownText.bringToTop();
  }

  //final scoreboard
  Game.endGame = function(data){
    setScreenBlack();
    // display the final scoreboard
    console.log("Into End Game");
    var currentScoreboard = data.scoreboard;
    var sorting = [];
    var Scoreheight = 800;

    for (var player in currentScoreboard) {
        sorting.push([player, currentScoreboard[player]]);
    }

    sorting.sort(function(a, b) {
      return b[1]-a[1];
    });

    scoreboardText.setText("End of Game");
    scoreboardText.anchor.setTo(0.5,0.5);
    for (var i = 0; i < sorting.length; i++) {
    playerScores[i] = game.add.text(game.camera.width/2, Scoreheight,sorting[i][0]+"  "+sorting[i][1],{
      font: "120px Arial",
      fill: "#FFFFFF",
      align: "center",
      background:'#212D39'
      });
        playerScores[i].anchor.setTo(0.5,0.5);
      Scoreheight = Scoreheight+200;
    }
  }

// finished lap
Game.finished = function(data) {
    var pos = data.lap;
    var suffix = ['n','st','nd','rd','th'];
    pos ++;
    lapPositionText.setText('You came '+pos+suffix[pos]+"!");
}

Game.ready = function(data){
    socket.emit('start game',{player:socket.id});
};

// player has finshed lap
Game.lap = function(data) {
    console.log(data);
    lapCounter =  data.lap;
    lapCounterText.setText(lapCounter+"/3");
    if (lapCounter ==4) {
      console.log(data.lap);
    }
}

function readyPlayerGo() {
  //player has clicked to say they are ready to go
  //send message to server
  socket.emit('player ready', { id: player.id });
}

function newLap(data){
  console.log("NEW LAP");
}

// set screen black for scoreboard
function setScreenBlack(){
  map.destroy();
  layer_1.destroy();
  layer_2.destroy();
  layer_3.destroy();
  layer_4.destroy();

  //new params
  map = game.add.tilemap("black");
  map.addTilesetImage('black', 'black');
  map.scaleMode = Phaser.ScaleManager.SHOW_ALL;
  layer_1 = map.createLayer('Tile Layer 1');
  layer_2 = map.createLayer('Tile Layer 2');
  layer_3 = map.createLayer('Tile Layer 3');
  layer_4 = map.createLayer('Tile Layer 4');
  layer_1.resizeWorld();
  layer_2.resizeWorld();
  layer_3.resizeWorld();
  layer_4.resizeWorld();

  for (var i = 0; i < racers.length; i++) {
    racers[i].player.bringToTop();
  }
  scoreboardText.bringToTop();
  username.bringToTop();

}

// freeze player from powerUp
function freeze(time){
  var counter = time;
  var interval = setInterval(function() {
      counter--;
      maxspeed = 0
      if (counter == 0) {
        maxspeed = 600;
      clearInterval(interval);
      }
  }, 1000);
}

// speed up player from powerup
function speedup(time){
  var counter = time;
  var interval = setInterval(function() {
      counter--;
      maxspeed = 800
      if (counter == 0) {
        maxspeed = 400;
      clearInterval(interval);
      }
  }, 1000);
}

// Find player by ID
function playerById (id) {
  for (var i = 0; i < racers.length; i++) {
    if (racers[i].player.name === id) {
      return racers[i];
    }
  }

  return false
}
