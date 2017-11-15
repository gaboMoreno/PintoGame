
class Card{
    constructor(suit, rank){
        this.suit = suit;
        this.rank = rank;
    }

    toString(){
        return `[ ${this.rank}, ${this.symbol}]`;
    }
}


var gameRules = [
    (cardPlayer,cardTopDis) => cardTopDis == null,
    (cardPlayer,cardTopDis) => cardPlayer.rank == 2,
    (cardPlayer,cardTopDis) => cardTopDis.rank == 7 && cardPlayer.rank <= 7,
    (cardPlayer,cardTopDis) => cardPlayer.rank == 1,
    (cardPlayer,cardTopDis) => cardTopDis.rank <= cardPlayer.rank && cardTopDis.rank != 1 && cardTopDis.rank !=7
];

const ACTION_SUBMIT_CARD    = "submit_card";
const ACTION_TAKE_CARD      = "take_card";
const ACTION_TAKE_DISCARPILE= "take_discarpile";
const C_TAKE_CARD           = "callback_take_card";
const C_DISCARD_CARD        = "callback_discard_card";
const C_TAKE_DISCARPILE     = "callback_take_discarpile";
const C_REMOVE_DISCARD_CARDS= "callback_remove_discard_cards";

class GameLogic{
    constructor(idPlayer1, idPlayer2){
        this.deck = [];
        this.discardCards = [];

        //In the beta version of the pinto game, there will be only 2 players per game.
        this.idPlayer1 = idPlayer1;
        this.idPlayer2 = idPlayer2; 
        
        this.players = {};
        this.players[idPlayer1] = [];
        this.players[idPlayer2] = [];

        this.actualPlayer = idPlayer1;

        this.init_game();
    }

    init_game(){
        this.init_deck();
        this.sort_deck();
        this.init_players_hand();
        this.init_discard_pile();
    }

    init_deck(){
        for (var i = 1; i <= 13; i++) {
			this.deck.push(new Card('h', i));
			this.deck.push(new Card('s', i));
			this.deck.push(new Card('d', i));
			this.deck.push(new Card('c', i));
		}
    }

    sort_deck(){
        let pos;
        for (var i = 0; i < 52; i++) {
            pos = this.getRandomPos(0,52);
            this.swapCards(i,pos);
		}
    }

    init_discard_pile(){
        this.discardCards.push(this.deck.pop());
    }

    getRandomPos(min, max) {
        // [min,max[
        return Math.floor(Math.random() * (max - min)) + min;
    }

    swapCards(posA,posB){
        [this.deck[posA], this.deck[posB]] = [this.deck[posB], this.deck[posA]]
    }


    init_players_hand(){
        this.players[this.idPlayer1] = this.deck.splice(0,9);
        this.players[this.idPlayer2] = this.deck.splice(0,9);
    }

    fitGameRules(cardPlayer, cardTopDis){
        return gameRules.some(e => e(cardPlayer,cardTopDis));
    }

    makeCallBackAct(action, params){
        return {action: action, params: params};
    }


    removeFromPlayerHand(playerID, card){
        this.players[playerID] =  this.players[playerID].filter( c => c.rank != card.rank || c.suit != card.suit);
    }

    changePlayerTurn(){
        this.actualPlayer = this.idPlayer1 == this.actualPlayer ? this.idPlayer2 : this.idPlayer1;
    }

    chackifPlayerWins(){
                //TODO
    }

    takeCardRequeried(playerID){
        return this.players[playerID].length < 3 && this.deck.length != 0;
    }

    executeStep(playerID, action, card){
        let resp = {};

        //not player turn 
        if(playerID != this.actualPlayer){
            [resp.status,resp.desc] = ["error", "It's NOT your turn, my friend...."];
            return resp;
        }
            
        //take card from deck
        if(action == ACTION_TAKE_CARD){
            let cardTopDeck = this.deck.splice(0,1);
            this.players[playerID].push(cardTopDeck);

            let callbackactions = [this.makeCallBackAct(C_TAKE_CARD, cardTopDeck)];
            [resp.status,resp.desc, resp.cb, resp.player] = ["ok", "Card Taken", callbackactions, playerID];
            
        }


        else if(action == ACTION_TAKE_DISCARPILE ){ 
            this.players[playerID] = this.players[playerID].concat(this.discardCards);

            let callbackactions = [this.makeCallBackAct(C_TAKE_DISCARPILE, this.discardCards)];
            this.discardCards = [];

            [resp.status,resp.desc, resp.cb, resp.player] = ["ok", "discarpile taken", callbackactions, playerID];
            
        }

        //put card into the discard pile
        else if(card.rank == 10){
            //empty discard pile
            this.discardCards = [];
            
            //remove card from players hand
            this.removeFromPlayerHand(playerID, card);

            let callbackactions = [this.makeCallBackAct(C_DISCARD_CARD, card),
                                   this.makeCallBackAct(C_REMOVE_DISCARD_CARDS,"")];
            
            if(this.takeCardRequeried(playerID))
                callbackactions = callbackactions.concat(this.makeCallBackAct(C_TAKE_CARD,  this.deck.splice(0,1)));

            [resp.status,resp.desc, resp.cb, resp.player] = ["ok", "Discard pile removed", callbackactions, playerID];
            
        }


        else if(this.fitGameRules(card, this.discardCards[this.discardCards.length -1])){
            this.discardCards.push(card);
            this.removeFromPlayerHand(playerID, card);

            let callbackactions = [this.makeCallBackAct(C_DISCARD_CARD, card)];

            if(this.takeCardRequeried(playerID))
                callbackactions = callbackactions.concat(this.makeCallBackAct(C_TAKE_CARD,  this.deck.splice(0,1)));

            [resp.status,resp.desc, resp.cb, resp.player] = ["ok", "Discard card", callbackactions, playerID];
        }

        if(resp.status)
            this.changePlayerTurn();
        else
            [resp.status,resp.desc, resp.player] = ["error", "No action could be performe", playerID];
        
        return resp;
      
    }

}

module.exports.GameLogic = GameLogic;