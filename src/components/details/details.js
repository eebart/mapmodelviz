// var Chartist = require('chartist');
// require('chartist-plugin-tooltip');

var Chart = require('chart.js');

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

var getFormattedNumber = function(value) {
  if (value >= 1000000000000) {
    var rounded = (Math.round(value/1000000000000 * 100) / 100)
    return numberWithCommas(rounded) + 't';
  } else if (value >= 1000000000) {
    var rounded = (Math.round(value/1000000000 * 100) / 100)
    return numberWithCommas(rounded) + 'b';
  } else if (value >= 1000000) {
    var rounded = (Math.round(value/1000000 * 100) / 100)
    return numberWithCommas(rounded) + 'm';
  } else if (value >= 10) {
    var rounded = (Math.round(value * 100) / 100)
    return numberWithCommas(rounded);
  } else if (value >= 1) {
    var rounded = (Math.round(value * 1000) / 1000)
    return numberWithCommas(rounded);
  } else {
    var rounded = (Math.round(value) * 10000 / 10000)
    return numberWithCommas(rounded);
  }
}

var getOptions = function(title) {
  var options = {
    responsive: true,
    title: {
      display: true,
      text: title
    },
    legend: {
			labels: {
				usePointStyle: true
      }
    },
    tooltips: {
      mode: 'index',
      intersect: false,
      callbacks: {
          label: function(tooltipItem, data) {
              var label = data.datasets[tooltipItem.datasetIndex].label || '';

              if (label) {
                  label += ': ';
              }
              label += getFormattedNumber(tooltipItem.yLabel); //getFormattedNumber(tooltipItem.yLabel);
              return label;
          }
      }
    },
    hover: {
      mode: 'nearest',
      intersect: true
    },
    scales: {
      xAxes: [{
        display: true,
        scaleLabel: {
          display: false
        }
      }],
      yAxes: [{
        display: true,
        ticks: {
          // Include a dollar sign in the ticks
          callback: function(value, index, values) {
            return getFormattedNumber(value);
          }
        },
        scaleLabel: {
          display: false,
          labelString: ''
        }
      }]
    }
  };

  return options;
};
var getDataset = function(label, color, data) {
  return {
    label: label,
    backgroundColor: color,
    borderColor: color,
    pointRadius: 1,
    data: data,
    fill: false,
  };
}

var colors = ['rgb(215,2,6)','rgb(240,91,79)','rgb(244,198,61)','rgb(209,121,5)',
              'rgb(69,61,63)','rgb(89,146,43)','rgb(5,68,211)','rgb(107,3,146)',
              'rgb(221,164,88)','rgb(234,207,125)','rgb(134,121,125)','rgb(178,195,38)',
              'rgb(97,136,226)','rgb(167,72,202)'];

var primaryLineChart = null;
var secondaryCharts = [];

var showPrimaryChart = function(feature) {
  //First, find secondary datasets for display
  var secondary = [];
  config.jsonData.forEach(function(dataset) {
    if (dataset.displayStatus === 'secondary') {
      secondary.push(dataset);
    }
  });

  for (var i = 0; i < config.activePolicy.data.length; i++) {
    var dataset = config.activePolicy.data[i];
    if (dataset[config.geoAreaId] === undefined || feature.properties[config.geoAreaId] === undefined) {
      //Can't match data to the selected region. Don't display charts.
      showInvalidRegionID();
      return;
    }
    if (dataset[config.geoAreaId] === feature.properties[config.geoAreaId]) {
      var dataVals = [getDataset(config.activePolicy.name,colors[0],dataset[config.mappedProperty])];
      secondary.forEach(function(secondset, index) {
        if (secondset.data && secondset.data[i] && secondset.data[i][config.mappedProperty]) {
          var colorNum = (index+1) % colors.length;
          var dataset = getDataset(secondset.name, colors[colorNum], secondset.data[i][config.mappedProperty]);
          dataset.borderDash = [5,5];
          dataVals.push(dataset);
        }
      });
      if (dataVals[0] !== undefined ) {
        var data = {
          labels: config.timeSeries,
          datasets: dataVals
        };

        var ctx = $("#primary-chart");
        if (primaryLineChart) {
          primaryLineChart.destroy();
        }
        primaryLineChart = new Chart(ctx, {
          type: 'line',
          data: data,
          options: getOptions(config.mappedProperty)
        });
      }
      break;
    }
  }
};

var showSecondaryCharts = function(feature) {
  //First, find secondary datasets for display
  var secondary = [];
  config.jsonData.forEach(function(dataset) {
    if (dataset.displayStatus === 'secondary') {
      secondary.push(dataset);
    }
  });

  var series = [];
  var datas = [];
  var options = [];
  for (var i = 0; i < config.activePolicy.data.length; i++) {
    var dataset = config.activePolicy.data[i];
    if (dataset[config.geoAreaId] === undefined || feature.properties[config.geoAreaId] === undefined) {
      //Can't match data to the selected region. Don't display charts.
    } else {
      if (dataset[config.geoAreaId] === feature.properties[config.geoAreaId]) {
        for (var key in dataset) {
          if (key != config.mappedProperty && Array.isArray(dataset[key]) && dataset[key].length === config.timeSeries.length) {
            var startingColorIdx = Math.floor((Math.random() * colors.length));
            var dataVals = [getDataset(config.activePolicy.name,colors[startingColorIdx],dataset[key])];

            secondary.forEach(function(secondset, index) {
              if (secondset.data && secondset.data[i] && secondset.data[i][key]) {
                var colorNum = (index+startingColorIdx+1) % colors.length;
                var dataset = getDataset(secondset.name, colors[colorNum], secondset.data[i][key]);
                dataset.borderDash = [5,10];
                dataVals.push(dataset);
              }
            });

            var data = {
              labels: config.timeSeries,
              datasets: dataVals
            };
            datas.push(data);
            options.push(getOptions(key));
          }
        }
        break;
      }
    }
  }
  secondaryCharts.forEach(function(chart) {
    chart.destroy();
  });
  secondaryCharts = [];
  
  var charts = $('#secondary-charts');
  charts.html('');

  var i;
  for (i = 0; i < datas.length; i++) {
    var div = '<div class="col-lg-6 col-sm-12 secondary-chart">';
    // div += '<div class="chart-title-secondary"><div class="chart-title-content">' + datas[i].title + '</div></div>'
    div += '<canvas id="chart-' + i + '" class="secondary-chart" width="150" height="150"></canvas>';
    div += '</div>';
    charts.append(div);
  }

  // var maxHeight = 0;
  // $(".chart-title-secondary").each(function(){
  //    if ($(this).height() > maxHeight) { maxHeight = $(this).height(); }
  // });
  // $(".chart-title-secondary").height(maxHeight);

  for(i = 0; i < datas.length; i++) {
    var ctx = $('#chart-'+i);
    var newChart = new Chart(ctx, {
      type: 'line',
      data: datas[i],
      options: options[i]
    });
    secondaryCharts.push(newChart);
  }

};
