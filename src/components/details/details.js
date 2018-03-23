var Chartist = require('chartist');

var detailshtml = require('./details.html');

export function loadDetails() {
  $("#details-content").html(detailshtml);
  $("[id=no-json-loaded]").show();
  $("[id=no-region-selected]").hide();
  $("[id=region-selected]").hide();
};

export function showJsonLoaded() {
  $("[id=no-region-selected]").show();
  $("[id=no-json-loaded]").hide();
  $("[id=region-selected]").hide();
};

export function hideFeatureDetails() {
  $("[id=no-region-selected]").show();
  $("[id=region-selected]").hide();
  $("[id=no-json-loaded]").hide();
};

export function showFeatureDetails(feature) {
  $("[id=no-region-selected]").hide();
  $("[id=no-json-loaded]").hide();

  $("[id=region-name]").html(feature.properties[config.geoJson.text]);
  $("[id=mapped-property-name]").html(config.mappedProperty);

  $("[id=region-selected]").show();

  showPrimaryChart(feature);
  showSecondaryChart(feature);
};

var options = {
  // Don't draw the line chart points
  showPoint: false,
  // Disable line smoothing
  // lineSmooth: false,
  // X-Axis specific configuration
  axisX: {
    // We can disable the grid for this axis
    // showGrid: false,
    // and also don't show the label
    // showLabel: false
    labelInterpolationFnc: function(value,  index) {
      var modVal = Math.floor(config.timeSeries.length / 10);
      return index % modVal === 0 ? value : null;
    }
  },
  // Y-Axis specific configuration
  axisY: {
    // Lets offset the chart a bit from the labels
    // offset: 60,
    // The label interpolation function enables you to modify the values
    // used for the labels on each axis. Here we are converting the
    // values into million pound.
    labelInterpolationFnc: function(value) {
      if (value > 1000000) {
        var rounded = (Math.round(value/100000 * 100) / 100)
        return numberWithCommas(rounded) + 'm';
      }
      return numberWithCommas(value);
    }
  }
};

var showPrimaryChart = function(feature) {
  config.jsonData.forEach(function(policy) {
    if (policy.name === config.selectedPolicy) {
      policy.data.forEach(function(dataset) {
        if (dataset[config.geoAreaId] == feature.properties[config.geoAreaId]) {
          var dataVals = dataset[config.mappedProperty];
          var data = {
            labels: config.timeSeries,
            series:[
              dataVals
            ]
          };
          new Chartist.Line('#primary-chart', data, options);
        }
      });
    }
  });
};

var showSecondaryCharts = function(feature) {
  var series = []
  var datas = []
  config.jsonData.forEach(function(policy) {
    if (policy.name === config.selectedPolicy) {
      policy.data.forEach(function(dataset) {
        if (dataset[config.geoAreaId] === feature.properties[config.geoAreaId]) {
          for (var key in dataset) {
            if (key != config.mappedProperty && Array.isArray(dataset[key]) && dataset[key].length === config.timeSeries.length) {
              series.push(dataset[key])
              var data = {
                labels: config.timeSeries,
                series:[dataset[key]],
                title: key
              };
              datas.push(data);
            }
          }
        }
      });
    }
  });

  for(var chart in datas) {
    new Chartist.Line('#secondary-chart', data, options);
    break;
  }
};


const numberWithCommas = (x) => {
  var parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}
