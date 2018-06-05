var util = require('util');
var http = require('http');
var path = require('path');
var ecstatic = require('ecstatic');
var io = require('socket.io');
var Player = require('./Player');
//var Finish = require('./Finish');


var socket;	// Socket controller
var players;	// Array of connected players
var readyPlayers; //Array of players ready to play
var lobby; // Array of players in the game
var races; // array of race names
var raceCounter; // what race are we on
var scoreboard; // scoreboard object
var position; // position of who came where in the race
var score; // score for that race


var port = process.env.PORT || 8080;
// Create and start the http server
var server = http.createServer(
  ecstatic({ root: path.resolve(__dirname, '../public') })
).listen(port, function (err) {
  if (err) {
    throw err;
  }
  init();
})

function init () {
  players = [];  // Create an empty array to store players
  readyPlayers = []; // players who are ready to play
  lobby ={}; // people who are playing
  scoreboard={}; // scoreboard for the game
  position=[]; // who came where
  score = 100; // race score
  races = ["race1","race2","race3"]; // names of races
  raceCounter= 0;
  // Attach Socket.IO to server
  socket = io.listen(server);
  // Start listening for events
  setEventHandlers();
}


var setEventHandlers = function () {
  // Socket.IO
  socket.sockets.on('connection', onSocketConnection);
}

// New socket connection
function onSocketConnection (client) {

  util.log('New player has connected: ' + client.id)
  // Listen for client disconnected
  client.on('disconnect', onClientDisconnect);
  // Listen for new player message
  client.on('new player', onNewPlayer);
  // Listen for move player message
  client.on('move player', onMovePlayer);
  //a player is ready in the lobby
  client.on('player ready', playerReady);
  //player has completed a lap
  client.on('new lap', newLap);
  // player hit box
  client.on('hit box', hitBox);

}
 // Premade functions
// Socket client has disconnected
function onClientDisconnect () {
  util.log('Player has disconnected: ' + this.id)

  var removePlayer = playerById(this.id)

  // Player not found
  if (!removePlayer) {
    util.log('Player not found: ' + this.id)
    return
  }

  // Remove player from players array
  players.splice(players.indexOf(removePlayer), 1)
  readyPlayers.splice(players.indexOf(removePlayer), 1)
  // Broadcast removed player to connected socket clients
  this.broadcast.emit('remove player', {id: this.id})
}

// New player has joined
function onNewPlayer (data) {
  // Create a new player
  var newPlayer = new Player(data.x, data.y, data.angle)
  newPlayer.id = this.id

  // Broadcast new player to connected socket clients
  this.broadcast.emit('new player', {id: newPlayer.id, x: newPlayer.getX(), y: newPlayer.getY(), angle: newPlayer.getAngle()})

  // Send existing players to the new player
  var i, existingPlayer
  for (i = 0; i < players.length; i++) {
    existingPlayer = players[i]
    this.emit('new player', {id: existingPlayer.id, x: existingPlayer.getX(), y: existingPlayer.getY(), angle: existingPlayer.getAngle()})
  }

  // Add new player to the players array
  players.push(newPlayer)
}

// Player has moved
function onMovePlayer (data) {
  // Find player in array
  var movePlayer = playerById(this.id)

  // Player not found
  if (!movePlayer) {
    util.log('Player not found: ' + this.id)
    return
  }
  // Update player position
  movePlayer.setX(data.x)
  movePlayer.setY(data.y)
  movePlayer.setAngle(data.angle)
  // Broadcast updated position to connected socket clients
  this.broadcast.emit('move player', {id: movePlayer.id, x: movePlayer.getX(), y: movePlayer.getY(), angle: movePlayer.getAngle()})
}

// end of premade functions



// Our functions

// player has clicked the ready button
function playerReady(data){
  var player = playerById(this.id);// get player id
  var response = ""; //
  var state ="";

  //put player in array for them to play
  //see if player is already in array
  if (readyPlayers.indexOf(this.id)== -1) {
        readyPlayers.push(this.id);
        this.emit('response', {response:"Ready! Waiting for others"});
  }else {
        console.log("player already in array");
  }

  //check to see if game can start
  if (players.length<2 ) {
      this.emit('response', {response:"Ready! Waiting for others"});
  }else {
    // if players in lobby match ready players
    if (readyPlayers.length == players.length) {
      //console.log("ready to play");
       for (var i = 0; i < readyPlayers.length; i++) {
         //get the lobby ready and get response from client to send unique data
          var num = i;
          num++;
          socket.sockets.emit('response', {response:"start",race:races[raceCounter],player:readyPlayers[i],gridPos:i,username:"Player "+num}); ;
          lobby[readyPlayers[i]] = 1;
          scoreboard["Player "+num]=0;
          console.log(lobby);
       }
       countDownToRace();
    }else {
    }
  }
}


