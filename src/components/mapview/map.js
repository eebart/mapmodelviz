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
  if (config.choropleth !== null && config.activePolicy !== null) {
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
    console.log('bucket not found');
    return "#ffffff"
  }
};

export function loadMap() {
  // A new map here
  var map = L.map('map').setView([52.0024612, 4.3668409], 7);
  basemapLayer("Gray").addTo(map);
  config.map = map;
  // buildChoroplethLegend();
};

export function updateMapData() {
  util.findChoroplethMinMax();
  util.setChoroplethBuckets();
  buildChoroplethLegend();
  updateSlider();

  addGeoJSONLayer();
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

export function addGeoJSONLayer() {
  if (geoJSONLayer) {
    geoJSONLayer.setStyle(baseStyle);
  }

  if (config.activePolicy === null) {
    return;
  }

  var featureName = config.activePolicy.geoJSON.text;
  if (!featureName || featureName === '') {
    featureName = 'name';
  }

  geoJSONLayer = L.geoJSON(false, {
      style: choroStyle,
      onEachFeature: onEachFeature
    })
    .bindTooltip(function(layer) {
      var text = String(layer.feature.properties[featureName]);
      return text;
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
      }
      div.innerHTML +=
        '<i style="background:' + config.choropleth[i] + '"></i> ' +
        lower + ' to ' + upper + '<br>';
    }

    return div;
  };

  legend.addTo(config.map);
  configureSlider();
};

export function configureSlider() {
  if (legend) {
    // var legendRight = parseInt($( ".legend" )[0].css('right').slice(0, -2));
    var legendWidth = $( ".legend" ).width();
    var viewportWidth = $("[id=map-viewport]").width();
    var sliderLeft = legendWidth + 30;
    var sliderWidth = viewportWidth - sliderLeft - 15;
    $("[id=slider]").css('width', sliderWidth + 'px');
    $("[id=slider]").css('left', sliderLeft + 'px');
  } else {
    var viewportWidth = $("[id=map-viewport]").width();
    var sliderLeft = 15
    var sliderWidth = viewportWidth - sliderLeft * 2;
    $("[id=slider]").css('width', sliderWidth + 'px');
    $("[id=slider]").css('left', sliderLeft + 'px');
  }
};
export function updateSlider() {
  if (config.activePolicy !== null && config.timeSeries !== null && config.timeSeries.length > 1 ) {
    $("[id=slider]").show();
  }

  if ($("[id=slider]").is(":visible") ) {
    var numPoints = config.timeSeries.length;
    var min = config.timeSeries[0];
    var max = config.timeSeries[numPoints-1];
    $("[id=the-slider]").attr('min', min);
    $("[id=the-slider]").attr('max', max);
    $("[id=the-slider]").attr('value', config.currentIndex)
  }
};
