L.Control.SwitchScaleControl = L.Control.extend({
  options: {
    position: 'bottomleft',
    dropdownDirection: 'upward',
    className: 'map-control-scalebar',
    updateWhenIdle: false,
    ratio: true,
    ratioPrefix: '1:',
    ratioCustomItemText: '1: другой...',
    customScaleTitle: 'Задайте свой масштаб и нажмите Enter',
    ratioMenu: true,

    // If recalcOnZoomChange is false, then recalcOnPositionChange is always false.
    recalcOnPositionChange: false,
    recalcOnZoomChange: false,
    scales: [500, 1000, 2000, 5000, 10000, 25000, 50000, 100000, 200000, 500000, 1000000, 2500000, 5000000, 10000000],
    roundScales: undefined,
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

    var className = this.options.className,
      container = L.DomUtil.create('div', 'leaflet-control-scale ' + className),
      options = this.options;

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

  onDropdownShow: function () {
    this._customScaleInput.value = this.options.ratioCustomItemText;
  },

  _addScales: function (options, className, container) {
    if (options.ratio) {
      this._rScaleMenu = L.DomUtil.create('div', className + '-ratiomenu ui dropdown', container);

      var scales = options.scales;
      this._rScaleMenuText = L.DomUtil.create('text', '', this._rScaleMenu);
      if (options.ratioMenu) {
        var dropMenu = L.DomUtil.create('div', 'menu', this._rScaleMenu);
        $.each(scales, function (i, scaleRatio) {
          var menuitem = L.DomUtil.create('div', className + '-ratiomenu-item item', dropMenu);
          menuitem.scaleRatio = scaleRatio;
          menuitem.style.setProperty('padding', '0.2em', 'important');

          var scaleRatioText = scaleRatio.toString();

          // 1500000 -> 1'500'000
          if (scaleRatioText.length > 3) {
            var joinerChar = '\'';
            scaleRatioText = scaleRatioText.split('').reverse().join('').replace(/([0-9]{3})/g, '$1' + joinerChar);
            if (scaleRatioText[scaleRatioText.length - 1] === joinerChar) {
              scaleRatioText = scaleRatioText.slice(0, -1);
            }

            scaleRatioText = scaleRatioText.split('').reverse().join('');
          }

          menuitem.innerHTML = options.ratioPrefix + scaleRatioText;
        });

        var setScaleRatio = function (scaleRatio) {
          if (scaleRatio) {
            var bounds = this._map.getBounds(),
              centerLat = bounds.getCenter().lat,
              crsScale = this._pixelsInMeterWidth * options.getMapWidthForLanInMeters(centerLat) / scaleRatio;
            this._map.setZoom(this._map.options.crs.zoom(crsScale));
          }
        };

        var myCustomScale = L.DomUtil.create('div', className + '-ratiomenu-item custom-scale', dropMenu);
        myCustomScale.title = options.customScaleTitle;

        var customScaleInput = L.DomUtil.create('input', className + '-customratio-input custom-scale-input', myCustomScale);
        customScaleInput.type = 'text';
        customScaleInput.setAttribute('value', options.ratioCustomItemText);
        this._customScaleInput = customScaleInput;
        var _this = this;

        $(customScaleInput).on('focus', function (e) {
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

        $(customScaleInput).on('keydown', {
          context: this
        }, function (e) {
          if (e.which === 13) {
            $(_this._rScaleMenu).dropdown('hide');
            var scaleRatioFound = this.value.replace(' ', '').replace('\'', '').match(/^(1:){0,1}([0-9]*)$/);
            if (scaleRatioFound && scaleRatioFound[2]) {
              var maxScale = Math.max.apply(null, scales);

              if (_this.options.adjustScales && scaleRatioFound[2] > maxScale) {
                var maxRatioItem = $(dropMenu).children('.' + className + '-ratiomenu-item.item').last();
                $(maxRatioItem).click();
              } else {
                myCustomScale.scaleRatio = scaleRatioFound[2];
                $(myCustomScale).click();
              }
            }

            return false;
          }

          return true;
        });

        $(customScaleInput).on('keypress', {
          context: this
        }, function (e) {
          if (e.charCode && (e.charCode < 48 || e.charCode > 57)) {
            return false;
          }
        });

        $(this._rScaleMenu).on('click', '.' + className + '-ratiomenu-item', {
          context: this
        }, function (e) {
          if (this.scaleRatio) {
            _this._fixedScale = this.scaleRatio;
            $.proxy(setScaleRatio, e.data.context)(this.scaleRatio);
            if ($(this).hasClass('custom-scale')) {
              this.scaleRatio = undefined;
            }
          } else {
            e.stopPropagation();
          }
        });

        this._rScaleMenu.style.overflow = 'visible';

        $(this._rScaleMenu).dropdown({
          direction: _this.options.dropdownDirection,
          onShow: function () {
            _this.onDropdownShow.call(_this);
          },
        });
      }
    }
  },

  _updateRound: function () {
    this._updateFunction(true);
  },

  _update: function () {
    this._updateFunction(false);
  },

  _updateFunction: function (isRound) {
    var dist,
      bounds = this._map.getBounds(),
      options = this.options;

    var centerLat = bounds.getCenter().lat;

    var size = this._map.getSize(),
      physicalScaleRatio = 0;

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
      this._rScaleMenuText.innerHTML = this.options.ratioPrefix + this._fixedScale;
      this._fixedScale = undefined;
    } else {
      var scaleText = isRound ? this._roundScale(physicalScaleRatio) : Math.round(physicalScaleRatio);
      this._rScaleMenuText.innerHTML = this.options.ratioPrefix + scaleText;
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
  },
});