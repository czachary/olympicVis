var mapDefaultFill = "#F5F5F5";
var mapBorderColor = "#DEDEDE";
var mapHighlightBorderColor = "#B7B7B7";

var world_map;

function initWorldMap() {

  world_map = new Datamap({
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
          updateLineGraphCountries(convertToOlympicCode(getCountry().id));
      });

      //Mouse Over
      //Cannot use the regular way of implementing mouseover since that would override the border automatic highlighting
      var mapContainer = d3.selectAll("#map_container");
      mapContainer.on('mouseover', function(info) {
        if (d3.event.target.tagName == "path") {
          d3.selectAll("g.medalcounts")
              .filter(function(d) { return convertCountryCode(d.Country) == getCountry().id; })
              .style("stroke-width", 2);
        }
      });

      //Mouse Out
      mapContainer.on('mouseout', function(info) {
        if (d3.event.target.tagName == "path") {
          d3.selectAll("g.medalcounts")
              .filter(function(d) { return convertCountryCode(d.Country) == getCountry().id; })
              .style("stroke-width", 0);
        }
      });
    }
  });
}

function updateMapContainer() {
  var data = datasets["curr"];

  var dataset = {};

  var minValue = d3.min(data, function(d) { return d.totalMedalCount; }),
      maxValue = d3.max(data, function(d) { return d.totalMedalCount; });

  var paletteScale = d3.scale.linear()
    .domain([minValue, maxValue])
    .range(["#f7fcb9", "#31a354"]); // green color

  data.forEach(function(d) {
    var value = d.totalMedalCount;
    dataset[convertCountryCode(d.Country)] = { numberOfThings: value, fillColor: paletteScale(value) };
  });

  world_map.updateChoropleth(dataset, {reset: true});
}

/**
 * Converts the olympic IOC country code to the ISO standard code that the datamap uses.
 * For some countries there is a mismatch, but for others the olympic country no longer exists.
 **/
function convertCountryCode(code) {
  switch (code) {
    case "ALG": return "DZA"; //algeria
    case "BAH": return "BHS"; //bahamas
    case "BAR": return "BRB"; //barbados
    case "BER": return "BMU"; //bermuda
    case "BUL": return "BGR"; //bulgaria
    case "CHI": return "CHL"; //chile
    case "CRO": return "HRV"; //croatia
    case "CRC": return "CRI"; //costa rica
    case "DEN": return "DNK"; //denmark
    case "GER": return "DEU"; //germany
    case "GRE": return "GRC"; //greece
    case "HAI": return "HTI"; //haiti
    case "INA": return "IDN"; //indonesia
    case "IRI": return "IRN"; //iran
    case "KUW": return "KWT"; //kuwait
    case "LAT": return "LVA"; //latvia
    case "LIB": return "LBN"; //lebanon
    case "MRI": return "MUS"; //mauritius
    case "MAS": return "MYS"; //malaysia
    case "MGL": return "MNG"; //mongolia
    case "NIG": return "NER"; //niger
    case "NGR": return "NGA"; //nigeria
    case "NED": return "NLD"; //netherlands
    case "PAR": return "PRY"; //paraguay
    case "PHI": return "PHL"; //philippines
    case "POR": return "PRT"; //portugal
    case "PUR": return "PRI"; //puerto rico
    case "KSA": return "SAU"; //saudi arabia
    case "SIN": return "SGP"; //singapore
    case "SLO": return "SVN"; //slovenia
    case "RSA": return "ZAF"; //south africa
    case "SRI": return "LKA"; //sri lanka
    case "SUD": return "SDN"; //sudan
    case "SUI": return "CHE"; //switzerland
    case "TPE": return "TWN"; //taiwan
    case "TAN": return "TZA"; //tanzania
    case "TOG": return "TGO"; //togo
    case "TGA": return "TON"; //tonga
    case "TRI": return "TTO"; //trinidad and tobago
    case "UAE": return "ARE"; //united arab emirates
    case "URU": return "URY"; //uruguay
    case "ISV": return "VIR"; //u.s. virgin islands
    case "VIE": return "VNM"; //vietnam
    case "ZAM": return "ZMB"; //zambia
    case "ZIM": return "ZWE"; //zimbabwe
    case "EUA": return "DEU"; //unified team of germany-> germany
    case "TCH": return "CZE"; //czechoslovakia -> czech republic
    case "BOH": return "CZE"; //bohemia -> czech republic
    case "ANZ": return "AUS"; //australasia -> australia
    case "URS": return "RUS"; //soviet union -> russia
    case "RU1": return "RUS"; //russian empire -> russia
    case "YUG": return "BIH"; //yugoslavia -> bosnia and herzegovina
    default: return code;
  }
}

