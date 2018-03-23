import choroplethColors from '../../util/colors.js';
import { updateMapData, addGeoJSONLayer } from '../mapview/map.js';
import { loadDetails } from '../details/details.js';

var settingshtml = require('./settings.html');
var nameselector = require('./nameSelector.html');
var modelselector = require('./modelSelector.html');
var exportselector = require('./exportSelector.html');
var colorselector = require('./colorSelector.html');

var newPolicies = [];
var pendingActivePolicy = '';
var pendingNewColor = '';

var loadOptionalConfig = function() {
  var configFileURL = 'assets/config.json';
  $.getJSON(configFileURL, function(json) {
    json.choropleth = findChoropleth(json.choroplethString);
    Object.assign(config, json);
    loadModelData();
  })
  .done(function() {
    loadSettings();
  })
  .fail(function(err) {
    console.log("Configuration File Not Found. Continuing without loading one.");
    loadDetails();
    loadSettings();
  })
}
var findChoropleth = function(choroplethString) {
  if (choroplethString && choroplethString != "") {
    var bracket = choroplethString.indexOf("[")
    var base = choroplethString.substring(0,bracket);
    var numColors = parseInt(choroplethString.substring(bracket+1, bracket+2));
    return choroplethColors[base][numColors];
  }
  return null;
}

var loadSettings = function() {
  $("#settings-content").html(settingshtml);

  $("#name-popup").html(nameselector);
  $("#color-popup").html(colorselector);
  $("#model-popup").html(modelselector);
  $("#export-popup").html(exportselector);

  displayCurrentChoropleth(config.choropleth);
  displayActivePolicy(config.selectedPolicy);
  displayModelName(config.modelName);
  displayGeoJsonFile(config.geoJson.file);

  $("[id=name-change-save]").click(function() {
    saveModelName();
  });
  $("[id=color-number-dropdown]").change(function() {
    buildChoroplethSelection();
  });
  $("[id=choropleth-change-save]").click(function() {
    saveChoroplethSelection();
  });

  $("[id=policy-file-selector]").change(function() {
    $("[id=policy-file-selected-name]").html(this.files[0].name);
  });

  $("[id=new-policy-button]").click(function() {
    addNewPolicy();
  });

  $("[id=policy-data-save]").click(function() {
    updateMapPolicies();
  });
  $("[id=export-save]").click(function() {
    saveConfigAsFile();
  });

  if(config.allowFileUpload) {
    $("#add-new-policy").show();
    $("[id=geojson-file-selector]").change(function() {
      config.geoJson = this.files[0];
      displayGeoJsonFile(config.geoJson.file);
      updateMapData();
    });

    $("[id=change-color-btn]").click(function() {
      buildChoroplethSelection();

      $('#color-select-add').on('click', 'tr', function(){
        selectNewChoropleth(this);
      });
    });
    $("[id=export-config-btn]").click(function() {
      saveConfigAsFile();
    });
  } else {
    $("#add-new-policy").hide();

    $("[id=geojson-file-selector]").prop('disabled', true);
    $("[id=geojson-upload-btn]").addClass('disabled');

    $("[id=name-change-btn]").prop('disabled', true);
    $("[id=change-color-btn]").prop('disabled', true);
    $("[id=export-config-btn]").prop('disabled', true);
  }

  $("[id=manage-policies]").click(function() {
    buildModelDataDisplay(config.jsonData, config.selectedPolicy);

    $('#policy-row-add').on('click', 'tr', function(){
      setNewActivePolicy(this);
    });
  });
};

var displayModelName = function(modelName) {
  $("[id=new_model_name]").value = modelName; // model name in popup
  $("#current-model-name").html(modelName); // model name in settings panel
  if (modelName === '') {
    modelName = 'MapModelViz';
  }
  $("#model-name").html(modelName); // model name in main title
};
var saveModelName = function() {
  var modelName = $("[id=new_model_name]")[0].value;
  config.modelName = modelName;
  displayModelName(modelName);
};

/** GeoJSON Settings **/
var displayGeoJsonFile = function(file) {
  $("[id=geojson-file]").html(file.name);
};

