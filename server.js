var http = require('http')
var bayes = require('bayes');
var csv = require("fast-csv");
var fs = require("fs");
var path = require("path");
var url = require('url');


var port = process.env.PORT || 8009;
var modelDone = "false";
var count=0;
var app = http.createServer(function(req, res) {
	var path = url.parse(req.url).pathname;
	
	switch(path){
		case '/':
			 res.writeHead(200, { 'Content-Type': 'text/plain' });
			 res.end('Is model ready ?\n'+modelDone+'Count of documents trained'+count);
			 break;
		case '/sentiment.html':
			fs.readFile("sentiment.html", function(err, data){
			res.writeHead(200, {'Content-Type': 'text/html'});
			res.write(data);
			res.end();
			})
			break;
		default:
            res.writeHead(404);
            res.write("opps this doesn't exist - 404");
            res.end();
            break;	
			
			
			}
			
 
}).listen(port);

	var io = require('socket.io').listen(app);
	var classifier = bayes();
	var stream = fs.createReadStream("./Datasets/tweetsBiploar.csv");
    //iterate through the dataset and train the model
   var csvStream = csv().on("data", function(data){
      		
    classifier.learn(data[4].toString(),data[2]);   
           
    var stateJson = classifier.toJson()

   // load the classifier back from its JSON representation.
    var revivedClassifier = bayes.fromJson(stateJson)
          
    })
    .on("end", function(){
        
         modelDone ="true"; 

          io.sockets.on('connection',function(socket){
            console.log("connected");
            socket.on('getSentiment',function(data){
              console.log(data.text);
                 
              socket.emit('sendSentiment',{sentiment:classifier.categorize(data.text.trim())});   
           })

		})

    }); 

stream.pipe(csvStream);  
