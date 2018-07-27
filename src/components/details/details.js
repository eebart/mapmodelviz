// var Chartist = require('chartist');
// require('chartist-plugin-tooltip');

var Chart = require('chart.js');
var JSZip = require("jszip");

import {saveAs} from 'file-saver';
import { numberWithCommas } from '../../util/util.js';

var detailshtml = require('./details.html');
var detailsModal = require('./detailsModal.html');

var selectedFeature = null;

export function loadDetails() {
  $("#details-content").html(detailshtml);
  $("#details-popup").html(detailsModal);
  $("[id=invalid-primary-key]").hide();
  $("[id=no-json-loaded]").show();
  $("[id=no-region-selected]").hide();
  $("[id=region-selected]").hide();

  $('#details-modal').on('show.bs.modal', function (e) {
    //Setup Editing Details modal
    buildDetailsModal();
  });

  $('#print-model-details').click(function() {
    saveChartsToDisk();
  })

  $("[id=details-display-save]").click(function() {
    updateDetailsDisplay();
  });
};

export function showJsonLoaded() {
  $("[id=invalid-primary-key]").hide();
  $("[id=no-region-selected]").show();
  $("[id=no-json-loaded]").hide();
  $("[id=region-selected]").hide();
};

function showInvalidRegionID() {
  $("[id=invalid-primary-key]").show();
  $("[id=no-region-selected]").hide();
  $("[id=region-selected]").hide();
  $("[id=no-json-loaded]").hide();
}

export function showFeatureDetails(feature) {
  selectedFeature = feature;

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

  setupDetailsDisplay();
  displayCharts();
};
export function hideFeatureDetails() {
  $("[id=invalid-primary-key]").hide();
  $("[id=no-region-selected]").show();
  $("[id=region-selected]").hide();
  $("[id=no-json-loaded]").hide();

  selectedFeature = null;
};
export function updateFeatureDetails() {
  if (selectedFeature) {
    displayCharts();
  }
};

//----------------------------
// Details Modal
//----------------------------
function setupDetailsDisplay() {
  if(config.activePolicy.detailsDisplay == null) {
    config.activePolicy.detailsDisplay = {};

    for (var i = 0; i < config.activePolicy.data.length; i++) {
      var dataset = config.activePolicy.data[i];
      if (dataset[config.geoAreaId] === undefined || selectedFeature.properties[config.geoAreaId] === undefined) {
        //Can't match data to the selected region. Don't display.
      } else if (dataset[config.geoAreaId] === selectedFeature.properties[config.geoAreaId]) {
        var count = 0;
        for (var key in dataset) {
          if (!(Array.isArray(dataset[key]) && dataset[key].length === config.timeSeries.length)) {
            //the dataset is bad. Continue.
            continue;
          }
          //not predefined, so build the detials display first.
          if(key === config.mappedProperty) {
            config.activePolicy.detailsDisplay[key] = {'key': key, 'index': count, 'value': 'primary'};
          } else {
            config.activePolicy.detailsDisplay[key] = {'key': key, 'index': count, 'value': 'secondary'};
          }
          count++;
        }
        break; // Found the right entry. No need to check more.
      }
    }
  }
}

