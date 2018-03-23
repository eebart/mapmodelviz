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
    "opacity": 0.4
  }
};

function choroStyle(feature) {
  return {
    fillColor: getFillColor(feature),
    weight: 1,
    opacity: 1,
    color: '#000000',
    fillOpacity: 0.4
  };
};
var getFillColor = function(feature) {
  if (config.choropleth !== null && config.selectedPolicy !== '') {
    var choroplethNum = 0;
    var id = feature.properties[config.geoAreaId];
    config.jsonData.forEach(function(policy) {
      if (policy.name = config.selectedPolicy) {
        for (var key in policy.data) {
          if (policy.data[key][config.geoAreaId] == id) {
            choroplethNum = policy.data[key]['choroplethNum'];
            break;
          }
        }
      }
    });
    choroplethNum = choroplethNum ? choroplethNum : 0;
    var hex = config.choropleth[choroplethNum];
    return hex
  } else {
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
export function setNewActivePolicy(newPolicyName) {
  config.selectedPolicy = newPolicyName;
  config.jsonData.forEach(function(policy) {
    if (policy.name = newPolicyName) {
      config.geoAreaId = policy.geoAreaId;
      config.mappedProperty = policy.mappedProperty;
    }
  });
};

function highlightFeature(e) {
  var layer = e.target;

  layer.setStyle({
    weight: 2,
    fillOpacity: 0.9
  });

  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
    layer.bringToFront();
  }
};
function resetHighlight(e) {
  if (e.target !== selectedFeature) {
    geoJSONLayer.resetStyle(e.target);
  }
};
function selectFeature(e) {
  var layer = e.target;
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
};
function onEachFeature(feature, layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: selectFeature
  });
};

export function addGeoJSONLayer() {
  if (jQuery.isEmptyObject(config.geoJson.file)) {
    return;
  }

  var featureName = config.geoJson.text;
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

  var url = config.geoJson.file.url;
  if (!url || url === '') {
    url = URL.createObjectURL(config.geoJson.file);
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
  if (config.choropleth !== null && config.selectedPolicy !== '') {
    if (legend !== null) {
      legend.remove();
    }
    legend = L.control({
      position: 'bottomleft'
    });

    legend.onAdd = function(map) {
      var div = L.DomUtil.create('div', 'info legend');

      for (var i = 0; i < config.choropleth.length; i++) {
        div.innerHTML +=
          '<i style="background:' + config.choropleth[i] + '"></i> ' +
          (Math.round(config.choroplethRanges[i] * 100) / 100) + ' to ' + (Math.round(config.choroplethRanges[i + 1] * 100) / 100) + '<br>';
      }

      return div;
    };

    legend.addTo(config.map);
    configureSlider();
  }
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
  if (config.selectedPolicy !== '' && config.choropleth !== null && config.timeSeries !== null && config.timeSeries.length > 1 ) {
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
