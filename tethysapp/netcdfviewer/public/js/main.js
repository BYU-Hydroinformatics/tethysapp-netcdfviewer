let firstlayeradded = false;
let files = [];
let wmsurl = '';
let odurl = '';
let netcdfSubset = '';
let shpfileAdded = false;

add_user_layers();

function get_metadata() {
  $.ajax({
    url: '/apps/netcdfviewer/metadata/',
    data: {'odurl': odurl,},
    dataType: 'json',
    contentType: "application/json",
    method: 'GET',
    success: function (result) {
      var variables = result['variables'];
      var attrs = result['attrs'];
      var dims = result['dims'];
      print_metadata(variables, attrs, dims);
      update_wmslayer();
    }
  })
}

function update_wmslayer() {
  if (firstlayeradded == true) {
    layerControlObj.removeLayer(dataLayerObj);
  }
  dataLayerObj = data_layer();
  dataLayerObj.setOpacity($('#opacity-slider').val());
  layerControlObj.addOverlay(dataLayerObj, 'netcdf Layer');
}

function print_metadata(variables, attrs, dims) {
  var html = '';
  var html2 = '';
  var html3 = '';
  var html4 = '';
  for (let vars in variables) {
    html += '<option>' + vars + '</option>';
  }
  for (var i = 0; i < dims.length; i++) {
    html2 += '<option>' + dims[i] + '</option>';
  }
  for (var att in attrs) {
    html3 += '<b style="padding-left: 40px">' + att + ':<b/><p style="padding-left: 40px">' + attrs[att] + '</p>';
  }
  for (var varb in variables) {
    html4 += '<b style="padding-left: 40px">' + varb + ':<b/>'
    for (var attr in variables[varb]) {
      html4 += '<p style="padding-left: 40px">' + attr + ': ' + variables[varb][attr] + '</p>';
    }
  }
  $('#variable-input').empty();
  $('#variable-input').append(html);
  $('#variable-input option:nth-child(2)').attr('selected', 'selected');
  $('#time').empty();
  $('#time').append(html2);
  $('#lat').empty();
  $('#lat').append(html2);
  $('#lat option:nth-child(2)').attr('selected', 'selected');
  $('#lng').empty();
  $('#lng').append(html2);
  $('#lng option:nth-child(3)').attr('selected', 'selected');
  $('#metadata-div').empty();
  $('#metadata-div').append(html3);
  $('#var-metadata-div').empty();
  $('#var-metadata-div').append(html4);
  $('#file-metadata-button').css('background-color', 'rgba(205, 209, 253, 1)');
}

function update_filepath() {
  var newURL = ''
  var cont = true;
  var href = $(this).attr('id');
  var currentURL = $('#url-input').val();
  var hrefArray = href.split('/')
  var currentArray = currentURL.split('/');

  if (currentURL !== files[files.length - 1]) {
    files.push(currentURL);
  }

  currentArray.forEach(function (val, index,) {
    hrefArray.forEach(function (val2, index2) {
      if (val == val2 && val == 'thredds' && cont == true) {
        for (var i = index; i <= currentArray.length; i++) {
          currentArray.pop();
        }
        for (var i = 0; i <= hrefArray.length - 1; i++) {
          currentArray.push(hrefArray[i]);
        }
        cont = false;
      }
    });
  });

  if (cont == true) {
    currentArray.pop();
    for (var i = 0; i <= hrefArray.length - 1; i++) {
      currentArray.push(hrefArray[i]);
    }
  }

  currentArray.forEach(function (value, i) {
    if (value == '' || value == undefined) {
      currentArray.splice(i, 1);
    }
    if (i == 0) {
      newURL = currentArray[i];
    } else if (i == 1) {
      newURL = newURL + '//' + currentArray[i];
    } else {
      newURL = newURL + '/' + currentArray[i];
    }
  })
  $('#url-input').val(newURL)
  get_files(newURL);
}

function get_files(url) {
  $.ajax({
    url: '/apps/netcdfviewer/files/',
    data: {'url': url,},
    dataType: 'json',
    contentType: "application/json",
    method: 'GET',
    success: function (result) {
      var passedFiles = result['files'];
      var folder = result['folder'];
      var correctURL = result['correct_url'];
      if (correctURL.substr(0, 4) == 'http') {
        $('#url-input').val(correctURL);
      }
      if (passedFiles == false) {
        $('#metadata-div').empty();
        $('#metadata-div').append('<p style="padding: 10px 0px 10px 40px">NO DATA!!!</p>');
      } else if (folder == true) {
        var html = ''
        if(passedFiles.length < 1 || passedFiles == undefined){
          html = '<div style="width: 100%; height: 30px;"><p>No Files Found!!!</p></div>'
        } else {
          for (var file in passedFiles) {
            html += '<div id="' + passedFiles[file] + '" class="file" style="width: 100%; height: 30px;" ' +
                'onclick="update_filepath.call(this)"><p>' + file + '</p></div>';
          }
        }
        $('#filetree-div').empty();
        $('#filetree-div').append(html);
      } else {
        var currentURL = $('#url-input').val();
        currentURL = currentURL.split('/thredds/')[0];
        wmsurl = currentURL + passedFiles['WMS:'];
        odurl = currentURL + passedFiles['OPENDAP:'];
        netcdfSubset = currentURL + passedFiles['NetcdfSubset:']
        var newURL = files[files.length - 1]
        $('#url-input').val(newURL)
        get_files(newURL);
        files.pop();
        get_metadata();
      }
    }
  });
}

$('#up-file').click(function () {
  if (files.length !== 0) {
    var newURL = files[files.length - 1]
    $('#url-input').val(newURL);
    get_files(newURL);
    files.pop();
  }
})

$('#url-input').change(function () {get_files($('#url-input').val());});
$('#variable-input').change(function () {update_wmslayer();});
$('#wmslayer-style').change(function () {update_wmslayer();});
$('#wmslayer-bounds').change(function () {update_wmslayer();});
$('#opacity-slider').change(function () {dataLayerObj.setOpacity($('#opacity-slider').val())});
$('#upload-shp').click(function() {$('#uploadshp-modal').modal('show')});
$('#file-metadata-button').click(function() {
  $('#var-metadata-div').css('display', 'none');
  $('#metadata-div').css('display', 'block');
  $('#file-metadata-button').css('background-color', 'rgba(205, 209, 253, 1)');
  $('#var-metadata-button').css('background-color', 'rgba(130, 141, 205, 1)');
});
$('#var-metadata-button').click(function() {
  $('#metadata-div').css('display', 'none');
  $('#var-metadata-div').css('display', 'block');
  $('#var-metadata-button').css('background-color', 'rgba(205, 209, 253, 1)');
  $('#file-metadata-button').css('background-color', 'rgba(130, 141, 205, 1)');
});
