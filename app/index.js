//globals: $, jQuery and Tether, see config

import 'bootstrap';
// adds all custom Bootstrap jQuery plugins
// see all plugins here: http://getbootstrap.com/javascript/

var modelConfig = require('./js/config.js');
var mapping = require('./js/map.js');
var util = require('./js/util.js');

document.addEventListener('DOMContentLoaded', () => {
  // do your setup here
  modelConfig.map = new ol.Map({
    target : 'map',
    layers : [
      new ol.layer.Tile({
        source: new ol.source.XYZ({
          attributions: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'
        })
      })
    ],
    options: {
      numZoomLevels: 15
    },
    view :
      new ol.View({center : ol.proj.fromLonLat([ 0,0 ]), zoom : 7})
  });

  $("[id=no-json-loaded]").show();
  $("[id=no-region-selected]").hide();
  $("[id=region-selected]").hide();

  util.buildChoroplethLegend(modelConfig);

  $.getJSON(modelConfig.jsonFileName, function(json) {
    modelConfig.jsonData = json;
  })
  .done(function() {
    util.findChoroplethMinMax(modelConfig);
    util.setChoroplethBuckets(modelConfig);
    util.buildChoroplethLegend(modelConfig);

    mapping.addGeoJSONLayer();
  })
  .fail(function(err) {
    console.error( "error loading model data: " + err );
  })

  $("[id=model-name]").html(modelConfig.modelName);

});
