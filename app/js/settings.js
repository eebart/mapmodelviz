var colors = require('./colors.js')
var modelConfig = require('../config.js');
var mapping = require('./map.js');

var newPolicies = [];
var pendingActivePolicy = '';

var loadSettings = function() {
  $("#settings-content").load("settings.html", function() {

    displayCurrentChoropleth(modelConfig.choropleth);
    displayActivePolicy(modelConfig.selectedPolicy);
    displayModelName(modelConfig.modelName);
    displayGeoJsonFile(modelConfig.geoJsonFile);

    $("[id=geojson-file-selector]").change(function() {
      modelConfig.geoJsonFile = this.files[0];
      displayGeoJsonFile(modelConfig.geoJsonFile);
      mapping.updateMapData();
    });

    $("#name-popup").load("nameSelector.html", function() {
      $("[id=name-change-save]").click(function() {
        saveModelName();
      });
    });
    $("#color-popup").load("colorSelector.html", function() {
      buildChoroplethSelection();

      $("[id=color-number-dropdown]").change(function() {
        buildChoroplethSelection();
      });

      $("[id=choropleth-change-save]").click(function() {
        saveChoroplethSelection();
      });
    });
    $("#model-popup").load("modelSelector.html", function() {
      $("[id=policy-file-selector]").change(function() {
        $("[id=policy-file-selected-name]").html(this.files[0].name);
      });

      $("[id=new-policy-button]").click(function() {
        addNewPolicy();
      });

      $("[id=policy-data-save]").click(function() {
        updateMapPolicies();
      });
    });

    $("[id=manage-policies]").click(function() {
      buildModelDataDisplay(modelConfig.jsonData, modelConfig.selectedPolicy);

      $('#policy-row-add').on('click', 'tr', function(){
        setNewActivePolicy(this);
      });
    });
    $("[id=change-color-button]").click(function() {
      buildChoroplethSelection();
    });
  });
};

var displayModelName = function(modelName) {
  $("#current-model-name").html(modelName);
  if (modelName === '') {
    modelName = 'MapModelViz';
  }
  $("#model-name").html(modelName);
};
var saveModelName = function() {
  var modelName = $("[id=new_model_name]")[0].value;
  modelConfig.modelName = modelName;
  displayModelName(modelName);
};

var displayGeoJsonFile = function(geoJsonFile) {
  $("[id=geojson-file]").html(geoJsonFile.name);
};

var displayActivePolicy = function(activePolicy) {
  $("#current-active-policy").html(activePolicy);
};
var buildModelDataDisplay = function(jsonData, activePolicy) {
  newPolicies = [];
  pendingActivePolicy = '';
  $("#policy-row-add tr").remove();

  if (jsonData.length == 0) {
    $("[id=no-policies]").show();
    $("[id=policies-exist]").hide();
  } else {
    $("[id=no-policies]").hide();
    $("[id=policies-exist]").show();

    jsonData.forEach(function(policy) {
      var isActive = policy.name === activePolicy;
      buildNewRow(policy, isActive);
    });
  }
};
var buildNewRow = function(policy, isActive) {
  var divContent = '<tr>';
  if (isActive) {
    divContent = '<tr class="table-primary">';
  }
  divContent += '<td>' + policy.name + '</td>';
  divContent += '<td>' + policy.file.name + '</td>';
  divContent += '<td>' + policy.mappedProperty + '</td>';
  divContent += '<td>' + policy.geoAreaId + '</td>';
  divContent += '</tr>';
  $("#policy-row-add").append(divContent);
};
var addNewPolicy = function() {
  var newPolicy = {
    name: $("[id=new_policy_name]")[0].value,
    data: null,
    file: $("[id=policy-file-selector]")[0].files[0],
    geoAreaId: $("[id=geo_id_property]")[0].value,
    mappedProperty: $("[id=mapped_property_name]")[0].value
  };
  newPolicies.push(newPolicy);
  buildNewRow(newPolicy, false);
};
var setNewActivePolicy = function(row) {
  $(row).addClass('table-primary').siblings().removeClass('table-primary');
  pendingActivePolicy = row.children[0].innerText;
};
var updateMapPolicies = function() {
  if (newPolicies.length !== 0) {
    modelConfig.jsonData.push(newPolicies);
  }
  if (pendingActivePolicy !== '' && modelConfig.selectedPolicy !== pendingActivePolicy) {
    modelConfig.selectedPolicy = pendingActivePolicy;
    displayActivePolicy(modelConfig.selectedPolicy);

    modelConfig.jsonData.forEach(function(dataset){
      if (dataset.name === modelConfig.selectedPolicy) {
        modelConfig.geoAreaId = dataset.geoAreaId;
        modelConfig.mappedProperty = dataset.mappedProperty;
        $.getJSON(dataset.file.name, function(json) {
          dataset.data = json;
        })
        .done(function() {
          mapping.updateMapData();
        })
        .fail(function(err) {
          console.error( "error loading model data: " + err );
        })
      } else {
        dataset.data = null;
      }
    });
  }
};

var displayCurrentChoropleth = function(currentChoropleth) {
  var divContent = '<div class="row">';
  divContent += buildChoroplethDisplay(currentChoropleth);
  divContent += '</div>';
  $("#current-color-settings").html(buildChoroplethDisplay(currentChoropleth));
};
var buildChoroplethSelection = function() {
  $("#all-color-selection")[0].innerHTML = '';

  $("#current-color-selection").html(buildChoroplethDisplay(modelConfig.choropleth));
  var numColors = parseInt($("#color-number-dropdown")[0].value);
  for (var color in colors) {
    if (colors[color][numColors] !== undefined) {
      var content = buildChoroplethDisplay(colors[color][numColors]);
      var divContent = '<div class="row form-group color-radio-row"><div class="col-sm-2 form-check">';
      divContent += '<input class="form-check-input" type="radio" name="choropleth-color-selector" id="' + color + '" value="' + color + '">';
      divContent += '<label class="form-check-label" for="' + color + '">' + color + '</label>';
      divContent += '</div>';
      divContent += '<div class="col-sm-10"> <div class="col-form-label choropleth-display">' + content + '</div></div>';
      divContent += '</div>';

      $("#all-color-selection").append(divContent);
    }
  }
};
var buildChoroplethDisplay = function(choropleth) {
  var divContent = '<div class="row">';
  choropleth.forEach(function(color){
    divContent += '<div class="col" style="background-color:' + color + ';"/>'
  });
  divContent += '</div>';
  return divContent;
};
var saveChoroplethSelection = function() {
  var colorName = $('input[name=choropleth-color-selector]:checked').val();
  var numColors = $('#color-number-dropdown')[0].value;
  modelConfig.choropleth = colors[colorName][numColors];

  $("#current-color-selection").html(buildChoroplethDisplay(modelConfig.choropleth));
  displayCurrentChoropleth(modelConfig.choropleth);
  mapping.updateMapData();
};

module.exports = {
  loadSettings: loadSettings
}
