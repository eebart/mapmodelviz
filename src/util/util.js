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
  config.jsonData.forEach(function(policy) {
    if (policy.name = config.selectedPolicy) {
      for (var key in policy.data) {
        if (policy.data[key][config.mappedProperty][config.currentIndex] < min) {
          min = policy.data[key][config.mappedProperty][config.currentIndex];
        }
        if (policy.data[key][config.mappedProperty][config.currentIndex] > max) {
          max = policy.data[key][config.mappedProperty][config.currentIndex];
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

    config.choroplethRanges = [];
    for (var i = 0; i < numColors; i++) {
      config.choroplethRanges[i] = config.choroplethDetails.min + intervalSize*i;
    }
    config.choroplethRanges[i] = config.choroplethDetails.max;

    config.jsonData.forEach(function(policy) {
      if (policy.name = config.selectedPolicy) {
        for (var key in policy.data) {
          var choroplethNum = numColors - 1;
          var value = policy.data[key][config.mappedProperty][config.currentIndex];
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

export function buildChoroplethLegend() {
  if (config.choropleth !== null && config.selectedPolicy !== '') {
    $("[id=legend]").show();

    var numColors = config.choropleth.length;
    var sectionHeight = 20;
    var totalHeight = sectionHeight*numColors + 10

    $("[id=legend]").height(totalHeight);
    $("[id=choropleth-legend]").html('');
    for (var i = 0; i < numColors; i++) {
      var div = $('<div/>', {
        'class': 'choropleth-details',
      });

      var colorDiv = $('<div/>', {
        'style': 'background-color:' + config.choropleth[i] + ';',
        'class': 'choropleth-color'
      });
      div.append(colorDiv);

      if (config.choroplethRanges && config.choroplethRanges.length == numColors+1) {
        $("[id=legend]").width(130);
        var textDiv = $('<div/>', {
          'class': 'choropleth-text',
          html: Math.round(config.choroplethRanges[i] * 100) / 100  + ' to ' + Math.round(config.choroplethRanges[i+1] * 100) / 100
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

export function configureSlider() {
  if (config.timeSeries !== null && config.timeSeries.length > 1 ) {
    $("[id=slider]").show();
  }

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

export function updateSlider() {
  if ($("[id=slider]").is(":visible") ) {
    var numPoints = config.timeSeries.length;
    var min = config.timeSeries[0];
    var max = config.timeSeries[numPoints-1];
    $("[id=the-slider]").attr('min', min);
    $("[id=the-slider]").attr('max', max);
    $("[id=the-slider]").attr('value', config.currentIndex)
  }
};
