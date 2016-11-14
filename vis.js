
var margin = {top: 20, right: 160, bottom: 35, left: 30};
var allData;

var tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);



//*****GET DATA********//

d3.csv("OlympicData.csv", function (error, data) {

  allData = data;
  displayData(1896);

});


//******YEAR CHANGE******//
function sliderChange(year) {
  d3.select("svg.stackedBar").remove();
  displayData(year);
}


//*******DISPLAY******//

function displayData(year) {

  data = allData.filter(function(d) {
    if (d.Year == year) return true;
  })

  var countryMedalData = {};
  data.forEach(function(d) {
    if(d.NOC in countryMedalData) {
      countryMedalData[d.NOC].push(d.Medal);
    } else {
      countryMedalData[d.NOC] = [d.Medal];
    }
  })


  //*******GET ALL COUNTRY MEDAL COUNTS
  var countryMedalCounts = [];
  for (var key in countryMedalData) {
    var goldCount = 0, silverCount = 0, bronzeCount = 0;
    for (var i = 0; i<countryMedalData[key].length;i++) {
      if(countryMedalData[key][i] == "Gold") goldCount++;
      else if(countryMedalData[key][i] == "Silver") silverCount++;
      else if(countryMedalData[key][i] == "Bronze") bronzeCount++;
    }

    var newEntry = {};
    newEntry["Country"] = key;
    newEntry["GoldCount"] = goldCount;
    newEntry["SilverCount"] = silverCount;
    newEntry["BronzeCount"] = bronzeCount;
    newEntry["totalMedalCount"] = goldCount+silverCount+bronzeCount;
    countryMedalCounts.push(newEntry);
  }

  stackedBarChart(countryMedalCounts);

}


function stackedBarChart(data) {

  //TODO: sort by gold, silver, or bronze on click
  data.sort(function(a,b) { return b.GoldCount - a.GoldCount;})
  var numCountries = Object.keys(data).length;

  var width = 500 - margin.left - margin.right,
      height = (numCountries*25) - margin.top - margin.bottom;

  var barChart = d3.select('#svg_container')
    .append("svg")
    .attr("class", "stackedBar")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var dataset = d3.layout.stack()(["GoldCount", "SilverCount", "BronzeCount"].map(function(medals) {
    return data.map(function(d) {
      return {x: d.Country, y: +d[medals]};
    });
  }));
  var dataset = dataset.map(function (group) {
    return group.map(function (d) {
        // Invert the x and y values, and y0 becomes x0
        return {
            x: d.y,
            y: d.x,
            x0: d.y0
        };
    });
  })

  // Set x, y and colors
  var x = d3.scale.linear()
    .domain([0, d3.max(dataset, function(d) {  return d3.max(d, function(d) { return d.x0 + d.x; });  })])
    .range([0,width]);

  var y = d3.scale.ordinal()
    .domain(dataset[0].map(function(d) { return d.y; }))
    .rangeRoundBands([10, height-10], .1);

  var colors = ["#f2b447", "#A9A9A9", "b33040"]; //gold, silver, bronze

  // Define and draw axes
  var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .tickSize(-width, 0, 0);

  var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom")
    .tickSize(-height, 0, 0);

  barChart.append("g")
    .attr("class", "y axis")
    .call(yAxis);


  // Create groups for each series, rects for each segment 
  var groups = barChart.selectAll("g.medalcounts")
    .data(dataset)
    .enter().append("g")
    .attr("class", "medalcounts")
    .style("fill", function(d, i) { return colors[i]; });

  var rect = groups.selectAll("rect")
    .data(function(d) { return d; })
    .enter()
    .append("rect")
    .attr("x", function(d) { return x(d.x0); })
    .attr("y", function(d) { return y(d.y); })
    .attr("height", function(d) { return y.rangeBand(); })
    .attr("width", function(d) { return x(d.x0+d.x) - x(d.x0); })
    .on("mouseover", function(d) { 
      tooltip.transition()
        .duration(200)
        .style("opacity", 0.75);
    })
    .on("mouseout", function() {
      tooltip.transition()
          .duration(200)
          .style("opacity", 0);
    })
    .on("mousemove", function(d) {
      tooltip.html(d.x)
        .style("left", (d3.event.pageX-10) + "px")
        .style("top", (d3.event.pageY-30) + "px");
    });

}