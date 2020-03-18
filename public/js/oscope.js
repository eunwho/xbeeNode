"use strict";
var xyPlotState = 0;				// 1 scope --> xy plot
const NO_SCOPE_DATA = 400;

var oscope = (function() {
  var m_canvas;
  var m_context;
  var m_width;
  var m_height;
  var m_h2;
  var m_trace = [];
  var m_voffset = [];
  // these must match the initial values of the controls
  // doh! no two way data bindind
  var m_seconds_per_div	   = 60;
  var m_samples_per_second = 1;
  var m_divisions          = 10;
  var m_yscale             = 2048;
  var m_sample_bits        = 12;
  var m_volts_per_div      = 1;
  var m_vrange             = 1;
  var m_cursor_index       = 2;
  var m_cursor_seconds     = 0.0;
  var m_cursor_volts       = 0.0;
  var m_run                = true;
  var m_size_index         = 0;
  var m_text_size          = 12;
  var m_updates            = 0;

  m_trace[0]           = null;
  m_trace[1]           = null;
  m_trace[2]           = null;
  m_trace[3]           = null;

  m_voffset[0]         = 0;
  m_voffset[1]         = 0;
  m_voffset[2]         = 0;
  m_voffset[3]         = 0;

  // ==============================================================
  // background display scaffolding
  // ==============================================================
  var outline_base = [
    [0.0,0.0],
    [1.0,0.0],
    [1.0,1.0],
    [0.0,1.0],
    [0.0,0.0]
  ];
  var outline;

  var xaxis_base = [
    [0.0,5.0/10.0,1.0,5.0/10.0], // channel 1
    [0.0,5.0/10.0,1.0,5.0/10.0]  // channel 2
  ];

  var xaxis;

  var vdiv_base  =  1.0/10.0;
  var vdiv;

  var mid_div_base = [0.0,5.0/10.0,1.0,5.0/10.0];
  var mid_div = [0,0,0,0];

  var hgrid_base = [
    [0.0,1.0/10.0,1.0,1.0/10.0],
    [0.0,2.0/10.0,1.0,2.0/10.0],
    [0.0,3.0/10.0,1.0,3.0/10.0],
    [0.0,4.0/10.0,1.0,4.0/10.0],
    [0.0,5.0/10.0,1.0,5.0/10.0],
    [0.0,6.0/10.0,1.0,6.0/10.0],
    [0.0,7.0/10.0,1.0,7.0/10.0],
    [0.0,8.0/10.0,1.0,8.0/10.0],
    [0.0,9.0/10.0,1.0,9.0/10.0]
  ];
	var hgrid;

  var vgrid_base = [
    [1.0/10.0,0.0,1.0/10.0,1.0],
    [2.0/10.0,0.0,2.0/10.0,1.0],
    [3.0/10.0,0.0,3.0/10.0,1.0],
    [4.0/10.0,0.0,4.0/10.0,1.0],
    [5.0/10.0,0.0,5.0/10.0,1.0],
    [6.0/10.0,0.0,6.0/10.0,1.0],
    [7.0/10.0,0.0,7.0/10.0,1.0],
    [8.0/10.0,0.0,8.0/10.0,1.0],
    [9.0/10.0,0.0,9.0/10.0,1.0]
  ];
  var vgrid;

  var cursor_base = [
    [0.0,0.0,0.0,1.0],  // 0 horizontal
    [0.0,0.0,0.0,1.0],  // 1 horizontal
    [0.0,0.0,1.0,0.0],  // 2 vertical
    [0.0,0.0,1.0,0.0]   // 3 vertical
  ];
  
	var m_cursor;

  // responsive sizes for canvas
  // aspect ratio of available sizes needs to be 4 over 3
  // and must fit the twitter boostrap grid size allocated
  var canvas_size = [
    {width:NO_SCOPE_DATA,height:NO_SCOPE_DATA}
  ];

  // responsive text size
  var text_size = [
      12,
      8,
      6
  ];

  function getCanvasSize(window_height,parent_width,parent_height) {
    var r;
    if (window_height > parent_height) {
      parent_height = window_height;
    }
    var s = canvas_size.filter(function(v) {
      return ((v.width < parent_width)&&(v.height < parent_height));
    });

    // if nothing matches
    if (s.length <= 0) {
      // use the smallest
      r = s[2];
    } else {
      // use first fit
      r = s[0];
    }

    return r;
  }

  function getTextSize(width) {
    var s;

    s = canvas_size.reduce(function(p,v,i) {
      return (width <= v.width) ? text_size[i] : p;
    },text_size[2]);

    return s;
  }

  function rescale(w,h) {
    // rescale horizontal divisions
    hgrid = hgrid_base.map(function (v) {
      var d = new Array(4);
      d[0] = v[0] * w;
      d[1] = v[1] * h;
      d[2] = v[2] * w;
      d[3] = v[3] * h;
      return d;
    });


    // rescale vertical division size
    vdiv = vdiv_base * h;

    // rescale vertical divisions
    vgrid = vgrid_base.map(function(v) {
      var d = new Array(4);
      d[0] = v[0] * w;
      d[1] = v[1] * h;
      d[2] = v[2] * w;
      d[3] = v[3] * h;
      return d;
    });

		// 2018.03. delete by jsk
    // scale channel axes
    xaxis = xaxis_base.map(function(v) {
      var d = new Array(4);
      d[0] = v[0] * w;
      d[1] = v[1] * h;
      d[2] = v[2] * w;
      d[3] = v[3] * h;
      return d;
    });

    // rescale outline
    outline = outline_base.map(function(v) {
      var d = [0,0];
      d[0] = v[0] * w;
      d[1] = v[1] * h;
      return d;
    });

    // rescale cursor
    m_cursor = cursor_base.map(function(v) {
      var d = new Array(4);
      d[0] = v[0] * w;
      d[1] = v[1] * h;
      d[2] = v[2] * w;
      d[3] = v[3] * h;
      return d;
    });

    // rescale mid divider
    mid_div[0] = mid_div_base[0] * w;
    mid_div[1] = mid_div_base[1] * h;
    mid_div[2] = mid_div_base[2] * w;
    mid_div[3] = mid_div_base[3] * h;
  }

  function clear(ctx,width,height) {
    ctx.fillStyle = "white";
    ctx.fillRect(0,0,width,height);
  }

  function drawLine(ctx,line)  {
      ctx.beginPath();
      ctx.moveTo(line[0],line[1]);
      ctx.lineTo(line[2],line[3]);
      ctx.stroke();
  }

  function drawLines(ctx,lines) {
    lines.forEach(function(v) {
      drawLine(ctx,v);
    });
  }

  function drawPath(ctx,path) {
    ctx.beginPath();
    ctx.moveTo(path[0][0],path[0][1]);
    path.slice(1).forEach(function(v) {
      ctx.lineTo(v[0],v[1]);
    });
    ctx.stroke();
  }

  function drawBackground(ctx,width,height,voffset) {
    // clear background
    clear(ctx,width,height);

    // draw geometry with cartesian coordinates (0,0) lower left
    ctx.save();
    ctx.translate(0,height);
    ctx.scale(1.0,-1.0);

    // draw the outline
    ctx.save();
    ctx.strokeStyle = 'black';
    ctx.lineWidth   = 4;
    drawPath(ctx,outline);
    ctx.restore();

    // draw the grid
    ctx.save();
    ctx.strokeStyle = "black";
    ctx.lineWidth   = 1;
    ctx.setLineDash([1,1]);
    drawLines(ctx,hgrid);
    drawLines(ctx,vgrid);
    ctx.restore();

    // draw the x axes
    ctx.save();
    ctx.translate(0,voffset[0]);
    ctx.strokeStyle = "magenta";
    ctx.lineWidth   = 1;
    drawLine(ctx,xaxis[0]);
    ctx.restore();

    ctx.save();
    ctx.translate(0,voffset[1]);
    ctx.strokeStyle = "darkgoldenrod";
    ctx.lineWidth   = 1;
    drawLine(ctx,xaxis[1]);
    ctx.restore();

    // draw the cursors
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "MediumSeaGreen";
    drawLine(ctx,m_cursor[0]);
    drawLine(ctx,m_cursor[2]);
    ctx.strokeStyle = "MediumSeaGreen";
    drawLine(ctx,m_cursor[1]);
    drawLine(ctx,m_cursor[3]);

    ctx.restore();
    ctx.restore();

  }

  function drawAnnotations(ctx,width,height,dy)
  {
    var t;
    var y;

    ctx.font = dy.toFixed(0) + "px monospace";
    ctx.fillStyle = "lime";
    y = dy + 1;
    ctx.fillText('seconds/div = ' + m_seconds_per_div.toFixed(4) + '    dS = ' + m_cursor_seconds.toFixed(4),2,y);
    y += dy + 1;
    ctx.fillText('volts/div   = ' + m_volts_per_div.toFixed(4)   + '    dV = ' + m_cursor_volts.toFixed(4) ,2,y);

    t = (m_run) ? ("RUN : " + m_updates.toFixed(0)) : "STOP";
    ctx.fillStyle = (m_run) ? 'lime' : 'red';
    ctx.fillText(t,2,height-4);
  }

  function computeVerticalScale(vrange,yscale,height,volts) {
    // divide by 2 to make scale for signed value
    return (vrange / yscale) * (height / volts) * 0.5;
  }

  function computeHorizontalScale(seconds,samples_per_second,width) {
    return width / (seconds * samples_per_second);
  }

 function drawTrace(ctx,trace,width,height,voffset) {
    var t = [];
    var ys;
    var hs;
    var i;

    ctx.save();
    ctx.translate(0,height);
    ctx.scale(1.0,-1.0);

    // set channel parameters
    switch(trace.channel) {
    case 0:
      ctx.translate(xaxis[0][0],xaxis[0][1]);
      ctx.strokeStyle = "darkgoldenrod";
      break;
    case 1:
      ctx.translate(xaxis[0][0],xaxis[0][1]);
      ctx.strokeStyle = "indigo";
      break;
    case 2:
      ctx.translate(xaxis[0][0],xaxis[0][1]);
      ctx.strokeStyle = "red";
      break;
    case 3:
      ctx.translate(xaxis[0][0],xaxis[0][1]);
      ctx.strokeStyle = "green";
      break;
    }
    
    // scale the trace y axis
    hs = 1;
    ys = 400 / 4096;
    for(i=0;i<trace.length;++i) {
      t.push([i*hs,(trace.sample[i]-2048) * ys]);
    }

    // draw it
    drawPath(ctx,t);    
    ctx.restore();    
    // restore context
  }

  function onVerticalOffset(channel,offset)
  {
    if ((offset < -4)||(4 < offset)) {
      return;
    }
    m_voffset[channel-1] = offset * vdiv;
    onPaint(null);
  }

  /**
   * event handler for setting volts per division
   * @param volts
   */
  function onVoltsPerDiv(volts) {
    m_volts_per_div = volts;

    updateCursorDiff();
    onPaint(null);
  }

  function drawXyPlot(ctx, trace1,trace2){
    var t = [];
    var x,y;

   ctx.fillStyle = "red";
   
	x = 400 * trace1[0] / 4096;
	y = 400 * trace2[0] / 4096;		
	ctx.fillRect(x,y,20,20);
	
   for(var i=0;i<trace1.length;++i) {
		x = 400 * trace1[i] / 4096;
		y = 400 * trace2[i] / 4096;		
      t.push([x,y]);
    }
    drawPath(ctx,t);
    ctx.restore();    
  }
  
  function onPaint(trace) {
    drawBackground(m_context,m_width,m_height,0);
 
   if (m_run & (trace !== null)) {
      m_updates++;
      m_trace[0] = trace[0];
      m_trace[1] = trace[1];
      m_trace[2] = trace[2];
      m_trace[3] = trace[3];
    }

	if(xyPlotState==1){
    // draw last traces
    if (m_trace[0] !== null) drawXyPlot( m_context, m_trace[0].sample, m_trace[1].sample);
	} else {
    // draw last traces
    if (m_trace[0] !== null) { drawTrace(m_context, m_trace[0], m_width, m_height, 0); }
    if (m_trace[1] !== null) { drawTrace(m_context, m_trace[1], m_width, m_height, 0); }
    if (m_trace[2] !== null) { drawTrace(m_context, m_trace[2], m_width, m_height, 0); }
    if (m_trace[3] !== null) { drawTrace(m_context, m_trace[3], m_width, m_height, 0); }
	}
    // draw text annotations
    drawAnnotations(m_context,m_width,m_height,m_text_size);
  }

  function onSampleBits(bits) {
      m_sample_bits = 12;
      m_yscale      = 2048;
	   onPaint(null);
  }

  function onVerticalOffset(channel,offset){
    if ((offset < -4)||(4 < offset)) {
      return;
    }
    m_voffset[channel-1] = offset * vdiv;
    onPaint(null);
  }

  function onVoltsPerDiv(volts) {
    m_volts_per_div = volts;

    updateCursorDiff();
    onPaint(null);
  }

  function onSecondsPerDiv(seconds) {
    m_seconds_per_div = seconds;

    updateCursorDiff();
    onPaint(null);
  }

  function onSamplesPerSecond(samples_per_second) {
    // no zero or negative
    if (samples_per_second < Number.MIN_VALUE) {
      m_samples_per_second = NO_SCOPE_DATA;
    }
    else {
      // rate is in samples/second
      m_samples_per_second = samples_per_second;
    }
    onPaint(null);0.
  }

 function onVoltageRange(vrange) {
    m_vrange = vrange;
    onPaint(null);
  }

  function updateCursorDiff() {
    // compute current cursor diff in seconds
    m_cursor_seconds = Math.abs(m_cursor[0][0] - m_cursor[1][0]) * (m_seconds_per_div* 10.0 / m_width);
    m_cursor_volts   = Math.abs(m_cursor[2][1] - m_cursor[3][1]) * (m_volts_per_div * 10.0 / m_height);
  }

  function onCursorMove(x,y) {
    var cursor = m_cursor[m_cursor_index];
    switch(m_cursor_index) {
    case 0:
    case 1:
      cursor[0] = x;
      cursor[2] = x;
      break;
    case 2:
    case 3:
      cursor[1] = m_height - y;
      cursor[3] = m_height - y;
      break;
    }

    updateCursorDiff();
    onPaint(null);
  }

  function onCursorSelect(index) {
    m_cursor_index = index;
  }

  function onRunStop(run) {
    m_run = run;
  }

  function onResize() {
    var parent = $("#oscope-parent");
    var size = getCanvasSize($(window).height(),parent.width(),parent.height());
    m_canvas = $("#oscope")[0];
//    m_width  = m_canvas.width  = size.width;
//    m_height = m_canvas.height = size.height;
//    m_width  = m_canvas.width  = NO_SCOPE_DATA;
//    m_height = m_canvas.height = NO_SCOPE_DATA;
    m_width  = m_canvas.width  = 400;
    m_height = m_canvas.height = 400;
    m_h2     = m_height / 2;
    rescale(m_width,m_height);
    onPaint(null);
  }

  function onInit() {
    m_canvas  = $("#oscope")[0];
    m_context = m_canvas.getContext("2d");
    $(window).resize(onResize);
    onResize();
    onPaint(null);
  }

	//--- invert code table create
  return {
    init               : onInit,
    onResize           : onResize,
    onPaint            : onPaint,
    onSampleBits       : onSampleBits,
    onVoltsPerDiv      : onVoltsPerDiv,
    onSecondsPerDiv    : onSecondsPerDiv,
    onSamplesPerSecond : onSamplesPerSecond,
    onVoltageRange     : onVoltageRange,
    onVerticalOffset   : onVerticalOffset,
    onCursorMove       : onCursorMove,
    onCursorSelect     : onCursorSelect,
    onRunStop          : onRunStop,
  };
})();

//---- end of oscope.js
