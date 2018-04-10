var modelConfig =  {
  modelName: '',
  allowFileUpload: true,

  jsonData: [],

  activePolicy: null,
  activePolicyName: '',
  geoAreaId: '',
  geoTextProperty: '',
  mappedProperty: '',
  timeSeries: [],
  currentIndex: 0,

  choropleth: null,
  choroplethDetails: {
    min: -Infinity,
    max: Infinity
  },
  choroplethRanges: [],

  map: null
};

export default modelConfig;
