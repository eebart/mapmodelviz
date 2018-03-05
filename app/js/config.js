const colors = require('./colors.js');

var modelConfig =  {
  modelName: '',


  choropleth: colors.GnBu[5],
  choroplethDetails: {
    min: -Infinity,
    max: Infinity
  },
  choroplethRanges: [],

  geoJsonFile: {
    name: 'provinces.geojson'
  },
  jsonData: [],
  selectedPolicy: '',
  geoAreaId: '',
  mappedProperty: '',

  map: null
};

module.exports = modelConfig;
