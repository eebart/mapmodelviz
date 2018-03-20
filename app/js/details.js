var modelConfig = require('../config.js');

var loadDetails = function() {
  $("#details-content").load("details.html", function() {
    $("[id=no-json-loaded]").show();
    $("[id=no-region-selected]").hide();
    $("[id=region-selected]").hide();
  });
};

var showJsonLoaded = function() {
  $("[id=no-region-selected]").show();
  $("[id=no-json-loaded]").hide();
  $("[id=region-selected]").hide();
};

var hideFeatureDetails = function() {
  $("[id=no-region-selected]").show();
  $("[id=region-selected]").hide();
  $("[id=no-json-loaded]").hide();
};

var showFeatureDetails = function(feature) {
  $("[id=no-region-selected]").hide();
  $("[id=no-json-loaded]").hide();

  $("[id=region-name]").html(feature.get('name'));
  $("[id=region-selected]").show();

  showPrimaryChart(feature);
};

var showPrimaryChart = function(feature) {
  modelConfig.jsonData.forEach(function(policy) {
    if (policy.name === modelConfig.selectedPolicy) {
      policy.data.forEach(function(dataset) {
        if (dataset[modelConfig.geoAreaId] == feature.get(modelConfig.geoAreaId)) {
          var dataVals = dataset[modelConfig.mappedProperty];
          var data = {
            labels: modelConfig.timeSeries,
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

module.exports = {
  loadDetails: loadDetails,
  hideFeatureDetails: hideFeatureDetails,
  showFeatureDetails: showFeatureDetails,
  showJsonLoaded: showJsonLoaded
}
