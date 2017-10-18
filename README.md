# Leaflet-Switch-Scale-Control
Leaflet switch scale control is used to select and display map scale from dropdown list. Depends on:
* [Leaflet#1.0.1](http://leafletjs.com/reference-1.0.1.html)
* [Semantic-UI#2.2.4](https://github.com/Semantic-Org/Semantic-UI)
### [DEMO](https://flexberry.github.io/leaflet-switch-scale-control/examples/demo.html)
## API
### Usage
```javascript
map.addControl(new L.Control.SwitchScaleControl(options));
```
### Options
Specified below values are default
```json
    position: "bottomleft", // Leaflet control position.
    dropdownDirection: "upward", // Specifies direction of dropdown's openning.
    className: "map-control-scalebar", // Control's wrapper class.
    updateWhenIdle: false, // Control's wrapper class.
    ratio: true, // Flag: whether to display ratio prefix.
    ratioPrefix: "1:", // Ratio prefix text.
    ratioCustomItemText: "1: другой...", // Custom ratio text.
    customScaleTitle: "Задайте свой масштаб и нажмите Enter", // Custom scale title text.
    recalcOnPositionChange: false, // Flag: whether to recalc scale on map position change.
    recalcOnZoomChange: false, // Flag: whether to recalc scale on map zoom change.
    scales: [500, 1000, 2000, 5000, 10000, 25000, 50000, 100000, 200000, 500000, 1000000, 2500000, 5000000, 10000000], // Array of available to select scales
    roundScales: undefined, // Array of available to display rounded scales
    adjustScales: false, // Flag: whether to adjust custom scale to max of scales
    pixelsInMeterWidth: function,
    getMapWidthForLanInMeters: function
    render: function
```
#### pixelsInMeterWidth: returns pixels per meter; needed if ratio: true.
```javascript
    pixelsInMeterWidth: function () {
      var div = document.createElement("div");
      div.style.cssText = "position: absolute;  left: -100%;  top: -100%;  width: 100cm;";
      document.body.appendChild(div);
      var px = div.offsetWidth;
      document.body.removeChild(div);
      return px;
    }
```
#### getMapWidthForLanInMeters: returns width of map in meters on specified latitude.
```javascript
    getMapWidthForLanInMeters: function (currentLan) {
      return 6378137 * 2 * Math.PI * Math.cos(currentLan * Math.PI / 180);
    }
```

#### render: returns the scale rendered for HTML; if provided, ratioPrefix is ignored
```javascript
    render: function (ratio) {
      return 'The current scale is 1 : ' + ratio;
    }
```
