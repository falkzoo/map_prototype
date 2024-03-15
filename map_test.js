var map = L.map('map').setView([52.52, 13.405], 13); // Setzen Sie die Karte auf Berlin

var myPopupText = "<h3>Litfaßsäule - Lausitzer Platz</h3><br>Werbeträger: Litfaßsäule<br>Ort: Lausitzer Platz<br>Standort: U-Bahnhof, etc.<br>Maße / Format:<br>beleuchtet / unbeleuchtet<br>Buchungsinterball: (wöchentlich, mtl., etc.)<br>Vorlaufzeit:<br><hr><br>"
var myPopupImage = '<img src= "https://www.wtm-aussenwerbung.de/wp-content/uploads/Lausitzer-Platz-wtm-aussenwerbung-berlin-2366.jpg" style="width: 15vw; min-width: 200px;">'
var myPopupImage2 = '<img src= "https://www.wtm-aussenwerbung.de/wp-content/uploads/Fehrbelliner-Platz-wtm-aussenwerbung-berlin-20230814_140021.jpg" style="width: 15vw; min-width: 200px;">'
var myPopup = generatePopup(myPopupText,myPopupImage,myPopupImage2);

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
        color: '#FF0000' // Rot
    },
    "City-Light-Board": {
        group: L.layerGroup(),
        color: '#00FF00' // Grün
    },
    "Großflächen": {
        group: L.layerGroup(),
        color: '#0000FF' // Blau
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
                //console.log("Added LayerGroup: " + input.groupName + " " + groupName)
                label.innerHTML += '  ' + groupName;
                //label.style.backgroundColor = backgroundColor;
                label.style.padding = '10px';

                
                //container.appendChild(label);
                

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



// Füllen Sie die Layer-Gruppen mit GeoJSON-Features
var geoJsonData_clp = {
    "type": "FeatureCollection",
    "features": [
        {"type": "Feature","properties":{"Name": "CLP1", "popupContent": myPopup, "Category": "clp" },"geometry": {"type": "Point","coordinates": [13.4115, 52.5237]}}
    ]
};
var geoJsonData_clb = {
    "type": "FeatureCollection",
    "features": [
        {"type": "Feature","properties":{"Name": "CLB1", "Category": "clb"},"geometry": {"type": "Point","coordinates": [13.3781, 52.5182]}}
    ]
};
var geoJsonData_gf = {
    "type": "FeatureCollection",
    "features": [
        {"type": "Feature","properties":{"Name": "GF1", "Category": "gf"},"geometry": {"type": "Point","coordinates": [13.3917, 52.4856]}}
    ]
};


// GeoJSON-Layer erstellen und zur jeweiligen Layer-Gruppe hinzufügen
var layer_clp = packagePoints(geoJsonData_clp);
var layer_clb = packagePoints(geoJsonData_clb);
var layer_gf = packagePoints(geoJsonData_gf);

layerGroups["City-Light-Poster"].group.addLayer(layer_clp);
layerGroups["City-Light-Board"].group.addLayer(layer_clb);
layerGroups["Großflächen"].group.addLayer(layer_gf);

function generatePopup(popupText,popupImage,popupImage2) {
    var popupString = ""
    popupString += '<div class="mCustomScrollbar" data-mcs-theme="rounded-dark">'
    popupString += '<div class="cf">';
    popupString += '<div>';
    popupString += popupText;
    popupString += '</div>';
    popupString += '<div>';
    popupString += popupImage;
    popupString += popupImage2;
    popupString += '</div>';
    popupString += '</div>';
    return popupString
}

function packagePoints(collection) {
    var geoJsonLayer = new L.geoJSON(collection, {
    pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, geoJsonMarkerOptions);

    },
    style: function(feature) {
        console.log(feature.properties.Category)
        switch(feature.properties.Category) {
            case 'clp': return { color : "red" };
            case 'clb': return { color : "green" };
            case 'gf': return { color : "blue" };
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