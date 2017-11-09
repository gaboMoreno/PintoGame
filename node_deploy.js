var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var GM = require('./model/GameLogic');

let totalUsers;
let gameLogic;


const ACTION_SUBMIT_CARD    = "submit_card";
const ACTION_TAKE_CARD      = "take_card";
const ACTION_TAKE_DISCARPILE= "take_discarpile";

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
	res.sendFile(__dirname + '/public/html/pintoGame.html');
  });

io.on('connection', function (socket) {
	totalUsers = !totalUsers ? 1 : totalUsers + 1 ;
	socket.userNumber= totalUsers;
	
	//Pinto v0.1 only is avaliable for 2 players at the same time
	if(totalUsers < 3)
		socket.emit('assing_user_number',totalUsers);
	else{
		socket.emit('max_users_reached',"Sorry , but it looks that the table is full");
		socket.disconnect();
	}

	//handle beginig of the game when there are two players online
	if(totalUsers == 2){
		gameLogic = new GM.GameLogic(1,2);
		io.emit("game_begin", gameLogic.players);
		io.emit("set_first_discard", gameLogic.discardCards[0]);
	}


	//------------------------------------------------------------------------------------
	//--------------------------------GAME LOGIC------------------------------------------
	//------------------------------------------------------------------------------------
	socket.on('disconnect', function (socket) {
		totalUsers--;
		io.emit("user_lost_connection", "The other player lost connection");
	});

	socket.on(ACTION_SUBMIT_CARD, function (card) {
		let resp = gameLogic.executeStep(socket.userNumber,ACTION_SUBMIT_CARD, card);
		if(resp.status == "error")
			socket.emit("replay_gameLogic",resp);
		else
			io.emit("replay_gameLogic",resp);
	});
  
  });

http.listen(3000, function(){
  console.log('listening on *:3000');
})