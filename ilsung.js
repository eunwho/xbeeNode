"use strict";
var express      = require('express');
var path         = require('path');
var favicon      = require('serve-favicon');
var logger       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var cons         = require('consolidate');

var routes    = require('./routes/index');
var users     = require('./routes/users');
// var socket    = require('./lib/socket');
var receiver  = require('./lib/receiver');
var debug     = require('debug')('ploty:server');
var port      = process.env.PORT || '3000';

var i2c				= require('i2c-bus');
var piI2c			= i2c.openSync(1);

piI2c.scan(function(err,res){
	if(err) console.log(err);
	else		console.log(res);
});
				

//--- create express application
var app = express();
app.set('port', port);

//--- create server
var server = require('http').Server(app);

//--- connect socket.io to server
var io = require('socket.io')(server);

//--- view engine setup
app.engine('html',cons.swig);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

//--- uncomment after placing your favicon in /public
//--- app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

//--- production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


var rpio = require('rpio');

//set spi
rpio.spiBegin(0);
rpio.spiChipSelect(0);
rpio.spiSetCSPolarity(0,rpio.LOW);
rpio.spiSetClockDivider(2048);
rpio.spiSetDataMode(0);

var inMcp23017=[0,0,0,0];
var digitalOutBuf = [0];

var count = 0 
var channel = 0;
var dataLength = 600;
var vacuumData = { data : [8]};

var traceData0 = { channel:0,length:dataLength,sample:[dataLength]}
var traceData1 = { channel:1,length:dataLength,sample:[dataLength]}
var traceData2 = { channel:2,length:dataLength,sample:[dataLength]}
var traceData3 = { channel:3,length:dataLength,sample:[dataLength]}
var traceData4 = { channel:4,length:dataLength,sample:[dataLength]}
var traceData5 = { channel:5,length:dataLength,sample:[dataLength]}
var traceData6 = { channel:6,length:dataLength,sample:[dataLength]}
var traceData7 = { channel:7,length:dataLength,sample:[dataLength]}


var adcValue = [0,0,0,0,0,0,0,0];
var adcOffset = [630,630,630,630,630,630,630,630]

for ( var key in traceData0.sample ){
	traceData0.sample[key] = traceData1.sample[key] = traceData2.sample[key]=0;
}

//	process.stdout.write( portVal.toString() + (count == 3 ? '\n' : '\t')); 

//--- start server
console.log('http on : ' + port.toString());
server.listen(port);

//--- socket.io support


var emitCount = 0;
var selVacRecord = 1;

var traceData = {channel:[0,0,0,0,0,0,0,0]};

io.on('connection', function (socket) {
	var host  = socket.client.request.headers.host;
	console.log('connected to : ' + host);
	socket.on('disconnect', function () {
  	console.log('disconnected from : ' + host);
  });

//	socket.on('codeTable',function(from,msg){
	socket.on('codeTable',function(msg){
  	console.log('received codeTable request',msg);
  });

	socket.on('btnClick',function(msgTx){

		var digitalOut = 1;

		digitalOutBuf = 0 ;
		setTimeOut( console.log('out') ,1000);

/*
		switch(msgTx.selVac){
		case 0: // btn Emg 
			console.log('test');
			digitalOutBuf = (digitalOutBuf | 1);
			return;
		case 1: // btn Emg 
			digitalOutBuf = (digitalOutBuf | 2);
			return;
		case 2: // btn Emg 
			digitalOutBuf = (digitalOutBuf | 4);
			return;
		case 3: // btn Emg 
			digitalOutBuf = (digitalOutBuf | 8);
			return;
		case 4: // btn Emg
			digitalOut = 0; 
			selVacRecord = ( selVacRecord > 5 ) ? 1 : selVacRecord +1;
			socket.emit('noVacTx',{selVac:selVacRecord});
			return;
		default:
			digitalOut = 0;
			return;
		}

		if(digitalOut){
			setTimeOut( console.log('digitalOut') ,2000);
			digitalOutBuf = 0;
		}
*/
  });

	setInterval(function() {
		socket.emit('trace',traceData);
		socket.emit('vacuum',vacuumData);
	},2000);

});

var errState = 0;

var	startTime = new Date();
var minute = 0;

var ADDR_IN1 = 0x20, ADDR_IN2 = 0x21, ADDR_OUT1=0x22,ADDR_OUT2= 0x23;


piI2c.writeByteSync(ADDR_OUT1,0,0,function(err){
  if(err) console.log(err);
});

piI2c.writeByteSync(ADDR_OUT1,1,0,function(err){
  if(err) console.log(err);
});

piI2c.writeByteSync(ADDR_OUT2,0,0,function(err){
  if(err) console.log(err);
});

piI2c.writeByteSync(ADDR_OUT2,1,0,function(err){
  if(err) console.log(err);
});


var writeMcp23017 = function(address,port,byte){

  return new Promise(function ( resolve , reject ){

    if(port) var GPIO = 0x13;
    else     var GPIO = 0x12;

    piI2c.writeByte(address,GPIO,byte,function(err){
      if(err){
        reject(err);
      }
      else{
        resolve();
      }
    });
  });
}

