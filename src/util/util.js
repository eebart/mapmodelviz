export function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255};
};

export function findChoroplethMinMax() {
  var min = Infinity;
  var max = -Infinity;

  var currIdx = config.timeSeries.indexOf(config.currentIndex);

  config.jsonData.forEach(function(policy) {
    if (policy.name === config.selectedPolicy) {
      for (var key in policy.data) {
        var theNum = parseFloat(policy.data[key][config.mappedProperty][currIdx]);
        if (isNaN(theNum)) {
          debugger;
        }
        if (theNum < min) {
          min = theNum;
        }
        if (theNum > max) {
          max = theNum;
        }
      }
    }
  });
  config.choroplethDetails.min = min;
  config.choroplethDetails.max = max;
}

export function setChoroplethBuckets() {
  if (config.choropleth !== null) {
    var numColors = config.choropleth.length;
    var range = config.choroplethDetails.max - config.choroplethDetails.min;
    var intervalSize = (range+0.0)/(numColors);
    var currIdx = config.timeSeries.indexOf(config.currentIndex);

    config.choroplethRanges = [];
    for (var i = 0; i < numColors; i++) {
      config.choroplethRanges[i] = config.choroplethDetails.min + intervalSize*i;
    }
    config.choroplethRanges[i] = config.choroplethDetails.max;

    config.jsonData.forEach(function(policy) {
      if (policy.name === config.selectedPolicy) {
        for (var key in policy.data) {
          var choroplethNum = numColors - 1;
          var value = policy.data[key][config.mappedProperty][currIdx];
          if (value !== config.choroplethDetails.max) {
            choroplethNum = Math.floor((value - config.choroplethDetails.min)/intervalSize);
          }
          policy.data[key]['choroplethNum'] = choroplethNum;
        }
      }
    });
  } else {
    config.choroplethDetails = {
      min: -Infinity,
      max: Infinity
    };
    config.choroplethRanges = [];
  }
};
