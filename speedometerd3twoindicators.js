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
                    uses : "settings",
                    items : {
                        variable : {
                            type : "items",
                            label: "Gauge Colors and Design",
                            items : {
                                colorOfUnder: {
                                    ref : "colorOfUnder",
                                    label : "KPI Color When Under Reference",
                                    type : "string",
                                    defaultValue: "#EE3311"
                                },
                                colorOfOver: {
                                    ref : "colorOfOver",
                                    label : "KPI Color When Over Reference",
                                    type : "string",
                                    defaultValue: "#00ff00"
                                },
                                rangeStart: {
                                    ref: "rangeStart",
                                    label: "Range Starts From:",
                                    type: "number",
                                    expression: "optional",
                                    defaultValue: 0
                                },
                                rangeEnd: {
                                    ref: "rangeEnd",
                                    label: "Range Ends At:",
                                    type: "number",
                                    expression: "optional",
                                    defaultValue: 100
                                },
                                totalTicks: {
                                    ref: "totalTicks",
                                    type: "string",
                                    component: "dropdown",
                                    label: "Total Ticks Multiplier",
                                    options: 
                                    [ {
                                        value: "0.5",
                                        label: "x0.5"
                                    }, {
                                        value: "1",
                                        label: "x1"
                                    }, {
                                        value: "2",
                                        label: "x2"
                                    }],
                                    defaultValue: "1"
                                },
                                subTicksPerTick: {
                                    ref: "subTicksPerTick",
                                    label: "SubTicks per Tick:",
                                    type: "number",
                                    defaultValue: 4  
                                },
                                arcOpacity: {
                                    ref: "arcOpacity",
                                    label: "Arc Shadow Opacity:",
                                    type: "number",
                                    defaultValue: 0.05  
                                }
                            }
                        }
                    }
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
            console.log('Current Width:', width);
            console.log('Current Height:', height);

            var id = "container_" + layout.qInfo.qId;
            if (document.getElementById(id)) {
                $("#" + id).empty();
            }
            else {
                $element.append($('<div />;').attr("id", id).width(width).height(height));
            }

            if(measure2 == 0){
                vizwithoutref(data,measureLabels,layout,width,height,id);
            }
            else if (measure2 == 1){
                vizwithref(data,measureLabels,layout,width,height,id);
            }
        }
    };
});



var vizwithref = function(data,labels,layout,width,height,id) {

    for(i=0; i<document.styleSheets.length; i++){  
        if(document.styleSheets[i].ownerNode.innerHTML.substring(0,69) == ".qv-object-speedometerd3twoindicators div.qv-object-content-container"){ 
            console.log('Speedometer Stylesheet:',document.styleSheets[i]);
            var speedometerSheet = document.styleSheets[i];
        }
    }

    //    var themRules = speedometerSheet.cssRules? speedometerSheet.cssRules: speedometerSheet.rules;    

    var newColorStroke = "stroke:";
    var newColorFill = "fill:";
    var newOpacity = "opacity:";
    speedometerSheet.addRule('.qv-object-speedometerd3twoindicators .gaugeunder .indicator', newColorStroke.concat(layout.colorOfUnder,";"));
    speedometerSheet.addRule('.qv-object-speedometerd3twoindicators .segdisplayunder .on', newColorFill.concat(layout.colorOfUnder,";"));
    speedometerSheet.addRule('.qv-object-speedometerd3twoindicators .gaugeover .indicator', newColorStroke.concat(layout.colorOfOver,";"));
    speedometerSheet.addRule('.qv-object-speedometerd3twoindicators .segdisplayover .on', newColorFill.concat(layout.colorOfOver,";"));
    speedometerSheet.addRule('.qv-object-speedometerd3twoindicators .gaugeover .arc, .qv-object-speedometerd3twoindicators .gaugeover .cursor', newOpacity.concat((layout.arcOpacity/2),";"));
    speedometerSheet.addRule('.qv-object-speedometerd3twoindicators .gaugeunder .arc, .qv-object-speedometerd3twoindicators .gaugeunder .cursor', newOpacity.concat((layout.arcOpacity/2),";"));
    speedometerSheet.addRule('.qv-object-speedometerd3twoindicators .gaugeref .arc, .qv-object-speedometerd3twoindicators .gaugeref .cursor', newOpacity.concat((layout.arcOpacity/2),";"));
    
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
        .ticks(12*layout.totalTicks)
        .tickSubdivide(layout.subTicksPerTick)
        .tickSize(10, 8, 10)
        .tickPadding(5)
        .scale(d3.scale.linear()
               .domain([layout.rangeStart, layout.rangeEnd])
               .range([-3*Math.PI/4, 3*Math.PI/4]));

    var gaugeref = iopctrl.arcslider()
    .radius((width+height)/5.5)
    .events(false)
    .indicator(iopctrl.defaultGaugeIndicator);
    gaugeref.axis().orient("in")
        .normalize(true)
        .ticks(12*layout.totalTicks)
        .tickSubdivide(layout.subTicksPerTick)
        .tickSize(10, 8, 10)
        .tickPadding(5)
        .scale(d3.scale.linear()
               .domain([layout.rangeStart, layout.rangeEnd])
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
            .attr("class", "gaugeover")
            .call(gauge);

        svg.append("g")
            .attr("class", "segdisplayover")
            .attr("transform", meterplacement)
            .call(segDisplay);
    }
    else if(kpi<reference){
        svg.append("g")
            .attr("class", "gaugeunder")
            .call(gauge);

        svg.append("g")
            .attr("class", "segdisplayunder")
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


var vizwithoutref = function(data,labels,layout,width,height,id) {
    
    for(i=0; i<document.styleSheets.length; i++){  
        if(document.styleSheets[i].ownerNode.innerHTML.substring(0,69) == ".qv-object-speedometerd3twoindicators div.qv-object-content-container"){ 
            console.log('Speedometer Stylesheet:',document.styleSheets[i]);
            var speedometerSheet = document.styleSheets[i];
        }
    }

    //    var themRules = speedometerSheet.cssRules? speedometerSheet.cssRules: speedometerSheet.rules;    

    var newColorStroke = "stroke:";
    var newColorFill = "fill:";
    var newOpacity = "opacity:";
    speedometerSheet.addRule('.qv-object-speedometerd3twoindicators .gaugeunder .indicator', newColorStroke.concat(layout.colorOfUnder,";"));
    speedometerSheet.addRule('.qv-object-speedometerd3twoindicators .segdisplayunder .on', newColorFill.concat(layout.colorOfUnder,";"));
    speedometerSheet.addRule('.qv-object-speedometerd3twoindicators .gaugeunder .arc, .qv-object-speedometerd3twoindicators .gaugeunder .cursor', newOpacity.concat((layout.arcOpacity),";"));
    
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
        .ticks(12*layout.totalTicks)
        .tickSubdivide(layout.subTicksPerTick)
        .tickSize(10, 8, 10)
        .tickPadding(5)
        .scale(d3.scale.linear()
               .domain([layout.rangeStart, layout.rangeEnd])
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
        .attr("class", "gaugeunder")
        .call(gauge);

    svg.append("g")
        .attr("class", "segdisplayunder")
        .attr("transform", meterplacement)
        .call(segDisplay);

    segDisplay.value(kpi);
    gauge.value(kpi);
};