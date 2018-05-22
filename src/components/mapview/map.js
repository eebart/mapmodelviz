import * as util from '../../util/util.js';
import * as details from '../details/details.js';
import * as L from 'leaflet';
import { basemapLayer } from 'esri-leaflet';

var geoJSONLayer,
  selectedFeature = null,
  legend = null;

function baseStyle(feature) {
  return {
    "color": "#000000",
    fillColor: "#ffffff",
    "weight": 2,
    "opacity": 0
  }
};

function choroStyle(feature) {
  var style = getFillColor(feature);

  return {
    fillColor: style.fillColor,
    weight: style.weight,
    opacity: style.opacity,
    color: '#000000',
    fillOpacity: style.fillOpacity
  };
};
var getFillColor = function(feature) {
  if (config.choropleth !== null && config.activePolicy !== null && config.activePolicy.data !== null) {
    var choroplethNum = -1;
    var id = feature.properties[config.geoAreaId];
    for (var key in config.activePolicy.data) {
      if (config.activePolicy.data[key][config.geoAreaId] == id) {
        choroplethNum = config.activePolicy.data[key]['choroplethNum'];
        break;
      }
    }

    // choroplethNum = choroplethNum ? choroplethNum : -1;
    if (choroplethNum == -1) {
      return {
        fillColor: "#ffffff",
        weight:0,
        opacity:0,
        fillOpacity: 0
      }
    } else {
      return {
        fillColor: config.choropleth[choroplethNum],
        opacity:1,
        weight:1,
        fillOpacity: 0.4
      };
    }
  } else {
    return {
      fillColor: "#ffffff",
      weight:1,
      opacity:1,
      fillOpacity: 0
    }
  }
};

export function loadMap() {
  // A new map here
  var map = L.map('map').setView([52.0024612, 4.3668409], 7);
  basemapLayer("Gray").addTo(map);
  config.map = map;
  // buildChoroplethLegend();
};

export function updateMapData(throughPlayback=false) {
  var invalid = false;
  if (config.activePolicy.data === null) {
    invalid = true;
  } else {
    for (var key in config.activePolicy.data) {
      if (config.activePolicy.data[key][config.mappedProperty] === undefined) {
        util.displayMessage('Invalid mapped property specified, or not specified for all data elements. Data will not display properly.');
        invalid = true;
      }
      break;
    }
  }

  if (!invalid) {
    // ORDER MATTERS HERE!!
    if (throughPlayback == false) {
      util.findChoroplethMinMaxOverall();
      util.setChoroplethRanges();
    }
    util.setChoroplethBuckets();
    if (throughPlayback == false) {
      buildChoroplethLegend();
      displayPropertyTitle();
      configureSlider();
      configurePlayer();
    }
    updateSlider();
  }

  if (throughPlayback == false) {
    addGeoJSONLayer();
  } else {
    updateGeoJSONLayer();
  }
};

function highlightFeature(e) {
  var layer = e.target;

  if (layer.options.opacity > 0) {
    layer.setStyle({
      weight: 2,
      fillOpacity: 0.9
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
      layer.bringToFront();
    }
  }
};
function resetHighlight(e) {
  if (e.target !== selectedFeature) {
    geoJSONLayer.resetStyle(e.target);
  }
};
function selectFeature(e) {
  var layer = e.target;
  if (layer.options.opacity > 0) {

    if (layer === selectedFeature) {
      geoJSONLayer.resetStyle(e.target);
      selectedFeature = null;
      details.hideFeatureDetails();
    } else {
      if (selectedFeature !== null) {
        geoJSONLayer.resetStyle(selectedFeature)
      }
      layer.setStyle({
        weight: 2,
        fillOpacity: 0.9
      });
      selectedFeature = layer;
      details.showFeatureDetails(selectedFeature.feature);
    }

  }
};
function onEachFeature(feature, layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: selectFeature
  });
};

function updateGeoJSONLayer() {
  //TODO only do this method if you are updating and not selecting a new property
  geoJSONLayer.setStyle(function(feature) {
      if (feature == selectedFeature.feature) {
        style = choroStyle(feature);
        style.weight = 2;
        style.fillOpacity = 0.9;
        return style;
      }
      else {
        return choroStyle(feature);
      }
  })


};
export function addGeoJSONLayer() {
  if (geoJSONLayer) {
    geoJSONLayer.setStyle(baseStyle);
  }

  if (config.activePolicy === null) {
    return;
  }

  var featureName = config.activePolicy.geoJSON.text;
  if (!featureName) {
    featureName = '';
  }

  geoJSONLayer = L.geoJSON(false, {
    style: choroStyle,
    onEachFeature: onEachFeature
  }).bindTooltip(function(layer) {
    var text = layer.feature.properties[featureName];
    if (text === undefined) {
      text = '';
    }
    return String(text);
  }, {});

  var url = config.activePolicy.geoJSON.file.url;
  if (!url || url === '') {
    url = URL.createObjectURL(config.activePolicy.geoJSON.file);
  }
  $.getJSON(url, function(json) {
    // console.log('successfully loaded GeoJSON');
  })
  .done(function(json) {
    details.showJsonLoaded();
    geoJSONLayer.addData(json);
    try {
      var featureText = json['features'][0]['properties'][featureName]
      if (!featureText) {
        geoJSONLayer.unbindTooltip();
      }
    } catch(err){
      geoJSONLayer.unbindTooltip();
    }
    config.map.addLayer(geoJSONLayer);
    config.map.fitBounds(geoJSONLayer.getBounds());
  }).fail(function(err) {
    console.error("Error rendering geojson map layer: " + err);
  });
};

