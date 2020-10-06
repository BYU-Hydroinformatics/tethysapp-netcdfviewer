from django.http import JsonResponse
import xarray
import geomatics
import json
import requests
import os
import urllib


def get_box_values(request):
    lat = request.GET['lat']
    lon = request.GET['lon']
    time = request.GET['time']
    subset_url = request.GET['subsetURL']
    var = request.GET['var']
    coord = json.loads(request.GET['coord'])
    path_to_netcdf = os.path.join(os.path.dirname(__file__), 'workspaces', 'app_workspace', 'temp.nc')

    urllib.request.urlretrieve(json.loads(subset_url), path_to_netcdf)

    if coord is not False:
        data = geomatics.timeseries.point([path_to_netcdf], var, (coord[0], coord[1]), (lat, lon), time)
        datetime = 'datetime'
        value = 'values'
    else:
        data = geomatics.timeseries.full_array_stats([path_to_netcdf], var, time)
        datetime = 'datetime'
        value = 'mean'

    ds = xarray.open_dataset(path_to_netcdf)
    times = ds.coords['time']
    data['datetime'] = times

    for t in enumerate(data.datetime):
        data.datetime[t[0]] = str(t[1])

    return JsonResponse({'data': data, 'time': datetime, 'value': value})
