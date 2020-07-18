//"use strict"; 
// $sudo dmesg | grep tty 
const NO_SCOPE_DATA = 400;
var inveStart = 0;
var digiOut = 0xff;
var graphOnOff = 0;
var scopeOnOff = 0;

//--- start of digital inout routine

var exec = require('child_process').exec;

// Create shutdown function
function shutdown(callback){
    exec('shutdown now', function(error, stdout, stderr){ callback(stdout); });
}

/*
var port = new SerialPort('/dev/ttyAMA0',{
    baudRate: 115200,
    parser: SerialPort.parsers.readline('\n')
});
*/
const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;
//const port = new SerialPort('/dev/ttyS0',{
const port = new SerialPort('/dev/ttyUSB0',{
//const port = new SerialPort('/dev/ttyAMA1',{
//const port = new SerialPort('COM4',{
   //baudRate: 500000
  // baudRate: 115200
   baudRate: 38400
});

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


var count = 0; 
var channel = 0;
var dataLength = 600;
var traceOnOff =0;			// 1 --> send tarace data to client
var monitorOnOff =0;			// 1 --> send tarace data to client
var codeEditOnOff =0;			// 1 --> send tarace data to client
var getCodeList = 0;

//--- start server
console.log('http on : ' + portAddr.toString());
server.listen(portAddr);

//--- socket.io support

io.on('connection', function (socket) {
	var host  = socket.client.request.headers.host;
	console.log('connected to : ' + host);
	socket.on('disconnect', function () {
  	console.log('disconnected from : ' + host);
  });

	socket.on('graph',function(msg){
		console.log('scoket on graph =',msg);
		graphOnOff = msg;
	});

	socket.on('scope',function(msg){
		console.log('scoket on scope =',msg);
		console.log(msg);
		scopeOnOff = msg;
	});

	socket.on('codeEdit',function(msg){
		console.log('scoket on codeEdit =',msg);
		port.write(msg);
	});

	socket.on('getCodeList',function(msg){
		console.log('scoket on codeList =',msg);
		port.write('9:4:901:0.000e+0');
	});

/* use io */
	socket.on('btnClick',function(msgTx){
		console.log(msgTx.selVac);
		var digitalOut = 1;
		if( msgTx.selVac == 0){
			inveStart = 1;
			//digiOut = digiOut & 0xfe;
			//writeMcp23017(ADDR1,0,digiOut);
		}else if( msgTx.selVac == 1){
			inveStart = 0;
			digiOut = digiOut | 1;
		} else if( msgTx.selVac == 2){
			testOn = true;
		} else if( msgTx.selVac == 3){
			testOn = false;
		} else if( msgTx.selVac == 4){
			digiOut = digiOut | 4;			// clear ArmOff;
			digiOut = digiOut & 0xfd;
		} else if( msgTx.selVac == 5){
			digiOut = digiOut | 2;			// clear ArmOff;
			digiOut = digiOut & 0xfb;
		} else if( msgTx.selVac == 6){
			shutdown(function(output){
    			console.log(output);
			});
		} else if( msgTx.selVac == 7){
			gracefulShutdown();
		}
  });

	//--- emitt graph proc 
	myEmitter.on('mMessage',function(data){
		socket.emit('message',data);
	});    

	myEmitter.on('mCodeList',function(data){
		socket.emit('codeList',data);
	});    

	myEmitter.on('mGraph',function(data){
		socket.emit('graph',data);
	});    

	myEmitter.on('mScope',function(data){
		socket.emit('scope',data);
	});    

	myEmitter.on('xbee',function(data){
		socket.emit('xbee',data);
	});    

});

var graphData = { rpm:0,Irms:0,Power:0,Ref:0,Vdc:0,Graph1:0,Graph2:0,Graph3:0,Graph4:0,Graph6:0};
var scopeData = {Ch:0,data:[]};
var graphProcCount = 0;

parser.on('data',function (data){
	var temp1 = 0;
	var temp2 = 0;
	var y =0;
	
	var buff = new Buffer(data);
	var tmp1 = data.split(",");

	console.log(data);
	//console.log(tmp1);
	//console.log(tmp1[1]);
	
	myEmitter.emit('xbee',data);

});

function sleepFor( sleepDuration ){
    var now = new Date().getTime();
    while(new Date().getTime() < now + sleepDuration){ /* do nothing */ } 
}

//--- time interval 

setInterval(function(){
	if(graphOnOff) port.write('9:4:900:0.000e+0');
},1000);


setInterval(function() {
	if(scopeOnOff)	  port.write('9:4:900:1.000e+2');
},4000);

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

//--- end of scope

