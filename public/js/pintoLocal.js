var isPlayerTurn = true;
var phase_player = 1;
var phase_IA = 1;

//Tell the library which element to use for the table
cards.init({table:'#card-table'});

//Create a new deck of cards
deck = new cards.Deck(); 
//By default it's in the middle of the container, put it slightly to the side
deck.x -= 50;

//cards.all contains all cards, put them all in the deck
deck.addCards(cards.all); 

//No animation here, just get the deck onto the table.
deck.render({immediate:true});

//Now lets create a couple of hands, one face down, one face up.

// In the game there are 2 phases, the first one last while the deck is not depleted
// in the second phase each player don't pick up cards from deck but from their support hand when their main hand its depleted

//IA HANDS
upperhand = new cards.Hand({faceUp:false, y:60}); // IA's main hand
upperhand2 = new cards.Hand({faceUp:false, x:100}); // IA's support hand

//PLAYER'S HANDS
lowerhand = new cards.Hand({faceUp:true, y:340}); // Player's main hand
lowerhand2 = new cards.Hand({faceUp:false, x:500}); // Player's support hand


//Lets add a discard pile
discardPile = new cards.Deck({faceUp:true});
discardPile.x += 50;

//Lets add a discard pile
erasedPile = new cards.Deck({faceUp:true});
erasedPile.x = 500;
erasedPile.y = 340;

function shuffle(deck) {
        //Fisher yates shuffle
        var i = deck.length;
        if (i == 0) return;
        while (--i) {
            var j = Math.floor(Math.random() * (i + 1));
            var tempi = deck[i];
            var tempj = deck[j];
            deck[i] = tempj;
            deck[j] = tempi;
        }
    }

//Let's deal when the Deal button is pressed:
$('#deal').click(function() {
	//Deck has a built in method to deal to hands.
	$('#deal').hide();
	var foo=new Sound("../music/coco.mp3",100,true);
	foo.init(100,true);
	foo.start();
  //foo.start();
  //foo.stop();
  //foo.start();
  //foo.remove();
	deck.deal(3, [lowerhand, upperhand], 50, function() {
		//This is a callback function, called when the dealing
		//is done.
		deck.deal(6, [lowerhand2, upperhand2], 50);
		discardPile.addCard(deck.topCard());
		discardPile.render();
	});
	
});


//When you click on the top card of the discardPile, all those cards are added
//to your hand
discardPile.click(function(card){
	if (card === discardPile.topCard()) {
		takeCards(discardPile, lowerhand);
	}
	AI_Turn();
});


function takeCards (source, destination){
	var i = source.length;
		while(i != 0){
		destination.addCard(source.topCard());
		i--;
		}
		cardArraySort(destination);
		destination.render();
}

//Finally, when you click a card in your hand, if it's
//the same suit or rank as the top card of the discard pile
//then it's added to it

lowerhand.click(function(card){
var condition = "higher";
var canPlace = false;
if(discardPile.length != 0 && discardPile.topCard().rank == 7) condition = "lower";
canPlace = matchCondition(condition, card);
gameMessage("Player","Is this card viable?: "+canPlace);
if(canPlace){
	discardPile.addCard(lowerhand[lowerhand.indexOf(card)]); //card place
	gameMessage("Player"," placed card: "+card+ "");
	discardPile.render();
	gameMessage("Player"," take discardPile");
	if(card.rank == 10) C10_Effect(); 
	
	if (lowerhand.length < 3){
		if(deck.length !=0){ // card pick
			lowerhand.addCard(deck.topCard());
			lowerhand.render();
		}
		else
			if(lowerhand2.length !=0){
			lowerhand.addCard(lowerhand2.topCard());
			lowerhand.render();
			}
				
	}
	if (lowerhand.length == 0) playerWon("human");
	AI_Turn();
}
});

function playerWon(player){
	if(player == "human") alert("GANASTE!");
	if(player == "AI") alert ("GANÓ LA MÁQUINA... GG");
	backToDeck(upperhand, upperhand2, discardPile, lowerhand2, lowerhand, erasedPile);
	shuffle(deck);
	deck.render();
	$('#deal').show();
}

function backToDeck(... cards){
	cards.forEach(function(element){
		takeCards(element,deck);
	});
}

async function AI_Turn(){
gameMessage("AI","Thinking");
await sleep(2000);

var condition = "higher";
var canPlace = false;
if(discardPile.length != 0)
if( discardPile.topCard().rank == 7) condition = "lower";

canPlace = card_place("AI", condition);
if(!canPlace) {  // If player could't place a card 
    console.log("AI didn't had viable cards");
	takeCards(discardPile, upperhand);
	}
else { // ai could place a card
    console.log("AI did had viable cards");
	console.log("AI hand's length is "+ lowerhand.length);
	if (upperhand.length < 3){
	if(deck.length !=0) 
	{
		console.log("Decks's length is "+ deck.length);
		upperhand.addCard(deck.topCard());
		upperhand.render();
	}
	else
		if(upperhand2.length !=0)
		{
	    console.log("Deck depleted upperhand2's length is "+ upperhand2.length);
		upperhand.addCard(upperhand2.topCard());
		upperhand.render();
		}
	}
	console.log("AI finished turn...");
if (upperhand.length == 0) playerWon("AI");
cardArraySort(lowerhand);
lowerhand.render();
//cardArraySort(upperhand);
//upperhand.render();
}
}

