//"use strict"; 
// $sudo dmesg | grep tty 

const SENS_NAME1 = 'G002';
const sens2 = 'G110';

var Promise = require('promise');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const Schema = mongoose.Schema;

const xbeeHourSchema = new Schema({
	date:{type:Date,default:Date.now},
	TR:Number,
	HR:Number
});

const xbeeStatusSchema = new Schema({
	date:{type:Date,default:Date.now},
	wsnData: String
});

const testSchema = new Schema({
	date:{type:Date,default:Date.now},
	TR:Number,
	HR:Number
});

mongoose.connect('mongodb://localhost/wsns0');

var db = mongoose.connection;
db.on('error',console.error.bind(console,'mongoose connection error'));
db.once('open',function(){
	console.log('Ok db connected');
});

var xbeeHourDB = mongoose.model('xbeeHourDB',xbeeHourSchema);
var xbeeStateDB = mongoose.model('xbeeStateDB',xbeeStatusSchema);
var testDB = mongoose.model('testDB',testSchema);

//--- start of digital inout routine

var exec = require('child_process').exec;

// Create shutdown function
function shutdown(callback){
    exec('shutdown now', function(error, stdout, stderr){ callback(stdout); });
}

const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;
//const port = new SerialPort('/dev/ttyS0',{
const port = new SerialPort('/dev/ttyUSB0',{
//const port = new SerialPort('/dev/ttyAMA1',{
//const port = new SerialPort('COM4',{
  // baudRate: 115200
   baudRate: 38400
});

var tempHumi = [];

const parser = new Readline();
port.pipe(parser);

port.on('open',function(err){
   if(err) return console.log('Error on write : '+ err.message);
   console.log('serial open');
});

port.on('error', function(err) {
    console.log('Error: ', err.message);
    console.log('Error Occured');
});

const eventEmitter = require('events');
class MyEmitter extends eventEmitter{};
const myEmitter = new MyEmitter();

var express      = require('express');
var path         = require('path');
var favicon      = require('serve-favicon');
var logger       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var cons         = require('consolidate');

var routes    = require('./routes/index');
var users     = require('./routes/users');
var receiver  = require('./lib/receiver');
var debug     = require('debug')('ploty:server');
var portAddr  = process.env.PORT || '7532';

//--- create express application
var app = express();
app.set('port', portAddr);

//--- create server
var server = require('http').Server(app);

//--- connect socket.io to server
var io = require('socket.io')(server);

//--- view engine setup
app.engine('html',cons.swig);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

/*
app.get('/wsnObj',function ( request, response, next) {
	response.send({x:12,y:34});
}); 
*/
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

//--- start server
console.log('http on : ' + portAddr.toString());
server.listen(portAddr);



function sleepFor( sleepDuration ){
    var now = new Date().getTime();
    while(new Date().getTime() < now + sleepDuration){ /* do nothing */ } 
}

//--- time interval 

setInterval(function(){
	var stamp = new Date().toLocaleString();
	console.log(stamp);
},10000);


//--- processing 

var exec = require('child_process').exec;

function shutdown(callback){
	exec('shutdown now', function(error, stdout, stderr){ callback(stdout); });
}

var gracefulShutdown = function() {
  console.log("Received kill signal, shutting down gracefully.");
  server.close(function() {
    console.log("Closed out remaining connections.");
    process.exit()
  });
  
   setTimeout(function() {
       console.error("Could not close connections in time, forcefully shutting down");
       process.exit()
  }, 10*1000);
}

process.on('SIGTERM', function () {
    process.exit(0);
});

process.on('SIGINT', function () {
    process.exit(0);
});
 
process.on('exit', function () {
    console.log('\nShutting down, performing GPIO cleanup');
    process.exit(0);
});

var dhtData = [ {"key": "Temperature","values":[]},
   					{"key": "Humidity"   ,"values":[]}
						];

setTimeout(function() {

}, 10*1000);

var testFind = function ( param ){
	var offset = param * 60 * 60 * 1000;
   return new Promise(function(resolve, reject){
   testDB.find(
      {$and:[{"date" :{
				$lte:new Date(), $gte: new Date( new Date() - offset)}
  			},{"TR":{$gte:0.0}}
      ]},
      {_id: false, __v: false},
      function (err, docs){
         if( err ) reject(err);
         else      resolve(docs);
      });
   });
}

var hourFind = function ( param ){
	try {
	// var offset = param * 60 * 60 * 1000;
   return new Promise(function(resolve, reject){
   xbeeHourDB.find(
      {$and:[{"date" :{
				// $lte:new Date(), $gte: new Date( new Date() - offset)}
				$lte:new Date()}
  			},{"TR":{$gte:0.0}}
      ]},
      {_id: false, __v: false},
      function (err, docs){
         if( err ) reject(err);
         else      resolve(docs);
      });
   });
	}catch (err) {
 		console.log(err);
 	}   
}

var sumHrTr = [0 , 0];

