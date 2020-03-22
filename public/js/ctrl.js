
//--- start the client application
const I_SENS_VALUE = 20.0;

// const NO_SCOPE_DATA = 400;

var noVac = 1;
var socket = io.connect();
var messages = 0;

const dataLength = 600;
var graphCount = 0;

var graphData = new Array();

graphData[0] = { channel:0,length:dataLength,sample:[dataLength]};
graphData[1] = { channel:1,length:dataLength,sample:[dataLength]};
graphData[2] = { channel:2,length:dataLength,sample:[dataLength]};
graphData[3] = { channel:3,length:dataLength,sample:[dataLength]};
graphData[4] = { channel:4,length:dataLength,sample:[dataLength]};
graphData[5] = { channel:5,length:dataLength,sample:[dataLength]};

var scopeData = new Array();

scopeData[0] = { channel:0,length:dataLength,sample:[NO_SCOPE_DATA]};
scopeData[1] = { channel:1,length:dataLength,sample:[NO_SCOPE_DATA]};
scopeData[2] = { channel:2,length:dataLength,sample:[NO_SCOPE_DATA]};
scopeData[3] = { channel:3,length:dataLength,sample:[NO_SCOPE_DATA]};


// var inputOffset = [1817,1817,2121,2009];

function graphClear(){
   for( var j = 0 ; j < 6 ; j++){
      for( var i = 0 ; i < 600 ; i++ ) graphData[j].sample[i] = 2048;
   }
   graphCount = 0;
   graphInverter.onPaint(graphData);
}

function scopeClear(){
   for( var j = 0 ; j < 4 ; j++){
      for( var i = 0 ; i < NO_SCOPE_DATA ; i++ )   scopeData[j].sample[i] = 2048;
   }
   oscope.onPaint(scopeData);
}

var gaugeSpeed={id:'gauge1',unit:'[RPM]',title:'Speed',min:-6000,max:6000,
mTick:[-6000,-4000,-2000,0,2000,4000,6000],
//alarm:'[ {"from": -6000, "to":-4000, "color": "rgba(255,  0,  0, 1.0)"},{"from": -4000, "to":-2000, "color": "rgba(255,255,  0, 0.5)"}, {"from": -2000, "to": 2000, "color": "rgba(255,255,255, 0.5)"},{"from":  000 , "to": 4000, "color": "rgba(255,255,  0, 0.5)"}, {"from": 4000 , "to": 6000, "color": "rgba(255,  0,  0, 1.5)"}]'
alarm:'[ {"from": -6000, "to":-4000, "color": "rgba(255,  0,  0, 1.0)"},{"from": -4000, "to":4000, "color": "rgba(255,255,255, 0.5)"}, {"from": 4000, "to": 6000, "color": "rgba(255,0,0, 1.0)"}]'
}

var gaugeRefOut={id:'gauge2',unit:'[Rate %]',title:'Speed/Torq',min:-300,max:300,
mTick:[-300,-200,-100,0,100,200,300],
alarm:'[ {"from": -300, "to":-200,"color": "rgba(255,0,0,1.0)"},{"from": 200,  "to":300, "color": "rgba(255,0,0,1.0)"}]'
}

var gaugeI500={id:'gauge3',unit:'[A]',title:'I_ac',min:0,max:500,
mTick:[0,100,200,300,400,500],
alarm:'[ {"from": 0, "to":300.0,"color": "rgba(255,255,255,1.0)"},{"from": 300.0,  "to":400.0, "color": "rgba(255,0,0,.3)"},{"from": 400.0,  "to":500.0, "color": "rgba(255,0,0,1.0)"}]'
}

var gaugeI100={id:'gauge3',unit:'[A]',title:'I_ac',min:0,max:100,
mTick:[0,25,50,75,100],
alarm:'[ {"from": 0, "to":50.0,"color": "rgba(255,255,255,1.0)"},{"from": 50.0,  "to":75.0, "color": "rgba(255,0,0,.3)"},{"from": 75.0,  "to":100.0, "color": "rgba(255,0,0,1.0)"}]'
}

var gaugeI50={id:'gauge3',unit:'[A]',title:'I_ac',min:0,max:50,
mTick:[0,10,20,30,40,50],
alarm:'[ {"from": 0, "to":30.0,"color": "rgba(255,255,255,1.0)"},{"from": 30.0,  "to":40.0, "color": "rgba(255,0,0,.3)"},{"from": 40.0,  "to":50.0, "color": "rgba(255,0,0,1.0)"}]'
}

