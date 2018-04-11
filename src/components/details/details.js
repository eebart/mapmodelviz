var Chartist = require('chartist');
require('chartist-plugin-tooltip');

import { numberWithCommas } from '../../util/util.js';


var detailshtml = require('./details.html');

export function loadDetails() {
  $("#details-content").html(detailshtml);
  $("[id=invalid-primary-key]").hide();
  $("[id=no-json-loaded]").show();
  $("[id=no-region-selected]").hide();
  $("[id=region-selected]").hide();
};

export function showJsonLoaded() {
  $("[id=invalid-primary-key]").hide();
  $("[id=no-region-selected]").show();
  $("[id=no-json-loaded]").hide();
  $("[id=region-selected]").hide();
};

export function hideFeatureDetails() {
  $("[id=invalid-primary-key]").hide();
  $("[id=no-region-selected]").show();
  $("[id=region-selected]").hide();
  $("[id=no-json-loaded]").hide();
};

function showInvalidRegionID() {
  $("[id=invalid-primary-key]").show();
  $("[id=no-region-selected]").hide();
  $("[id=region-selected]").hide();
  $("[id=no-json-loaded]").hide();
}

export function showFeatureDetails(feature) {
  $("[id=no-region-selected]").hide();
  $("[id=no-json-loaded]").hide();
  $("[id=invalid-primary-key]").hide();

  if (config.activePolicy.data === null) {
    showInvalidRegionID();
    return;
  }

  var selectedName = feature.properties[config.geoTextProperty];
  if (selectedName === undefined) {
    $("[id=region-name]").html('Unnamed');
  } else {
    $("[id=region-name]").html(selectedName);
  }

  $("[id=region-selected]").show();

  showPrimaryChart(feature);
  showSecondaryCharts(feature);
};


var plugins = [
  Chartist.plugins.tooltip({
      valueTransform: function (value) {
          return numberWithCommas(value);
      }
  })
]
var options = {
  // showPoint: false,
  axisX: {
    labelInterpolationFnc: function(value,  index) {
      var modVal = Math.floor(config.timeSeries.length / 10);
      return index % modVal === 0 ? value : null;
    }
  },
  // Y-Axis specific configuration
  axisY: {
    labelInterpolationFnc: function(value) {
      if (value > 1000000) {
        var rounded = (Math.round(value/1000000 * 100) / 100)
        return numberWithCommas(rounded) + 'm';
      }
      return numberWithCommas(value);
    }
  },
  plugins: plugins
};

var secondary = {
  showPoint: true,
  offset: 0,
  axisX: {
    showGrid: false,
    // showLabel: false,
    labelInterpolationFnc: function(value,  index) {
      if (index === 0 || index === (config.timeSeries.length - 1) || index === Math.round(config.timeSeries.length/2)) {
        return value;
      } else {
        return false;
      }
    }
  },
  // Y-Axis specific configuration
  axisY: {
    offset: 0,
    showLabel: false
  },
  plugins: plugins
};

var showPrimaryChart = function(feature) {
  for (var i = 0; i < config.activePolicy.data; i++) {
    var dataset = config.activePolicy.data[i];
    if (dataset[config.geoAreaId] === undefined || feature.properties[config.geoAreaId] === undefined) {
      //Can't match data to the selected region. Don't display charts.
      showInvalidRegionID();
      return;
    }
    if (dataset[config.geoAreaId] === feature.properties[config.geoAreaId]) {
      var dataVals = dataset[config.mappedProperty];
      if (dataVals !== undefined) {
        $("[id=mapped-property-name]").html(config.mappedProperty);
        var data = {
          labels: config.timeSeries,
          series:[
            dataVals
          ]
        };
        new Chartist.Line('#primary-chart', data, options);
      }
      break;
    }
  }
};

var colorLabels = ['b','c','d','e','f','g','h','i','j','k','l','m','n','o'];

var showSecondaryCharts = function(feature) {
  var series = []
  var datas = []
  config.activePolicy.data.forEach(function(dataset) {
    if (dataset[config.geoAreaId] === undefined || feature.properties[config.geoAreaId] === undefined) {
      //Can't match data to the selected region. Don't display charts.
    } else {
      if (dataset[config.geoAreaId] === feature.properties[config.geoAreaId]) {
        for (var key in dataset) {
          if (key != config.mappedProperty && Array.isArray(dataset[key]) && dataset[key].length === config.timeSeries.length) {
            // series.push(dataset[key])
            var data = {
              labels: config.timeSeries,
              series:[dataset[key]],
              title: key
            };
            datas.push(data);
          }
        }
      }
    }
  });

  var charts = $('#secondary-charts')
  charts.html('');

  var i;
  for (i = 0; i < datas.length; i++) {
    var colorNum = i % colorLabels.length;
    var div = '<div class="col-lg-6 col-sm-12 secondary-chart"><div>';
    div += '<div class="chart-title-secondary"><div class="chart-title-content">' + datas[i].title + '</div></div>'
    div += '<div id="chart-' + i + '" class="secondary-chart ct-chart ct-major-third ct-series-' + colorLabels[colorNum] + '"></div>';
    div += '</div></div>';
    charts.append(div);
  }

  var maxHeight = 0;
  $(".chart-title-secondary").each(function(){
     if ($(this).height() > maxHeight) { maxHeight = $(this).height(); }
  });
  $(".chart-title-secondary").height(maxHeight);

  for (i = 0; i < datas.length; i++) {
    new Chartist.Line('#chart-'+i, datas[i], secondary);
  }

};
