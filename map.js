var mapDefaultFill = "#F5F5F5";
var mapBorderColor = "#DEDEDE";
var mapHighlightBorderColor = "#B7B7B7";

var world_map = new Datamap({
    element: document.getElementById("map_container"),
    height: 400,
    width: 600,
    projection: 'mercator',
    fills: {
      defaultFill: mapDefaultFill,
    },
    data: {},
    geographyConfig: {
      borderColor: mapBorderColor,
      highlightBorderWidth: 2,
      highlightFillColor: function(geo) {
          //don't change color on mouse hover
          return geo['fillColor'] || mapDefaultFill;
      },
      highlightBorderColor: mapHighlightBorderColor,
      popupTemplate: function(geo, d) {
          //Don't show tooltip if country doesn't have medal count
          if (!d.numberOfThings) { return ; }
          return ['<div class="hoverinfo">',
              '<strong>', geo.properties.name, '</strong>',
              '<br>Count: <strong>', d.numberOfThings, '</strong>',
              '</div>'].join('');
      }
    },
    done: function(datamap) {
      var getCountry = function() { return d3.select(d3.event.target).data()[0]; };

      //Zooming
      datamap.svg.call(d3.behavior.zoom().on("zoom", function() {
        datamap.svg.selectAll("g").attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
      }));

      //Clicking
      datamap.svg.selectAll(".datamaps-subunit").on('click', function(geo) {
          console.log(geo.properties.name + " was clicked");
      });

      //Mouse Over
      //Cannot 
      var mapContainer = d3.selectAll("#map_container");
      mapContainer.on('mouseover', function(info) {
        if (d3.event.target.tagName == "path") {
          d3.selectAll("rect")
              .filter(function(d) { return d.y == getCountry().id; })
              .style("stroke-width", 2);
        }
      });

      //Mouse Out
      mapContainer.on('mouseout', function(info) {
        if (d3.event.target.tagName == "path") {
          d3.selectAll("rect")
              .filter(function(d) { return d.y == getCountry().id; })
              .style("stroke-width", 0);
        }
      });
    }
  });

function updateMapContainer(data) {
  var dataset = {};

  var minValue = d3.min(data, function(d) { return d.totalMedalCount; }),
      maxValue = d3.max(data, function(d) { return d.totalMedalCount; });

  var paletteScale = d3.scale.linear()
    .domain([minValue, maxValue])
    .range(["#f7fcb9", "#31a354"]); // green color

  data.forEach(function(d) {
    var value = d.totalMedalCount;
    dataset[d.Country] = { numberOfThings: value, fillColor: paletteScale(value) };
  });

  world_map.updateChoropleth(dataset, {reset: true});
}
