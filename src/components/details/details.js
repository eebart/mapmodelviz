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

  $("[id=region-name]").html(feature.properties.name);
  $("[id=region-selected]").show();

  showPrimaryChart(feature);
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
          new Chartist.Line('.ct-chart', data);
        }
      });
    }
  });
};