// player has done a lap
function newLap(data){
  var id = data.id; // player id
  var user = data.player; // player name
  var lap;
  var currentLap = lobby[id];
  currentLap++;

  if (currentLap == 2) { // finish race lap
    position.push(id); // push player into position
    var pos = position.indexOf(id); // see where they came
    scoreboard[user] = scoreboard[user]+ score; //log thier score
    score = score-20; // decrease score
    this.emit('finished',{lap:pos}); // send score back to player
  }
  var objLength = Object.keys(lobby).length; // get length of lobby

  if (position.length == objLength) { // if all players have finished the race
    raceCounter ++;
    if (raceCounter == 3) {
      //game is over
      displayEndScreen();
      }else {
        console.log("Race is over");
        // reset variables
        score = 100;
        lobby = {};
        position =[];
        for (var i = 0; i < readyPlayers.length; i++) {
          lobby[readyPlayers[i]] = 1;
        }
        displayScoreboard();
      }

  }else {
    // player has finished a lap update their laps
    lobby[id] = currentLap;
    this.emit('lap', {lap:currentLap}); // send it back to them
    }
  }


// hit a powerup box
function hitBox(data){
  var player = data.socket; //who is sending the bitmapData
  console.log(player);
  var box = data.box; // if of box that has been hit
  //pick a random powerup
  var i;
  i= Math.floor((Math.random() * 3) + 1);
  var power = i;

  if (power == 0) {
    console.log("power is " + power);
    // slow all players but the player who hit the box
    socket.sockets.emit("box",{data:box,user:player,code:power});
  }

  if (power == 1) {
    console.log("power is " + power);

    // speed player up that hit the box
    socket.sockets.emit("box",{data:box,user:player,code:power});
  }

  if (power == 2) {
    console.log("power is " + power);

    //slow player that hit the box
      socket.sockets.emit("box",{data:box,user:player,code:power});

  }
}


function countDownToRace(){
  // countdown to race
 var counter = 7;
 var canMove = false;
 var interval = setInterval(function() {
     counter--;
     // can move bool is for pauseing player
     socket.sockets.emit('countdown', {count:counter-1,canMove:false});

     if (counter == 0) {
       // they go
       socket.sockets.emit('countdown', {count:"GO", canMove:true});
     }
     if (counter == -1) {
       // stop countdown
       socket.sockets.emit('countdown', {count:"",canMove:true});
       clearInterval(interval);
     }
 }, 1000);
}

function displayScoreboard() {
  // display scoreboard to players
  var counter = 10;
  var canMove = false;
  socket.sockets.emit('scoreboard', {scoreboard:scoreboard,canMove:false});
  var interval = setInterval(function() {
      counter--;
      if (counter == 0) {
        for (var i = 0; i < readyPlayers.length; i++) {
          var num = i;
          num++;
          socket.sockets.emit('response', {response:"start",race:races[raceCounter],player:readyPlayers[i],gridPos:i,username:"Player "+num});
        }
        countDownToRace(5000);
        clearInterval(interval);
      }
  }, 1000);
}

function displayEndScreen() {
  // display final scoreboard
  var counter = 10;
  var canMove = false;
  socket.sockets.emit('endGame', {scoreboard:scoreboard,canMove:false});
  var interval = setInterval(function() {
      counter--;

      if (counter == 0) {
        for (var i = 0; i < readyPlayers.length; i++) {
          var num = i;
          num++;
          socket.sockets.emit('restart', {response:"start",race:races[lobby]});
        }
        // now game is over reset game
        resetGame();
        clearInterval(interval);
      }
  }, 1000);
}

function resetGame(){
  console.log("reset");
  readyPlayers = [];
  lobby ={};
  scoreboard={};
  position=[];
  score = 100;
  raceCounter= 0;
}

/* ************************************************
** GAME HELPER FUNCTIONS
************************************************ */
// Find player by ID
function playerById (id) {
  var i
  for (i = 0; i < players.length; i++) {
    if (players[i].id === id) {
      return players[i]
    }
  }
  return false
}
