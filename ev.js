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

const SerialPort = require('serialport');
const Readline = SerialPort.parsers.Readline;
const port = new SerialPort('/dev/ttyS0',{
//const port = new SerialPort('/dev/ttyUSB1',{
//const port = new SerialPort('/dev/ttyAMA1',{
//const port = new SerialPort('COM4',{
   //baudRate: 500000
   baudRate: 115200
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

});

var graphData = { rpm:0,Irms:0,Power:0,Ref:0,Vdc:0,Graph1:0,Graph2:0};
var scopeData = {Ch:0,data:[]};
var graphProcCount = 0;

parser.on('data',function (data){
	var temp1 = 0;
	var temp2 = 0;
	var y =0;
	
	var buff = new Buffer(data);
	var command_addr = parseInt(buff.slice(4,7));
	var command_data = parseFloat(buff.slice(8,16));

	console.log(data);

	if(( buff.length < 16 ) || ( command_addr !== 900 )){
		if( command_addr == 901 ){ 
			myEmitter.emit('mCodeList', data);
			return;
		} else {
			myEmitter.emit('mMessage', data);
			return;
		}
	}


	if ( command_data < 100 ) {
		var rx_data = data.slice(17,24);
		var buff2 = data.substr(24);
   	var buff = new Buffer(buff2,'utf8');

   	var i = 0;
   	var lsb = (buff[ i*3 + 2] & 0x0f) * 1 + (buff[i*3 + 1] & 0x0f) * 16;
   	var msb = ( buff[i*3] & 0x0f ) * 256;
   	var tmp = msb + lsb;
		graphData.rpm = tmp;

   	i = 1;
   	lsb = (buff[ i*3 + 2] & 0x0f)*1 + (buff[i*3 + 1]  & 0x0f) * 16;
   	msb = ( buff[i*3] & 0x0f ) * 256;
   	tmp = msb + lsb;
		graphData.Irms = tmp;

   	i = 2;
   	lsb = (buff[ i*3 + 2] & 0x0f)*1 + (buff[i*3 + 1] & 0x0f) * 16;
   	msb = ( buff[i*3] & 0x0f ) * 256;
   	tmp = msb + lsb;
		graphData.Power = tmp;

   	i = 3;
   	lsb = (buff[ i*3 + 2] & 0x0f)*1 + (buff[i*3 + 1] & 0x0f) * 16;
   	msb = ( buff[i*3] & 0x0f ) * 256;
   	tmp = msb + lsb;
		graphData.Ref = tmp;

 	i = 4;
   	lsb = (buff[ i*3 + 2] & 0x0f)*1 + (buff[i*3 + 1] & 0x0f) * 16;
   	msb = ( buff[i*3] & 0x0f ) * 256;
   	tmp = msb + lsb;
	graphData.Vdc = tmp;

 	i = 5;
   	lsb = (buff[ i*3 + 2] & 0x0f)*1 + (buff[i*3 + 1] & 0x0f) * 16;
   	msb = ( buff[i*3] & 0x0f ) * 256;
   	tmp = msb + lsb;
	graphData.Graph1 = tmp;

 	i = 6;
   	lsb = (buff[ i*3 + 2] & 0x0f)*1 + (buff[i*3 + 1] & 0x0f) * 16;
   	msb = ( buff[i*3] & 0x0f ) * 256;
   	tmp = msb + lsb;
	graphData.Graph2 = tmp;

	myEmitter.emit('mGraph', graphData);
		return;
	} else if( command_data > 99 ) {
		var i, j, lsb, msb, tmp;
		var offset = 4;

   	var buff2 = data.substr(17);
   	var buff = new Buffer(buff2,'utf8');
		var scope = {Ch:0,data:[]};

		scope.Ch = buff[2];
  		for ( i = 0; i < NO_SCOPE_DATA ; i++){
  			lsb = (buff[ i*3 + 2 + offset] & 0x0f) * 1 + (buff[i*3 + 1 + offset] & 0x0f) * 16;
  			msb = ( buff[i*3 + offset ] & 0x0f ) * 256;
  			tmp = msb + lsb - 2048;
			scope.data.push(tmp);
		}
		myEmitter.emit('mScope', scope);
		return;
	}	
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

