//globals: $, jQuery and Tether, see config

// import 'bootstrap';
// adds all custom Bootstrap jQuery plugins
// see all plugins here: http://getbootstrap.com/javascript/

import 'bootstrap';

var modelConfig = require('./js/config.js');
var mapping = require('./js/map.js');
var util = require('./js/util.js');
var settings = require('./js/settings.js');
var details = require('./js/details.js')

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

  util.buildChoroplethLegend(modelConfig);

  //TODO remove this loading to support dynamic data.
  var jsonFileName = 'dummydata.json';
  $.getJSON(jsonFileName, function(json) {
    modelConfig.jsonData.push({
      name: 'Policy A',
      data: json,
      file: {
        name: jsonFileName
      },
      geoAreaId: 'regioFacetId',
      mappedProperty: 'value'
    });
    mapping.setNewActivePolicy('Policy A');
  })
  .done(function() {
    mapping.updateMapData();
  })
  .fail(function(err) {
    console.error( "error loading model data: " + err );
  })

  settings.loadSettings();
  details.loadDetails();
});