/** Model Data Settings **/
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
    config.jsonData.push(newPolicies);
  }
  if (pendingActivePolicy !== '' && config.selectedPolicy !== pendingActivePolicy) {
    config.selectedPolicy = pendingActivePolicy;
    displayActivePolicy(config.selectedPolicy);

    loadModelData();
  }
};
var loadModelData = function() {
  if (config.jsonData.length === 0) {
    addGeoJSONLayer();
  }

  config.jsonData.forEach(function(dataset){
    if (dataset.name === config.selectedPolicy) {
      config.geoAreaId = dataset.geoAreaId;
      config.mappedProperty = dataset.mappedProperty;

      var url = dataset.file.url;
      if (!url || url === '') {
        url = URL.createObjectURL(dataset.file);
      }
      loadCSVData(dataset, url);

    } else {
      dataset.data = null;
    }
  });
};
var loadCSVData = function(dataset, url) {
  $.ajax({
    type: "GET",
    url: url,
    dataType: "text",
    success: function(data) {
      var parsed = processData(data, dataset.geoAreaId);
      dataset.data = parsed.data;
      config.timeSeries = parsed.timeSeries;
      config.currentIndex = config.timeSeries[0];
      updateMapData();
      loadDetails();
    },
    error: function(data) {
      console.error( "error loading model data: " + err );
      loadDetails();
    }
  });
};
var processData = function(allText, geoAreaId) {
  var allTextLines = allText.split(/\r\n|\n/);
  var headers = allTextLines[0].split(',');
  var parsed = {};

  var timeIdx = headers.indexOf('Time') + 1;
  var timeSeries = headers.slice(timeIdx);

  var geoAreaIdx = headers.indexOf(geoAreaId);

  for (var i=1; i<allTextLines.length; i++) {
    var data = allTextLines[i].split(',');

    if(!(data[geoAreaIdx] in parsed)){
      parsed[data[geoAreaIdx]] = {}
      for (var idx = 0; idx < timeIdx - 1; idx++) {
        // if (idx !== geoAreaIdx) {
          parsed[data[geoAreaIdx]][headers[idx]] = data[idx];
        // }
      }
    }
    parsed[data[geoAreaIdx]][data[timeIdx - 1]] = data.slice(timeIdx);
  }

  var values = Object.keys(parsed).map(function(key){
    return parsed[key];
  });
  return {timeSeries: timeSeries, data: values};
};
var loadJSONData = function(url) {
  $.getJSON(url, function(json) {
    dataset.data = json;
  })
  .done(function() {
    updateMapData();
    loadDetails();
  })
  .fail(function(err) {
    console.error( "error loading model data: " + err );
    loadDetails();
  })
}

/** Choropleth Settings **/
var displayCurrentChoropleth = function(currentChoropleth) {
  $("#current-color-settings").html(buildChoroplethDisplay(currentChoropleth));
};
var buildChoroplethSelection = function() {
  pendingNewColor = '';
  var currentChoropleth = findChoropleth(config.choroplethString);

  $("#current-color-selection").html(buildChoroplethDisplay(config.choropleth));
  $("#color-select-add tr").remove();

  var numColors = parseInt($("#color-number-dropdown")[0].value);
  for (var color in choroplethColors) {
    if (choroplethColors[color][numColors] !== undefined) {
      var content = buildChoroplethDisplay(choroplethColors[color][numColors]);

      var divContent = '<tr id="' + color + '">';
      if (currentChoropleth === choroplethColors[color][numColors]) {
        divContent = '<tr id="' + color + '" class="table-primary">';
      }

      divContent += '<td class="color-name">' + color + '</td>';
      divContent += '<td class="choropleth-display">' + content + '</td>';
      divContent += '</tr>';

      $("#color-select-add").append(divContent);
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
var selectNewChoropleth = function(row) {
  $(row).addClass('table-primary').siblings().removeClass('table-primary');
  pendingNewColor = row.id;
};
var saveChoroplethSelection = function() {
  if (pendingNewColor != '') {
    var numColors = $('#color-number-dropdown')[0].value;
    config.choropleth = choroplethColors[pendingNewColor][numColors];
    config.choroplethString = pendingNewColor + "[" + numColors + "]";
    pendingNewColor = '';

    $("#current-color-selection").html(buildChoroplethDisplay(config.choropleth));
    displayCurrentChoropleth(config.choropleth);
    updateMapData();
  }
};

/** Export Config **/
var saveConfigAsFile = function() {
  var config = {
    modelName: config.modelName,

    choroplethString: config.choroplethString,
    geoJson: {
      file: {
        name: config.geoJson.file.name
      },
      text: config.geoJson.text
    },
    jsonData: config.jsonData,
    selectedPolicy: config.selectedPolicy
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

export { loadSettings, loadOptionalConfig };
