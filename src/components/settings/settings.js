import choroplethColors from '../../util/colors.js';
import { displayMessage } from '../../util/util.js';
import { updateMapData, addGeoJSONLayer } from '../mapview/map.js';
import { loadDetails, updateFeatureDetails } from '../details/details.js';

var policieshtml = require('./policies.html');
var nameselector = require('./nameSelector.html');
var modelselector = require('./modelSelector.html');
var exportselector = require('./exportSelector.html');
var colorselector = require('./colorSelector.html');

var pendingNewColor = '';
var pendingChoroplethString = '';
var openDataset = null;
var pendingChoropleth = null;

var openedDropdown = false;
var closedByButton = false;

var loadOptionalConfigAndSettings = function() {
  var configFileURL = 'assets/config.json';
  $.getJSON(configFileURL, function(json) {
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

var btnGroupHandlerPrevent = function(event) {
  if (event.target.id.includes('dataset')) {
    event.preventDefault();
    return false;
  }

  var desc = event.target.id.split('_');
  config.jsonData.forEach(function(dataset, index) {
    if (parseInt(desc[0]) === index) {
      if (dataset.displayStatus === 'primary' && desc[2] !== 'primary') {
        //Trying to change off of primary. Show alert.
        displayMessage('You must have at least one primary policy. To change the primary policy, select another policy from the list.');
      }
    }
  });

  event.preventDefault();
  return false;
};
var btnGroupHandlerUpdate = function(event) {
  var target = event.target;
  if (!target.id.includes('dataset')) {
    var desc = target.id.split('_');
    updateDatasetDisplay(desc[0], desc[2], false);
  }
};

var loadSettings = function() {
  $("#settings-content").html(policieshtml);

  $("#name-popup").html(nameselector);
  $("#model-popup").html(modelselector);
  $("#export-popup").html(exportselector);
  $("#color-popup").html(colorselector);

  $('#show-settings').bind('click', function(event) {
		$('#show-settings').dropdown();
    closedByButton = openedDropdown;
  });
  $(".dropdown").on("shown.bs.dropdown", function(event){
    openedDropdown = true;
  });
  $(".dropdown").on("hide.bs.dropdown", function(event){
    return closedByButton;
  });
  $(".dropdown").on("hidden.bs.dropdown", function(event){
    openedDropdown = false;
    closedByButton = false;
  });

  /***********************
   * Model Name Stuff
   ***********************/
  // displayModelName(config.modelName);
  // $("[id=name-change-save]").click(function() {
  //   saveModelName();
  // });

  /***********************
   * Main Page Model Datasets
   ***********************/
  displayModelData();

  $('.btn-group').on("click", ".disabled", btnGroupHandlerPrevent);
  $('.btn-group').on("click", btnGroupHandlerUpdate);

  // $('#model-modal').on('hidden.bs.modal', function() {
      // $('#dataset-form').formValidation('resetForm', true);
  // });

  $("#dataset-form").on("submit", function(event) {
    var theform = $("#dataset-form")[0];
    if (theform.checkValidity() === false
        || pendingChoropleth === null
        || $("#geojson-file-selected-name").html() === ''
        || $("#policy-file-selected-name").html() === '') {
      event.preventDefault();
      event.stopPropagation();
      theform.classList.add('was-validated');
      if (pendingChoropleth === null) {
        $('#current-color-settings').addClass('is-invalid')
      } else {
        $('#current-color-settings').addClass('is-valid');
      }
      if ($("#geojson-file-selected-name").html() === '') {
        $('#geojson-file-selected-name').addClass('is-invalid')
      }
      if ($("#policy-file-selected-name").html() === '') {
        $('#policy-file-selected-name').addClass('is-invalid')
      }

      return false;
    }
    var formtype = $("#dataset-form").attr('formtype');
    if (formtype === 'new') {
      addModelDetails();
    } else if (formtype === 'edit') {
      saveModelDetails();
    } else {
      saveModelDetails_OK();
    }
    $('#model-modal').modal('hide')
    return false;
  });

  /***********************
   * Configuring model datasets
   ***********************/
  if (config.allowFileUpload) {
    $("[id=dataset-add-btn]").on('click', function(){
        newDataset();
    });

    $('#policies-body').on('click', 'tr', function(event){
      var target = $(event.target)[0];
      if (target.tagName === 'TD' || target.tagName === 'TR') {
        editDataset(this);
      }
    });

    $("[id=policy-data-save]").on('click', function() {
      // saveModelDetails();
      return $("#dataset-form").submit();
    });
    $("[id=policy-data-add]").on('click', function() {
      // addModelDetails();
      $("#dataset-form").submit();
    });

    $("[id=dataset-add-btn]").show();
  } else {
    $('#policies-body').on('click', 'tr', function(event){
      var target = $(event.target)[0];
      if (target.tagName === 'TD' || target.tagName === 'TR') {
        viewDataset(this);
      }
    });
    $("[id=policy-data-ok]").click(function() {
      // saveModelDetails_OK();
      $("#dataset-form").submit();
    });

    $("[id=dataset-add-btn]").hide();
  }

  /***********************
   * File Management
   ***********************/
  $("[id=policy-file-selector]").change(function() {
    $("[id=policy-file-selected-name]").html(this.files[0].name);
  });
  $("[id=geojson-file-selector]").change(function() {
    $("[id=geojson-file-selected-name]").html(this.files[0].name);
  });

  /***********************
   * Exporting config data
   ***********************/
  if (config.allowFileUpload) {
    $("[id=export-save]").click(function() {
      saveConfigAsFile();
    });
  } else {
    $("[id=export-config-btn]").hide();
  }

  /***********************
   * Choropleth Configuration
   ***********************/
  if (config.allowFileUpload) {
    $("#choropleth-input").on('click', function() {
      buildChoroplethSelection();
      $('#color-modal').modal('show');
    });
    $('#color-select-add').on('click', 'tr', function(){
      selectNewChoropleth(this);
    });
    $("#color-number-dropdown").change(function() {
      buildChoroplethSelection();
    });
    $("#choropleth-change-save").click(function() {
      saveChoroplethSelection();
    });
  }
};

/** Model Name Configuration **/
var displayModelName = function(modelName) {
  $("#new_model_name").val(modelName); // model name in popup
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

/** Main Model Data Table **/
var displayModelData = function() {
  if (config.jsonData.length == 0) {
    $("[id=no-policies]").show();
    $("[id=policies-list]").hide();
  } else {
    $("[id=no-policies]").hide();
    $("[id=policies-list]").show();

    config.jsonData.forEach(function(policy, index) {
      $("#policies-body").append(buildRow(policy, index));
    });
  }
}
var addModelDataRow = function(newDataset) {
  if (config.jsonData.length === 1) {
    $("[id=no-policies]").hide();
    $("[id=policies-list]").show();
  }
  $("#policies-body").append(buildRow(newDataset, config.jsonData.length-1));
};
var buildRow = function(dataset, index) {
  var divContent = '<tr>';
  divContent += '<td id="' + index + '_propname" style="vertical-align:middle;">' + dataset.name + '</td>';
  divContent += '<td>' + displayButtons(dataset, index) + '</td>';
  divContent += '</tr>';
  return divContent;
};
var displayButtons = function(dataset, index) {
  var div = '<div class="btn-group btn-group-toggle" data-toggle="buttons" style="width:100%;">';

  if (dataset.displayStatus === 'primary') {
    div += buildButton(index,'Primary','active','');
    div += buildButton(index,'Secondary','','disabled');
    div += buildButton(index,'Off','','disabled');
  } else if (dataset.displayStatus === 'secondary') {
    div += buildButton(index,'Primary','','');
    div += buildButton(index,'Secondary','active','');
    div += buildButton(index,'Off','','');
  } else {
    div += buildButton(index,'Primary','','');
    div += buildButton(index,'Secondary','','');
    div += buildButton(index,'Off','active','');
  }
  div += '</div>'

  return div;
}
var buildButton = function(id, displayType, activeClass, disabledClass) {
  var checked = '';
  if (activeClass) {
    checked = 'checked';
  }
  var div = '<label id="' + id + '_display_' + displayType.toLowerCase() + '_label" class="btn btn-secondary btn-sm ' + activeClass + ' ' + disabledClass + '">';
  div +=      '<input type="radio" name="options" id="' + id + '_display_' + displayType.toLowerCase() + '" autocomplete="off" ' + checked + '> ' + displayType;
  div +=    '</label>';
  return div;
}

var newDataset = function() {
  $('#model_modal_title').html('Add Model Data Configuration');
  $('#dataset-form').removeClass('was-validated');
  $('#current-color-settings').removeClass('is-invalid');
  $('#current-color-settings').removeClass('is-valid');
  $('#policy-file-selected-name').removeClass('is-invalid');
  $('#geojson-file-selected-name').removeClass('is-invalid');

  //TODO reset all form fields
  $("#new_policy_name").val('');
  $("#policy-file-selected-name").text('Choose File');
  $("#geojson-file-selected-name").text('Choose File');
  $("#geo_id_property").val('');
  $("#mapped_property_name").val('');
  $("#geo_display_property").val('');
  $("#current-color-settings").html('');

  $("#scale_logarithmic").checked = false;
  $("#scale_logarithmic_label").removeClass('active');
  $("#scale_linear").checked = true;
  $("#scale_linear_label").addClass('active');

  $("#dataset_primary").checked = false;
  $("#dataset_primary_label").removeClass('active');
  $("#dataset_secondary").checked = false;
  $("#dataset_secondary_label").removeClass('active');
  $("#dataset_secondary_label").removeClass('disabled');
  $("#dataset_off").checked = true;
  $("#dataset_off_label").addClass('active');
  $("#dataset_off_label").removeClass('disabled');

  $("#policy-data-add").show();
  $("#policy-data-save").hide();
  $("#policy-data-ok").hide();

  $("#dataset-form").attr("formType", "new");

  $('#model-modal').modal('show');
}
var editDataset = function(row) {
  var dataToEdit = row.children[0].innerText;

  $('#model_modal_title').html('Edit Model Data Configuration');

  $('#dataset-form').removeClass('was-validated');
  $('#current-color-settings').removeClass('is-invalid');
  $('#current-color-settings').removeClass('is-valid');
  $('#policy-file-selected-name').removeClass('is-invalid');
  $('#geojson-file-selected-name').removeClass('is-invalid');

  $('#current-color-settings-holder').addClass('col-sm-6');
  $('#current-color-settings-holder').removeClass('col-sm-9');

  $("#geojson-file-selected-name").removeClass('disabled-file-selector');
  $("#policy-file-selected-name").removeClass('disabled-file-selector');

  $("#policy-data-add").hide();
  $("#policy-data-save").show();
  $("#policy-data-ok").hide();

  loadModelDetails(dataToEdit);

  $("#dataset-form").attr("formType", "edit");

  $('#model-modal').modal('show');
}
var viewDataset = function(row) {
  var dataToEdit = row.children[0].innerText;

  $('#model_modal_title').html('View Model Data Configuration');

  $('#dataset-form').removeClass('was-validated');
  $('#current-color-settings').removeClass('is-invalid');
  $('#current-color-settings').removeClass('is-valid');
  $('#policy-file-selected-name').removeClass('is-invalid');
  $('#geojson-file-selected-name').removeClass('is-invalid');

  $("#new_policy_name").attr("disabled", "disabled");
  $("#geojson-file-selector").attr("disabled", "disabled");
  $("#policy-file-selector").attr("disabled", "disabled");
  $("#geojson-file-selected-name").addClass('disabled-file-selector');
  $("#policy-file-selected-name").addClass('disabled-file-selector');

  $("#geo_id_property").attr("disabled", "disabled");
  $("#mapped_property_name").attr("disabled", "disabled");
  $("#geo_display_property").attr("disabled", "disabled");

  $("#change-color-btn").hide();
  $('#current-color-settings-holder').removeClass('col-sm-6');
  $('#current-color-settings-holder').addClass('col-sm-9');

  $("#policy-data-add").hide();
  $("#policy-data-save").hide();
  $("#policy-data-ok").show();

  loadModelDetails(dataToEdit);

  $("#dataset-form").attr("formType", "view");

  $('#model-modal').modal('show');
}
var loadModelDetails = function(dataToEdit) {
  for (var i = 0; i < config.jsonData.length; i++) {
    if (config.jsonData[i].name === dataToEdit) {
      openDataset = config.jsonData[i]
      break;
    }
  }

  $("#new_policy_name").val(openDataset.name);
  $("#policy-file-selected-name").text(openDataset.file.name);
  $("#geojson-file-selected-name").text(openDataset.geoJSON.file.name);
  $("#geo_id_property").val(openDataset.geoAreaId);
  $("#mapped_property_name").val(openDataset.mappedProperty);
  $("#geo_display_property").val(openDataset.geoJSON.text);

  var choropleth = findChoropleth(openDataset.choroplethString);
  $("#current-color-settings").html(buildChoroplethDisplay(choropleth));

  pendingChoroplethString = openDataset.choroplethString;
  pendingChoropleth = choropleth;

  if (openDataset.scale == 'linear') {
    $("#scale_linear").checked = true;
    $("#scale_linear_label").addClass('active');

    $("#scale_logarithmic_label").removeClass("active");
    $("#scale_logarithmic").checked = false;
  } else if (openDataset.scale == 'logarithmic') {
    $("#scale_linear").checked = false;
    $("#scale_linear_label").removeClass('active');

    $("#scale_logarithmic_label").addClass("active");
    $("#scale_logarithmic").checked = true;
  }

  if (openDataset.displayStatus === 'primary') {
    $("#dataset_primary").checked = true;
    $("#dataset_primary_label").addClass('active');

    $("#dataset_secondary_label").addClass("disabled");
    $("#dataset_off_label").addClass("disabled");
  } else if (openDataset.displayStatus === 'secondary') {
    $("#dataset_secondary").checked = true;
    $("#dataset_secondary_label").addClass('active');

    $("#dataset_primary_label").removeClass("active");
    $("#dataset_off_label").removeClass("active");

    $("#dataset_secondary_label").removeClass("disabled");
    $("#dataset_off_label").removeClass("disabled");
  } else {
    $("#dataset_off").checked = true;
    $("#dataset_off_label").addClass('active');

    $("#dataset_primary_label").removeClass("active");
    $("#dataset_secondary_label").removeClass("active");

    $("#dataset_secondary_label").removeClass("disabled");
    $("#dataset_off_label").removeClass("disabled");

  }
};

/** Model Data Changes **/
var saveModelDetails_OK = function() {
  var displayStatus = $('#dataset-display label.active input').val();
  var scale = $('#scale-display label.active input').val();
  if (openDataset.displayStatus !== displayStatus || openDataset.scale !== scale) {
    for (var i = 0; i < config.jsonData.length; i++) {
      if (config.jsonData[i].name === openDataset.name) {
        selectDisplayButton(i, openDataset.name, displayStatus);
        updateDatasetDisplay(i,displayStatus, openDataset.scale == scale);
        return;
      }
    }
  }
  openDataset = null;
};
var saveModelDetails = function() {
  var displayStatus = $('#dataset-display label.active input').val();
  var scale = $('#scale-display label.active input').val();

  var updatedDataset = buildDataset();

  var changed = false;
  var scaleChanged = false;
  if (openDataset.name !== updatedDataset.name) {
    changed = true;
    openDataset.name = updatedDataset.name;
  }
  if (updatedDataset.file !== undefined && updatedDataset.file !== null && openDataset.file.name !== updatedDataset.file.name) {
    changed = true;
    openDataset.file = updatedDataset.file;
  }
  if (updatedDataset.geoJSON.file !== undefined && updatedDataset.geoJSON.file !== null && openDataset.geoJSON.file.name !== updatedDataset.geoJSON.file.name) {
    changed = true;
    openDataset.geoJSON.file = updatedDataset.geoJSON.file;
  }
  if (openDataset.geoAreaId !== updatedDataset.geoAreaId) {
    changed = true;
    openDataset.geoAreaId = updatedDataset.geoAreaId;
  }
  if (openDataset.mappedProperty !== updatedDataset.mappedProperty) {
    changed = true;
    openDataset.mappedProperty = updatedDataset.mappedProperty;
  }
  if (openDataset.displayStatus !== updatedDataset.displayStatus) {
    changed = true;
  }
  if (openDataset.scale !== updatedDataset.scale) {
    changed = true;
    scaleChanged = true;
    openDataset.scale = updatedDataset.scale;
  }
  if (openDataset.choroplethString !== updatedDataset.choroplethString) {
    changed = true;
    openDataset.choroplethString = updatedDataset.choroplethString;
    openDataset.choropleth = updatedDataset.choropleth;
  }
  if (openDataset.geoJSON.text !== updatedDataset.geoJSON.text) {
    changed = true;
    openDataset.geoJSON.text = updatedDataset.geoJSON.text;
  }

  if (changed) {
    for (var i = 0; i < config.jsonData.length; i++) {
      if (config.jsonData[i].name === openDataset.name) {
        selectDisplayButton(i, openDataset.name, displayStatus);
        updateDatasetDisplay(i,displayStatus, scaleChanged);
        return;
      }
    }
  }

  openDataset = null;
};
var addModelDetails = function() {
  var displayStatus = $('#dataset-display label.active input').val();

  $('.btn-group').off( "click", ".disabled", btnGroupHandlerPrevent);
  $('.btn-group').off("click", btnGroupHandlerUpdate);

  config.jsonData.push(buildDataset());

  addModelDataRow(config.jsonData[config.jsonData.length - 1]);
  updateDatasetDisplay(config.jsonData.length - 1, displayStatus, true);

  openDataset = null;

  $('.btn-group').on("click", ".disabled", btnGroupHandlerPrevent);
  $('.btn-group').on("click", btnGroupHandlerUpdate);
};
var buildDataset = function() {
  var newDataset = {
    name: $("#new_policy_name").val(),
    data: null,
    scale: $('#scale-display label.active input').val(),
    file: $("#policy-file-selector")[0].files[0],
    geoAreaId: $("#geo_id_property").val(),
    mappedProperty: $("#mapped_property_name").val(),
    displayStatus: $('#dataset-display label.active input').val(),
    choroplethString: pendingChoroplethString,
    choropleth: pendingChoropleth,
    geoJSON: {
      file: $("#geojson-file-selector")[0].files[0],
      text: $("#geo_display_property").val(),
    }
  };

  pendingChoropleth = null;
  pendingChoroplethString = '';

  return newDataset;

}
var selectDisplayButton = function(index, displayName, displayStatus) {
  $('#' + index + '_display_' + 'primary' + '_label').removeClass("active");
  $('#' + index + '_display_' + 'primary').checked = false;
  $('#' + index + '_display_' + 'secondary' + '_label').removeClass("active");
  $('#' + index + '_display_' + 'secondary').checked = false;
  $('#' + index + '_display_' + 'off' + '_label').removeClass("active");
  $('#' + index + '_display_' + 'off').checked = false;

  $('#' + index + '_display_' + displayStatus + '_label').addClass("active");
  $('#' + index + '_display_' + displayStatus).checked = true;

  $('#' + index + '_propname').html(displayName);
};

// Select a new active policy from the main settings window
var updateDatasetDisplay = function(clickedIndex, displayStatus, scaleChanged=false) {
  var update = false;
  config.jsonData.forEach(function(dataset, index) {
    if (displayStatus === 'primary') {
      if (parseInt(clickedIndex) === index) {
        if (dataset.displayStatus !== 'primary') {
          update = true;
        } else if (dataset.displayStatus === 'primary' && scaleChanged) {
          update = true;
        }

        dataset.displayStatus = 'primary';
        config.activePolicy = dataset;
        config.activePolicyName = dataset.name;

        $('#' + index + '_display_secondary_label').addClass("disabled");
        $('#' + index + '_display_off_label').addClass("disabled");
      } else {
        if (dataset.displayStatus === 'primary') {
          dataset.displayStatus = 'off';

          $('#' + index + '_display_secondary_label').removeClass("disabled");
          $('#' + index + '_display_off_label').removeClass("disabled");
          selectDisplayButton(index, dataset.name, 'off');
        }
      }
    } else {
      if (parseInt(clickedIndex) === index) {
        dataset.displayStatus = displayStatus;
        if (displayStatus === 'secondary') {
          var url = dataset.file.url;
          if (!url || url === '') {
            url = URL.createObjectURL(dataset.file);
          }
          loadCSVData(dataset, url, false);
        } else {
          dataset.data = null;
          updateFeatureDetails();
        }
      }
    }
  });

  if (update) {
    loadModelData();
  }
};

var loadModelData = function() {
  if (config.jsonData.length === 0) {
    return;
  }

  if (config.activePolicy === null) {
    for (var i = 0; i < config.jsonData.length; i++) {
      var dataset = config.jsonData[i];
      if (dataset.name === config.activePolicyName) {
        config.activePolicy = dataset;
        break;
      } else {
        if (dataset.displayStatus === 'secondary') {
          var url = dataset.file.url;
          if (!url || url === '') {
            url = URL.createObjectURL(dataset.file);
          }
          loadCSVData(dataset, url, false);
        }
      }
    }
    if (config.activePolicy === null) {
      return;
    }
  }

  config.geoAreaId = config.activePolicy.geoAreaId;
  config.mappedProperty = config.activePolicy.mappedProperty;
  config.geoTextProperty = config.activePolicy.geoJSON.text;
  config.choropleth = findChoropleth(config.activePolicy.choroplethString);

  var url = config.activePolicy.file.url;
  if (!url || url === '') {
    url = URL.createObjectURL(config.activePolicy.file);
  }
  loadCSVData(config.activePolicy, url, true);
};
var loadCSVData = function(dataset, url, update) {
  if (dataset.data !== null && dataset.data !== undefined) {
    updateMapDataset(dataset);
    return;
  }

  $.ajax({
    type: "GET",
    url: url,
    dataType: "text",
    success: function(data) {
      var parsed = processData(data, dataset.geoAreaId);
      dataset.data = parsed.data;
      dataset.timeSeries = parsed.timeSeries
      if (update) {
        updateMapDataset(dataset);
      } else {
        updateFeatureDetails();
      }
    },
    error: function(err) {
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
  if (geoAreaIdx === -1) {
    console.log('Unable to find common geo area id. Could not process data.');
    displayMessage('Unable to find the common geo area id in model data, so could not properly process it. Visuals will not be displayed for current primary.');
    return {timeSeries: timeSeries, data: null};
  }

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
var updateMapDataset = function(dataset) {
  config.timeSeries = dataset.timeSeries;
  config.currentIndex = 0;
  updateMapData();
  loadDetails();
}

/** Choropleth Settings **/
var buildChoroplethSelection = function() {
  pendingNewColor = '';

  if (openDataset !== null) {
    var currentChoropleth = findChoropleth(openDataset.choroplethString);
    $("#current-color-selection").html(buildChoroplethDisplay(currentChoropleth));
  }
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
    var numColors = $('#color-number-dropdown').val();
    pendingChoropleth = choroplethColors[pendingNewColor][numColors];
    pendingChoroplethString = pendingNewColor + '[' + numColors + ']';
    pendingNewColor = '';

    $("#current-color-settings").html(buildChoroplethDisplay(pendingChoropleth));
    $('#current-color-settings').removeClass('is-invalid')
  }
};

/** Export Config **/
var saveConfigAsFile = function() {
  var savedConfig = {
    modelName: config.modelName,
    playbackSpeed: config.playbackSpeed,
    choroplethString: config.choroplethString,
    jsonData: config.jsonData,
    activePolicyName: config.activePolicy.name
  };
  savedConfig.jsonData.forEach(function(dataset) {
    delete dataset.data;
    delete dataset.timeseries;
  });
  var editable = $('#allow-file-change label.active input').val();
  savedConfig.allowFileUpload = editable == 'Yes';
  debugger;

  var textToWrite = JSON.stringify(savedConfig);
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

export { loadOptionalConfigAndSettings };
