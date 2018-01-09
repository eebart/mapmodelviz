const colors = require('./colors.js');

var modelConfig =  {
  modelName: 'Model Name Here',

  geoJson: 'provinces.geojson',

  choropleth: colors.GnBu[5],
  choroplethDetails: {
    min: -Infinity,
    max: Infinity
  },
  choroplethRanges: [],

  jsonFileName: 'dummydata.json',
  jsonData: null,
  geoAreaId: 'regioFacetId',
  mappedProperty: 'value',

  map: null
};

module.exports = modelConfig;
