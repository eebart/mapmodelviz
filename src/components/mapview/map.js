import * as util from '../../util/util.js';
import * as details from '../details/details.js';
var ol = require('openlayers');

var standardStyle = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: '#000',
    width: 1
  }),
  text: new ol.style.Text({
    font: '12px Calibri,sans-serif',
    fill: new ol.style.Fill({
      color: '#000'
    })
  })
});
var highlightStyle = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: '#000',
    width: 2
  }),
  text: new ol.style.Text({
    font: '12px Calibri,sans-serif',
    fill: new ol.style.Fill({
      color: '#000'
    })
  })
});
var hoverStyle = new ol.style.Style({
  stroke: new ol.style.Stroke({
    color: '#000',
    width: 2
  }),
  text: new ol.style.Text({
    font: '12px Calibri,sans-serif',
    fill: new ol.style.Fill({
      color: '#000'
    })
  })
});

export function loadMap() {
  config.map = new ol.Map({
    target : 'map',
    layers : [
      new ol.layer.Tile({
        source: new ol.source.XYZ({
          attributions: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'
        })
      })
    ],
    options: {
      numZoomLevels: 15
    },
    view :
      new ol.View({center : ol.proj.fromLonLat([4.3668409,52.0024612]), zoom : 3})
  });
  util.buildChoroplethLegend();
};

export function updateMapData() {
  util.findChoroplethMinMax();
  util.setChoroplethBuckets();
  util.buildChoroplethLegend();
  util.updateSlider();

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
}

var getFillColor = function(feature) {
  if (config.choropleth !== null && config.selectedPolicy !== '') {
    var choroplethNum = 0;
    var id = feature.get(config.geoAreaId);
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
    return util.hexToRgb(hex);
  } else {
    return { r: 255, g: 255, b: 255};
  }
};

var baseStyleFunction = function(feature, style, transparency) {
  style.getText().setText(feature.get('name'));

  var fillColor = getFillColor(feature);
  style.setFill(new ol.style.Fill({
    color:[fillColor.r, fillColor.g, fillColor.b, transparency]
  }));
  return style;
};
var styleFunction = function(feature) {
  return baseStyleFunction(feature, standardStyle, 0.4);
};
var highlightStyleFunction = function(feature) {
  return baseStyleFunction(feature, highlightStyle, 0.9);
};
var hoveredStyleFunction = function(feature) {
  return hoverStyle;
}

// Map Sources: http://josm.openstreetmap.de/wiki/Maps, http://leaflet-extras.github.io/leaflet-providers/preview/index.html, http://services.arcgisonline.com/arcgis/rest/services

var geoJSONLayer, featureOverlay, hoverOverlay;
var highlight, hovered;
var clickEvent, hoverEvent;

export function addGeoJSONLayer() {
  resetMap();

  if (jQuery.isEmptyObject(config.geoJsonFile)) {
    return;
  }

  var url = config.geoJsonFile.url;
  if (!url || url === '') {
    url = URL.createObjectURL(config.geoJsonFile);
  }
  $.getJSON( url, function( json ) {
    console.log('successfully loaded GeoJSON');
  })
  .done(function( json ) {
    details.showJsonLoaded();

    var vectorSource = new ol.source.Vector({
      features: (new ol.format.GeoJSON()).readFeatures(json,{ featureProjection: 'EPSG:3857' })
    });
    geoJSONLayer = new ol.layer.Vector({
      source: vectorSource,
      // map: map,
      style: styleFunction
    });
    config.map.addLayer(geoJSONLayer);
    config.map.getView().fit(vectorSource.getExtent(), (config.map.getSize()));

    if (config.selectedPolicy !== '') {
      featureOverlay = new ol.layer.Vector({
        source: new ol.source.Vector(),
        map: config.map,
        style: highlightStyleFunction
      });
      hoverOverlay = new ol.layer.Vector({
        source: new ol.source.Vector(),
        map: config.map,
        style: hoveredStyleFunction
      });

      hoverEvent = config.map.on('pointermove', onMapHover);
      clickEvent = config.map.on('click', onMapClick);
    }
  }).fail(function(err) {
    console.error( "Error rendering geojson map layer: " + err );
  });
};

var onMapHover = function(evt) {
  if (evt.dragging) {
    return;
  }
  var pixel = config.map.getEventPixel(evt.originalEvent);
  var feature = config.map.forEachFeatureAtPixel(pixel, function(feature) {
    return feature;
  });

  if (feature !== hovered) {
    if (hovered) {
      hoverOverlay.getSource().removeFeature(hovered);
    }
    if (feature) {
      hoverOverlay.getSource().addFeature(feature);
    }
    hovered = feature;
  }
};
var onMapClick = function(evt) {
  var feature = config.map.forEachFeatureAtPixel(evt.pixel, function(feature) {
    return feature;
  });

  if (feature) {
    if (highlight) {
      featureOverlay.getSource().removeFeature(highlight);
    }
    if (feature !== highlight) {
      details.showFeatureDetails(feature);
      featureOverlay.getSource().addFeature(feature);
      highlight = feature;
    } else {
      details.hideFeatureDetails();
      highlight = null;
    }
  } else {
    if (highlight) {
      featureOverlay.getSource().removeFeature(highlight);
      highlight = null;
    }
    details.hideFeatureDetails();
  }
};
var resetMap = function(evt) {
  if (hovered) {
    featureOverlay.getSource().removeFeature(hovered);
    hovered = null;
  }
  if (highlight) {
    featureOverlay.getSource().removeFeature(highlight);
    highlight = null;
  }
  if (geoJSONLayer) {
    config.map.removeLayer(geoJSONLayer);
  }
  if (featureOverlay) {
    config.map.removeLayer(featureOverlay);
  }
  if (hoverOverlay) {
    config.map.removeLayer(hoverOverlay);
  }
  if (hoverEvent) {
    ol.Observable.unByKey(hoverEvent);
  }
  if (clickEvent) {
    ol.Observable.unByKey(clickEvent);
  }
};
