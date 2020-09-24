//"use strict"; 
// $sudo dmesg | grep tty 

const sens1 = 'G001';
const sens2 = 'G110';

var Promise = require('promise');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const Schema = mongoose.Schema;

const wsnSchema = new Schema({
	start_date:{type:Date,default:Date.now},
	tempData: [],
	humiData: []
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

var wsnDB1 = mongoose.model('wsnDB1',wsnSchema);
var wsnDB2 = mongoose.model('wsnDB2',xbeeStatusSchema);
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
const port = new SerialPort('/dev/ttyUSB1',{
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

//--- socket.io support
io.on('connection', function (socket) {
	var host  = socket.client.request.headers.host;
	console.log('connected to : ' + host);

	var promise = testFind("TR");
	// var promise = tesAggregate("G001");
	promise
	.then(function( result){
		console.log('=============================================');
		console.log('          testFind Success        ');
		console.log('=============================================');		
		// console.log(result);
		socket.emit('graphInit',result);
	})
	.catch(function(reject){
		console.log('=============================================');
		console.log('          testFind Fail !!!!        ');
		console.log('=============================================');		
		console.log(reject);
	});				

	
	socket.on('disconnect', function () {
  		console.log('disconnected from : ' + host);
  	});

	//--- emitt graph proc 
	myEmitter.on('xbee',function(data){
		socket.emit('xbee',data);
	});    
});

parser.on('data',function (data){

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

   if( (tmp1[1] == "G001") && ( var1[0] == "TR" ) && (var2[0] == "HR")){
	
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

function getTable(docs){

	return new Promise(function(resolve,reject){

	var sequence = Promise.resolve();

	var retu =[[],[]];
	var results= 0;
	var maxIndex = docs.length;

	for ( var i = 0 ; i < maxIndex ; i++ ){
		(function(){
			var closInde = i;
			var records = docs[closInde];
			sequence = sequence.then(function(){
				return getTempHumi(records);
			})
			.then(function(results){
				retu[0].push(results[0]);
				retu[1].push(results[1]);				
				if(closInde == (maxIndex -1) ) {
					console.log(retu);
					resolve(retu);
				}	
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

function getTempHumi(arg1){

	return new Promise(function(resolve,reject){

	// var dateTmp = Date(arg1.date);
	var dateTmp = arg1.date;

	var retu =[[],[]];
	var tmp = new Date();
	var tmpDate = new Date();
	var getData1 = {"x":tmpDate,"y":0};
	var getData2 = {"x":tmpDate,"y":0};
	
	var masterMsg = arg1.wsnData;
	var tmpIn = masterMsg.split(",");

   var tmp1 = tmpIn[0];
   var tmp2 = tmpIn[1].split(":");
   var tmp3 = tmpIn[2].split(":");

  	if( (tmp1 == "G110") && ( tmp2[0] == "TR" ) && (tmp3[0] == "HR")){
      getData1.x = dateTmp ;
      getData1.y = tmp2[1] * 1.0;

      getData2.x = dateTmp;
      getData2.y = tmp3[1] * 1.0;

		//console.log(getData2.x);
      retu[0].push(getData1);
      retu[1].push(getData2);
		resolve(retu);
	}
	else reject(0);
	});
}	

setTimeout(function() {

}, 10*1000);

/*
		docs.forEach(function (collection){
			var tmp1 = collection.wsnData.split(",");
			var dateCount = ( collection.date*1 - now ) / oneDayCount;
			
			test.push([dateCount]);
			test[i].push( tmp1[4]*1);
			for ( var j = 5 ; j < 10 ; j++){ test[i].push( tmp1[j]*1);}
				i ++;
		});
*/		
var testFind = function ( param ){
	var graphDay = 3 * 60 * 60 * 1000;
   return new Promise(function(resolve, reject){
   testDB.find(
      {$and:[{"date" :{
         $lte:new Date(),
         $gte:new Date(new Date().setDate(new Date().getDate() - graphDay))}},
         // {"wsnData":{$regex:param}},
         {"TR":{$gte:0.0}}
      ]},
      {_id: false, __v: false},
      function (err, docs){
         if( err ) {
            reject(err);
         }else{
 	       resolve(docs);
         }
      }).sort({'date':-1});
      // }).limit(10).sort({'date':-1});
      // }).limit(100);
      // });
   });
}
//--- end of scope

