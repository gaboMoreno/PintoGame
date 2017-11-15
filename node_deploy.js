var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var GM = require('./model/GameLogic');

let totalUsers = 0;
let gameLogic;


const ACTION_SUBMIT_CARD    = "submit_card";
const ACTION_TAKE_CARD      = "take_card";
const ACTION_TAKE_DISCARPILE= "take_discarpile";

app.use(express.static(__dirname + '/public'));



//Clear Game
app.get('/clear', function(req, res){
	totalUsers = 1;
	delete gameLogic ;
	res.send("Ok, Game Clear");
});


//MAIN page
app.get('/', function(req, res){
	res.sendFile(__dirname + '/public/html/index.html');
  });




io.on('connection', function (socket) {
	totalUsers = totalUsers==0 ? 1 : totalUsers + 1 ;
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
	socket.on('disconnect', function () {
		totalUsers--;
		io.emit("user_lost_connection", "The other player lost connection");
	});

	socket.on(ACTION_SUBMIT_CARD, function (card) {
		let resp = gameLogic.executeStep(socket.userNumber,ACTION_SUBMIT_CARD, card);
		handleReplay(resp, socket);
	});

	socket.on(ACTION_TAKE_CARD, function (card) {
		let resp = gameLogic.executeStep(socket.userNumber,ACTION_TAKE_CARD, card);
		handleReplay(resp, socket);
	});

	socket.on(ACTION_TAKE_DISCARPILE, function (card) {
		let resp = gameLogic.executeStep(socket.userNumber,ACTION_TAKE_DISCARPILE, card);
		handleReplay(resp, socket);
	});
  
  });

http.listen(3000, function(){
  console.log('listening on *:3000');
})


function handleReplay(resp, socket){
	if(resp.status == "error")
		socket.emit("replay_gameLogic",resp);
	else
		io.emit("replay_gameLogic",resp);
}