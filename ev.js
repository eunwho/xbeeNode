//"use strict"; 
// $sudo dmesg | grep tty 

const SENS_NAME1 = 'G001';
const SENS_NAME2 = 'G002';

var Promise = require('promise');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const Schema = mongoose.Schema;

const xbeeHourSchema = new Schema({
	date:{type:Date,default:Date.now},
	sensName: String,
	TR:Number,
	HR:Number
});

const xbeeStatusSchema = new Schema({
	date:{type:Date,default:Date.now},
	wsnData: String
});

const testSchema = new Schema({
	date:{type:Date,default:Date.now},
	sensName: String,
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


async function getBattVal(records){

    return new Promise(function(resolve,reject){

    try {
    var retu = [];
    var getData = {"x":0,"y":0};
    
	var tmp = records.wsnData.split(",");
	var battVolt = tmp[8].split(":");
	var keyNum = 0;

   getData.x = new Date(records.date);
   getData.y = battVolt[1] * 1.0 ;

	if      ( tmp[0] == SENS_NAME1 ) keyNum = 1;
	else if ( tmp[0] == SENS_NAME2 ) keyNum = 2;

    retu.push( keyNum  );
   	retu.push( getData );
    resolve(retu);

	} catch (err) {
		console.log(err)
		retu = [0,0]; 
        reject(retu);
	}
    });
}   

var getBatteryDB = function ( ){

   return new Promise(function(resolve, reject){
   xbeeStateDB.find(
      // {_id: false, __v: false},
      function (err, docs){			
         if( err ) reject(err);
         else      resolve(docs);
      });
   });
}

async function setBattTable(docs){

    return new Promise(function(resolve,reject){
    var sequence = Promise.resolve();

    var maxIndex = docs.length;
    var dht = [[],[]];

    for ( var i = 0 ; i < maxIndex ; i++ ){
        (function(){
            var closInde = i;
            var records = docs[closInde];
            sequence = sequence.then(function(){
                return getBattVal(records);
            })
            .then(function(results){
				if      ( results[0] == 1 ) dht[0].push(results[1]);
                else if ( results[0] == 2 ) dht[1].push(results[1]);

                if(closInde == (maxIndex -1) ) resolve(dht);
            })
            .catch(function(err){
                console.log('get DbTable error');
                console.log(err);
                reject(err);
            }) 
        }())
    }
    });
}   

var getBattData = function( ){

   return new Promise(function(resolve, reject){

		var promise = getBatteryDB( );

		promise
		.then( (docs) => {	return setBattTable(docs); })
		.then( ( results )=>{ resolve ( results ); })
		.catch( (rej     )=>{ console.log(rej); 	});
   });
}


var testFind = function ( hours, sensName ){
	var offset = hours * 60 * 60 * 1000;
   return new Promise(function(resolve, reject){
   testDB.find(
      {$and:[{"date" :{ $lte:new Date(), $gte: new Date( new Date() - offset)}},
			{"TR":{$gte:0.0}},
			{"sensName":sensName}
			//{$match:{"sensName":sensName}}
      ]},
      {_id: false, __v: false},
      function (err, docs){			
         if( err ) reject(err);
         else      resolve(docs);
      });
   });
}

var hourFind = function ( sensName ){
	try {
	// var offset = param * 60 * 60 * 1000;
   return new Promise(function(resolve, reject){
   xbeeHourDB.find(
      {$and:[{"date" :{ $lte:new Date()}},
			{"TR":{$gte:0.0}},
			{"sensName":sensName}
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

	var maxIndex = docs.length;
	var sequence = Promise.resolve();

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
				if(closInde >= (maxIndex -1) ){
					dht[0] = results[0] / maxIndex ;
					dht[1] = results[1] / maxIndex ;
					console.log('--- mean value = '+ dht);
					resolve(dht);
				}
			})
			.catch((err)=>{	reject(err); }) 
		}())
	}
	});
}	


var hoursProc = function ( hours, sensIn ){
	try{
   return new Promise(function(resolve, reject){
	var promise = testFind(hours, sensIn );

	promise
	.then(function(docs){
		
		if (  docs.length < 4 ) resolve(0);

		var promise = getOneHourMean(docs);
		promise
		.then(function(res){
			var xbeeHour = new xbeeHourDB({sensName:sensIn,TR:res[0],HR:res[1]});
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
		console.log("--- err testFind()---");
		reject(rej);		
	 });
	 });
	}catch (err) {
		console.log(err);
	}
}


async function getTableBatt(docs){

    return new Promise(function(resolve,reject){
    var sequence = Promise.resolve();

    var maxIndex = docs.length;
    var dht = [[],[]];

    for ( var i = 0 ; i < maxIndex ; i++ ){
        (function(){
            var closInde = i;
            var records = docs[closInde];
            sequence = sequence.then(function(){
                return getTempHumi(records);
            })
            .then(function(results){
                dht[0].push(results[0]);
                dht[1].push(results[1]);
                if(closInde == (maxIndex -1) ) resolve(dht);
            })
            .catch(function(err){
                console.log('get DbTable error');
                console.log(err);
                reject(err);
            }) 
        }())
    }
    });
}   


var socket_connection = 0;	// debug skj 2020.1011

//--- socket.io support
io.on('connection', function (socket) {
	var host  = socket.client.request.headers.host;
	console.log('connected to : ' + host);

	socket_connection = 1;	// debug soonkil jung

	var promise = getBattData( );
	promise.then((results)=>{ socket.emit('chartBattInit',results);
	}).catch((reject)=>{ console.log(reject); });

	var retVal = [0,0];

	var promise = testFind(3,SENS_NAME1);
	promise
	.then(( results)=> {
		retVal[0] = results;
		return testFind(3,SENS_NAME2);
	}).then((results) => {
		retVal[1] = results;
		socket.emit('graphInit',retVal);
	}).catch((rej)=>{ console.log(rej); });				


	var promise = hourFind(SENS_NAME1);
	promise
	.then( (res)=>{ retVal[0] = res ;
		return hourFind(SENS_NAME2);
	}).then( (res)=>{ retVal[1] = res ;
		socket.emit('hourInit',retVal );
	}).catch((rej)=>{ console.log(reject); });				

   socket.on('btnPress', function (btnKey) {
		console.log('--- PRESS TEST!  !\r\n');		
		try {						
			var promise = getBattData( );
			promise
			.then(function( results){
				socket.emit('chartBattInit',results);
			}).catch(function(reject){
				console.log('--- #537 Oops getBattData Fail !\r\n');
				console.log(reject);
			});

		} catch(err){
			console.log( '---#357 ---');
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

	try{ 

		if( hourNow != hourFlag ){
			hourFlag = hourNow;		

			var promise = hoursProc(1,SENS_NAME1);
			promise
			.then(function(res){
				return hoursProc(1,SENS_NAME2);
			})
			.then((res)=>{ })
			.catch((rej)=>{	console.log(rej);		
			});
		}	
	}catch (err) {
		console.log(err);
	}
	
	try{

	console.log("data =" + data);
	var y =0;
	var buff = new Buffer(data);
	var tmp1 = data.split(",");

	var startNo = tmp1[0].length;
	var endNo = data.length;

	// console.log('---endNo = '+endNo);

	var dataIn = data.slice(startNo+1,endNo);
	var var1 = tmp1[2].split(":");
	var var2 = tmp1[3].split(":");

	// console.log("dataIn =" + dataIn);

  	if( var1[0] == "MY" ){
		var recordState = new xbeeStateDB({wsnData:dataIn});
		
		recordState.save( function( err, recordState ){
			if(err) return console.error(err);	
	    	console.log('SAVE xbeeState: '+ recordState);
		});					
		// myEmitter.emit('xbee',recordState);
  	// }else  if( (tmp1[1] == SENS_NAME1 ) && ( var1[0] == "TR" ) && (var2[0] == "HR")){
  	}else  if( ( var1[0] == "TR" ) && (var2[0] == "HR")){
	
		var xbee1 = new testDB({sensName:tmp1[1], TR:var1[1], HR:var2[1]});
		
		xbee1.save( function( err, recordHour ){
			if(err) return console.error(err);	
	    	console.log('SAVED : ' + xbee1);
		});					

		if(	socket_connection === 1 ) myEmitter.emit('xbee',xbee1 );
	}	

	} catch(err){
		console.log(err);
	}
});

//--- end of scope

