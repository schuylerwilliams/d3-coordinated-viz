	(function(){
		
		var attrArray = [
        	"Alaska",
            "Alabama",
            "Arkansas",
            "Arizona",
            "California",
            "Colorado",
            "Connecticut",
            "Delaware",
            "Florida",
            "Georgia",
            "Hawaii",
            "Iowa",
            "Idaho",
            "Illinois",
            "Indiana",
            "Kansas",
            "Kentucky",
            "Louisiana",
            "Massachusetts",
            "Maryland",
            "Maine",
            "Michigan",
            "Minnesota",
            "Missouri",
            "Mississippi",
            "Montana",
            "North Carolina",
            "North Dakota",
            "Nebraska",
            "New Hampshire",
            "New Jersey",
            "New Mexico",
            "Nevada",
            "New York",
            "Ohio",
            "Oklahoma",
            "Oregon",
            "Pennsylvania",
            "Rhode Island",
            "South Carolina",
            "South Dakota",
            "Tennessee",
            "Texas",
            "Utah",
            "Virginia",
            "Vermont",
            "Washington",
            "Wisconsin",
            "West Virginia",
            "Wyoming"
        ];
        
        var expressed = attrArray[0];
            	
		// beging script when window loads
		window.onload = setMap();


		// set up choropleth map
		function setMap(){
    		//use queue.js to parallelize asynchronous data loading
    		var q = d3_queue.queue();
    		
    		// map frame dimensions
    		var width = window.innerWidth * 0.5;
    		var height = 460;
    		
    		//create new svg container for the map
    		var map = d3.select("body")
        		.append("svg")
        		.attr("class", "map")
        		.attr("width", width)
        		.attr("height", height);
    		
    		//create Albers equal area conic projection centered on united states
    		var projection = d3.geo.albersUsa()
        		//.center([-89, 46])
        		//.rotate([100, -20, -5])
        		//.parallels([43, 62])
        		.scale(900)
        		.translate([width / 2, height / 2]);
        	
        	// create path generator
        	var path = d3.geo.path()
        		.projection(projection);
    		
    		
    		q.defer(d3.csv, "/data/state_migration_outflow.csv") //load attributes from csv
        		.defer(d3.json, "/data/stateProperty.json") //load background spatial data
        		.await(callback);

    		function callback(error, csvData, states){
        		//translate json data
        		var stateBounds = topojson.feature(states, states.objects.states_Natural);
        		var indvState = topojson.feature(states, states.objects.states_Natural).features;
        		
        		// add country to map
        		var countries = map.append("path")
            		.datum(stateBounds)
            		.attr("class", "states")
            		.attr("d", path);	
            	
            	// join the data
            	indvState = joinData(indvState, csvData);
            	
            	//create the color scale
        		var colorScale = makeColorScale(csvData);
        		
            	// call setEnumerationUnits function
            	setEnumerationUnits(indvState, map, path, colorScale);
            	
            	//add coordinated visualization to the map
        		setChart(csvData, colorScale);
            	
        		// function to perform data joining
        		function joinData(indvState, csvData){
        			for (var i=0; i<csvData.length; i++){
        				var csvRegion = csvData[i]; //the current region
        				var csvKey = csvRegion.Outflow; //the CSV primary key
        			
        				//loop through geojson regions to find correct region
        				for (var a=0; a<indvState.length; a++){
            				var geojsonProps = indvState[a].properties; //the current region geojson properties
            				var geojsonKey = geojsonProps.name; //the geojson primary key
            			
            				if (geojsonKey == csvKey) {
            					//assign all attributes and values
                				attrArray.forEach(function(attr){
                    				var val = parseFloat(csvRegion[attr]); //get csv attribute value
                    				geojsonProps[attr] = val; //assign attribute and value to geojson properties
                				});
            				};
            			};
        			};
        			return indvState;
        		};
        		
        		// function to add state regions to map
        		function setEnumerationUnits(indvState, map, path, colorScale){
        			// add regions to map
            		var regions = map.selectAll(".regions")
            			.data(indvState)
            			.enter()
            			.append("path")
            			.attr("class", function(d){
            				return "region" + d.properties.name;
            			})
            			.attr("d", path)
            			.style("fill", function(d){
            				return choropleth(d.properties, colorScale);
            			});
            	};
    		};
		};
		
		
		//function to test for data value and return color
		function choropleth(props, colorScale){
    		//make sure attribute value is a number
    		var val = parseFloat(props[expressed]);
    		//if attribute value exists, assign a color; otherwise assign gray
    		if (val && val != NaN){
        		return colorScale(val);
    		} else {
        		return "#CCC";
    		};
		};
		
		//function to create color scale generator
		function makeColorScale(data){
			console.log('hello');
    		var colorClasses = [
        		"#D4B9DA",
        		"#C994C7",
        		"#DF65B0",
        		"#DD1C77",
        		"#980043"
    		];
    		
    		//create color scale generator
    		var colorScale = d3.scale.quantile()
        		.range(colorClasses);
        	
        	//build array of all values of the expressed attribute
    		var domainArray = [];
    			for (var i=0; i<data.length; i++){
        			var val = parseFloat(data[i][expressed]);
        			domainArray.push(val);
    			};
    		
    		//assign array of expressed values as scale domain
    		colorScale.domain(domainArray);
    		
    		return colorScale;
    	};
    	
    	
    	//function to create coordinated bar chart
		function setChart(csvData, colorScale){
    		//chart frame dimensions
    		var chartWidth = window.innerWidth * 0.425,
        		chartHeight = 473,
        		leftPadding = 25,
        		rightPadding = 2,
        		topBottomPadding = 5,
        		chartInnerWidth = chartWidth - leftPadding - rightPadding,
        		chartInnerHeight = chartHeight - topBottomPadding * 2,
        		translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    		//create a second svg element to hold the bar chart
    		var chart = d3.select("body")
        		.append("svg")
        		.attr("width", chartWidth)
        		.attr("height", chartHeight)
        		.attr("class", "chart");

    		//create a rectangle for chart background fill
    		var chartBackground = chart.append("rect")
        		.attr("class", "chartBackground")
        		.attr("width", chartInnerWidth)
        		.attr("height", chartInnerHeight)
        		.attr("transform", translate);

    		//create a scale to size bars proportionally to frame and for axis
    		var yScale = d3.scale.linear()
        		.range([463, 0])
        		.domain([0, 100]);

    		//set bars for each province
    		var bars = chart.selectAll(".bar")
        		.data(csvData)
        		.enter()
        		.append("rect")
        		.sort(function(a, b){
            		return b[expressed]-a[expressed]
        		})
        		.attr("class", function(d){
            		return "bar " + d.Outflow;
        		})
        		.attr("width", chartInnerWidth / csvData.length - 1)
        		.attr("x", function(d, i){
            		return i * (chartInnerWidth / csvData.length) + leftPadding;
        		})
        		.attr("height", function(d, i){
            		return 463 - yScale(parseFloat(d[expressed]));
        		})
        		.attr("y", function(d, i){
            		return yScale(parseFloat(d[expressed])) + topBottomPadding;
        		})
        		.style("fill", function(d){
            		return choropleth(d, colorScale);
        		});

    		//create a text element for the chart title
    		var chartTitle = chart.append("text")
        		.attr("x", 40)
        		.attr("y", 40)
        		.attr("class", "chartTitle")
        		.text(expressed);

    		//create vertical axis generator
    		var yAxis = d3.svg.axis()
        		.scale(yScale)
        		.orient("left");

    		//place axis
    		var axis = chart.append("g")
        		.attr("class", "axis")
        		.attr("transform", translate)
        		.call(yAxis);

    		//create frame for chart border
    		var chartFrame = chart.append("rect")
        		.attr("class", "chartFrame")
        		.attr("width", chartInnerWidth)
        		.attr("height", chartInnerHeight)
        		.attr("transform", translate);



    	/*
    	//function to create coordinated bar chart
		function setChart(csvData, colorScale){
    		//chart frame dimensions
    		var chartWidth = window.innerWidth * 0.425,
        	chartHeight = 460;

    		//create a second svg element to hold the bar chart
    		var chart = d3.select("body")
        		.append("svg")
        		.attr("width", chartWidth)
        		.attr("height", chartHeight)
        		.attr("class", "chart");
        	
        	//create a scale to size bars proportionally to frame
    		var yScale = d3.scale.linear()
        		.range([0, chartHeight])
        		.domain([0, 105]);
        	
        	//set bars for each province
    		var bars = chart.selectAll(".bars")
        		.data(csvData)
        		.enter()
        		.append("rect")
        		.sort(function(a, b){
            		return a[expressed]-b[expressed]
        		})
        		.attr("class", function(d){
            		return "bars " + d.Outflow;
        		})
        		.attr("width", chartWidth / csvData.length - 1)
        		.attr("x", function(d, i){
            		return i * (chartWidth / csvData.length);
        		})
        		.attr("height", function(d){
            		return yScale(parseFloat(d[expressed]));
        		})
        		.attr("y", function(d){
            		return chartHeight - yScale(parseFloat(d[expressed]));
        		})
        		.style("fill", function(d){
            		return choropleth(d, colorScale);
        		});
        	
        	//annotate bars with attribute value text
    		var numbers = chart.selectAll(".numbers")
        		.data(csvData)
        		.enter()
        		.append("text")
        		.sort(function(a, b){
            		return a[expressed]-b[expressed]
        		})
        		.attr("class", function(d){
            		return "numbers " + d.Outflow;
        		})
        		.attr("text-anchor", "middle")
        		.attr("x", function(d, i){
            		var fraction = chartWidth / csvData.length;
            		return i * fraction + (fraction - 1) / 2;
        		})
        		.attr("y", function(d){
            		return chartHeight - yScale(parseFloat(d[expressed])) + 15;
        		})
        		.text(function(d){
            		return d[expressed];
        		});
        	
        	// create chart displaying attribute
        	var chartTitle = chart.append("text")
        		.attr("x", 20)
        		.attr("y", 40)
        		.attr("class", "chartTitle")
        		.text(expressed);
			};	
			*/
		};		
	})();








	



