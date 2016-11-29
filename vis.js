
var margin = {top: 55, right: 160, bottom: 35, left: 140};
var year = 1896;
var init_order = ["Gold", "Silver", "Bronze"];
var stack_order = init_order.slice();

var width, height;
var barChart, lineGraph;
var x_scale, y_scale, xAxis, yAxis;

var barMoveDuration = 800;

var tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

var datasets = {}


//*****INITIALIZE DISPLAY & GET DATA********//

function init() {
  initStackedBarChart();
  initWorldMap();

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
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  d3.select("svg.stackedBar")
    .append("text")
    .attr("x", (width / 2))
    .attr("y", margin.top-18)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .text("Total Medal Count by Country")

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

//******YEAR CHANGE******//
function sliderChange(yearSelected) {
  year = yearSelected;
  prepareAndFilterData();
  stackedBarChart(barMoveDuration);
  updateMapContainer();
}

//*******PREPARE DATA**********/
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

function updateLineGraph() {

  var countryMedals = datasets["countries"]["USA"]  //TODO: default to top medal earner of year, allow country selection

  var medalsOverTime = [];
  for(i=0; i<5; i++) //TODO: define which years we actually want, instead of curr + next 4
  {
    medalsOverTime[i] = {};
    medalsOverTime[i]["year"] = year+(i*4);
    medalsOverTime[i]["count"] = 0;
    countryMedals.forEach(function(d) {
      if (d.Year == year+(i*4)) medalsOverTime[i]["count"]++;
    })
  }

  console.log(medalsOverTime);


  var x = d3.scale.ordinal().rangeRoundBands([0, width], .5, 0);//.range([0, width]);
  var y = d3.scale.linear().range([height, 0]);

  // Define the axes
  var xAxis = d3.svg.axis().scale(x)
      .orient("bottom");

  var yAxis = d3.svg.axis().scale(y)
      .orient("left");

  // Define the line
  var valueline = d3.svg.line()
      .x(function(d) { return x(d.year); })
      .y(function(d) { return y(d.count); });
      

  var lineGraphWidth = 500, lineGraphHeight = 500;

  lineGraph = d3.select('#linegraph_container')
    .append("svg")
      .attr("class", "linegraph")
      .attr("width", lineGraphWidth + margin.left + margin.right)
      .attr("height", lineGraphHeight + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  d3.select("svg.linegraph")
    .append("text")
    .attr("x", (width / 2))
    .attr("y", margin.top-18)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .text("Medal Count Over Time: COUNTRY NAME") //TODO

  x.domain(medalsOverTime.map(function(d) { return d.year; }));
  y.domain([0, d3.max(medalsOverTime, function(d) { return d.count; })]);

  // Add the valueline path
  lineGraph.append("path")
      .attr("class", "line")
      .attr("d", valueline(medalsOverTime));

  // Add the X Axis
  lineGraph.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  // Add the Y Axis
  lineGraph.append("g")
      .attr("class", "y axis")
      .call(yAxis);

}
