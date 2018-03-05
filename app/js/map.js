var modelConfig = require('./config.js');
var util = require('./util.js')

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


var geoJSONLayer = null;
var featureOverlay = null;
var hoverOverlay = null;

var addGeoJSONLayer = function() {
  // Clean up layers if they exist. For changing settings or choropleth.
  if (geoJSONLayer !== null) {
    modelConfig.map.removeLayer(geoJSONLayer);
  }
  if (featureOverlay !== null) {
    modelConfig.map.removeLayer(featureOverlay);
  }
  if (hoverOverlay !== null) {
    modelConfig.map.removeLayer(hoverOverlay);
  }

  // Alternate way to read geoJSON files
  $.getJSON( modelConfig.geoJsonFile.name, function( json ) {
    // console.log('successfully loaded GeoJSON');
  })
  .done(function( json ) {
    $("[id=no-region-selected]").show();
    $("[id=no-json-loaded]").hide();

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

    var highlight, hovered;
    modelConfig.map.on('pointermove', function(evt) {
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
    });
    modelConfig.map.on('click', function(evt) {
      var feature = modelConfig.map.forEachFeatureAtPixel(evt.pixel, function(feature) {
        return feature;
      });

      if (feature) {
        if (highlight) {
          featureOverlay.getSource().removeFeature(highlight);
        }
        if (feature !== highlight) {
          displayFeatureDetails(feature);
          featureOverlay.getSource().addFeature(feature);
          highlight = feature;
        } else {
          hideFeatureDetails();
          highlight = null;
        }
      } else {
        if (highlight) {
          featureOverlay.getSource().removeFeature(highlight);
          highlight = null;
        }
        hideFeatureDetails();
      }
    });
  })
  .fail(function(err) {
    console.error( "Error rendering geojson map layer: " + err );
  })
};

var hideFeatureDetails = function() {
  $("[id=no-region-selected]").show();
  $("[id=region-selected]").hide();
};

var displayFeatureDetails = function(feature) {
  $("[id=no-region-selected]").hide();

  $("[id=region-name]").html(feature.get('name'));
  $("[id=region-selected]").show();
};

module.exports = {
  addGeoJSONLayer: addGeoJSONLayer,
  updateMapData: updateMapData,
  setNewActivePolicy: setNewActivePolicy
}
