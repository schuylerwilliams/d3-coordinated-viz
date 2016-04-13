
	// wrapper function
	(function(){
		// array to hold state choices
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
            "NorthCarolina",
            "NorthDakota",
            "Nebraska",
            "NewHampshire",
            "NewJersey",
            "NewMexico",
            "Nevada",
            "NewYork",
            "Ohio",
            "Oklahoma",
            "Oregon",
            "Pennsylvania",
            "RhodeIsland",
            "SouthCarolina",
            "SouthDakota",
            "Tennessee",
            "Texas",
            "Utah",
            "Virginia",
            "Vermont",
            "Washington",
            "Wisconsin",
            "WestVirginia",
            "Wyoming"
        ];
        var regions; //global variable for states
        var expressed = attrArray[0]; //currently selected state
            	
		window.onload = setMap(); //when window loads, run setMap function


		// set up choropleth map
		function setMap(){
    		var q = d3_queue.queue(); //use queue.js to parallelize asynchronous data loading
    		
    		var width = window.innerWidth * 0.5; //map frame width
    		var height = 400; //map frame height
    		
    		//create new svg container for the map
    		var map = d3.select("body")
        		.append("svg")
        		.attr("class", "map") //give class name "map"
        		.attr("width", width) //set width
        		.attr("height", height); //set height
    		
    		//create albers USA specialized projection
    		var projection = d3.geo.albersUsa()
        		.scale(800) //adjust scale for frame extent
        		.translate([width / 2, height / 2]);
        	
        	// create path generator
        	var path = d3.geo.path()
        		.projection(projection); //set projection
    		
    		
    		q.defer(d3.csv, "/data/state_migration_outflow_perc_round_approx_trans.csv") //load attributes from csv
        		.defer(d3.json, "/data/stateProperty.json") //load background spatial data
        		.await(callback);

			// callback function which runs after data is loaded
    		function callback(error, csvData, states){
        		var stateBounds = topojson.feature(states, states.objects.states_Natural); //translate json data for the state bounds
        		var indvState = topojson.feature(states, states.objects.states_Natural).features; //translate json data for individual state
        		
        		// add country to map
        		var countries = map.append("path")
            		.datum(stateBounds)
            		.attr("class", "states") //give class name "states"
            		.attr("d", path);	
            	
            	indvState = joinData(indvState, csvData); //call function to join the data
            	
        		var colorScale = makeColorScale(csvData); //call function to create the color scale
        		
            	setEnumerationUnits(indvState, map, path, colorScale); //call function to set up each individual state
            	
        		setChart(csvData, colorScale); //add the coordinated visualization (chart) to the map
        		
        		// function to perform data joining
        		function joinData(indvState, csvData){
        			//loop through the data's length
        			for (var i=0; i<csvData.length; i++){
        				var csvRegion = csvData[i]; //the current region
        				var csvKey = csvRegion.Outflow; //the CSV primary key
        			
        				//loop through geojson regions to find correct region
        				for (var a=0; a<indvState.length; a++){
            				var geojsonProps = indvState[a].properties; //the current region geojson properties
            				var geojsonKey = geojsonProps.name; //the geojson primary key
            				
            				//if geojsonKey matches the CSVKey then perform the join
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
            		regions = map.selectAll(".regions")
            			.data(indvState)
            			.enter()
            			.append("path")
            			// give each state unique class name
            			.attr("class", function(d){
            				return "region" + d.properties.name;
            			})
            			// give each state unique id name
            			.attr("id", function(d){
            				return d.properties.name;
            			})
            			.attr("d", path)
            			//each state is colored according to the data
            			.style("fill", function(d){
            				return choropleth(d.properties, colorScale); //call choropleth function
            			})
            			//change style on mouse over
            			.on("mouseover", function(){
            				var hovered = this.id;
            				highlight(hovered); //call highlight function
        				})
        				//change style on mouse out
        				.on("mouseout", function(){
        					var hovered = this.id;
        					dehighlight(hovered); //call dehighlight function
        				})
        				//update the tooltip on moving the mouse
        				.on("mousemove", function(d){
        					infoLabelUpdate(d.properties); //call infoLabelUpdate function 
        				});
            	};
    		};
		};
		
		//function to perform the highlighting of the state and chart
		function highlight(x){
			var hoverID = "#" + x;
			//select all objects with the same id
			d3.selectAll(hoverID)
				//perform the highlighting
				.style({
					"stroke": "#e34a33",
					"stroke-width": "2"
				});
		};
		
		// function to perform the de-highlighting of the state and chart
		function dehighlight(x){
			var hoverID = "#" + x;
			//select all objects with the same id
			d3.selectAll(hoverID)
				//perform the de-highlighting
				.style({
					"stroke": "",
					"stroke-width": ""
				});
			//change tooltip to invisiblie
			d3.select(".infolabel")
				.style({
					"visibility": "hidden"
				});
		};
		
		//function to update the info label tooltip
		function infoLabelUpdate(x){
			console.log(x);
			//select the infolabel
        	d3.select(".infolabel")
        		//change the info label visibility to visible
        		.style({
        			"visibility": "visible"
        		});
        	
			if (x.name === undefined) {
				infolabel.html(x.Outflow + ": " + x[expressed] + "%");
			} else {
				infolabel.html(x.name + ": " + x[expressed] + "%");
			}
			moveLabel(); //call moveLabel function to position in accordance with mouse
        };
        
        //function to move info label with mouse
		function moveLabel(){
			//get width of label
    		var labelWidth = d3.select(".infolabel")
        		.node()
        		.getBoundingClientRect()
        		.width;
        
    		//use coordinates of mousemove event to set label coordinates
    		var x1 = d3.event.clientX + 10,
        		y1 = d3.event.clientY - 75,
        		x2 = d3.event.clientX - labelWidth - 10,
        		y2 = d3.event.clientY + 25;
        	
        	//horizontal label coordinate, testing for overflow
    		var x = d3.event.clientX > window.innerWidth - labelWidth - 20 ? x2 : x1; 
    		//vertical label coordinate, testing for overflow
    		var y = d3.event.clientY < 75 ? y2 : y1; 
			
			//select the info label tooltip
    		d3.select(".infolabel")
        		.style({
            		"left": x + "px",
            		"top": y + "px"
        		});
		};
        
        //create the info label tooltip
        var infolabel = d3.select("body")
        	.append("div")
        	//assign class name
        	.attr({
            	"class": "infolabel"
        	});
		
		//function to test for data value and return color
		function choropleth(props, colorScale){
    		//make sure attribute value is a number
    		var val = parseFloat(props[expressed]);
    		//if attribute value exists, assign a color; otherwise assign red
    		if (val && val != NaN){
        		return colorScale(val);
    		} else {
        		return "#e34a33";
        		//return "#2ca25f";
    		};
		};
		
		//function to create color scale generator
		function makeColorScale(data){
			//colors inside the classes
    		var colorClasses = [
        		"#f1eef6",
        		"#bdc9e1",
        		"#74a9cf",
        		"#2b8cbe",
        		"#045a8d"
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
    		var chartWidth = window.innerWidth * .45,
        		chartHeight = window.innerHeight,
        		leftPadding = 50,
        		rightPadding = 0,
        		topBottomPadding = 100,
        		//chartInnerWidth = chartWidth - leftPadding - rightPadding,
        		chartInnerWidth = chartWidth,
        		//chartInnerHeight = chartHeight - topBottomPadding,
        		chartInnerHeight = chartHeight,
        		translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    		//create a second svg element to hold the bar chart
    		var chart = d3.select("#chartContainer")
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
        		.range([460, 0])
        		.domain([0, 34]);

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
        		.attr("id", function(d){
        			return d.Outflow;
        		})
        		.attr("width", chartInnerWidth / csvData.length - 1)
        		
        		.attr("x", function(d, i){
            		return i * (chartInnerWidth / csvData.length) + leftPadding;
        		})
        		.attr("height", function(d, i){
            		return 800 - yScale((d[expressed]));
        		})
        		.attr("y", function(d, i){
            		return yScale((d[expressed])) + topBottomPadding;
        		})
        		
        		.style("fill", function(d){
            		return choropleth(d, colorScale);
        		})
        		.on("mouseover", function(){
        			highlight(this.id);
        		})
        		.on("mouseout", function(){
        			dehighlight(this.id);
        		})
        		.on("mousemove", infoLabelUpdate)
        		.on("click", function(d){
        			changeAttribute(this.id, csvData);
        			dropdown.node().value = this.id;
        			infoLabelUpdate(d.properties);
        		});

    		//create a text element for the chart title
    		var chartTitle = chart.append("text")
        		.attr("x", 40)
        		.attr("y", 40)
        		.attr("class", "chartTitle")
        		.text(expressed + " Outflows");

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
        	
        	// create dropdown
        	var dropdown = d3.select("body")
        		.append("select")
        		.attr("class", "dropdown")
        		.on("change", function(){
            		changeAttribute(this.value, csvData)
        		});

    		//add initial option
    		var titleOption = dropdown.append("option")
        		.attr("class", "titleOption")
        		.attr("disabled", "true")
        		.text("Select Attribute");

    		//add attribute name options
    		var attrOptions = dropdown.selectAll("attrOptions")
        		.data(attrArray)
        		.enter()
        		.append("option")
        		.attr("value", function(d){ return d })
        		.text(function(d){ return d });
        	
        	//regions variable on click functionality
        	regions.on("click", function(d){
        		changeAttribute(this.id, csvData);
        		dropdown.node().value = this.id;
        		infoLabelUpdate(d.properties);
        		getMaxVal(this.id);
        	});
        	
        	//dropdown change listener handler
			function changeAttribute(attribute, csvData){
    			//change the expressed attribute
    			expressed = attribute;
			
    			//recreate the color scale
    			var colorScale1 = makeColorScale(csvData);
    			
    			chartTitle.text(expressed + " Outflows");
    			
    			regions.style("fill", function(d){
            		return choropleth(d.properties, colorScale1);
            	});
            	
            	//re-sort, resize, and recolor bars
    			bars.sort(function(a, b){
            			return b[expressed] - a[expressed];
        			})
        			.attr("x", function(d, i){
            			return i * (chartInnerWidth / csvData.length) + leftPadding;
        			})
        			//resize bars
        			.attr("height", function(d, i){
            			return 460 - yScale(parseFloat(d[expressed]));
        			})
        			.attr("y", function(d, i){
            			return yScale(parseFloat(d[expressed])) + topBottomPadding;
        			})
        			//recolor bars
        			.style("fill", function(d){
            			return choropleth(d, colorScale1);
        			});
			};
			
			function getMaxVal(x){
				console.log(x);
				/*
				var domainMax = [12, 22, 20, 22, 12, 10, 30, 27, 13, 19, 22, 19, 19, 12, 21, 25, 16, 28, 15, 
					20, 16, 12, 17, 17, 20, 14, 13, 29, 17, 35, 36, 23, 36, 16, 12, 26, 27, 18, 32, 20, 16, 
					12, 14, 19, 13, 18, 21, 23, 18, 17];
				
				for (i=0; i <= attrArray.length; i++){
					if (x == attrArray[i]) {
						yScale.domain([0, domainMax[i]]);
						yAxis.scale(yScale);
						axis.call(yAxis);
					}
				}
				*/
			};
		};
	})();

	




	