function buildChoroplethLegend() {
  if (legend !== null) {
    legend.remove();
  }

  if (config.activePolicy === null || config.activePolicy.choropleth === null) {
    return;
  }

  legend = L.control({
    position: 'bottomleft'
  });

  legend.onAdd = function(map) {
    var div = L.DomUtil.create('div', 'info legend');

    for (var i = 0; i < config.choropleth.length; i++) {
      var lower = config.choroplethRanges[i]
      if (lower > 10) {
        lower = util.numberWithCommas(Math.round(lower * 100) / 100);
      }
      var upper = config.choroplethRanges[i + 1]
      if (upper > 10) {
        upper = util.numberWithCommas(Math.round(upper * 100) / 100);
        if (lower <= 10) {
          lower = util.numberWithCommas(Math.round(lower * 100) / 100);
        }
      }
      div.innerHTML +=
        '<i style="background:' + config.choropleth[i] + '"></i> ' +
        lower + ' to ' + upper + '<br>';
    }

    return div;
  };
  legend.addTo(config.map);
};

export function displayPropertyTitle() {
  var viewportWidth = $("[id=map-viewport]").width();
  var propTitle = $("#mapped-property-title");
  propTitle.css('width', viewportWidth - 50 * 2);
  propTitle.css('left', 50);
  propTitle.html('Displayed: ' + config.activePolicy.name);
  propTitle.show();
};

export function configureSlider() {

  if (config.timeSeries == null || config.timeSeries.length == 0) {
    return;
  }

  var slider = $("#slider");
  if (legend) {
    // var legendRight = parseInt($( ".legend" )[0].css('right').slice(0, -2));
    var thelegend = $( ".legend" );
    var legendWidth = thelegend.width();
    var viewportWidth = $("[id=map-viewport]").width();
    var sliderLeft = legendWidth + 30;
    var sliderWidth = viewportWidth - sliderLeft - 15;
    slider.css('width', sliderWidth + 'px');
    slider.css('left', sliderLeft + 'px');

    var currentTime = $("#current-time");
    var legendHeight = thelegend.height();
    currentTime.css('width', legendWidth + 10 + 2);
    currentTime.css('left', thelegend.css('margin-left'));
    currentTime.css('bottom', legendHeight + 5 + 10 + 2 + 10);
  } else {
    var currentTime = $("#current-time");
    currentTime.css('width', 160);
    currentTime.css('left', 10);
    currentTime.css('bottom', 10 + 2 + 10);

    var viewportWidth = $("[id=map-viewport]").width();
    var sliderLeft = 15
    var sliderWidth = viewportWidth - sliderLeft * 2;
    slider.css('width', sliderWidth + 'px');
    slider.css('left', sliderLeft + 'px');
  }

  var numPoints = config.timeSeries.length;
  var min = config.timeSeries[0];
  var max = config.timeSeries[numPoints-1];
  $("[id=the-slider]").attr('min', min);
  $("[id=the-slider]").attr('max', max);

  $("[id=slider]").show();
  $("#current-time").show();
};
export function updateSlider() {
  if ($("[id=slider]").is(":visible") ) {
    // console.log('Updating slider to ' + config.timeSeries[config.currentIndex])
    $("[id=the-slider]").attr('value', config.timeSeries[config.currentIndex])
    // console.log($("[id=the-slider]"))
    $('#current-time-val').html(config.timeSeries[config.currentIndex]);
  }
};

var currentlyPlaying = false;
var playerConfigured = false;
var timer = null;
function configurePlayer(legendHeight, legendWidth, legendLeft) {
  if (playerConfigured) {
    if (currentlyPlaying) {
      clearInterval(timer);   // stop the animation by clearing the interval
      $('#run-playback').html('Play');   // change the button label to play
      currentlyPlaying = false;   // change the status again
    }
  } else {
    var thelegend = $( ".legend" );
    var legendWidth = thelegend.width();
    var legendHeight = thelegend.height();
    var legendLeft = thelegend.css('margin-left')
    var playback = $("#playback-div");
    playback.css('width', legendWidth + 10 + 2);
    playback.css('left', legendLeft);
    playback.css('bottom', legendHeight + 5 + 10 + 2 + 10 + 30 + 5);
    playback.show();

    $('#run-playback').on("click", function(event) {
      if (currentlyPlaying == false) {
        $("#show-settings").removeClass('active');
        $("#show-settings").addClass('disabled');

        timer = setInterval(function(){   // set a JS interval
          if(config.currentIndex < config.timeSeries.length - 1) {
            config.currentIndex +=1;  // increment the current attribute counter
          } else {
            config.currentIndex = 0;  // or reset it to zero
          }
          updateMapData(true);  // update the representation of the map
        }, config.playbackSpeed);

        $('#run-playback').text('Stop');  // change the button label to stop
        $('#run-playback').addClass('btn-dark');
        $('#run-playback').removeClass('btn-primary');
        currentlyPlaying = true;   // change the status of the animation
      } else {    // else if is currently playing
        clearInterval(timer);   // stop the animation by clearing the interval
        $('#run-playback').text('Play');   // change the button label to play
        $('#run-playback').removeClass('btn-dark');
        $('#run-playback').addClass('btn-primary');
        currentlyPlaying = false;   // change the status again

        $("#show-settings").addClass('active');
        $("#show-settings").removeClass('disabled');
      }
    });
    playerConfigured = true;
  }

};
