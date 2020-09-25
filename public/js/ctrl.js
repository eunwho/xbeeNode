//--- start the client application
var socket = io.connect();
var messages = 0;

var tmp = new Date();
var dhtData1 = [ {"key": "Temperature","values":[{"x":tmp,"y": 0},{"x":tmp, "y":10}]},
	{"key": "Humidity"   ,"values":[{"x":tmp,"y":10},{"x":tmp, "y":20}]}
];

var dhtData2 = [ {"key": "Temperature","values":[{"x":tmp,"y": 0},{"x":tmp, "y":10}]},
	{"key": "Humidity"   ,"values":[{"x":tmp,"y":10},{"x":tmp, "y":20}]}
];

//
//-- Chart1  3 Hour chart
// 

var chart1 = nv.models.lineWithFocusChart();

chart1.xAxis.tickFormat(function(d) { 
		return d3.time.format('%X')(new Date(d));
});

chart1.x2Axis.tickFormat(function(d) { 
		return d3.time.format('%X')(new Date(d));
});

chart1.useInteractiveGuideline(true);
chart1.yAxis.tickFormat(d3.format(',.1f'));
chart1.y2Axis.tickFormat(d3.format(',.1f'));
chart1.yDomain([-5,100]);
chart1.color(['red','green','yellow']);

//-- Chart2  Select Day, Week, Month, Year chart
var chart2 = nv.models.lineWithFocusChart();
chart2.xAxis.tickFormat(function(d) { 
		return d3.time.format('%X')(new Date(d));
});

chart2.x2Axis.tickFormat(function(d) { 
		return d3.time.format('%d/%m/%y')(new Date(d));
});

chart2.useInteractiveGuideline(true);
chart2.yAxis.tickFormat(d3.format(',.1f'));
chart2.y2Axis.tickFormat(d3.format(',.1f'));
chart2.yDomain([-5,100]);
chart2.color(['red','green','yellow']);

var gaugeTemperature = {id:'gauge1',unit:'[\260C]',title:'Temperature',min:-10,max:50,
mTick:[-10,0,10,20,30,40,50],
alarm:'[ {"from": -10, "to":0, "color": "rgba(0,  0, 255, 1.0)"},{"from":10, "to":30, "color": "rgba(255,255,255, 0.5)"}, {"from": 30, "to": 50, "color": "rgba(255,0,0, 1.0)"}]'
}

var gaugeHumidity = {id:'gauge2',unit:'[%]',title:'Humidity',min:0,max:100,
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
   
	d3.select('#chart1 svg').datum(dhtData1).transition().duration(5).call(chart1);
	chart1.update;

	d3.select('#chart2 svg').datum(dhtData2).transition().duration(5).call(chart2);
	chart2.update;

   // chart1.update;
   // chart2.update;
   
   gaugeInit(gaugeTemperature);
   gaugeInit(gaugeHumidity);
/*   
	$.getJSON('/wsnObj', { dummy: new Date().getTime() }, function(wsnObj){ 
		console.log(wsnObj);	
	});
*/
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


socket.on('graphInit', function (data) {

	var promise = getTable(data);
	promise
	.then(function(res){
		console.log("---- dhtData1.value ---")
		
		dhtData1[0].values = res[0];
		dhtData1[1].values = res[1];
		// dhtData1[0].values = test1;
		// dhtData1[1].values = test2;
		
		console.log(dhtData1[0].values);
					
		d3.select('#chart1 svg').datum(dhtData1).transition().duration(30).call(chart1);
		chart1.update;
		
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
		
		dhtData2[0].values = res[0];
		dhtData2[1].values = res[1];
		
		console.log(dhtData2[0].values);
					
		d3.select('#chart2 svg').datum(dhtData2).transition().duration(30).call(chart2);
		chart2.update;
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
			
	var dataLen = (dhtData1[0].values).length;
	if( dataLen > 500 ){
		dhtData1[0].values.splice(0,1);
		dhtData1[1].values.splice(0,1);
	}
	dhtData1[0].values.push(getData1);
	dhtData1[1].values.push(getData2);

//			console.log(dhtData);
	d3.select('#chart1 svg').datum(dhtData1).transition().duration(10).call(chart1);
	chart1.update;
});
//--- end of ctrl.js
