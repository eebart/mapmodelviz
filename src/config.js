
var modelConfig =  {
  modelName: '',

  allowFileUpload: true,

  choropleth: null,
  choroplethDetails: {
    min: -Infinity,
    max: Infinity
  },
  choroplethRanges: [],
  currentIndex: 0,

  geoJson: {
    file: {},
    text: 'name'
  },
  jsonData: [],
  timeSeries: [],
  
  selectedPolicy: '',
  geoAreaId: '',
  mappedProperty: '',

  map: null
};

export default modelConfig;
