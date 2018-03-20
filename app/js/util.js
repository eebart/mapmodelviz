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
  modelConfig.jsonData.forEach(function(policy) {
    if (policy.name = modelConfig.selectedPolicy) {
      for (var key in policy.data) {
        if (policy.data[key][modelConfig.mappedProperty][modelConfig.currentIndex] < min) {
          min = policy.data[key][modelConfig.mappedProperty][modelConfig.currentIndex];
        }
        if (policy.data[key][modelConfig.mappedProperty][modelConfig.currentIndex] > max) {
          max = policy.data[key][modelConfig.mappedProperty][modelConfig.currentIndex];
        }
      }
    }
  });
  modelConfig.choroplethDetails.min = min;
  modelConfig.choroplethDetails.max = max;
}

var setChoroplethBuckets = function(modelConfig) {
  if (modelConfig.choropleth !== null) {
    var numColors = modelConfig.choropleth.length;
    var range = modelConfig.choroplethDetails.max - modelConfig.choroplethDetails.min;
    var intervalSize = (range+0.0)/(numColors);

    modelConfig.choroplethRanges = [];
    for (var i = 0; i < numColors; i++) {
      modelConfig.choroplethRanges[i] = modelConfig.choroplethDetails.min + intervalSize*i;
    }
    modelConfig.choroplethRanges[i] = modelConfig.choroplethDetails.max;

    modelConfig.jsonData.forEach(function(policy) {
      if (policy.name = modelConfig.selectedPolicy) {
        for (var key in policy.data) {
          var choroplethNum = numColors - 1;
          var value = policy.data[key][modelConfig.mappedProperty][modelConfig.currentIndex];
          if (value !== modelConfig.choroplethDetails.max) {
            choroplethNum = Math.floor((value - modelConfig.choroplethDetails.min)/intervalSize);
          }
          policy.data[key]['choroplethNum'] = choroplethNum;
        }
      }
    });
  } else {
    modelConfig.choroplethDetails = {
      min: -Infinity,
      max: Infinity
    };
    modelConfig.choroplethRanges = [];
  }
};

var buildChoroplethLegend = function(modelConfig) {
  if (modelConfig.choropleth !== null) {
    $("[id=legend]").show();
    $("[id=slider]").show();

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

      configureSlider();
    }
  } else {
    $("[id=legend]").hide();
    $("[id=slider]").hide();
  }
};

var configureSlider = function() {
  if ($("[id=slider]").is(":visible") ) {
    var legendLeft = parseInt($("[id=legend]").css('left').slice(0, -2));
    var legendWidth = $("[id=legend]").width();
    var viewportWidth = $("[id=map-viewport]").width();
    var sliderLeft = legendLeft + legendWidth + legendLeft;
    var sliderWidth = viewportWidth - sliderLeft - 25 - legendLeft * 2;
    $("[id=slider]").css('width', sliderWidth + 'px');
    $("[id=slider]").css('left', sliderLeft + 'px');
  }
};

var updateSlider = function(modelConfig) {
  var numPoints = modelConfig.timeSeries.length;
  var min = modelConfig.timeSeries[0];
  var max = modelConfig.timeSeries[numPoints-1];
  $("[id=the-slider]").attr('min', min);
  $("[id=the-slider]").attr('max', max);
  $("[id=the-slider]").attr('value', modelConfig.currentIndex)
};

module.exports = {
  hexToRgb: hexToRgb,
  findChoroplethMinMax: findChoroplethMinMax,
  setChoroplethBuckets: setChoroplethBuckets,
  buildChoroplethLegend: buildChoroplethLegend,
  configureSlider: configureSlider,
  updateSlider: updateSlider
}
