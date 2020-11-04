from django.http import JsonResponse
from django.shortcuts import render
from tethys_sdk.permissions import login_required
from tethys_sdk.gizmos import Button, TextInput, SelectInput, RangeSlider
from siphon.catalog import TDSCatalog
import requests
import netCDF4


@login_required()
def home(request):
    """
    Controller for the app home page.
    """
    save_button = Button(
        display_text='',
        name='save-button',
        icon='glyphicon glyphicon-floppy-disk',
        style='success',
        attributes={
            'data-toggle':'tooltip',
            'data-placement':'top',
            'title':'Save'
        }
    )
    context = {
        'save_button': save_button,
    }
    return render(request, 'netcdfviewer/home.html', context)


def build_data_tree(request):
    url = request.GET['url']
    ds = TDSCatalog(url)
    data_tree = {}
    folders_dict = {}
    files_dict = {}

    folders = ds.catalog_refs
    for x in enumerate(folders):
        folders_dict[folders[x[0]].title] = folders[x[0]].href

    files = ds.datasets
    for x in enumerate(files):
        files_dict[files[x[0]].name] = files[x[0]].access_urls

    data_tree['folders'] = folders_dict
    data_tree['files'] = files_dict
    correct_url = ds.catalog_url
    return JsonResponse({'dataTree': data_tree, 'correct_url': correct_url})


def metadata(request):
    url = request.GET['opendapURL']
    ds = netCDF4.Dataset(url)
    str_attrs = {}
    variables = []

    for attr in ds.__dict__:
        str_attrs[str(attr)] = str(ds.__dict__[attr])

    for var in ds.variables:
        variables.append(var)

    variables_sorted = sorted(variables)
    return JsonResponse({'variables_sorted': variables_sorted, 'attrs': str_attrs})


def get_dimensions(request):
    url = request.GET['opendapURL']
    variable = request.GET['variable']
    ds = netCDF4.Dataset(url)
    variables = {}
    var_attr = {}
    dimensions = []

    for dim in ds[variable].dimensions:
        dimensions.append(dim)

    for attr in ds[variable].__dict__:
        var_attr[str(attr)] = str(ds[variable].__dict__[attr])

    variables[variable] = var_attr

    dimensions.sort()
    return JsonResponse({'variables': variables, 'dims': dimensions})