var writeCmdMcp23017 = function(address,port,byte){

  return new Promise(function ( resolve , reject ){

    piI2c.writeByteSync(address,port,byte,function(err){
      if(err){
        reject(err);
      }
      else{
        resolve();
      }
    });
  });
}

var readMcp23017 = function(address,port){

  return new Promise(function ( resolve , reject ){

    var GPIO = 0x12;

    if( port ) GPIO = 0x13;
    else       GPIO = 0x12;
   
    piI2c.readByte(address,GPIO,function(err,Byte){
      if(err){
        reject(err);
      }
      else{
        resolve(Byte);
      }
    });
  });
}

/*
var promise writeCmdMcp23017(ADDR_OUT1,0,0);

.then(function(){
	return writeCmdMcp23017(ADDR_OUT1,1,0);
}).catch(function(ere){
	console.log(err);
});
*/


setInterval(function() {

	var date = new Date();
	var n = date.toLocaleDateString();
	var time = date.toLocaleTimeString();

  for ( var channel = 0; channel <= 7; channel++){
		try{
		//prepare Tx buffer [trigger byte = 0x01] [channel = 0x80(128)] [placeholder = 0x01]
    var sendBuffer = new Buffer([0x01,(8 + channel<<4),0x1]);
    var recieveBuffer = new Buffer(3)
		rpio.spiTransfer(sendBuffer, recieveBuffer, sendBuffer.length); // send Tx buffer and recieve Rx buffer

    // Extract value from output buffer. Ignore first byte
    var junk = recieveBuffer[0];
    var MSB = recieveBuffer[1];
    var LSB = recieveBuffer[2];

    // Ignore first six bits of MSB, bit shift MSB 8 position and 
    // finally combine LSB and MSB to get a full 10bit value

    var value = ((MSB & 3 ) << 8 ) + LSB;
		adcValue[channel] = value;
		vacuumData.data[channel] = value;
		} catch(e) {
			var date = new Date();
			var n = date.toLocaleDateString();
			var time = date.toLocaleTimeString();
			console.log('E time = ',n+' : ' + time);
			console.log('SPI ADC error = ',e);
		}
  };

  var promise = readMcp23017(ADDR_IN1,0);

  promise
  .then(function(byte){
    if(byte < 256 ){
      inMcp23017[0] = byte;
      return writeMcp23017(ADDR_OUT1,0,byte);
    } 
  }).catch(function(err){
    console.log(err);
  }).then(function(){
    return(readMcp23017(ADDR_IN1,1));
  }).catch(function(err){
    console.log(err);
  }).then(function(byte){
    if(byte < 256 ){
      inMcp23017[1] = byte;
      return writeMcp23017(ADDR_OUT1,1,byte);
    } 
  }).catch(function(err){
    console.log(err);
  }).then(function(){
    return(readMcp23017(ADDR_IN2,0));
  }).catch(function(err){
    console.log(err);
  }).then(function(byte){
    if(byte < 256 ){
      inMcp23017[2] = byte;
      return writeMcp23017(ADDR_OUT2,0,byte);
    } 
  }).catch(function(err){
    console.log(err);
  }).then(function(){
    return(readMcp23017(ADDR_IN2,1));
  }).then(function(byte){
    if(byte < 256 ){
	  	inMcp23017[3] = byte;
      return writeMcp23017(ADDR_OUT2,1,byte);
    } 
  }).catch(function(err){
    console.log(err);
  }); 
  console.log('%d,%d,%d,%d,%d,%d,%d,%d',
			adcValue[0],adcValue[1],adcValue[2],adcValue[3],adcValue[4],adcValue[5],adcValue[6],adcValue[7]);
  console.log('%d,%d,%d,%d',inMcp23017[0],inMcp23017[1],inMcp23017[2],inMcp23017[3]);

	try{
		for ( var i = 0 ; i < 8 ; i++){
			traceData.channel[i] = adcValue[i] - adcOffset[i];
		}
		count = (channel > 598 ) ? 0 : count+1; 
		channel = (channel > 6 ) ? 0 : channel+1; 
	
	  var portVal = 0;

		if( (count % 10) == 0 ){
		
			var endTime = new Date();
			var timeDiff = endTime - startTime;

			timeDiff /= 1000;

			timeDiff /= 60;

			minute = Math.round(timeDiff);
			console.log('-------------------------------------------------------');
			console.log('                    경과 분  =    ',minute ); 
			console.log('-------------------------------------------------------');
		}

	} catch(e) {
		var date = new Date();
		var n = date.toLocaleDateString();
		var time = date.toLocaleTimeString();
		console.log('E time = ',n+' : ' + time);
		console.log('process.stdout.write error = ',e);
	}
},1000);


process.on('uncaughtException',function(err) {
	var	stack = err.stack;
	var timeout = 1;

	console.log('Caught exception: ',err);

//	logger.log('SERVER CRASHED!');
//	logger.log(err,stack);

	setTimeout( function(){
//		logger.log('KILLING PROCESS');
		process.exit();
	},1000);
});

process.on('SIGTERM', function () {
    process.exit(0);
});

process.on('SIGINT', function () {
    process.exit(0);
});
 
process.on('exit', function () {
    console.log('\nShutting down, performing GPIO cleanup');
    rpio.spiEnd();
    process.exit(0);
});
