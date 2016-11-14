
var margin = {top: 55, right: 160, bottom: 35, left: 30};
var allData;
var year = 1896;
var stackedOrder = ["Gold", "Silver", "Bronze"];

var tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);



//*****GET DATA********//

d3.csv("OlympicData.csv", function (error, data) {

  allData = data;
  displayData(year);

});


//******YEAR CHANGE******//
function sliderChange(yearSelected) {
  year = yearSelected;
  displayData();
}


//*******DISPLAY******//

function displayData() {

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
    newEntry["Gold"] = goldCount;
    newEntry["Silver"] = silverCount;
    newEntry["Bronze"] = bronzeCount;
    newEntry["totalMedalCount"] = goldCount+silverCount+bronzeCount;
    countryMedalCounts.push(newEntry);
  }
  countryMedalCounts.sort(function(a,b) { return b.Gold - a.Gold;})

  stackedBarChart(countryMedalCounts);

}


function stackedBarChart(data) {

  d3.select("svg.stackedBar").remove();

  var numCountries = Object.keys(data).length;

  var width = 500, height = (numCountries*25);

  var barChart = d3.select('#stackedBar_container')
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

  var dataset = d3.layout.stack()([stackedOrder[0], stackedOrder[1], stackedOrder[2]].map(function(medals) {
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
    .rangeRoundBands([0, height], .1, 0);

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

  barChart.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0,-14)")
    .call(xAxis);


  // Create groups for each series, rects for each segment 
  var groups = barChart.selectAll("g.medalcounts")
    .data(dataset)
    .enter().append("g")
    .attr("class", "medalcounts")
    .style("fill", function(d, i) { return color(stackedOrder[i]); })
    .on('click', function(d,i) { updateStacked(i); });

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

function updateStacked(medalType) {
  var newType = stackedOrder[medalType];
  if(newType == "Gold") stackedOrder = ["Gold", "Silver", "Bronze"];
  else if (newType == "Silver") stackedOrder = ["Silver", "Gold", "Bronze"];
  else if (newType == "Bronze") stackedOrder = ["Bronze", "Gold", "Silver"];

  displayData();
}

function color(medalType) {
  if(medalType == "Gold") return "#f2b447";
  else if(medalType == "Silver") return "#A9A9A9";
  else if(medalType == "Bronze") return "#b33040"
}