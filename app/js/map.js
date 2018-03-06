var modelConfig = require('./config.js');
var util = require('./util.js');
var details = require('./details.js');

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

var updateMapData = function() {
  util.findChoroplethMinMax(modelConfig);
  util.setChoroplethBuckets(modelConfig);
  util.buildChoroplethLegend(modelConfig);

  addGeoJSONLayer();
};
var setNewActivePolicy = function(newPolicyName) {
  modelConfig.selectedPolicy = newPolicyName;
  modelConfig.jsonData.forEach(function(policy) {
    if (policy.name = newPolicyName) {
      modelConfig.geoAreaId = policy.geoAreaId;
      modelConfig.mappedProperty = policy.mappedProperty;
    }
  });
}

var getFillColor = function(feature) {
  var choroplethNum = 0;
  var id = feature.get(modelConfig.geoAreaId);
  modelConfig.jsonData.forEach(function(policy) {
    if (policy.name = modelConfig.selectedPolicy) {
      for (var key in policy.data) {
        if (policy.data[key][modelConfig.geoAreaId] == id) {
          choroplethNum = policy.data[key]['choroplethNum'];
          break;
        }
      }
    }
  });
  choroplethNum = choroplethNum ? choroplethNum : 0;
  var hex = modelConfig.choropleth[choroplethNum];
  return util.hexToRgb(hex);
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

var addGeoJSONLayer = function() {
  resetMap();

  // Alternate way to read geoJSON files
  $.getJSON( modelConfig.geoJsonFile.name, function( json ) {
    // console.log('successfully loaded GeoJSON');
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
    modelConfig.map.addLayer(geoJSONLayer);
    modelConfig.map.getView().fit(vectorSource.getExtent(), (modelConfig.map.getSize()));

    featureOverlay = new ol.layer.Vector({
      source: new ol.source.Vector(),
      map: modelConfig.map,
      style: highlightStyleFunction
    });
    hoverOverlay = new ol.layer.Vector({
      source: new ol.source.Vector(),
      map: modelConfig.map,
      style: hoveredStyleFunction
    });

    hoverEvent = modelConfig.map.on('pointermove', onMapHover);
    clickEvent = modelConfig.map.on('click', onMapClick);
  }).fail(function(err) {
    console.error( "Error rendering geojson map layer: " + err );
  });
};

var onMapHover = function(evt) {
  if (evt.dragging) {
    return;
  }
  var pixel = modelConfig.map.getEventPixel(evt.originalEvent);
  var feature = modelConfig.map.forEachFeatureAtPixel(pixel, function(feature) {
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
  var feature = modelConfig.map.forEachFeatureAtPixel(evt.pixel, function(feature) {
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
    modelConfig.map.removeLayer(geoJSONLayer);
  }
  if (featureOverlay) {
    modelConfig.map.removeLayer(featureOverlay);
  }
  if (hoverOverlay) {
    modelConfig.map.removeLayer(hoverOverlay);
  }
  if (hoverEvent) {
    ol.Observable.unByKey(hoverEvent);
  }
  if (clickEvent) {
    ol.Observable.unByKey(clickEvent);
  }
};

module.exports = {
  addGeoJSONLayer: addGeoJSONLayer,
  updateMapData: updateMapData,
  setNewActivePolicy: setNewActivePolicy
}
