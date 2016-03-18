define(["jquery",
        "text!./speedometerd3twoindicators.css",
        "text!./googleplay.css",
        "./d3.min",
        "./iopctrl",
        "./pointergestures",
        "./pointerevents"], 
       function($, cssContent) {

    'use strict';
    $("<style>").html(cssContent).appendTo("head");

    return {
        initialProperties : {
            qHyperCubeDef : {
                qDimensions : [],
                qMeasures : [],
                qInitialDataFetch : [{
                    qWidth : 2,
                    qHeight : 1000
                }]
            }
        },
        definition : {
            type : "items",
            component : "accordion",
            items : {
                dimensions : {
                    uses : "dimensions",
                    min : 0,
                    max : 0
                },
                measures : {
                    uses : "measures",
                    min : 1,
                    max : 2
                },
                sorting : {
                    uses : "sorting"
                },
                settings : {
                    uses : "settings"
                }
            }
        },
        snapshot : {
            canTakeSnapshot : true
        },
        paint : function($element,layout) {
            console.log($element);
            console.log(layout);


            var qMatrix = layout.qHyperCube.qDataPages[0].qMatrix;
            var measureLabels = layout.qHyperCube.qMeasureInfo.map(function(d) {
                return d.qFallbackTitle;
            });

            var measure2 = 0;
            var data = qMatrix.map(function(d) {
                if(d[1] == null){
                    return {
                        "Metric1":d[0].qNum
                    }
                }
                else{
                    measure2 = 1;
                    return {
                        "Metric1":d[0].qNum,
                        "Metric2":d[1].qNum
                    }
                }
            });

            var width = $element.width();
            var height = $element.height();
            var id = "container_" + layout.qInfo.qId;
            if (document.getElementById(id)) {
                $("#" + id).empty();
            }
            else {
                $element.append($('<div />;').attr("id", id).width(width).height(height));
            }

            
            if(measure2 == 0){
                vizwithoutref(data,measureLabels,width,height,id);
            }
            else if (measure2 == 1){
                vizwithref(data,measureLabels,width,height,id);
            }
        }
    };
});

var vizwithoutref = function(data,labels,width,height,id) {
    var svg = d3.select("#"+id)
    .append("svg")
    .attr("width", width)
    .attr("height", height);


    var gauge = iopctrl.arcslider()
    .radius((width+height)/5.5)
    .events(false)
    .indicator(iopctrl.defaultGaugeIndicator);
    gauge.axis().orient("in")
        .normalize(true)
        .ticks(12)
        .tickSubdivide(4)
        .tickSize(10, 8, 10)
        .tickPadding(5)
        .scale(d3.scale.linear()
               .domain([0, 100])
               .range([-3*Math.PI/4, 3*Math.PI/4]));

    var segDisplay = iopctrl.segdisplay()
    .width((width+height)/10)
    .digitCount(3)
    .negative(false)
    .decimals(1);

    var transform = "translate(";
    var widthtransform = ((width+height)*1.15/3)/1.87;
    var heighttransform = ((width+height)*3.18/5)/2;
    var meterplacement = transform.concat(widthtransform, ",",heighttransform,")");

    var kpi = data.map(function(d){return d.Metric1;});

    svg.append("g")
        .attr("class", "gaugered")
        .call(gauge);

    svg.append("g")
        .attr("class", "segdisplayred")
        .attr("transform", meterplacement)
        .call(segDisplay);

    segDisplay.value(kpi);
    gauge.value(kpi);
};


var vizwithref = function(data,labels,width,height,id) {
    var svg = d3.select("#"+id)
    .append("svg")
    .attr("width", width)
    .attr("height", height);


    var gauge = iopctrl.arcslider()
    .radius((width+height)/5.5)
    .events(false)
    .indicator(iopctrl.defaultGaugeIndicator);
    gauge.axis().orient("in")
        .normalize(true)
        .ticks(12)
        .tickSubdivide(4)
        .tickSize(10, 8, 10)
        .tickPadding(5)
        .scale(d3.scale.linear()
               .domain([0, 100])
               .range([-3*Math.PI/4, 3*Math.PI/4]));

    var gaugeref = iopctrl.arcslider()
    .radius((width+height)/5.5)
    .events(false)
    .indicator(iopctrl.defaultGaugeIndicator);
    gaugeref.axis().orient("in")
        .normalize(true)
        .ticks(12)
        .tickSubdivide(4)
        .tickSize(10, 8, 10)
        .tickPadding(5)
        .scale(d3.scale.linear()
               .domain([0, 100])
               .range([-3*Math.PI/4, 3*Math.PI/4]));

    var segDisplay = iopctrl.segdisplay()
    .width((width+height)/10)
    .digitCount(3)
    .negative(false)
    .decimals(1);

    var transform = "translate(";
    var widthtransform = ((width+height)*1.15/3)/1.87;
    var heighttransform = ((width+height)*3.18/5)/2;
    var meterplacement = transform.concat(widthtransform, ",",heighttransform,")");

    var kpi = data.map(function(d){return d.Metric1;});
    var reference = data.map(function(d){return d.Metric2;});


    if(kpi>=reference){
        svg.append("g")
            .attr("class", "gaugegreen")
            .call(gauge);

        svg.append("g")
            .attr("class", "segdisplaygreen")
            .attr("transform", meterplacement)
            .call(segDisplay);
    }
    else if(kpi<reference){
        svg.append("g")
            .attr("class", "gaugered")
            .call(gauge);

        svg.append("g")
            .attr("class", "segdisplayred")
            .attr("transform", meterplacement)
            .call(segDisplay);
    }

    segDisplay.value(kpi);
    gauge.value(kpi);


    svg.append("g")
        .attr("class", "gaugeref")
        .call(gaugeref);
    gaugeref.value(reference);
};