// GameLogic - Related

function C10_Effect(){
	takeCards(discardPile,erasedPile);
}

function card_place(player_type, condition){
var used_hand = upperhand;
var effect10 = false;
var chosen = viableCards(condition, used_hand); // decide viable cards
console.log("chosen cards from AI: "+chosen);
var chosenCard; 
 // take the lower viable card
if(chosen != undefined && chosen.length != 0){
	chosenCard = chosen[0];
	console.log("chosen card from AI: "+chosenCard);
	console.log("AI hand's length is "+ upperhand.length);
	if(upperhand[upperhand.indexOf(chosenCard)].rank == 10) effect10 = true;
	discardPile.addCard(upperhand[upperhand.indexOf(chosenCard)]);
	discardPile.render();
	console.log("AI placed"+ chosenCard);
	console.log("AI hand's length is "+ upperhand.length);
	if(effect10) C10_Effect();
return true;
}
console.log("AI didn't have any viable card");
return false;// Player didn't had viable cards to place 
}

function viableCards(condition, hand){
var chosen = [];
console.log ("viable cards: "+ chosen);
hand.forEach(function(element) {
    if((matchCondition(condition, element)))
		chosen.push(element);
});
hand.forEach(function(element) {
    if((matchCondition(condition, element)))
		if(element.rank == 1) element.rank = 15;
});
console.log ("viable cards: "+ cardArraySort(chosen));
return cardArraySort(chosen);
}

function matchCondition(condition, card){
console.log("Player","Pile length = " + discardPile.length + ", condition : "+
 condition + " , card: "+card.rank + " vs ");
if(discardPile.length == 0) console.log(0);
else console.log(discardPile.topCard().rank);
var emptyDiscardPile = false;
var lowerOn7 = false;
var higher = false;
var card2 = false;
var card10 = false;
var cardA = false;

if (discardPile.length == 0) emptyDiscardPile = true;
	gameMessage("SYSTEM","Discard pile empty? "+emptyDiscardPile);
	if(emptyDiscardPile) return true;
	
if (card.rank == 2) card2 = true;
	gameMessage("SYSTEM"," Is the card 2? "+card2);
	if(card2) return true;

if (card.rank == 10 && condition != "lower") card10 = true;
	gameMessage("SYSTEM"," Is the card 10 and we're not on lowers? "+card10);
	if(card10) return true;
	
if (card.rank == 1 && condition != "lower") cardA = true;
	gameMessage("SYSTEM"," Is the card Ace and we're not on lowers? "+cardA);
	if(cardA) return true;

if ((condition == "lower" && card.rank <= 7) && card.rank != 1) lowerOn7 = true;
	gameMessage("SYSTEM"," Are we on lowers and the card is lower? "+lowerOn7);
	if(lowerOn7) return true;

if (condition == "higher" && card.rank >= discardPile.topCard().rank) if(discardPile.topCard().rank !=1) higher = true;
	gameMessage("SYSTEM"," Are we on highers and the card is higher? "+higher);
	if(higher) return true;

return false;
}

function cardArraySort(cards){
	if(cards.length != 0){
	var sorted = cards.sort(function (a, b) {
  if(a.rank == 1) a.rank = 15;
  if(b.rank == 1) b.rank = 15;
  if (a.rank > b.rank) {
    return 1;
  }
  if (a.rank < b.rank) {
    return -1;
  }
  // a must be equal to b
  return 0;
});
return sorted;
}
return cards;
}

function gameMessage(player, message){
var currentdate = new Date(); 
var datetime = "" +  
+ currentdate.getHours() + ":"  
+ currentdate.getMinutes() + ":" 
+ currentdate.getSeconds() +" - "
+ player + " : " + message;
console.log(datetime)
}

function Sound(source,volume,loop)
{
    this.source=source;
    this.volume=volume;
    this.loop=loop;
    var son;
    this.son=son;
    this.finish=false;
    this.stop=function()
    {
        document.body.removeChild(this.son);
    }
    this.start=function()
    {
        if(this.finish)return false;
        this.son=document.createElement("embed");
        this.son.setAttribute("src",this.source);
        this.son.setAttribute("hidden","true");
        this.son.setAttribute("volume",this.volume);
        this.son.setAttribute("autostart","true");
        this.son.setAttribute("loop",this.loop);
        document.body.appendChild(this.son);
    }
    this.remove=function()
    {
        document.body.removeChild(this.son);
        this.finish=true;
    }
    this.init=function(volume,loop)
    {
        this.finish=false;
        this.volume=volume;
        this.loop=loop;
    }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
