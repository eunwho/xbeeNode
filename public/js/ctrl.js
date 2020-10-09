//--- start the client application
const SENS_NAME1 = 'G001';
const SENS_NAME2 = 'G002';

var socket = io.connect();
var messages = 0;

var tmp = new Date();
var tempData = [ {"key": "Temperature1","values":[{"x":tmp,"y": 0},{"x":tmp, "y":10}]},
	{"key": "Temperature2" ,"values":[{"x":tmp,"y":0},{"x":tmp, "y":20}]}
];

var humiData = [ {"key": "Humidity1","values":[{"x":tmp,"y": 0},{"x":tmp, "y":10}]},
	{"key": "Humidity2" ,"values":[{"x":tmp,"y":0},{"x":tmp, "y":20}]}
];

var hourTempData = [ {"key": "Temperature1","values":[{"x":tmp,"y": 0},{"x":tmp, "y":10}]},
	{"key": "Temperature2" ,"values":[{"x":tmp,"y":0},{"x":tmp, "y":0}]}
];

var hourHumiData = [ {"key": "Humidity1","values":[{"x":tmp,"y": 0},{"x":tmp, "y":10}]},
	{"key": "Humidity2" ,"values":[{"x":tmp,"y":0},{"x":tmp, "y":0}]}
];

var chartTemp = nv.models.lineWithFocusChart();
chartTemp.xAxis.tickFormat(function(d) { 
		return d3.time.format('%X')(new Date(d));
});
chartTemp.x2Axis.tickFormat(function(d) { 
		return d3.time.format('%X')(new Date(d));
});
chartTemp.useInteractiveGuideline(true);
chartTemp.yAxis.tickFormat(d3.format(',.1f'));
chartTemp.y2Axis.tickFormat(d3.format(',.1f'));
chartTemp.yDomain([-10,40]);
chartTemp.color(['red','green','yellow']);

var chartHourTemp = nv.models.lineWithFocusChart();
chartHourTemp.xAxis.tickFormat(function(d) { 
		return d3.time.format('%X')(new Date(d));
});
chartHourTemp.x2Axis.tickFormat(function(d) { 
		return d3.time.format('%X')(new Date(d));
});
chartHourTemp.useInteractiveGuideline(true);
chartHourTemp.yAxis.tickFormat(d3.format(',.1f'));
chartHourTemp.y2Axis.tickFormat(d3.format(',.1f'));
chartHourTemp.yDomain([-10,40]);
chartHourTemp.color(['red','green','yellow']);

//-- Chart2  Select Day, Week, Month, Year chart
var chartHumi = nv.models.lineWithFocusChart();
chartHumi.xAxis.tickFormat(function(d) { 
		return d3.time.format('%X')(new Date(d));
});
chartHumi.x2Axis.tickFormat(function(d) { 
		return d3.time.format('%d/%m/%y')(new Date(d));
});
chartHumi.useInteractiveGuideline(true);
chartHumi.yAxis.tickFormat(d3.format(',.1f'));
chartHumi.y2Axis.tickFormat(d3.format(',.1f'));
chartHumi.yDomain([0,100]);
chartHumi.color(['red','green','yellow']);

var chartHourHumi = nv.models.lineWithFocusChart();
chartHourHumi.xAxis.tickFormat(function(d) { 
		return d3.time.format('%X')(new Date(d));
});
chartHourHumi.x2Axis.tickFormat(function(d) { 
		return d3.time.format('%d/%m/%y')(new Date(d));
});
chartHourHumi.useInteractiveGuideline(true);
chartHourHumi.yAxis.tickFormat(d3.format(',.1f'));
chartHourHumi.y2Axis.tickFormat(d3.format(',.1f'));
chartHourHumi.yDomain([0,100]);
chartHourHumi.color(['red','green','yellow']);


var gaugeTemp1 = {id:'gaugeTemp1',unit:'[\260C]',title:'Temperature',min:-10,max:50,
mTick:[-10,0,10,20,30,40,50],
alarm:'[ {"from": -10, "to":0, "color": "rgba(0,  0, 255, 1.0)"},{"from":10, "to":30, "color": "rgba(255,255,255, 0.5)"}, {"from": 30, "to": 50, "color": "rgba(255,0,0, 1.0)"}]'
}

var gaugeTemp2 = {id:'gaugeTemp2',unit:'[\260C]',title:'Temperature',min:-10,max:50,
mTick:[-10,0,10,20,30,40,50],
alarm:'[ {"from": -10, "to":0, "color": "rgba(0,  0, 255, 1.0)"},{"from":10, "to":30, "color": "rgba(255,255,255, 0.5)"}, {"from": 30, "to": 50, "color": "rgba(255,0,0, 1.0)"}]'
}

var gaugeHumi1 = {id:'gaugeHumi1',unit:'[%]',title:'Humidity',min:0,max:100,
mTick:[0,25,50,75,100,],
alarm:'[ {"from": 0, "to":25, "color": "rgba(255,0,0,0.5)"}, {"from": 25,"to":75, "color": "rgba(255,255,255,1.0)"}, {"from":75,"to":100, "color": "rgba( 0, 0,255,0.5)"}]'
}

var gaugeHumi2 = {id:'gaugeHumi2',unit:'[%]',title:'Humidity',min:0,max:100,
mTick:[0,25,50,75,100,],
alarm:'[ {"from": 0, "to":25, "color": "rgba(255,0,0,0.5)"}, {"from": 25,"to":75, "color": "rgba(255,255,255,1.0)"}, {"from":75,"to":100, "color": "rgba( 0, 0,255,0.5)"}]'
}

