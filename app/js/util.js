var hexToRgb = function(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
};

var findChoroplethMinMax = function(modelConfig) {
  var min = Infinity;
  var max = -Infinity;
  for (var key in modelConfig.jsonData) {
    if (modelConfig.jsonData[key][modelConfig.mappedProperty] < min) {
      min = modelConfig.jsonData[key][modelConfig.mappedProperty];
    }
    if (modelConfig.jsonData[key][modelConfig.mappedProperty] > max) {
      max = modelConfig.jsonData[key][modelConfig.mappedProperty];
    }
  }

  modelConfig.choroplethDetails.min = min;
  modelConfig.choroplethDetails.max = max;
}

var setChoroplethBuckets = function(modelConfig) {
  var numColors = modelConfig.choropleth.length;
  var range = modelConfig.choroplethDetails.max - modelConfig.choroplethDetails.min;
  var intervalSize = (range+0.0)/(numColors);

  modelConfig.choroplethRanges = [];
  for (var i = 0; i < numColors; i++) {
    modelConfig.choroplethRanges[i] = modelConfig.choroplethDetails.min + intervalSize*i;
  }
  modelConfig.choroplethRanges[i] = modelConfig.choroplethDetails.max;

  for (var key in modelConfig.jsonData) {
    var choroplethNum = numColors - 1;
    var value = modelConfig.jsonData[key][modelConfig.mappedProperty];
    if (value !== modelConfig.choroplethDetails.max) {
      choroplethNum = Math.floor((value - modelConfig.choroplethDetails.min)/intervalSize);
    }
    modelConfig.jsonData[key]['choroplethNum'] = choroplethNum;
  }
};

var buildChoroplethLegend = function(modelConfig) {
  var numColors = modelConfig.choropleth.length;
  var sectionHeight = 20;
  var totalHeight = sectionHeight*numColors + 10

  $("[id=legend]").height(totalHeight);
  $("[id=choropleth-legend]").html('');
  for (var i = 0; i < numColors; i++) {
    var div = $('<div/>', {
      'class': 'choropleth-details',
    });

    var colorDiv = $('<div/>', {
      'style': 'background-color:' + modelConfig.choropleth[i] + ';',
      'class': 'choropleth-color'
    });
    div.append(colorDiv);

    if (modelConfig.choroplethRanges && modelConfig.choroplethRanges.length == numColors+1) {
      $("[id=legend]").width(130);
      var textDiv = $('<div/>', {
        'class': 'choropleth-text',
        html: Math.round(modelConfig.choroplethRanges[i] * 100) / 100  + ' to ' + Math.round(modelConfig.choroplethRanges[i+1] * 100) / 100
      });

      div.append(textDiv);
    } else {
      $("[id=legend]").width(30);
    }

    $("[id=choropleth-legend]").append(div);
  }
};

module.exports = {
  hexToRgb: hexToRgb,
  findChoroplethMinMax: findChoroplethMinMax,
  setChoroplethBuckets: setChoroplethBuckets,
  buildChoroplethLegend: buildChoroplethLegend
}