var gaugeI10={id:'gauge3',unit:'[A]',title:'I_ac',min:0,max:10.0,
mTick:[0,2.5,5.0,7.5,10.0],
alarm:'[ {"from": 0, "to":5.0,"color": "rgba(255,255,255,1.0)"},{"from": 5.0,  "to":7.5, "color": "rgba(255,0,0,.3)"},{"from": 7.5,"to":10.0, "color": "rgba(255,0,0,1.0)"}]'
}

var gaugeQ={id:'gauge4',unit:'[Vdc]',title:'Vdc',min:0,max:800,
mTick:[0,200,400,600,800],
alarm:'[ {"from": 0, "to":200,"color": "rgba(255,255,0,5.0)"},{"from": 501,  "to":720, "color": "rgba(255,0,0,.3)"},{"from": 721,  "to":800, "color": "rgba(255,0,0,1.0)"}]'
}

function gaugeInit(arg){
   var a = 'canvas[id=' + arg.id + ']';

   $(a).attr('data-units',arg.unit);
   $(a).attr('data-title',arg.title);
   $(a).attr('data-min-value',arg.min);
   $(a).attr('data-max-value',arg.max);
   $(a).attr('data-major-ticks',arg.mTick);
// $(a).attr('data-minor-ticks',5);
   $(a).attr('data-stroke-ticks',true);
   $(a).attr('data-highlights',arg.alarm);
}

$("document").ready(function() {
  if (oscope) {
    oscope.init();
  }
   var dummy = {0:0};

   graphInverter.init();

   gaugeInit(gaugeSpeed);
   gaugeInit(gaugeRefOut);
   gaugeInit(gaugeI10);
   gaugeInit(gaugeQ);

});

function btnStartGraph(){

   graphClear();
   socket.emit('graph',1);
}

function btnStopGraph(){
   // onOff = 0 --> stop send grpah data 
   socket.emit('graph',0);
}

function btnStartScope(){
   scopeClear();
   socket.emit('scope',1);
}

function btnStopScope(){
   socket.emit('scope',0);
}

function btnRunMotor(){
   cmd = '9:4:905:0.000e+0';  // sciCmdStart
   socket.emit('codeEdit',cmd);
}

function btnStopMotor(){
   msgTx.selVac = 1;
   socket.emit('btnClick',msgTx);
   cmd = '9:4:905:1.000e+0';  // sciCmdStop
   socket.emit('codeEdit',cmd);
}

function btnStartTest(){
   msgTx.selVac = 2;
   socket.emit('btnClick',msgTx);
}

function btnStopTest(){
   msgTx.selVac = 3;
   socket.emit('btnClick',msgTx);
}

function btnSpeedUp(){
   cmd = '9:4:905:2.000e+0';  // sciCmdStart
   socket.emit('codeEdit',cmd);
}

function btnSpeedUp1(){
   cmd = '9:4:905:4.000e+0';  // sciCmdStart
   socket.emit('codeEdit',cmd);
}

function btnSpeedDown(){
   cmd = '9:4:905:3.000e+0';  // sciCmdStart
   socket.emit('codeEdit',cmd);
}

function btnShutDown(){
   msgTx.selVac = 6;
   socket.emit('btnClick',msgTx);
}

function btnRestart(){
   msgTx.selVac = 7;
   socket.emit('btnClick',msgTx);
}

function btnTripReset(){
   cmd = '9:4:902:5.000e+0';  // RESET
   socket.emit('codeEdit',cmd);
}

