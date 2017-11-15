

//------------------Constants---------------------------
const ACTION_SUBMIT_CARD    = "submit_card";
const ACTION_TAKE_CARD      = "take_card";
const ACTION_TAKE_DISCARPILE= "take_discarpile";

const C_TAKE_CARD           = "callback_take_card";
const C_DISCARD_CARD        = "callback_discard_card";
const C_TAKE_DISCARPILE     = "callback_take_discarpile";
const C_REMOVE_DISCARD_CARDS= "callback_remove_discard_cards";
//-----------------------------------------------------



//-------------------Callback Handler-------------------
let cb_handler = {};
cb_handler[C_DISCARD_CARD] = discard_card;
cb_handler[C_TAKE_CARD] = take_card;
cb_handler[C_TAKE_DISCARPILE] = take_discard_pile;
cb_handler[C_REMOVE_DISCARD_CARDS] = remove_discar_pile;


//------------------------------------------------------


$("#deal").hide();
cards.init({table:'#card-table'});
let deck = new cards.Deck(); 
deck.x -= 50;
deck.addCards(cards.all); 
deck.render({immediate:true});

upperhand = new cards.Hand({faceUp:false, y:60});
lowerhand = new cards.Hand({faceUp:true, y:340});

discardPile = new cards.Deck({faceUp:true});
discardPile.x += 50;

erasedPile = new cards.Deck({faceUp:true});
erasedPile.x = 500;
erasedPile.y = 340;


//-------------------------------------------------------
//-----------connection logic with web sockets-----------
//-------------------------------------------------------

var socket = io();
let user_number;

socket.on('max_users_reached', function(msg){
	console.log(msg);
});

socket.on('assing_user_number', function(msg){
	user_number = msg;
	console.log("This players is the number "+user_number);
});

socket.on('user_lost_connection', function(msg){
	console.log(msg);
	location.reload();
});

socket.on('game_begin', function(msg){
	console.log("The game has begun...")
	console.log(msg);
	replaceCardsOnDeck(msg);
});

socket.on('set_first_discard', function(msg){
	console.log("First top card...")
	console.log(msg);
	setFirstDiscard(msg);
});

socket.on('replay_gameLogic', function(msg){
	console.log("Replay game logic...")
	console.log(msg);
	if(msg.status != "error")	
		handleCallback(msg.cb, msg.player);
});


//---------------------------------
//------------UTILS----------------
//---------------------------------


function takeCards (source, destination){
	while(source.topCard())
		destination.addCard(source.topCard());
	destination.render();
}


function replaceCardsOnDeck(data){
	let cards = data[user_number];
	cards.forEach( (e, i) => mergeCards(deck[i+43], e) );
	deck.forEach( (e,i)=> console.log(i+" "+e.suit+" "+e.rank));
	deck.render();
	initGame();
}

function initGame(){
	deck.deal(9, [lowerhand, upperhand] , 50);
}

function setFirstDiscard(card) {
	mergeCards(deck[33], card);
	discardPile.addCard(deck[33]);
	discardPile.render();
	deck.render()
}

function mergeCards(target,source){
	target.suit = source.suit;
	target.rank = source.rank;
}


function cardSimplifier(card){
	return {suit: card.suit, rank: card.rank};
}

function handleCallback(callbacks, player){
	console.log(callbacks);
	callbacks.forEach( e => console.log(e.action));
	callbacks.forEach( e => cb_handler[e.action](e.params, player));
}

function findIndexCard(hand, card){
	for(let i=0;i<hand.length;i++){
		if(hand[i].suit == card.suit  && hand[i].rank ==card.rank){
			return i;
		}
	}
	return -1;
}

//---------------------------------------------------
//--------------callback methods---------------------
//---------------------------------------------------
function take_card(params, player){ 	
	if(user_number == player){
		mergeCards(deck.topCard(), params[0]);
		lowerhand.addCard(deck.topCard());
		lowerhand.render();
		lowerhand.render();
		return;
	}
	
	upperhand.addCard(deck.topCard());
	upperhand.render();
	upperhand.render();
}

function discard_card(params, player){
	console.log("discard card")
	let index = findIndexCard(lowerhand, params);
	mergeCards(upperhand[0],params);
	discardPile.addCard((user_number == player) ? lowerhand[index] : upperhand[0] );
	discardPile.render();
	lowerhand.render();
	upperhand.render();
}

function take_discard_pile(params, player){
	takeCards(discardPile, (user_number == player) ? lowerhand : upperhand );
	discardPile.render();
}

function remove_discar_pile(parmas, player){
	takeCards(discardPile, erasedPile);
	discardPile.render();
}
//---------------------------------------------------
//--------------Reactive actions---------------------
//---------------------------------------------------

deck.click(function(card){
	// if (card === deck.topCard()) {
	// 	socket.emit(ACTION_TAKE_CARD, cardSimplifier(card));
	// }
});

discardPile.click(function(card){
		socket.emit(ACTION_TAKE_DISCARPILE, cardSimplifier(card));
});

lowerhand.click(function(card){
	socket.emit(ACTION_SUBMIT_CARD, cardSimplifier(card))
});