async function getTrHr(arg1){

	return new Promise(function(resolve,reject){
		// console.log("--- getTrHr input arg1 = " + arg1);	
		try {
   		sumHrTr[0] = sumHrTr[0]*1.0 + (arg1.TR) * 1.0 ;
   		sumHrTr[1] = sumHrTr[1]*1.0 + (arg1.HR) * 1.0 ;
			resolve(sumHrTr);
		} catch (err) { 
			reject(err);
		}	
	});
}	

async function getOneHourMean(docs){

	return new Promise(function(resolve,reject){

	var sequence = Promise.resolve();

	var maxIndex = docs.length;
	var dht = [[0],[0]];

	sumHrTr[0] = 0;	// global variable
	sumHrTr[1] = 0;   // 
	
	for ( var i = 0 ; i < maxIndex ; i++ ){
		(function(){
			var closInde = i;
			var records = docs[closInde];
			sequence = sequence.then(function(){
				return getTrHr(records);
			})
			.then(function(results){
				// console.log(results);
				if(closInde == (maxIndex -1) ){
					dht[0] = results[0] / maxIndex;
					dht[1] = results[1] / maxIndex;
					console.log('--- mean value = '+ dht);
					resolve(dht);
				}
			})
			.catch(function(err){
				console.log('#272 Oops Err getOneHourMean');
				console.log(err);
				reject(err);				
			}) 
		}())
	}
	});
}	

var hoursProc = function ( param ){
	try {
   return new Promise(function(resolve, reject){
	var promise = testFind(param);
	promise
	.then(function(docs){
		// console.log(docs);			
		var promise = getOneHourMean(docs);
		promise
		.then(function(res){
			var xbeeHour = new xbeeHourDB({TR:res[0],HR:res[1]});
			xbeeHour.save( function( err, xbeeHour ){
				if(err) reject (err);				
  				console.log('\r\n--- xbeeHourDB SAVED: ' + xbeeHour);
  				resolve(res);
			});

		})	
		.catch(function(err){
			console.log(err);
			reject(err);
		});
	})
	.catch(function(rej){
		reject(err);		
	 });
	 });
	}catch (err) {
		console.log(err);
	}
}

//--- socket.io support
io.on('connection', function (socket) {
	var host  = socket.client.request.headers.host;
	console.log('connected to : ' + host);

	var promise = testFind(3);
	promise
	.then(function( result){
		console.log('--- \234 testFind Success \r\n');
		socket.emit('graphInit',result);
	}).catch(function(reject){
		console.log('--- Oops testFind Fail !\r\n');
		console.log(reject);
	});				

   socket.on('btnPress', function (btnKey) {
		try {						
			var promise = hoursProc(1);
			promise
			.then(function( result){
				console.log('--- \234 #351 hourProc Success \r\n');
			}).catch(function(reject){
				console.log('--- #353 Oops housProc Fail !\r\n');
				console.log(reject);
			});
		} catch(err){
			console.log( '---#357 ---');
			console.log(err);		
		}

		try{
			var promise = hourFind();
			promise
			.then(function( result){
				console.log('--- \234 hourFind Success \r\n');
				socket.emit('allGraphInit',result);
			}).catch(function(reject){
				console.log('--- #363 Oops hourFind Fail !\r\n');
				console.log(reject);
			});
		}catch(err){
			console.log('--- #372 ')
			console.log(err);
		}		
  	});

	socket.on('disconnect', function () {
  		console.log('disconnected from : ' + host);
  	});

	//--- emitt graph proc 
	myEmitter.on('xbee',function(data){
		socket.emit('xbee',data);
	});    
});
var hourFlag = (new Date()).getHours();

parser.on('data',function (data){

//-- if changed hour 
//  1. delete dataBase 3hours late;
//  2. save 1 hour database 

	var hourNow = (new Date()).getHours() 

	if( hourNow != hourFlag ){
		hourFlag = hourNow;		

		var promise = hoursProc(1);
		promise
		.then(function(res){
			console.log(res);
		})
		.catch(function(rej){
			console.log(rej);		
		});
	}	
		
	console.log("data =" + data);
	var y =0;
	var buff = new Buffer(data);
	var tmp1 = data.split(",");

	var startNo = tmp1[0].length;
	var endNo = data.length;
	var dataIn = data.slice(startNo+1,endNo);
	var var1 = tmp1[2].split(":");
	var var2 = tmp1[3].split(":");
	// console.log("dataIn =" + dataIn);

   if( (tmp1[1] == SENS_NAME1 ) && ( var1[0] == "TR" ) && (var2[0] == "HR")){
	
		// console.log("temperature =" + var1[1]);
		// console.log("Humidity =" + var2[1]);
	
		var recordHour = new testDB({TR:var1[1],HR:var2[1]});
		
		recordHour.save( function( err, recordHour ){
			if(err) return console.error(err);	
	    	console.log('SAVED: '+recordHour);
		});					
		myEmitter.emit('xbee',recordHour);
	}	
});

//--- end of scope

