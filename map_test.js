var map = L.map('map').setView([52.52, 13.405], 13); // Setzen Sie die Karte auf Berlin

var geoJsonMarkerOptions = {
    radius: 8,
    weight: 1,
    opacity: 1,
    clickable: true,
    fillOpacity: .5
}

// Fügen Sie eine Basiskarte hinzu
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Definieren Sie Ihre Layer-Gruppen mit individuellen Farben
var layerGroups = {
    "City-Light-Poster": {
        group: L.layerGroup(),
        data: [],
        color: '#ef476f'
    },
    "City-Light-Board": {
        group: L.layerGroup(),
        data: [],
        color: '#f78c6b'
    },
    "Großflächen": {
        group: L.layerGroup(),
        data: [],
        color: '#ffd166'
    },
    "Stromkasten": {
        group: L.layerGroup(),
        data: [],
        color: '#06d6a0' 
    },
    "Litfaßsäule": {
        group: L.layerGroup(),
        data: [],
        color: '#118ab2' 
    },
    "Plakatwerbung": {
        group: L.layerGroup(),
        data: [],
        color: '#073b4c' 
    }
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
var customLayerControl = L.control.customLayerGroups(options, {position: 'topright', className: 'custom-control-input'});
map.addControl(customLayerControl);


fetch('https://raw.githubusercontent.com/falkzoo/map_prototype/main/standort_daten.json')
    .then(response => response.json())
    .then(data => {
        for (let groupName in data) {
            if (groupName in layerGroups) {
                layerGroups[groupName].data = packagePoints(data[groupName])
                layerGroups[groupName].group.addLayer(layerGroups[groupName].data)
            }
        }
    })
    .catch(function(error) {
        console.log(`This is the error: ${error}`)
    })


function packagePoints(collection) {
    var geoJsonLayer = new L.geoJSON(collection, {
    pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, geoJsonMarkerOptions);
    },
    style: function(feature) {
        switch(feature.properties.Category) {
            case "City-Light-Poster": return { color : '#ef476f' };
            case "City-Light-Board": return { color : '#f78c6b' };
            case 'Großflächen': return { color : '#ffd166' };
            case 'Stromkasten': return { color : '#06d6a0' };
            case 'Litfaßsäule': return { color : '#118ab2' };
            case 'Plakatwerbung': return { color : '#073b4c'  };
        }
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