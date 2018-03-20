var colors = require('./colors.js')
var modelConfig = require('../config.js');
var mapping = require('./map.js');
var details = require('./details.js');

var newPolicies = [];
var pendingActivePolicy = '';

var loadOptionalConfig = function() {
  var jsonFileName = 'config.json';
  $.getJSON(jsonFileName, function(json) {
    json.choropleth = findChoropleth(json.choroplethString);
    Object.assign(modelConfig, json);
    loadModelData();
  })
  .done(function() {
    loadSettings();
  })
  .fail(function(err) {
    //No Config file provided
  })
}
var findChoropleth = function(choroplethString) {
  var bracket = choroplethString.indexOf("[")
  var base = choroplethString.substring(0,bracket);
  var numColors = parseInt(choroplethString.substring(bracket+1, bracket+2));
  return colors[base][numColors];
}

var loadSettings = function() {
  $("#settings-content").load("settings.html", function() {

    displayCurrentChoropleth(modelConfig.choropleth);
    displayActivePolicy(modelConfig.selectedPolicy);
    displayModelName(modelConfig.modelName);
    displayGeoJsonFile(modelConfig.geoJsonFile);

    $("#name-popup").load("nameSelector.html", function() {
      $("[id=name-change-save]").click(function() {
        saveModelName();
      });
    });
    $("#color-popup").load("colorSelector.html", function() {
      $("[id=color-number-dropdown]").change(function() {
        buildChoroplethSelection();
      });

      $("[id=choropleth-change-save]").click(function() {
        saveChoroplethSelection();
      });
    });
    $("#model-popup").load("modelSelector.html", function() {
      if (modelConfig.allowFileUpload) {
        $("#add-new-policy").show();

      } else {
        $("#add-new-policy").hide();
      }

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
    $("#export-popup").load("exportSelector.html", function() {
      $("[id=export-save]").click(function() {
        saveConfigAsFile();
      });
    });

    if(modelConfig.allowFileUpload) {
      $("[id=geojson-file-selector]").change(function() {
        modelConfig.geoJsonFile = this.files[0];
        displayGeoJsonFile(modelConfig.geoJsonFile);
        mapping.updateMapData();
      });
      $("[id=change-color-btn]").click(function() {
        buildChoroplethSelection();
      });
      $("[id=export-config-btn]").click(function() {
        // buildChoroplethSelection();
      });
    } else {
      $("[id=geojson-file-selector]").prop('disabled', true);
      $("[id=geojson-upload-btn]").addClass('disabled');
      $("[id=name-change-btn]").prop('disabled', true);
      $("[id=change-color-btn]").prop('disabled', true);
      $("[id=export-config-btn]").prop('disabled', true);
    }

    $("[id=manage-policies]").click(function() {
      buildModelDataDisplay(modelConfig.jsonData, modelConfig.selectedPolicy);

      $('#policy-row-add').on('click', 'tr', function(){
        setNewActivePolicy(this);
      });
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

    loadModelData();
  }
};
var loadModelData = function() {
  modelConfig.jsonData.forEach(function(dataset){
    if (dataset.name === modelConfig.selectedPolicy) {
      modelConfig.geoAreaId = dataset.geoAreaId;
      modelConfig.mappedProperty = dataset.mappedProperty;
      $.getJSON(dataset.file.name, function(json) {
        dataset.data = json;
      })
      .done(function() {
        mapping.updateMapData();
        details.loadDetails();
      })
      .fail(function(err) {
        console.error( "error loading model data: " + err );
        details.loadDetails();
      })
    } else {
      dataset.data = null;
    }
  });
};

var displayCurrentChoropleth = function(currentChoropleth) {
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
  if (choropleth !== null) {
    choropleth.forEach(function(color){
      divContent += '<div class="col" style="background-color:' + color + ';"/>'
    });
  }
  divContent += '</div>';
  return divContent;
};
var saveChoroplethSelection = function() {
  var colorName = $('input[name=choropleth-color-selector]:checked').val();
  var numColors = $('#color-number-dropdown')[0].value;
  modelConfig.choropleth = colors[colorName][numColors];
  modelConfig.choroplethString = colorName + "[" + numColors.str() + "]";

  $("#current-color-selection").html(buildChoroplethDisplay(modelConfig.choropleth));
  displayCurrentChoropleth(modelConfig.choropleth);
  mapping.updateMapData();
};

var saveConfigAsFile = function() {
  var config = {
    modelName: modelConfig.modelName,

    choroplethString: modelConfig.choroplethString,
    geoJsonFile: {
      name: modelConfig.geoJsonFile.name
    },
    jsonData: modelConfig.jsonData,
    selectedPolicy: modelConfig.selectedPolicy
  };
  config.jsonData.forEach(function(dataset) {
    delete dataset.data;
  });
  config.allowFileUpload = $("[id=allow-file-change]").hasClass('active');

  var textToWrite = JSON.stringify(config);
  var textFileAsBlob = new Blob([textToWrite], { type: 'text/json' });
  var fileNameToSaveAs = "config.json";

  // create a link for our script to 'click'
  var downloadLink = document.createElement("a");
  downloadLink.download = fileNameToSaveAs;
  // provide text for the link. This will be hidden so you
  // can actually use anything you want.
  downloadLink.innerHTML = "Config Download";

  // allow our code to work in webkit & Gecko based browsers
  // without the need for a if / else block.
  window.URL = window.URL || window.webkitURL;

  // Create the link Object.
  downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
  // when link is clicked call a function to remove it from
  // the DOM in case user wants to save a second file.
  downloadLink.onclick = destroyClickedElement;
  // make sure the link is hidden.
  downloadLink.style.display = "none";
  // add the link to the DOM
  document.body.appendChild(downloadLink);

  // click the new link
  downloadLink.click();
}
function destroyClickedElement(event) {
  // remove the link from the DOM
  document.body.removeChild(event.target);
}

module.exports = {
  loadSettings: loadSettings,
  loadOptionalConfig: loadOptionalConfig
}
