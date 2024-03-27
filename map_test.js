var map = L.map('map').setView([52.52, 13.405], 13); // Setzen Sie die Karte auf Berlin

var geojsonBezirke

var geoJsonMarkerOptions = {
    color: 'black',
    radius: 8,
    weight: 1,
    opacity: 1,
    clickable: true,
    fillOpacity: 1
}

// Hinzufügen der Basiskarte
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Erstellen des Besizrksoverlays
fetch('https://raw.githubusercontent.com/funkeinteraktiv/Berlin-Geodaten/master/berlin_bezirke.geojson')
    .then(response => response.json())
    .then(data => {
        geojsonBezirke = packageBezirke(data).addTo(map);
    })
    .catch(function(error) {
        console.log(`Error processing Bezirk data: ${error}`)
    })

// Definieren Sie Ihre Layer-Gruppen mit individuellen Farben
var layerGroups = {
    "City-Light-Poster": { group: L.layerGroup(), color: '#54478c'},
    "City-Light-Board": { group: L.layerGroup(), color: '#2c699a'},
    "City Light Säule": { group: L.layerGroup(), color: '#048ba8' },
    "Fassadenwerbung": { group: L.layerGroup(), color: '#0db39e' },
    "Großflächen": { group: L.layerGroup(), color: '#16db93'},
    "Leuchtkasten": { group: L.layerGroup(), color: '#83e377' },
    "Litfaßsäule": { group: L.layerGroup(), color: '#b9e769' },
    "Mastenschild": { group: L.layerGroup(), color: '#efea5a' },
    "Plakatwerbung": { group: L.layerGroup(), color: '#f1c453' },
    "Stromkasten": { group: L.layerGroup(), color: '#f29e4c' },
    "Uhrenwerbung": { group: L.layerGroup(),color: '#f694c1' }
};

// Definieren Sie die Funktion zur Erstellung der benutzerdefinierten Schichtenkontrolle
L.control.customLayerGroups = function(options) {
    return new L.Control.CustomLayerGroups(options);
};

L.Control.CustomLayerGroups = L.Control.extend({
    onAdd: function (map) {
        var container = L.DomUtil.create('div', 'leaflet-bar custom-control');
        this._inputs = {};
        
        for (var groupName in this.options) {
            if (this.options.hasOwnProperty(groupName) && this.options[groupName].group instanceof L.LayerGroup) {
                var group = this.options[groupName].group;
                var checked = group._map ? 'checked' : '';
                var backgroundColor = this.options[groupName].color;

                var label = L.DomUtil.create('label', 'form-control', container);
                var input = this._createCheckbox('input', 'checkbox', label, checked, backgroundColor, groupName);

                input.layerGroupName = groupName;
                input.group = group; // Save the group reference

                label.innerHTML += '  ' + groupName;
                label.style.padding = '10px';             
            }
        }
        L.DomEvent.on(container, 'change', this._onChange, this);
        return container;
    },

    _createCheckbox: function (type, className, container, checked, color, groupName) {
        var input = L.DomUtil.create(type, className, container);
        
        input.type = 'checkbox';
        input.defaultChecked = checked;
        input.checked = checked;
        input.layerGroupName = groupName;
        input.control = this;
        input.style.color = color;

        return input;
    },

    _onChange: function (event) {
        event.preventDefault();
        var input = event.target;
        var groupName = input.parentElement.innerText.trim();
        var group = layerGroups[groupName].group;
        
        if(group){
            if (input.checked) {
                map.addLayer(group);
            } else {
                map.removeLayer(group);
            }
        }
        else {
            console.error("Layer group not found:", groupName);
        }
    }
});

var options = { layers: {}};
// Fügen Sie die Layer-Gruppen der Karte hinzu und erstellen Sie die Checkboxen mit individuellen Farben
for (var groupName in layerGroups) {
    layerGroups[groupName].group.addTo(map);
    options[groupName] = { group: layerGroups[groupName].group, color: layerGroups[groupName].color};
}
var customLayerControl = L.control.customLayerGroups(options, {position: 'top right', className: 'custom-control-input'});
customLayerControl.setPosition('bottomright');
map.addControl(customLayerControl);

/* Werbetraeger Daten von Github ziehen */

fetch('https://raw.githubusercontent.com/falkzoo/map_prototype/main/geojson/standort_daten.json')
    .then(response => response.json())
    .then(data => {
        for (let groupName in data) {
            if (groupName in layerGroups) {
                layerGroups[groupName].group.addLayer(packagePoints(data[groupName]))
            }
        }
    })
    .catch(function(error) {
        console.log(`Error processing standort data: ${error}`)
    })

/* Bezirks Info Feld */

var info = L.control();

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
    this.update();
    return this._div;
};

// method that we will use to update the control based on feature properties passed
info.update = function (props) {
    this._div.innerHTML = '<h4>Bezirk:</h4>' +  (props ?
        '<b>' + props.name + '</b><br />' + "Anzahl der Werbeträger: "
        : 'Hover über einen Bezirk');
};

info.addTo(map);

/* Funktionen */

function packagePoints(collection) {
    var geoJsonLayer = new L.geoJSON(collection, {
    pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, geoJsonMarkerOptions);
    },
    style: function(feature) {
        return { fillColor : layerGroups[feature.properties.Category].color };
    },
    onEachFeature: function(feature, layer){
        if (feature.properties && feature.properties.popupContent) {
            layer.bindPopup(feature.properties.popupContent, {
                maxWidth: "auto"
                });
        }
    }
    });

    return geoJsonLayer
}

function packageBezirke(collection) {
    var geoJsonLayer = new L.geoJSON(collection, {
        style: function() {
            return {
                color: 'darkgreen',
                opacity: 1,
                fillOpacity: 0,
                weight: 2,
                dashArray: '10'
            }
        },
        onEachFeature: function(feature, layer) {
            layer.on({
                mouseover: highlightFeature,
                mouseout: resetHighlight,
                click: zoomToFeature
            });
        }
    })

    return geoJsonLayer
}

function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.2
    });

    info.update(layer.feature.properties);
    layer.bringToBack();
}

function resetHighlight(e) {
    geojsonBezirke.resetStyle(e.target);
    info.update();
}

function zoomToFeature(e) {
    map.fitBounds(e.target.getBounds());
}