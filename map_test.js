var map = new L.map('map')
var osmLayer

var geoJsonLayer
var collection

osmLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

collection = [{
    "type": "FeatureCollection",
    "features": [
    {"type": "Feature","properties":{"category": "City-Light-Poster","Name": "CLP1", "popupContent": "This is a City-Light-Poster"},"geometry": {"type": "Point","coordinates": [13.4115, 52.5237]}},
    {"type": "Feature","properties":{"category": "City-Light-Board","Name": "CLB1"},"geometry": {"type": "Point","coordinates": [13.3781, 52.5182]}},
    {"type": "Feature","properties":{"category": "Grossflaechen","Name": "GF1"},"geometry": {"type": "Point","coordinates": [13.3917, 52.4856]}},
    ]
}];

var categories = {}, 
    category;


var geoJsonMarkerOptions = {
    radius: 8,
    weight: 1,
    opacity: 1,
    clickable: true
}

map.setView([52.51973492285525, 13.402860253799327], 13);
map.addLayer(osmLayer);


var allPoints = new L.geoJSON(collection, {
    pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, geoJsonMarkerOptions);

    },
    style: function(feature) {
        switch(feature.properties.category) {
            case 'City-Light-Poster': return { color : "black" };
            case 'City-Light-Board': return { color: "blue" };
            case 'Grossflaechen': return { color: "red" };
        }
    },
    onEachFeature: function(feature, layer){
        if (feature.properties && feature.properties.popupContent) {
            layer.bindPopup(feature.properties.popupContent);
        }
        else layer.bindPopup(feature.properties.Name);
        category = feature.properties.category;
        // Initialize the category array if not already set.
        if (typeof categories[category] === "undefined") {
            categories[category] = [];
        }
        categories[category].push(layer);
    }
});


var overlaysObj = {},
    categoryName,
    categoryArray,
    categoryLG;

for (let categoryName in categories) {
    
    categoryArray = categories[categoryName];
    categoryLG = L.layerGroup(categoryArray);
    categoryLG.categoryName = categoryName;
    overlaysObj[categoryName] = categoryLG;
}

var control = L.control.layers(null, overlaysObj, {collapsed: false}).addTo(map);

/*
var legend = L.control({position: "topright"});
legend.onAdd = function (map) {
    var div = L.DomUtil.create("div", "info legend");
    div.innerHTML +='<img src="./icons/icon1.png" alt="legend" width="134" height="147">';
    return div;
};
legend.addTo(map)
*/



