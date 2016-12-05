
var margin = {top: 55, right: 160, bottom: 35, left: 140};
var lineGraphMargins = {top: 55, right: 160, bottom: 35, left: 50};
var year = 1896;
var currCity = "Athens", currCountry = "Greece";
var init_order = ["Gold", "Silver", "Bronze"];
var stack_order = init_order.slice();

var width, height;
var barChart;
var x_scale, y_scale, xAxis, yAxis;

var barMoveDuration = 800;

var tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);
var lineGraphTooltip = d3.select("body").append("div") 
  .attr("class", "tooltip")       
  .style("opacity", 0);

var datasets = {}

var lineGraphWidth = 500, lineGraphHeight = 150;
var lineGraph, valueline;
var lineGraphCountries = [];
var numCushionYears = 4;
var x_scaleLine, y_scaleLine, xAxisLine, yAxisLine;


//*****INITIALIZE DISPLAY & GET DATA********//

function init() {
  initStackedBarChart();
  initWorldMap();
  initLineGraph();

  d3.csv("hostData.csv", getHostData);
  d3.csv("OlympicData.csv", onDataArrival);
}

function initStackedBarChart() {

  width = 500, height = 500;

  barChart = d3.select('#stackedBar_container')
    .append("svg")
      .attr("class", "stackedBar")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + (margin.top-30) + ")");

  // d3.select("svg.stackedBar")
  //   .append("text")
  //   .attr("x", (width / 2))
  //   .attr("y", margin.top-18)
  //   .attr("text-anchor", "middle")
  //   .style("font-size", "16px")
  //   .text("Total Medal Count by Country")

  // Set x, y and colors
  x_scale = d3.scale.linear()
    .domain([0, 200])
    .range([0,width]);

  y_scale = d3.scale.ordinal()
    .rangeRoundBands([0, height], .1, 0);

  // Define and draw axes
  yAxis = d3.svg.axis()
    .scale(y_scale)
    .orient("left")
    .tickSize(-width, 0, 0);

  xAxis = d3.svg.axis()
    .scale(x_scale)
    .orient("bottom")
    .tickSize(-height, 0, 0);

  barChart.append("g")
    .attr("class", "y_axis")
    .call(yAxis);

  barChart.append("g")
    .attr("class", "x_axis")
    .attr("transform", "translate(0,-14)")
    .call(xAxis);
}

function initLineGraph() {

  x_scaleLine = d3.scale.ordinal().rangeRoundBands([0, lineGraphWidth], .5, 0);
  y_scaleLine = d3.scale.linear().range([lineGraphHeight, 0]);

  var bluescale4 = ["#8BA9D0", "#6A90C1", "#066CA9", "#004B8C"];
  linegraphcolor = d3.scale.ordinal().range(bluescale4);

  lineGraph = d3.select('#linegraph_container')
    .append("svg")
      .attr("class", "linegraph")
      .attr("width", lineGraphWidth + lineGraphMargins.left + lineGraphMargins.right)
      .attr("height", lineGraphHeight + lineGraphMargins.top + lineGraphMargins.bottom)
    .append("g")
      .attr("transform", "translate(" + lineGraphMargins.left + "," + lineGraphMargins.top + ")");

  d3.select("svg.linegraph")
    .append("text")
    .attr("x", lineGraphMargins.left+150)
    .attr("y", lineGraphMargins.top-18)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .text("Compare Country Medal Counts Over Time")


  //LEGEND HOST COUNTRY INFO
  d3.select("svg.linegraph")
    .append("text")
    .attr("x", lineGraphMargins.left+400)
    .attr("y", lineGraphMargins.top-18)
    .attr("text-anchor", "middle")
    .text("= Host Country")
  d3.select("svg.linegraph")
    .append("circle")
    .attr("cx", lineGraphMargins.left+355)
    .attr("cy", lineGraphMargins.top-22)
    .attr("r", "5")
    .style("fill", "#DAA520");
}

//******YEAR CHANGE******//
function sliderChange(yearSelected) {
  updateYearInfo(yearSelected);
  prepareAndFilterData();
  stackedBarChart(barMoveDuration);
  updateMapContainer();
  updateLineGraph();
}
function updateYearInfo(yearSelected) {
  year = yearSelected;
  currCity = datasets["hosts"][year]["city"];
  currCountry = datasets["hosts"][year]["country"];
  document.getElementById("hostInfo").innerHTML = year + ": " + currCity + ", " + currCountry;
}

