// var L = require('leaflet');

L.Control.SwitchScaleControl = L.Control.extend({
  options: {
    position: 'bottomleft',
    dropdownDirection: 'upward',
    className: 'map-control-scalebar',
    updateWhenIdle: false,
    ratio: true,
    ratioPrefix: '1:',
    ratioCustomItemText: '1: Entrez une valeur',
    customScaleTitle: 'Entrez une valeur et appuyez sur ENtrée',
    ratioMenu: true,
    // If recalcOnZoomChange is false, then recalcOnPositionChange is always false.
    recalcOnPositionChange: false,
    recalcOnZoomChange: false,
    scales: [500, 1000, 2000, 5000, 10000, 25000, 50000, 100000, 200000, 500000, 1000000, 2500000, 5000000, 10000000],
    roundScales: null,
    adjustScales: false,

    // Returns pixels per meter; needed if ratio: true.
    pixelsInMeterWidth: function () {
      var div = document.createElement('div');
      div.style.cssText = 'position: absolute;  left: -100%;  top: -100%;  width: 100cm;';
      document.body.appendChild(div);
      var px = div.offsetWidth;
      document.body.removeChild(div);
      return px;
    },

    // Returns width of map in meters on specified latitude.
    getMapWidthForLanInMeters: function (currentLan) {
      return 6378137 * 2 * Math.PI * Math.cos(currentLan * Math.PI / 180);
    }
  },

  onAdd: function (map) {
    this._map = map;
    this._pixelsInMeterWidth = this.options.pixelsInMeterWidth();

    var className = this.options.className;
    var container = L.DomUtil.create('div', 'leaflet-control-scale ' + className);
    var options = this.options;

    this._addScales(options, className, container);

    if (options.recalcOnZoomChange) {
      if (options.recalcOnPositionChange) {
        map.on(options.updateWhenIdle ? 'moveend' : 'move', this._update, this);
      } else {
        map.on(options.updateWhenIdle ? 'zoomend' : 'zoom', this._update, this);
      }
    } else {
      map.on(options.updateWhenIdle ? 'zoomend' : 'zoom', this._updateRound, this);
    }

    map.whenReady(options.recalcOnZoomChange ? this._update : this._updateRound, this);

    L.DomEvent.disableClickPropagation(container);

    return container;
  },

  onRemove: function (map) {
    if (this.options.recalcOnZoomChange) {
      if (this.options.recalcOnPositionChange) {
        map.off(this.options.updateWhenIdle ? 'moveend' : 'move', this._update, this);
      } else {
        map.off(this.options.updateWhenIdle ? 'zoomend' : 'zoom', this._update, this);
      }
    } else {
      map.off(this.options.updateWhenIdle ? 'zoomend' : 'zoom', this._updateRound, this);
    }
  },

  _setScale: function (ratio) {
    this._fixedScale = ratio;
    var map = this._map;
    var bounds = map.getBounds();
    var centerLat = bounds.getCenter().lat;
    var crsScale = this._pixelsInMeterWidth * this.options.getMapWidthForLanInMeters(centerLat) / ratio;
    this._map.setZoom(map.options.crs.zoom(crsScale)); 
    this._toggleDropdown();
  },

  _toggleDropdown: function () {
    var height = this.dropdown.style['max-height'] === '0em' ? (this.options.scales.length * 2) : 0;
    this.dropdown.style['max-height'] = height + 'em';
    this.dropdown.style.border = height ? null : '0';
  },

  _addScale(ratio) {
    var menuitem = L.DomUtil.create('div', this.options.className + '-scale-item', this.dropdown);

    var scaleRatioText = ratio.toString();

    // 1500000 -> 1'500'000
    if (scaleRatioText.length > 3) {
      var joinerChar = '\'';
      scaleRatioText = scaleRatioText.split('').reverse().join('').replace(/([0-9]{3})/g, '$1' + joinerChar);
      if (scaleRatioText[scaleRatioText.length - 1] === joinerChar) {
        scaleRatioText = scaleRatioText.slice(0, -1);

      }

      scaleRatioText = scaleRatioText.split('').reverse().join('');
    }

    menuitem.innerHTML = this.options.ratioPrefix + scaleRatioText;

    var setScale = this._setScale.bind(this);
    menuitem.addEventListener('click', function () {
      setScale(ratio);
    });
  },

  _addScales: function (options, className, container) {
    if (!options.ratio) return;

    if (options.ratioMenu) {
      this.dropdown = L.DomUtil.create('div', className + '-dropdown', container);
      this._toggleDropdown();
    }
    this.text = L.DomUtil.create('div', className + '-text', container);

    if (!options.ratioMenu) return;

    var _this = this;
    var scales = options.scales;

    this.text.addEventListener('click', this._toggleDropdown.bind(_this));

    scales.forEach(this._addScale.bind(this));

    var customScaleInput = L.DomUtil.create('input', className + '-custom-scale', this.dropdown);
    customScaleInput.type = 'text';
    customScaleInput.setAttribute('value', options.ratioCustomItemText);
    customScaleInput.addEventListener('focus', function (e) {
      if (this.value === options.ratioCustomItemText) {
        this.value = options.ratioPrefix;

        // IE fix.
        if (this.createTextRange) {
          var r = this.createTextRange();
          r.moveStart('character', this.value.length);
          r.select();
        }
      }

      e.stopPropagation();
    });

    customScaleInput.addEventListener('keydown', function (e) {
      if (e.which !== 13) return;

      var scaleRatioFound = this.value.replace(' ', '').replace('\'', '').match(/^(1:){0,1}([0-9]*)$/);
      if (scaleRatioFound && scaleRatioFound[2]) {
        var maxScale = Math.max(scales);

        if (_this.options.adjustScales && scaleRatioFound[2] > maxScale) {
          _this._setScale.call(_this, scales[scales.length - 1]);
        } else {
          _this._setScale.call(_this, scaleRatioFound[2]);
        }
      }

      e.preventDefault();
    });

    customScaleInput.addEventListener('keypress', function (e) {
      if (e.charCode && (e.charCode < 48 || e.charCode > 57)) e.preventDefault();
    });
  },

  _updateRound: function () {
    this._updateFunction(true);
  },

  _update: function () {
    this._updateFunction(false);
  },

  _updateFunction: function (isRound) {
    var bounds = this._map.getBounds();
    var options = this.options;

    var centerLat = bounds.getCenter().lat;

    var size = this._map.getSize();
    var physicalScaleRatio = 0;

    if (size.x > 0) {
      if (options.ratio) {
        physicalScaleRatio = this._pixelsInMeterWidth * options.getMapWidthForLanInMeters(centerLat) / this._map.options.crs.scale(this._map.getZoom());
      }
    }

    this._updateScales(options, physicalScaleRatio, isRound);
  },

  _updateScales: function (options, physicalScaleRatio, isRound) {
    if (options.ratio && physicalScaleRatio) {
      this._updateRatio(physicalScaleRatio, isRound);
    }
  },

  _updateRatio: function (physicalScaleRatio, isRound) {
    if (this._fixedScale) {
      this.text.innerHTML = this.options.ratioPrefix + this._fixedScale;
      this._fixedScale = null;
    } else {
      var scaleText = isRound ? this._roundScale(physicalScaleRatio) : Math.round(physicalScaleRatio);
      this.text.innerHTML = this.options.ratioPrefix + scaleText;
    }
  },

  _roundScale: function (physicalScaleRatio) {
    var scales = this.options.roundScales || this.options.scales;

    if (physicalScaleRatio < scales[0]) {
      return scales[0];
    }

    if (physicalScaleRatio > scales[scales.length - 1]) {
      return scales[scales.length - 1];
    }

    for (var i = 0; i < scales.length - 1; i++) {
      if (physicalScaleRatio < scales[i + 1] && physicalScaleRatio >= scales[i]) {
        return (scales[i + 1] + scales[i] - 2 * physicalScaleRatio) >= 0 ? scales[i] : scales[i + 1];
      }
    }

    return Math.round(physicalScaleRatio);
  }
});