function sendSetScopeChCmd(ch,point,scale,offset){

   var returns = 'Invalid number';

   var addr = 21 + 3*ch;
	addr = '0'+addr;

   var sciCmd = '9:6:'+addr+':';
   var codeData = (point*1.0).toExponential(3);

   var setPoint = sciCmd + codeData;

   if( setPoint.length !== 16 ){
      document.getElementById('codeEditResult').innerHTML = "Invalid scope Point : "+ setPoint ;
      return;
   }   

   setTimeout(function(){
      console.log('set Scope Point command =', setPoint);
      socket.emit('codeEdit',setPoint);
   },500);

   //--- setScale
   addr = 22 + 3*ch;
	addr = '0' + addr;

   sciCmd = '9:6:'+addr+':';
   codeData = (scale*1.0).toExponential(3);
   var setScale = sciCmd + codeData;

   if( setScale.length !== 16 ){
      document.getElementById('codeEditResult').innerHTML = "Invalid scope Point : "+ setScale ;
      return;
   }   

   setTimeout(function(){
      console.log('set Scope Scale command =', setScale);
      socket.emit('codeEdit',setScale);
   },1000);

   //--- setOffset
   addr = 23 + 3*ch;
	addr = '0'+addr;

   sciCmd = '9:6:'+addr+':';
   codeData = (offset*1.0).toExponential(3);
   var setOffset = sciCmd + codeData;

   if( setOffset.length !== 16 ){
      document.getElementById('codeEditResult').innerHTML = "Invalid scope Point : "+ setOffse$
      return;
   }   

   setTimeout(function(){
      console.log('set Scope Offset command =', setOffset);
      socket.emit('codeEdit',setOffset);
   },1500);
}

var msgTx = { selVac: 0};
var traceOnOff = 0;
var monitorOnOff = 0;


// '9:4:901:0.000e+0'
function getSciCmd( ){

   var returns = 'Invalid number';
   var tmp1 = document.getElementById('txtCodeEdit1').value;
   var tmp2 = document.getElementById('txtCodeEdit2').value;

   tmp1 = tmp1 * 1;
   tmp2 = tmp2 * 1;

   if(isNaN(tmp1)) return returns;
   if(isNaN(tmp2)) return returns;
   if(( tmp1 > 990 ) || ( tmp1 < 0 )) return returns;

   var sciCmd = '9:4:';
   if(tmp1 < 10){
      sciCmd = sciCmd + '00';
   } else if ( tmp1 < 100 ){ 
      sciCmd = sciCmd + '0';
   }

   sciCmd = sciCmd + tmp1 + ':';

   var codeData = tmp2.toExponential(3);
   
   sciCmd = sciCmd + codeData;

   if((sciCmd.length) != 16) return returns;

   return sciCmd;
}
function btnReadCode(){ 
   var returns = getSciCmd( );

   //console.log(returns);

   if( returns.length == 16 ){
      socket.emit('codeEdit',returns);
   } else {
      document.getElementById('codeEditResult').innerHTML = returns;
   }   
}

function btnWriteCode(){
   var returns = getSciCmd( );

   if( returns.length == 16 ){
      var test = returns.replace('4','6');
      socket.emit('codeEdit',test);
   } else {
      document.getElementById('codeEditResult').innerHTML = returns;
   }   
}

function btnOptionSendCmd(){
   var selector = document.getElementById("idCmdSelect");
   var value = selector[selector.selectedIndex].value;
   var cmd = '9:4:902:5.000e+0';

   if(value == 0 ){
      cmd = '9:4:910:0.000e+0';  // read adc
      socket.emit('codeEdit',cmd);
   } else if(value == 1) { 
      cmd = '9:4:909:0.000e+0';  // read RPM
      socket.emit('codeEdit',cmd);
   } else if(value == 2) { 
      cmd = '9:4:902:5.000e+0';  // RESET
      socket.emit('codeEdit',cmd);
   } else if(value == 3) {          // READ ALL CODE
      cmd = '9:4:901:0.000e+0';  
      socket.emit('codeEdit',cmd);
   } else if(value == 4) { 
      cmd = '9:4:908:0.000e+1';  // read INput state and pwm trip
      socket.emit('codeEdit',cmd);
   } else if(value == 5) { 
      cmd = '9:6:900:9.000e+1';  // reset all codes to factory setting
      // socket.emit('codeEdit',cmd);
   } else if(value == 6) { 
      cmd = '9:4:900:1.000e+1';  // read trip record
      socket.emit('codeEdit',cmd);
   }
}


 // =============================================
  // canvas mouse event for cursor drag
  // =============================================
  var mouse_state = 0;
  $('#oscope').on('mousedown',function(event) {
    mouse_state = 1;

    oscope.onCursorMove(event.offsetX,event.offsetY);
  });

  $('#oscope').on('mouseup',function() {
    mouse_state = 0;

  });

  $('#oscope').on('mouseout',function() {
    mouse_state = 0;
  });

  $('#oscope').on('mousemove',function(event) {
    switch(mouse_state) {
    case 0:
      // do nothing
      break;
    case 1:
      oscope.onCursorMove(event.offsetX,event.offsetY);
      var temp = (225 - event.offsetY) * 4096 / 450;
      var x = document.getElementById('vcursor1').checked;

      if( x ) {
         document.getElementById('curVerStartPosi').innerHTML = parseInt(temp);
      }else{
         document.getElementById('curVerEndPosi').innerHTML = parseInt(temp);
      }
      break;
    }
  });

