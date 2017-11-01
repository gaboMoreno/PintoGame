var express = require('express');
var app = express();

function main(req, res){
	res.send("data");
}


app.get('/', main);

app.listen(80,()=> console.log("Listening port 8080..."));