from django.http import JsonResponse
from django.shortcuts import render
from tethys_sdk.permissions import login_required
from tethys_sdk.gizmos import Button, TextInput, SelectInput, RangeSlider
from bs4 import BeautifulSoup
import xarray as xr
import requests


@login_required()
def home(request):
    """
    Controller for the app home page.
    """
    layer_style = SelectInput(display_text='Select Color Style',
                              name='wmslayer-style',
                              multiple=False,
                              options=[('RAINBOW', 'boxfill/rainbow'), ('OCCAM', 'boxfill/occam'),
                                       ('ALG', 'boxfill/alg'), ('ALG2', 'boxfill/alg2'),
                                       ('GRAYSCALE', 'boxfill/greyscale'), ('SST_36', 'boxfill/sst_36'),
                                       ('NC VIEW', 'boxfill/ncview'), ('RED BLUE', 'boxfill/redblue')],
                              initial=['RAINBOW'],
                              )

    layer_range = TextInput(display_text='Set Data Bounds',
                            name='wmslayer-bounds',
                            initial='0,100',
                            )

    context = {
        'layer_style': layer_style,
        'layer_range': layer_range,
    }

    return render(request, 'netcdfviewer/home.html', context)


def files(request):
    url = request.GET['url']
    response = requests.get(url, verify=False)
    soup = BeautifulSoup(response.text, "html.parser")
    correct_url = soup.title.text
    correct_url = correct_url.replace('TdsStaticCatalog ', '')
    correct_url = correct_url.replace('Catalog ', '')
    correct_url = correct_url.replace(' ', '')
    files = {}

    for link in soup.find_all('a'):
        if hasattr(link.tt, 'text'):
            files[link.tt.text] = link.get('href')
            folder = True

    if files == {}:
        for link in soup.find_all('li'):
            if not link.find_all('b') == []:
                files[link.b.text] = link.a.text
        folder = False
        if files == {}:
            files = False

    return JsonResponse({'folder': folder, 'files': files, 'correct_url': correct_url})

# GET ALL METADATA FROM THE FILE, VARIABLES, AND DIMENTIONS
def metadata(request):
    # USE XARRAY TO GET METADATA INFORMATION USING AN OPENDAP URL
    url = request.GET['odurl']
    ds = xr.open_dataset(url)
    str_attrs = {}
    variables = {}
    var_attr = {}
    dims = []

    # ADD ALL DIMENTIONS TO A LIST
    for dim in ds.coords:
        dims.append(dim)

    # ADD THE VARIABLES AND CORRESPONDING ATTRIBUTES TO A DICTIONARY
    for attr in ds.attrs:
        str_attrs[str(attr)] = str(ds.attrs[attr])

    for var in ds.data_vars:
        for attr in ds[var].attrs:
            var_attr[str(attr)] = str(ds[var].attrs[attr])

        variables[str(var)] = var_attr
        var_attr = {}

    return JsonResponse({'variables': variables, 'dims': dims, 'attrs': str_attrs})