function gaugeInit(arg){
   var a = 'canvas[id=' + arg.id + ']';

   $(a).attr('data-units',arg.unit);
   $(a).attr('data-title',arg.title);
   $(a).attr('data-min-value',arg.min);
   $(a).attr('data-max-value',arg.max);
   $(a).attr('data-major-ticks',arg.mTick);
   $(a).attr('data-stroke-ticks',true);
   $(a).attr('data-highlights',arg.alarm);
}
		
$("document").ready(function() {
   var dummy = {0:0};
   
/*
	d3.select('#chart1 svg').datum(dhtData1).transition().duration(5).call(chart1);
	chart1.update;

	d3.select('#chart2 svg').datum(dhtData2).transition().duration(5).call(chart2);
	chart2.update;
*/
   // chart1.update;
   // chart2.update;
   
   gaugeInit(gaugeTemp1);
   gaugeInit(gaugeTemp2);
   gaugeInit(gaugeHumi1);
   gaugeInit(gaugeHumi2);
});

function btnTest1(arg){
	socket.emit('btnPress',arg);
}	

async function getTempHumi(arg1){

	return new Promise(function(resolve,reject){

	try {
	var retu = [];
	var getData1 = {"x":0,"y":0};
	var getData2 = {"x":0,"y":0};
	
   getData1.x = new Date(arg1.date);
   getData1.y = arg1.TR;

   getData2.x = new Date(arg1.date);
   getData2.y = arg1.HR;

   retu.push( getData1);
   retu.push( getData2);
	resolve(retu);
	} catch (err) { 
		reject(err);
	}
	});
}	

async function getTable(docs){

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

socket.on('hourInit1', function (data) {

	var promise = getTable(data);
	promise
	.then(function(res){

		hourTempData[0].values = res[0];
		hourHumiData[0].values = res[1];
					
		d3.select('#chartHourTemp svg').datum(hourTempData).transition().duration(30).call(chartHourTemp);
		chartHourTemp.update;
		d3.select('#chartHourHumi svg').datum(hourHumiData).transition().duration(30).call(chartHourHumi);
		chartHourHumi.update;
	})
	.catch(function(rej){
		console.log("---- Error getTable ---")
		console.log(rej);
	});
});

socket.on('hourInit2', function (data) {

	var promise = getTable(data);
	promise
	.then(function(res){

		hourTempData[1].values = res[0];
		hourHumiData[1].values = res[1];
					
		d3.select('#chartHourTemp svg').datum(hourTempData).transition().duration(30).call(chartHourTemp);
		chartHourTemp.update;
		d3.select('#chartHourHumi svg').datum(hourHumiData).transition().duration(30).call(chartHourHumi);
		chartHourHumi.update;
	})
	.catch(function(rej){
		console.log("---- Error getTable ---")
		console.log(rej);
	});
});

socket.on('graphInit1', function (data) {

	console.log('--- Test debug ---');
	var promise = getTable(data);
	promise
	.then(function(res){

		tempData[0].values = res[0];
		humiData[0].values = res[1];
					
		d3.select('#chartTemp svg').datum(tempData).transition().duration(30).call(chartTemp);
		chartTemp.update;
		d3.select('#chartHumi svg').datum(humiData).transition().duration(30).call(chartHumi);
		chartHumi.update;
		// chartTemp.update;
		
	})
	.catch(function(rej){
		console.log("---- Error getTable ---")
		console.log(rej);
	});
});

socket.on('graphInit2', function (data) {

	var promise = getTable(data);
	promise
	.then(function(res){
		
		tempData[1].values = res[0];
		humiData[1].values = res[1];
					
		d3.select('#chartTemp svg').datum(tempData).transition().duration(30).call(chartTemp);
		chartTemp.update;

		d3.select('#chartHumi svg').datum(humiData).transition().duration(30).call(chartHumi);
		chartHumi.update;
		
	})
	.catch(function(rej){
		console.log(rej);
	});
});


socket.on('allGraphInit', function (data) {

	var promise = getTable(data);
	promise
	.then(function(res){
		console.log("--- dhtData - 2 - value")
		
		hourTempData[0].values = res[0];
		hourHumiData[1].values = res[1];
		
		// console.log(dhtData2[0].values);
					
		d3.select('#chartHourTemp svg').datum(hourTempData).transition().duration(30).call(chartHourTemp);
		// chartHourTemp.update;
	})
	.catch(function(rej){
		console.log(rej);
	});
});


socket.on('xbee', function (data) {

	console.log('--- socket on xbee ---');
	console.log(data);
	
	var getData1 = {"x":0,"y":0};
	var getData2 = {"x":0,"y":0};
	var tmpDate = new Date();

	getData1.x = new Date(data.date);
	getData1.y = data.TR;

	getData2.x = new Date(data.date);
	getData2.y = data.HR;
	var index  = 0;
			
	if(data.sensName == SENS_NAME2 ) index = 1; 

	var dataLen = (tempData[index].values).length;
	if( dataLen > 500 )	tempData[index].values.splice(0,1);

	dataLen = (tempData[index].values).length;
	if( dataLen > 500 )	humiData[index].values.splice(0,1);

	tempData[index].values.push(getData1);
	humiData[index].values.push(getData2);

//			console.log(dhtData);
	d3.select('#chartTemp svg').datum(tempData).transition().duration(10).call(chartTemp);
	chartTemp.update;

	d3.select('#chartHumi svg').datum(humiData).transition().duration(10).call(chartHumi);
	chartHumi.update;

	if(data.sensName == SENS_NAME1 ) { 
		$('#gaugeTemp1').attr('data-value', data.TR);
   		$('#gaugeHumi1').attr('data-value', data.HR);
	} else {
   		$('#gaugeTemp2').attr('data-value', data.TR);
   		$('#gaugeHumi2').attr('data-value', data.HR);
	}
});
//--- end of ctrl.js