//*******PREPARE DATA**********/
function getHostData(error, data) {
  if (error) {
    console.warn(error);
    return
  }
  datasets["hosts"] = {};
  data.forEach(function(d) {
    newEntry = {};
    newEntry["city"] = d.City;
    newEntry["country"] = d.Country;
    newEntry["countryCode"] = d.CountryCode;
    datasets["hosts"][d.Year] = newEntry;
  })
}
function onDataArrival(error, data) {
  if (error) {
    console.warn(error)
    return
  }
  datasets["orig"] = data

  //organize medals by country
  var countryData = datasets["countries"] = {};
  datasets["orig"].forEach(function(d) {
    if (d.NOC in countryData) {
      countryData[d.NOC].push(d);
    } else {
      countryData[d.NOC] = [d];
    }
  })

  prepareAndFilterData();

  stackedBarChart();
  updateMapContainer();
  lineGraphCountries = ["GRE"]; //default to Greece, 1896
  updateLineGraph();
}

//*******GET ALL COUNTRY MEDAL COUNTS*******//
function prepareAndFilterData() {
  var countryMedalCounts = datasets["curr"] = [];

  for (var key in datasets["countries"]) {
    var t2m = { //type to medal map
      "Gold" : 0,
      "Silver" : 0,
      "Bronze" : 0
    }

    var filteredMedals = datasets["countries"][key]
      .filter(function(d) {
        if (d.Year == year) return true;
      });

    if (filteredMedals.length == 0) continue;

    filteredMedals.forEach(function(d) {
      var medalType = d.Medal;
      t2m[medalType]++;
    })

    var medals_per_type = [];
    init_order.forEach(function(type) {
      var medalEntry = {
        "type" : type,
        "count" : t2m[type],
        "t2m": t2m
      }
      medals_per_type.push(medalEntry);
    });

    var countryEntry = {
      "Country" : key,
      "all_medals" : filteredMedals,
      "medals_per_type" : medals_per_type,
      "totalMedalCount" : t2m.Gold + t2m.Silver + t2m.Bronze
    }
    countryMedalCounts.push(countryEntry);
  }
  countryMedalCounts.sort(function(a,b) { return b.totalMedalCount - a.totalMedalCount;})
}

function stackedBarChart(delayGrow) {
  data = datasets["curr"];

  //update the height of the bar chart based on the number of countries
  var numCountries = Object.keys(data).length;
  height = (numCountries*25);
  d3.select("svg.stackedBar").attr("height", height + margin.top + margin.bottom)

  var total_medals_max = 180// d3.max(data, function(d) { return d.totalMedalCount });

  // Set x, y and colors
  x_scale.domain([0, total_medals_max]);
  y_scale.domain(data.map(function(d) { return countryName(d.Country); }))
      .rangeRoundBands([0, height], .1, 0);

  // Redefine and draw axes
  yAxis.scale(y_scale).tickSize(-height, 0, 0)
  xAxis.scale(x_scale);

  d3.select("g.x_axis").call(xAxis);
  var yAxisObj = d3.select("g.y_axis").transition().duration(barMoveDuration).call(yAxis);

  var highlightCountry = function(country) {
    d3.selectAll(".datamaps-subunit")
      .filter(function(datamap) { return convertCountryCode(country) == datamap.id; })
      .style("stroke", mapHighlightBorderColor)
      .style("stroke-width", 2);
  };

  var unHighlightCountry = function(country) {
    d3.selectAll(".datamaps-subunit")
      .filter(function(datamap) { return convertCountryCode(country) == datamap.id; })
      .style("stroke", mapBorderColor)
      .style("stroke-width", 1);
  };

  //highlight country in map on label hover
  yAxisObj.selectAll(".tick")[0].forEach(function(d) {
    d3.select(d)
      .on("mouseover", function(axisLabel) {
        d1 = data.filter(function(d1) { return countryName(d1.Country) == axisLabel; })[0];
        return highlightCountry(d1.Country);
      })
      .on("mouseout", function(axisLabel) {
        d1 = data.filter(function(d1) { return countryName(d1.Country) == axisLabel; })[0];
        return unHighlightCountry(d1.Country);
      })
      .on("click", function(axisLabel) {
        d1 = data.filter(function(d1) { return countryName(d1.Country) == axisLabel; })[0];
        updateLineGraphCountries(convertToOlympicCode(d1.Country));
      })
  });

  // Create groups for each series, rects for each segment 
  var groups = barChart.selectAll("g.medalcounts")
    .data(data, function(d, i) { return d.Country; })

  // Enter set: new groups to create
  groups.enter().append("g")
    .attr("class", "clickable")
    .attr("class", "medalcounts")
    .on("mouseover", function(d) { return highlightCountry(d.Country); })
    .on("mouseout", function(d) { return unHighlightCountry(d.Country); })

  // Update set, groups to update
  groups.transition().duration(barMoveDuration).attr("transform", function(d, i) {
    return "translate(0," + y_scale(countryName(d.Country)) + ")"
  })

  // Nested binding to <rect> inside each country group
  var nested_bars_per_group = groups.selectAll("rect")
    .data(function(d) { return d.medals_per_type; })

  nested_bars_per_group.enter()
    .append("rect")
    .attr("x", 0)
    .attr("y", function(d) { return y_scale(countryName(d.Country)); })
    .attr("height", function(d) { return y_scale.rangeBand(); })
    .attr("width", 0)
    .on("click", function(d) {
      updateStacked(d.type)
      stackedBarChart(0);
    })
    .on("mouseover", function(d) {
      tooltip.transition()
        .duration(200)
        .style("opacity", 0.75);
    })
    .on("mouseout", function(d) {
      tooltip.transition()
          .duration(200)
          .style("opacity", 0);
    })
    .on("mousemove", function(d) {
      tooltip.html(d.count)
        .style("left", (d3.event.pageX-10) + "px")
        .style("top", (d3.event.pageY-30) + "px");
    });

  nested_bars_per_group.transition().delay(delayGrow ? barMoveDuration : 0).duration(700)
    .attr("x", function(d) { return x_scale(leftBarPadding(d)) })
    .attr("width", function(d) { return x_scale(d.count) })
    .style("fill", function(d, i, n) { return color(d.type) })

  nested_bars_per_group.exit()
    .attr("width", 0)
    .attr("x", 0)
    .remove()

  // Exiting set: groups to exit
  groups.exit().selectAll("rect").transition().duration(500)
    .attr("width", 0)
    .attr("x", 0)
    .remove()

  groups.exit()
    .remove()
}

