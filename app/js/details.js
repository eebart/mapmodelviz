var modelConfig = require('./config.js');
var charting = require('./charting.js');

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
};

var hideFeatureDetails = function() {
  $("[id=no-region-selected]").show();
  $("[id=region-selected]").hide();
};

var showFeatureDetails = function(feature) {
  $("[id=no-region-selected]").hide();

  $("[id=region-name]").html(feature.get('name'));
  $("[id=region-selected]").show();
};

module.exports = {
  loadDetails: loadDetails,
  hideFeatureDetails: hideFeatureDetails,
  showFeatureDetails: showFeatureDetails,
  showJsonLoaded: showJsonLoaded
}
