//Declaring all files we'll be using
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
        //definition is the function that gets called only when
        //the extension is created. If you resize or update the
        //variables or selections, it doesn't get called again.
        definition : {
            type : "items",
            component : "accordion",
            items : {
                //No dimensions needed for this extension
                dimensions : {
                    uses : "dimensions",
                    min : 0,
                    max : 0
                },
                //One required measure for KPI
                //Another optional measure for Reference
                measures : {
                    uses : "measures",
                    min : 1,
                    max : 2
                },
                sorting : {
                    uses : "sorting"
                },
                //Custom Settings
                settings : {
                    uses : "settings",
                    items : {
                        variable : {
                            type : "items",
                            //Title of Custom Settings
                            label: "Gauge Colors and Design",
                            items : {
                                //Ref: Setting Reference so we can call from visualization as layout.colorOfUnder
                                //Label: Title of Setting
                                //Type: Type of Input
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
                                //Expression: Show option for expression window (fx button) 
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
                                //Dropdown and its options
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
                                displayDigits: {
                                    ref: "displayDigits",
                                    label: "Number of Display Digits:",
                                    type: "number",
                                    defaultValue: 3  
                                },
                                displayDecimals: {
                                    ref: "displayDecimals",
                                    label: "Display Decimal Places:",
                                    type: "number",
                                    defaultValue: 1
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
        
        //paint is the function that gets called every time the
        //variables or selection changes, or if you resize the window.
        paint : function($element,layout) {
            //element is what holds the chart's width and length
            //layout is what holds Qlik's dimensions and measures as well as
            //the custom settings selected
            
            //Pushing element and layout to the console for 
            //reference-finding and debugging
            console.log($element);
            console.log(layout);

            //From layout, we'll extract the data array that contains all
            //dimensions and measures
            var qMatrix = layout.qHyperCube.qDataPages[0].qMatrix;
            
            //From layout, we'll extract the measure labels array
            var measureLabels = layout.qHyperCube.qMeasureInfo.map(function(d) {
                return d.qFallbackTitle;
            });
            
            //Creating an array of each row in the qMatrix, each containing
            //either one or two measures
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
            
            //From element, we'll extract the current width and length
            var width = $element.width();
            var height = $element.height();
            console.log('Current Width:', width);
            console.log('Current Height:', height);

            //From element, we'll extract our chart's ID
            var id = "container_" + layout.qInfo.qId;
            //Check if the chart has already been created
            if (document.getElementById(id)) {
                //If it has, empty it so we can repaint our visualization
                $("#" + id).empty();
            }
            else {
                //If it hasn't, create it with our id, width, and height
                $element.append($('<div />;').attr("id", id).width(width).height(height));
            }

            //Determining if we'll draw a reference line or not based
            //on the existence of the second measure
            if(measure2 == 0){
                vizwithoutref(data,measureLabels,layout,width,height,id);
            }
            else if (measure2 == 1){
                vizwithref(data,measureLabels,layout,width,height,id);
            }
        }
    };
});


//Function for the D3 Gauge with a Reference indicator added
var vizwithref = function(data,labels,layout,width,height,id) {
    
    //Finding this specific extension's stylesheet's reference in Qlik's main HTML
    for(i=0; i<document.styleSheets.length; i++){  
        if(document.styleSheets[i].ownerNode.innerHTML.substring(0,69) == ".qv-object-speedometerd3twoindicators div.qv-object-content-container"){ 
            console.log('Speedometer Stylesheet:',document.styleSheets[i]);
            var speedometerSheet = document.styleSheets[i];
        }
    }

    //    var themRules = speedometerSheet.cssRules? speedometerSheet.cssRules: speedometerSheet.rules;    
    
    //Applying Custom Settings: Indicator Colors and Arc Shadow Opacity
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
    
    //Feeding D3 our chart's ID
    //Feeding D3 width and height
    var svg = d3.select("#"+id)
    .append("svg")
    .attr("width", width)
    .attr("height", height);
    
    //Determining whether width or height is shorter
    var widthOrHeight = (width<=height)? width: height;
    console.log('Deciding factor:', widthOrHeight);

    //Resizing Map Declarations
    var fontPercentage = "60%";
    var tickPadding = widthOrHeight/200;
    var gaugeWidthTransform = -30;
    var gaugeHeightTransform = -30;
    var displayWidthTransform = ((widthOrHeight/2)*0.8);
    var displayHeightTransform = ((widthOrHeight/2)*0.8);
    
    //Resizing Map
    if(widthOrHeight<=151){
        fontPercentage = "40%";
        tickPadding = 1;
        gaugeWidthTransform = -37;
        gaugeHeightTransform = -35;
        displayWidthTransform = ((widthOrHeight/2)*0.825);
        displayHeightTransform = ((widthOrHeight/2)*1.45);
    }
    else if(widthOrHeight>151 && widthOrHeight<=213){
        fontPercentage = "50%";
        tickPadding = 2;
        gaugeWidthTransform = -32;
        gaugeHeightTransform = -25;
        displayWidthTransform = ((widthOrHeight/2)*0.775);
        displayHeightTransform = ((widthOrHeight/2)*1.45);
    }
    else if(widthOrHeight>213 && widthOrHeight<=276){
        fontPercentage = "60%";
        tickPadding = 3;
        gaugeWidthTransform = -27;
        gaugeHeightTransform = -20;
        displayWidthTransform = ((widthOrHeight/2)*0.775);
        displayHeightTransform = ((widthOrHeight/2)*1.375);
    }
    else if(widthOrHeight>276 && widthOrHeight<=338){
        fontPercentage = "70%";
        tickPadding = 4;
        gaugeWidthTransform = -20;
        gaugeHeightTransform = -9;
        displayWidthTransform = ((widthOrHeight/2)*0.8);
        displayHeightTransform = ((widthOrHeight/2)*1.375);
    }
    else if(widthOrHeight>338 && widthOrHeight<=422){
        fontPercentage = "80%";
        tickPadding = 4;
        gaugeWidthTransform = -10;
        gaugeHeightTransform = 0;
        displayWidthTransform = ((widthOrHeight/2)*0.825);
        displayHeightTransform = ((widthOrHeight/2)*1.4);
    }
    else if(widthOrHeight>422 && widthOrHeight<=504){
        fontPercentage = "90%";
        tickPadding = 4;
        gaugeWidthTransform = 0;
        gaugeHeightTransform = 10;
        displayWidthTransform = ((widthOrHeight/2)*0.825);
        displayHeightTransform = ((widthOrHeight/2)*1.425);
    }
    else if(widthOrHeight>504){
        fontPercentage = "100%";
        tickPadding = 4;
        gaugeWidthTransform = 20;
        gaugeHeightTransform = 20;
        displayWidthTransform = ((widthOrHeight/2)*0.825);
        displayHeightTransform = ((widthOrHeight/2)*1.4);
    }
    
    //Applying Resizing Map to CSS: Font Size
    var newFontSize = "font-size:";
    speedometerSheet.addRule('.qv-object-speedometerd3twoindicators .gaugeover .major', newFontSize.concat(fontPercentage,";"));
    speedometerSheet.addRule('.qv-object-speedometerd3twoindicators .gaugeunder .major', newFontSize.concat(fontPercentage,";"));
    speedometerSheet.addRule('.qv-object-speedometerd3twoindicators .gaugeref .major', newFontSize.concat(fontPercentage,";"));
    
    //Creating first gauge and KPI indicator
    //Draw radius depending on width or height (whichever's shorter)
    //Applying Custom Settings: Total Ticks Multiplier and Subticks per Tick
    //Applying Resizing Map: Padding between tick and numbers
    //Applying Custom Settings: Range Start and End
    var gauge = iopctrl.arcslider()
    .radius((widthOrHeight/2)*0.8)
    .events(false)
    .indicator(iopctrl.defaultGaugeIndicator);
    gauge.axis().orient("in")
        .normalize(true)
        .ticks(12*layout.totalTicks)
        .tickSubdivide(layout.subTicksPerTick)
        .tickSize(10, 8, 10)
        .tickPadding(tickPadding)
        .scale(d3.scale.linear()
               .domain([layout.rangeStart, layout.rangeEnd])
               .range([-3*Math.PI/4, 3*Math.PI/4]));

    //Creating second overlapping gauge and KPI indicator
    //Draw radius depending on width or height (whichever's shorter)
    //Applying Custom Settings: Total Ticks Multiplier and Subticks per Tick
    //Applying Resizing Map: Padding between tick and numbers
    //Applying Custom Settings: Range Start and End
    var gaugeref = iopctrl.arcslider()
    .radius((widthOrHeight/2)*0.8)
    .events(false)
    .indicator(iopctrl.defaultGaugeIndicator);
    gaugeref.axis().orient("in")
        .normalize(true)
        .ticks(12*layout.totalTicks)
        .tickSubdivide(layout.subTicksPerTick)
        .tickSize(10, 8, 10)
        .tickPadding(tickPadding)
        .scale(d3.scale.linear()
               .domain([layout.rangeStart, layout.rangeEnd])
               .range([-3*Math.PI/4, 3*Math.PI/4]));
    
    //Creating Display of Digits
    //Adjust size depending on radius
    //Applying Custom Settings: Number of Digits and Decimal Places
    var segDisplay = iopctrl.segdisplay()
    .width((widthOrHeight)/5)
    .digitCount(layout.displayDigits)
    .negative(false)
    .decimals(layout.displayDecimals);  

    //Putting the measures we received from Qlik into variables
    var kpi = data.map(function(d){return d.Metric1;});
    var reference = data.map(function(d){return d.Metric2;});

    //Preparing statements to be injected into D3 that determine gauge and display placement 
    var transform = "translate(";
    var gaugePlacement = transform.concat(gaugeWidthTransform, ",",gaugeHeightTransform,")");
    var displayPlacement = transform.concat(displayWidthTransform, ",",displayHeightTransform,")");
    
    //Applying KPI indicator colors based on if KPI is over or under Reference
    //Applying Resizing Map: gauge and display placement
    if(kpi>=reference){
        svg.append("g")
            .attr("class", "gaugeover")
            .attr("transform", gaugePlacement)
            .call(gauge);

        svg.append("g")
            .attr("class", "segdisplayover")
            .attr("transform", displayPlacement)
            .call(segDisplay);
    }
    else if(kpi<reference){
        svg.append("g")
            .attr("class", "gaugeunder")
            .attr("transform", gaugePlacement)
            .call(gauge);

        svg.append("g")
            .attr("class", "segdisplayunder")
            .attr("transform", displayPlacement)
            .call(segDisplay);
    }

    //Pushing Qlik's KPI measure into the just created gauge and display
    segDisplay.value(kpi);
    gauge.value(kpi);

    //Applying the reference's indicator color
    //Applying Resizing Map: gauge placement
    //Notice how we don't print out the display digits for the reference
    svg.append("g")
        .attr("class", "gaugeref")
        .attr("transform", gaugePlacement)
        .call(gaugeref);
    
    //Pushing Qlik's Reference measure into the just created gauge
    gaugeref.value(reference);
};

//Function for the D3 Gauge without a Reference indicator
var vizwithoutref = function(data,labels,layout,width,height,id) {

    //Finding this specific extension's stylesheet's reference in Qlik's main HTML
    for(i=0; i<document.styleSheets.length; i++){  
        if(document.styleSheets[i].ownerNode.innerHTML.substring(0,69) == ".qv-object-speedometerd3twoindicators div.qv-object-content-container"){ 
            console.log('Speedometer Stylesheet:',document.styleSheets[i]);
            var speedometerSheet = document.styleSheets[i];
        }
    }

    //    var themRules = speedometerSheet.cssRules? speedometerSheet.cssRules: speedometerSheet.rules;    
    
    //Applying Custom Settings: Indicator Color and Arc Shadow Opacity
    var newColorStroke = "stroke:";
    var newColorFill = "fill:";
    var newOpacity = "opacity:";
    speedometerSheet.addRule('.qv-object-speedometerd3twoindicators .gaugeunder .indicator', newColorStroke.concat(layout.colorOfUnder,";"));
    speedometerSheet.addRule('.qv-object-speedometerd3twoindicators .segdisplayunder .on', newColorFill.concat(layout.colorOfUnder,";"));
    speedometerSheet.addRule('.qv-object-speedometerd3twoindicators .gaugeunder .arc, .qv-object-speedometerd3twoindicators .gaugeunder .cursor', newOpacity.concat((layout.arcOpacity),";"));
    
    //Feeding D3 our chart's ID
    //Feeding D3 width and height
    var svg = d3.select("#"+id)
    .append("svg")
    .attr("width", width)
    .attr("height", height);
    
    //Determining whether width or height is shorter
    var widthOrHeight = (width<=height)? width: height;
    console.log('Deciding factor:', widthOrHeight);

    //Resizing Map Declarations
    var fontPercentage = "60%";
    var tickPadding = widthOrHeight/200;
    var gaugeWidthTransform = -30;
    var gaugeHeightTransform = -30;
    var displayWidthTransform = ((widthOrHeight/2)*0.8);
    var displayHeightTransform = ((widthOrHeight/2)*0.8);
    
    //Resizing Map
    if(widthOrHeight<=151){
        fontPercentage = "40%";
        tickPadding = 1;
        gaugeWidthTransform = -37;
        gaugeHeightTransform = -35;
        displayWidthTransform = ((widthOrHeight/2)*0.825);
        displayHeightTransform = ((widthOrHeight/2)*1.45);
    }
    else if(widthOrHeight>151 && widthOrHeight<=213){
        fontPercentage = "50%";
        tickPadding = 2;
        gaugeWidthTransform = -32;
        gaugeHeightTransform = -25;
        displayWidthTransform = ((widthOrHeight/2)*0.775);
        displayHeightTransform = ((widthOrHeight/2)*1.45);
    }
    else if(widthOrHeight>213 && widthOrHeight<=276){
        fontPercentage = "60%";
        tickPadding = 3;
        gaugeWidthTransform = -27;
        gaugeHeightTransform = -20;
        displayWidthTransform = ((widthOrHeight/2)*0.775);
        displayHeightTransform = ((widthOrHeight/2)*1.375);
    }
    else if(widthOrHeight>276 && widthOrHeight<=338){
        fontPercentage = "70%";
        tickPadding = 4;
        gaugeWidthTransform = -20;
        gaugeHeightTransform = -9;
        displayWidthTransform = ((widthOrHeight/2)*0.8);
        displayHeightTransform = ((widthOrHeight/2)*1.375);
    }
    else if(widthOrHeight>338 && widthOrHeight<=422){
        fontPercentage = "80%";
        tickPadding = 4;
        gaugeWidthTransform = -10;
        gaugeHeightTransform = 0;
        displayWidthTransform = ((widthOrHeight/2)*0.825);
        displayHeightTransform = ((widthOrHeight/2)*1.4);
    }
    else if(widthOrHeight>422 && widthOrHeight<=504){
        fontPercentage = "90%";
        tickPadding = 4;
        gaugeWidthTransform = 0;
        gaugeHeightTransform = 10;
        displayWidthTransform = ((widthOrHeight/2)*0.825);
        displayHeightTransform = ((widthOrHeight/2)*1.425);
    }
    else if(widthOrHeight>504){
        fontPercentage = "100%";
        tickPadding = 4;
        gaugeWidthTransform = 20;
        gaugeHeightTransform = 20;
        displayWidthTransform = ((widthOrHeight/2)*0.825);
        displayHeightTransform = ((widthOrHeight/2)*1.4);
    }
    
    //Applying Resizing Map to CSS: Font Size
    var newFontSize = "font-size:";
    speedometerSheet.addRule('.qv-object-speedometerd3twoindicators .gaugeunder .major', newFontSize.concat(fontPercentage,";"));
    
    //Creating gauge and KPI indicator
    //Draw radius depending on width or height (whichever's shorter)
    //Applying Custom Settings: Total Ticks Multiplier and Subticks per Tick
    //Applying Resizing Map: Padding between tick and numbers
    //Applying Custom Settings: Range Start and End
    var gauge = iopctrl.arcslider()
    .radius((widthOrHeight/2)*0.8)
    .events(false)
    .indicator(iopctrl.defaultGaugeIndicator);
    gauge.axis().orient("in")
        .normalize(true)
        .ticks(12*layout.totalTicks)
        .tickSubdivide(layout.subTicksPerTick)
        .tickSize(10, 8, 10)
        .tickPadding(tickPadding)
        .scale(d3.scale.linear()
               .domain([layout.rangeStart, layout.rangeEnd])
               .range([-3*Math.PI/4, 3*Math.PI/4]));

    //Creating Display of Digits
    //Adjust size depending on radius
    //Applying Custom Settings: Number of Digits and Decimal Places
    var segDisplay = iopctrl.segdisplay()
    .width((widthOrHeight)/5)
    .digitCount(layout.displayDigits)
    .negative(false)
    .decimals(layout.displayDecimals);

    //Putting the KPI measure we received from Qlik into a variable
    var kpi = data.map(function(d){return d.Metric1;});

    //Preparing placement-determining statement to be injected into D3
    var transform = "translate(";
    var gaugePlacement = transform.concat(gaugeWidthTransform, ",",gaugeHeightTransform,")");
    var displayPlacement = transform.concat(displayWidthTransform, ",",displayHeightTransform,")");
    
    //Applying KPI indicator color
    //Applying Resizing Map: gauge and display placement
        svg.append("g")
            .attr("class", "gaugeunder")
            .attr("transform", gaugePlacement)
            .call(gauge);

        svg.append("g")
            .attr("class", "segdisplayunder")
            .attr("transform", displayPlacement)
            .call(segDisplay);

    //Pushing Qlik's KPI measure into the just created gauge and display
    segDisplay.value(kpi);
    gauge.value(kpi);
};