function buildDetailsModal() {
  $("#details-display-form").html('');
  for (var key in config.activePolicy.detailsDisplay) {
    var rowHtml = buildRow(config.activePolicy.detailsDisplay[key]);
    $("#details-display-form").append(rowHtml);
  }
};
var buildRow = function(property) {
  var divContent = '<div class="row form-group">';
  divContent += '<div class="col-sm-6" >' + property['key'] + '</div>';
  divContent += '<div class="col-sm-6" >' + displayButtons(property) + '</div>';
  divContent += '</div>';
  return divContent;
};
var displayButtons = function(property) {
  var div = '<div id="' + property['index'] + '_details_display" class="btn-group btn-group-toggle" data-toggle="buttons" style="width:100%;">';

  if (property['value'] === 'primary') {
    div += buildButton(property['index'],'Primary','active','');
    div += buildButton(property['index'],'Secondary','','');
    div += buildButton(property['index'],'Off','','');
  } else if (property['value'] === 'secondary') {
    div += buildButton(property['index'],'Primary','','');
    div += buildButton(property['index'],'Secondary','active','');
    div += buildButton(property['index'],'Off','','');
  } else {
    div += buildButton(property['index'],'Primary','','');
    div += buildButton(property['index'],'Secondary','','');
    div += buildButton(property['index'],'Off','active','');
  }
  div += '</div>'

  return div;
}
var buildButton = function(index, displayType, activeClass, disabledClass) {
  var checked = '';
  if (activeClass) {
    checked = 'checked';
  }
  var div = '<label id="' + index + '_details_display_' + displayType.toLowerCase() + '_label" class="btn btn-secondary btn-sm ' + activeClass + ' ' + disabledClass + '">';
  div +=      '<input type="radio" name="options" id="' + index + '_details_display_' + displayType.toLowerCase() + '" value="' + displayType.toLowerCase() + '" autocomplete="off" ' + checked + '> ' + displayType;
  div +=    '</label>';
  return div;
}

function updateDetailsDisplay() {
  $("[id=region-selected]").show();
  $("[id=no-charts-to-chart]").hide();

  for (var key in config.activePolicy.detailsDisplay) {
    var chart = config.activePolicy.detailsDisplay[key];
    var id = '#' + config.activePolicy.detailsDisplay[key]['index'] + '_details_display';
    var active = $(id + ' label.active input');
    var setting = $(id + ' label.active input').val();
    config.activePolicy.detailsDisplay[key]['value'] = setting;
  }
  displayCharts();
};