socket.on('scope', function (msg) {
   var chanel = msg.Ch - 49;
   console.log('received scope data chanel = '+ chanel);
   scopeData[chanel].sample = msg.data ;
   if(chanel == 3 ){ 
      oscope.onPaint(scopeData);
   }
});

socket.on('disconnect',function() {
  console.log('disconnected');
});

socket.on('message',function(msg){
   document.getElementById('codeEditResult').innerHTML = msg;
});   

socket.on('codeList', function (msg) {

   var msg1 = msg.substr(17);          // subtract uart command '9:6:900:5.000e+1:'
   var testIn = msg1.toString();
   
   //testIn.replace(/:,/g,'\r\n');
   var testIn1 = testIn.replace(/:/g,'\r\n');
   var testOut = testIn1.replace(/,/g,'\t');
   document.getElementById('txtCodeTable').innerHTML = testOut;
});

socket.on('trace', function (msg) {

   console.log(msg);
  // oscope.onPaint(trace);

});


// power scale 10k, 50k, 100k 500k

socket.on('graph', function (msg) {
 
//   console.log('rpm =',msg.rpm,'Irms =',msg.Irms,'P_total =',msg.Power,' ref_out = ',msg.Ref,'Vdc = ',msg.Vdc);
//   console.log('Graph1 =',msg.rpm,'Irms =',msg.Irms,'P_total =',msg.Power,' ref_out = ',msg.Ref,'Vdc = ',msg.Vdc);
   graphCount = ( graphCount < 600 ) ? graphCount + 1 : 0 ;

   graphData[0].sample[graphCount] = msg.Graph1;
   graphData[1].sample[graphCount] = msg.Graph2; 
   graphData[2].sample[graphCount] = msg.Graph3; 
   graphData[3].sample[graphCount] = msg.Graph4;; 
   graphData[4].sample[graphCount] = msg.Graph5; 
   graphData[5].sample[graphCount] = msg.Graph6; 
   graphInverter.onPaint(graphData);


//convert to

   var speed =   ((msg.rpm  -2048)/ 2048) * 5000;
   var ref_out = ((msg.Ref  -2048)/ 2048) * 500;
   var I_rms =   ((msg.Irms -2048)/ 2048) * I_SENS_VALUE;
   var Vdc =     ((msg.Vdc  -2048)/ 2048) * 1000;

   console.log('rpm =',speed,'Irms =',I_rms,' ref_out = ',ref_out,'Vdc = ',Vdc);

   if ( speed > 6000) speed = 6000;
   if ( speed < -6000) speed = -6000;

   if ( ref_out >  300 ) ref_out = 300;
   if ( ref_out < -300 ) ref_out = -300;

   if ( I_rms >  500 ) I_rms = 500;
   if ( I_rms <    0 ) I_rms = 0;

   if ( Vdc  >  800 ) Vdc = 800;
   if ( Vdc  <    0 ) Vdc = 0;
  
   $('#gauge1').attr('data-value', speed);
   $('#gauge2').attr('data-value', Math.floor(ref_out + 0.5));
   $('#gauge3').attr('data-value', I_rms);
   $('#gauge4').attr('data-value', Vdc);
});
var scopeCount = 0;

/*
setInterval(function(){

   for( var i = 0 ; i < 400 ; i++ ){
      scopeData[0].sample[i] = 0.5 * 2048 * Math.sin(Math.PI * 2 * i / 400 )+2048;
      scopeData[1].sample[i] = 0.5 * 2048 * Math.cos(Math.PI * 2 * i / 400 )+2048;
      scopeData[2].sample[i] = 0.25 * 2048 * Math.sin(Math.PI * 2 * i / 400 )+2048;
      scopeData[3].sample[i] = 0.25 * 2048 * Math.cos(Math.PI * 2 * i / 400 )+2048;
	}   
   oscope.onPaint(scopeData);
   scopeCount ++;
   console.log('scopeCount = ',scopeCount);
},2000);
*/
//--- end of ctrl.js
