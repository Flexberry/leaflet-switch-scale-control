# Leaflet-Switch-Scale-Control
Leaflet switch scale control is used to select and display map scale from dropdown list. Depends on:

* [Leaflet#1.2.0](http://leafletjs.com/reference-1.2.0.html)

### [DEMO](https://hbaltz.github.io/leaflet-switch-scale-control/examples/demo.html)

## API

## Install
```bash
npm install leaflet-switch-scale-control
```

### Usage
```javascript
map.addControl(new L.Control.SwitchScaleControl(options));
```
### Options
Specified below values are default
```json
    position: 'bottomleft',  // Leaflet control position.
    dropdownDirection: 'upward', // Specifies direction of dropdown's openning.
    className: 'map-control-scalebar', // Control's wrapper class.
    updateWhenIdle: false, // Control's wrapper class.
    ratio: false, // Flag: whether to display ratio prefix.
    ratioPrefix: '1:', // Ratio prefix text.
    ratioCustomItemText: '1: Entrez une valeur', // Custom ratio text.
    customScaleTitle: 'Entrez une valeur et appuyez sur Entrée', // Custom scale title text.
    ratioMenu: true,
    // If recalcOnZoomChange is false, then recalcOnPositionChange is always false.
    recalcOnPositionChange: false, // Flag: whether to recalc scale on map position change.
    recalcOnZoomChange: true, // Flag: whether to recalc scale on map zoom change.
    scales: [500, 1000, 2000, 5000, 10000, 25000, 50000, 100000, 200000, 500000, 1000000, 2500000, 5000000, 10000000], // Array of available to select scales
    roundScales: null,// Array of available to display rounded scales
    adjustScales: false, // Flag: whether to adjust custom scale to max of scales
    splitScale: false, // if true 1:1500000 => 1:1'500'000 in scale display
    pixelsInMeterWidth: function,
    getMapWidthForLanInMeters: function
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