//----------------------------
// Charting
//----------------------------
var displayCharts = function() {
  var primary = {};
  var secondary = {};
  var charted = false;
  for (var key in config.activePolicy.detailsDisplay) {
    if (config.activePolicy.detailsDisplay[key]['value'] == 'primary') {
      charted = true;
      primary[key] = config.activePolicy.detailsDisplay[key];
    } else if (config.activePolicy.detailsDisplay[key]['value'] == 'secondary') {
      charted = true;
      secondary[key] = config.activePolicy.detailsDisplay[key];;
    }
  }

  if (charted) {
    $("[id=the-detail-charts]").show();
    $("[id=no-charts-to-chart]").hide();
  } else {
    $("[id=the-detail-charts]").hide();
    $("[id=no-charts-to-chart]").show();
  }
  showPrimaryChart(primary);
  showSecondaryCharts(secondary);
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

var getOptions = function(title, displayLegend, scaleType) {
  var options = {
    responsive: true,
    maintainAspectRatio: false,
    title: {
      display: true,
      text: title
    },
    legend: {
			labels: {
				usePointStyle: true
      },
      display: displayLegend
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
        type: scaleType,
        ticks: {
          autoSkip: true,
          callback: function(value, index, values) {
            if (scaleType == "logarithmic" && values.length > 5 ) {
              if (index == 0 || index == values.length - 1 || index == Math.round(values.length/4) || index == Math.round(values.length/4 * 3)) {
                return getFormattedNumber(value);
              } else {
                return '';
              }
            //   console.log("long values length, checking things", title, index);
            //   console.log(values.length, values)
            //   if (index % 2 == 0) {
            //     console.log("printing formatted")
            //     return "";
            //   } else {
            //     console.log("printing blank");
            //     return '';
            //   }
            } else {
              return getFormattedNumber(value);
            }
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

var primaryCharts = [];
var secondaryCharts = [];

var showPrimaryChart = function(primary) {
  var chartdata = buildChartData(primary, primaryCharts);

  var chartdiv = $('#primary-charts');
  cleanCharts(primaryCharts, chartdiv)
  for (var i = 0; i < chartdata.datas.length; i++) {
    var div = '<div class="col-12 primary-chart">';
    div += '<canvas id="primary-chart-' + i + '" class="" style="width:400px; height:300px;"></canvas>'
    div += '</div>'
    chartdiv.append(div);
  }

  primaryCharts = buildCharts('primary', chartdata);
};
var showSecondaryCharts = function(secondary) {
  var chartdata = buildChartData(secondary, secondaryCharts);

  var chartdiv = $('#secondary-charts');
  cleanCharts(secondaryCharts, chartdiv)
  for (var i = 0; i < chartdata.datas.length; i++) {
    var div = '<div class="col-lg-6 col-sm-12 secondary-chart">';
    div += '<canvas id="secondary-chart-' + i + '" class="secondary-chart" width="150" height="200"></canvas>';
    div += '</div>';
    chartdiv.append(div);
  }

  secondaryCharts = buildCharts('secondary', chartdata);
};
var buildChartData = function(properties) {
  //First, find secondary datasets for display
  var secondaryDatasets = [];
  config.jsonData.forEach(function(dataset) {
    if (dataset.displayStatus === 'secondary') {
      secondaryDatasets.push(dataset);
    }
  });

  var datas = [];
  var options = [];
  for (var i = 0; i < config.activePolicy.data.length; i++) {
    var dataset = config.activePolicy.data[i];
    if (dataset[config.geoAreaId] === undefined || selectedFeature.properties[config.geoAreaId] === undefined) {
      //Can't match data to the selected region. Don't display charts.
    } else {
      if (dataset[config.geoAreaId] === selectedFeature.properties[config.geoAreaId]) {
        for (var key in dataset) {
          if (key in properties && Array.isArray(dataset[key]) && dataset[key].length === config.timeSeries.length) {
            var startingColorIdx = Math.floor((Math.random() * colors.length));
            var dataVals = [getDataset(config.activePolicy.name,colors[startingColorIdx],dataset[key])];

            secondaryDatasets.forEach(function(secondset, index) {
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
            var showLegend = secondaryDatasets.length > 0;
            options.push(getOptions(key, showLegend, config.activePolicy.scale));
          }
        }
        break;
      }
    }
  }
  return {'datas':datas, 'options':options};
}
var cleanCharts = function(charts, chartdiv) {
  charts.forEach(function(chart) {
    chart.destroy();
  });
  charts = [];
  chartdiv.html('');
};
var buildCharts = function(type, chartdata) {
  var savedCharts = [];
  for(var i = 0; i < chartdata.datas.length; i++) {
    var ctx = $('#' + type + '-chart-'+i);
    var newChart = new Chart(ctx, {
      type: 'line',
      data: chartdata.datas[i],
      options: chartdata.options[i]
    });
    savedCharts.push(newChart);
  }
  return savedCharts;
}

function callback(title, blob) {
  var filename = title + '.png';
  saveAs(blob, filename);
};
var saveChartsToDisk = function() {
  var toSave = [];
  for(var i = 0; i < primaryCharts.length; i++) {
    var chart = primaryCharts[i];
    var name = 'primary_' + chart.options.title.text.replace(' ','') + '.png';
    toSave.push({'filename': name, 'imgUrl': chart.canvas.toDataURL()});
  }
  for(var j = 0; j < secondaryCharts.length; j++) {
    var chart = secondaryCharts[j];
    var name = 'secondary_' + chart.options.title.text.replace(' ','') + '.png';
    toSave.push({'filename': name, 'imgUrl': chart.canvas.toDataURL()});
  }

  var zip = new JSZip();
  for(var k = 0; k < toSave.length; k++) {
    zip.file(toSave[k]['filename'], toSave[k]['imgUrl'].split('base64,')[1], {base64: true});
  }
  zip.generateAsync({type:"blob"}).then(function(content) {
      saveAs(content, "mapmodelviz_" + selectedFeature.properties[config.geoTextProperty] + "_charts.zip");
  });
};
