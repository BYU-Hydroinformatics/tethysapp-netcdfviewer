// find if method is csrf safe
function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

// add csrf token to appropriate ajax requests
$(function() {
    $.ajaxSetup({
        beforeSend: function(xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", getCookie("csrftoken"));
            }
        }
    });
});

function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = jQuery.trim(cookies[i]);
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

///////////////////////////////////////////////////////////////////////////////////////////////////
//LOAD EXISTING USER LAYERS TO MAP
function add_user_layers() {
  $.ajax({
    url: 'shapefile/user_geojsons/',
    dataType: 'json',
    contentType: "application/json",
    method: 'GET',
    success: function (result) {
      let filenames = jQuery.parseJSON(result['filenames']);
      var geojson = jQuery.parseJSON(result['geojson']);
      if (filenames !== []) {
        $('#shp-select').append('<option value="" disabled selected hidden>Zoom To Layer</option>');
        $('#properties').append('<option value="" disabled selected hidden></option>');
        for (var i = 0, len = geojson.length; i < len; i++) {
          let current_layer = jQuery.parseJSON(geojson[i]);
          let geojson_layer = make_file_layer(current_layer);

          $('#shp-select').append('<option id="' + filenames[i].split(" ").join("") + '" value="' + filenames[i] + '">' + filenames[i] + '</option>');
          $('#' + filenames[i].split(" ").join("") + '').data('layer', geojson_layer);

          let option_insert = '';
          let option_keys = Object.keys(current_layer.features[0].properties);
          for(var s = 0, leng = (option_keys).length; s < leng; s++) {
            option_insert = option_insert + '<option value="' + option_keys[s] + '">' + option_keys[s] + '</option>';
          }

          $('#' + filenames[i].split(" ").join("") + '').data('options', option_insert);
          $('#' + filenames[i].split(" ").join("") + '').data('option_keys', option_keys);
          $('#' + filenames[i].split(" ").join("") + '').data('name', filenames[i].split(" ").join(""));
        }
      }
    },
  });
}


//Create a geojson layer on the map using the shapefile the user uploaded
function make_file_layer(geojson) {
    let polygons = geojson;
    let style = {
        "color": "#ffffff",
        "weight": 1,
        "opacity": 0.40,
    };
    user_layer =  L.geoJSON(polygons, {
        style: style,
        onEachFeature: EachFeature,
    });
    shpfileAdded = true;
    return user_layer.addTo(shpLayer);
}

//Set the popup for each feature
function EachFeature(feature, layer) {
    layer.on('click', function(){
        $('#shp-select > option').each(function() {
            let id = $(this).val();
            if (id != '') {
                let prop = Object.keys(feature.properties);
                let prop2 = $('#' + id + '').data('option_keys');
                let name = $('#' + id + '').data('name');
                if (String(prop) == String(prop2) | String(id) != String(name)) {
                    $('#shp-select').val(name).change();
                }
            }
        });
/*        layer.bindPopup('<div id="name-insert" style="text-align: center">'
                        + '<h1>' + feature.properties[$('#properties').val()] + '</h1></div>'
                        + '<br><button id="get-timeseries" style="width: 100%; height: 50px;'
                        + 'background-color: aqua" onclick="timeseriesFromShp(`' + String(feature.properties[$('#properties').val()]) + '`)">'
                        + 'Get Timeseries</button><div id="loading" class="loader"></div>');*/
    });
}


//ADD A USER SHAPEFILE TO THE MAP
//Ajax call to send the shapefile to the client side
function uploadShapefile() {
    let files = $('#shapefile-upload')[0].files;

    if (files.length !== 4) {
        alert('The files you selected were rejected. Upload exactly 4 files ending in shp, shx, prj and dbf.');
        return
    }

    let data = new FormData();
    Object.keys(files).forEach(function (file) {
        data.append('files', files[file]);
    });

    $.ajax({
        url: '/apps/netcdfviewer/shapefile/uploadShapefile/',
        type: 'POST',
        data: data,
        dataType: 'json',
        processData: false,
        contentType: false,
        success: function (result) {
            let id = jQuery.parseJSON(result['filenames']);
            $('#shp-select').empty();
            if (shpfileAdded == true) {
                mapObj.removeLayer(user_layer);
            }
            add_user_layers(id);
            $('#uploadshp-modal').modal('hide');
        },
    });
}

$('#uploadshp').click(uploadShapefile);
$('#zoom-shp').click(function () {
    var bounds = shpLayer.getBounds();
    mapObj.flyToBounds(bounds);
})