function updateStacked(medalType) {
  var idx = stack_order.indexOf(medalType)
  if (-1 == idx) return
  stack_order.unshift(stack_order.splice(idx, 1)[0])
}

function leftBarPadding(d) {  // Sum medal counts left of
  var sum = 0
  for (var i = 0; i < stack_order.length; i++) {
    var cur = stack_order[i]
    if (cur == d.type) break
    sum += d.t2m[cur]
  }
  return sum;
}

function color(medalType) {
  if(medalType == "Gold") return "#e5c100";
  else if(medalType == "Silver") return "#acacac";
  else if(medalType == "Bronze") return "#cd7f32"
}



////***LINE GRAPH
function updateLineGraphCountries(countryId) {
  countryIndex = lineGraphCountries.indexOf(countryId);
  if(countryIndex != -1) { //if in array, remove
    lineGraphCountries.splice(countryIndex, 1);
    updateLineGraph();
  } else if (lineGraphCountries.length < 5) { //else add if less than 5
    lineGraphCountries.push(countryId);
    updateLineGraph();
  }
}

function updateLineGraph() {
  updateLineGraphColors();
  d3.transition()
      .duration(1500)
      .each(redraw);
}


function redraw() {

  var medalsOverTime = [];

  //get year range to display
  startYear = year - (numCushionYears*4);
  endYear = year + (numCushionYears*4);
  if (startYear < 1896) { startYear = 1896; endYear = 1928; }
  if (endYear > 2008) { startYear = 1976; endYear = 2008; }

  lineGraphCountries.forEach(function(d) {
    for(currYear=startYear; currYear<=endYear; currYear+=4) {
      newEntry = {};
      newEntry["country"] = d;
      newEntry["year"] = currYear;

      count = 0;
      if (datasets["countries"][d] != null) {
        datasets["countries"][d].forEach(function(medal) {
          medalYear = +medal.Year;
          if(medalYear == currYear) {
            count++;
          }
        })
        if(d=="URS") { //SovietUnion + Russia 
          datasets["countries"]["RUS"].forEach(function(medal) {
            medalYear = +medal.Year;
            if(medalYear == currYear) {
              count++;
            }
          })
        }
        if(d=="TCH") { //Czechoslovakia + Bohemia 
          datasets["countries"]["BOH"].forEach(function(medal) {
            medalYear = +medal.Year;
            if(medalYear == currYear) {
              count++;
            }
          })
        }
      }

      newEntry["count"] = count;
      medalsOverTime.push(newEntry);
    }

  });

  // Nest the entries by country
  var dataNest = d3.nest()
      .key(function(d) {return d.country;})
      .entries(medalsOverTime);

  var lastvalues=[];
  x_scaleLine.domain(medalsOverTime.map(function(d) { return d.year; }));
  y_scaleLine.domain([0, d3.max(medalsOverTime, function(d) { return d.count; })]);

  // Define the axes
  xAxisLine = d3.svg.axis().scale(x_scaleLine)
      .orient("bottom");
  lineGraph.append("svg:g")
      .attr("class", "x axis");

  yAxisLine = d3.svg.axis().scale(y_scaleLine)
      .orient("left")
      .ticks(5);
  lineGraph.append("svg:g")
      .attr("class", "y axis");

  // Define the line
  valueline = d3.svg.line()
      .x(function(d) { return x_scaleLine(d.year); })
      .y(function(d) { return y_scaleLine(d.count); });


  d3.selectAll(".thegraph").remove();
  var thegraph = lineGraph.selectAll(".thegraph")
      .data(dataNest)

  //Enter new country lines
  var thegraphEnter = thegraph.enter().append("g")
    .attr("clip-path", "url(#clip)")
    .attr("class", "thegraph")
      .attr('id',function(d){ return d.key+"-line"; })
    .style("stroke-width",2.5)

  thegraphEnter.append("path")
      .attr("class", "line")
        .style("stroke", function(d) { return assignedColors[d.key]; })
        .attr("d", function(d) { return valueline(d.values); })

  //remove old country lines
  thegraph.exit().remove();

  // set variable for updating visualization
  var thegraphUpdate = d3.transition(thegraph);
  
  // change values of pat
  thegraphUpdate.select("path")
    .style("stroke", function(d) { return assignedColors[d.key]; })
    .attr("d", function(d, i) {       
        lastvalues[i]=d.values[d.values.length-1].value;         
        lastvalues.sort(function (a,b){return b-a});
      
        return valueline(d.values);
    });


  d3.transition(lineGraph).select(".y.axis")
    .call(yAxisLine);   
        
  d3.transition(lineGraph).select(".x.axis")
    .attr("transform", "translate(0," + lineGraphHeight + ")")
      .call(xAxisLine);


  //TOOLTIPS
  lineGraph.selectAll("circle").remove();
  lineGraph
    .selectAll("circle")
    .data(medalsOverTime)
    .enter().append("circle")
    .attr("fill", function(d) {
      if(datasets["hosts"][d.year] != null && datasets["hosts"][d.year]["countryCode"] == d.country) return "#DAA520";
      return assignedColors[d.country];
    })
    .attr("r", function(d) {
      if(datasets["hosts"][d.year] != null && datasets["hosts"][d.year]["countryCode"] == d.country) return "5";
      return "3";
    })
    .attr("cx", function(d) { return x_scaleLine(d.year)+13; })
    .attr("cy", function(d) { return y_scaleLine(d.count); })
    .on("mouseover", function(d) {
      lineGraphTooltip.transition()
        .duration(200)
        .style("opacity", 1);
    })
    .on("mouseout", function(d) {
      lineGraphTooltip.transition()
          .duration(200)
          .style("opacity", 0);
    })
    .on("mousemove", function(d) {
      lineGraphTooltip
        .html(d.count)
        .style("left", (d3.event.pageX-10) + "px")
        .style("top", (d3.event.pageY-30) + "px");
      lineGraphTooltip.style("opacity", 1);
    });


  //LEGEND
  d3.select(".legend").remove();
  var legend = lineGraph.append("g")
    .attr("class", "legend")
    .attr("height", 100)
    .attr("width", 100)
    
  legend.selectAll('rect')
    .data(dataNest)
    .enter()
    .append("rect")
  .attr("x", lineGraphWidth - 100)
    .attr("y", function(d, i){ return i *  12;})
  .attr("width", 10)
  .attr("height", 10)
  .style("fill", function(d) { return assignedColors[d.key]; })

  legend.selectAll('text')
    .data(dataNest)
    .enter()
    .append("text")
  .attr("x", lineGraphWidth - 85)
    .attr("y", function(d, i){ return i *  12 + 9;})
  .text(function(d) {
    if(countryName(d.key)=="Soviet Union") return "Soviet Union/Russia";
    else return countryName(d.key);
  })

}


var lineColors = ["#177B9A", "#05C176", "#6EAC1C", "#667AC1", "#41BBD9"];
var assignedColors = [];

function updateLineGraphColors() {
  var newColors = [];

  //copy over countries remaining
  for(var key in assignedColors) {
    if(lineGraphCountries.includes(key)) { newColors[key] = assignedColors[key]; }
  }

  //assign color to new countries
  for(i=0;i<lineGraphCountries.length;i++) {
    if(!Object.keys(newColors).includes(lineGraphCountries[i])) {
      for(j=0;j<lineColors.length;j++) {
        found = false;
        for(var key in newColors) {
          if(newColors[key] == lineColors[j]) { found = true; break; }
        }
        if(!found) newColors[lineGraphCountries[i]] = lineColors[j];
      }
    }
  }

  assignedColors = newColors;
}
