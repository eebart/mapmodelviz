export function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255};
};

export const numberWithCommas = (x) => {
  var parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

export function findChoroplethMinMax() {
  var min = Infinity;
  var max = -Infinity;

  if (config.activePolicy === null) {
    config.choroplethDetails = {
      min: -Infinity,
      max: Infinity
    };
    return;
  }

  var currIdx = config.timeSeries.indexOf(config.currentIndex);
  for (var key in config.activePolicy.data) {
    var theNum = parseFloat(config.activePolicy.data[key][config.mappedProperty][currIdx]);
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
    for (var key in config.activePolicy.data) {
      var choroplethNum = numColors - 1;
      var value = parseFloat(config.activePolicy.data[key][config.mappedProperty][currIdx]);
      if (value < config.choroplethDetails.max) {
        choroplethNum = Math.floor((value - config.choroplethDetails.min)/intervalSize);
      }
      config.activePolicy.data[key]['choroplethNum'] = choroplethNum;
    }
  } else {
    config.choroplethDetails = {
      min: -Infinity,
      max: Infinity
    };
    config.choroplethRanges = [];
  }
};