/**
 * Finds the country name by converting the IOC country code to the ISO standard code.
 * Countries that no longer exist or are not on the map are manually coded.
 **/
function countryName(country) {
  switch (country) {
    case "ANZ": return "Australasia";
    case "TCH": return "Czechoslovakia";
    case "URS": return "Soviet Union";
    case "RU1": return "Russian Empire";
    case "YUG": return "Yugoslavia";
    case "SCG": return "Serbia and Montenegro";
    case "BOH": return "Bohemia";
    case "EUA": return "Unified Team of Germany";
    case "FRG": return "West Germany";
    case "GDR": return "East Germany";
    case "AHO": return "Netherlands Antilles";
    case "HKG": return "Hong Kong";
    case "ISV": return "U.S. Virgin Islands";
    case "IOP": return "Ind. Olympic Participants"
    case "EUN": return "Unified Team (USSR)";
    case "MRI": return "Mauritius";
    case "SIN": return "Singapore";
    case "BER": return "Bermuda";
    case "TGA": return "Tonga";
    case "BAR": return "Barbados";
    case "ZZX": return "Mixed Teams";
    case "BWI": return "West Indies Federation";
  }

  var countryCode = convertCountryCode(country);
  var names = [];
  var data = d3.selectAll(".datamaps-subunit")
    .filter(function(d) { return countryCode == d.id; })
    .each(function(d) { names.push(d.properties.name); })

  return names.length > 0 ? names[0] : country;
}




//converts the ISO standard code used by datamaps to the olympic IOC country code
//for use in line graph
function convertToOlympicCode(code) {
  switch (code) {
    case "DZA": return "ALG"; //algeria
    case "BHS": return "BAH"; //bahamas
    case "BRB": return "BAR"; //barbados
    case "BMU": return "BER"; //bermuda
    case "BGR": return "BUL"; //bulgaria
    case "CHL": return "CHI"; //chile
    case "HRV": return "CRO"; //croatia
    case "CRI": return "CRC"; //costa rica
    case "DNK": return "DEN"; //denmark
    case "DEU": return "GER"; //germany
    case "GRC": return "GRE"; //greece
    case "HTI": return "HAI"; //haiti
    case "IDN": return "INA"; //indonesia
    case "IRN": return "IRI"; //iran
    case "KWT": return "KUW"; //kuwait
    case "LVA": return "LAT"; //latvia
    case "LBN": return "LIB"; //lebanon
    case "MUS": return "MRI"; //mauritius
    case "MYS": return "MAS"; //malaysia
    case "MNG": return "MGL"; //mongolia
    case "NER": return "NIG"; //niger
    case "NGA": return "NGR"; //nigeria
    case "NLD": return "NED"; //netherlands
    case "PRY": return "PAR"; //paraguay
    case "PHL": return "PHI"; //philippines
    case "PRT": return "POR"; //portugal
    case "PRI": return "PUR"; //puerto rico
    case "SAU": return "KSA"; //saudi arabia
    case "SGP": return "SIN"; //singapore
    case "SVN": return "SLO"; //slovenia
    case "ZAF": return "RSA"; //south africa
    case "LKA": return "SRI"; //sri lanka
    case "SDN": return "SUD"; //sudan
    case "CHE": return "SUI"; //switzerland
    case "TWN": return "TPE"; //taiwan
    case "TZA": return "TAN"; //tanzania
    case "TGO": return "TOG"; //togo
    case "TON": return "TGA"; //tonga
    case "TTO": return "TRI"; //trinidad and tobago
    case "ARE": return "UAE"; //united arab emirates
    case "URY": return "URU"; //uruguay
    case "VIR": return "ISV"; //u.s. virgin islands
    case "VNM": return "VIE"; //vietnam
    case "ZMB": return "ZAM"; //zambia
    case "ZWE": return "ZIM"; //zimbabwe
    case "DEU": return "EUA"; //germany -> unified team of germany
    case "CZE": return "TCH"; //czech republic -> czechoslovakia
    //case "CZE": return "BOH"; //czech republic -> bohemia //TODO: fix CZE, DONE: check added in lineGraph redraw()
    case "AUS": return "ANZ"; //australia -> australasia
    case "RUS": return "URS"; //russia -> soviet union
    //case "RUS": return "RUS"; //russia -> russian empire //TODO: fix RUS, DONE: check added in lineGraph redraw()
    case "BIH": return "YUG"; //bosnia and herzegovina -> yugoslavia
    default: return code;
  }
}
