L.Control.SwitchScaleControl = L.Control.extend({
  options: {
    position: 'bottomleft',
    dropdownDirection: 'upward',
    className: 'map-control-scalebar',
    updateWhenIdle: false,
    ratio: true,
    ratioPrefix: '1:',
    ratioCustomItemText: '1: другой...',
    ratioMenu: true,
    getWorldRect: null /* L.LatLngBounds to world coordinates; needed if ratio: true */,
    setWorldRect: null /* Sets world coordinates; needed if ratio: true && ratioMenu: true */,
    pixelsInMeterWidth: false /* Returns pixels per meter; needed if ratio: true */,
    getBoundsWidthInMeters: null /* Returns width in meters of specified area L.LatLngBounds. */
  },

  onAdd: function (map) {
    this._map = map;

    let className = this.options.className,
      container = L.DomUtil.create('div', 'leaflet-control-scale ' + className),
      options = this.options;

    this._addScales(options, className, container);

    map.on(options.updateWhenIdle ? 'moveend' : 'move', this._update, this);
    map.whenReady(this._update, this);

    L.DomEvent.disableClickPropagation(container);

    return container;
  },

  onRemove: function (map) {
    map.off(this.options.updateWhenIdle ? 'moveend' : 'move', this._update, this);
  },

  onDropdownShow: function () {
    this._customScaleInput.value = this.options.ratioCustomItemText;
  },

  _addScales: function (options, className, container) {
    if (options.ratio) {
      this._rScaleMenu = L.DomUtil.create('div', className + '-ratiomenu ui dropdown', container);

      let scales = [500, 1000, 2000, 5000, 10000, 25000, 50000, 100000, 200000, 500000, 1000000, 2500000, 5000000, 10000000];
      this._rScaleMenuText = L.DomUtil.create('text', '', this._rScaleMenu);
      if (options.ratioMenu) {
        let dropMenu = L.DomUtil.create('div', 'menu', this._rScaleMenu);
        $.each(scales, function (i, scaleRatio) {
          let menuitem = L.DomUtil.create('div', className + '-ratiomenu-item item', dropMenu);
          menuitem.scaleRatio = scaleRatio;
          menuitem.style.setProperty('padding', '0.2em', 'important');

          let scaleRatioText = scaleRatio.toString();
          if (scaleRatioText.length > 3) { // 1500000 -> 1'500'000
            let joinerChar = '\'';
            scaleRatioText = scaleRatioText.split('').reverse().join('').replace(/([0-9]{3})/g, '$1' + joinerChar);
            if (scaleRatioText[scaleRatioText.length - 1] === joinerChar) {
              scaleRatioText = scaleRatioText.slice(0, -1);
            }

            scaleRatioText = scaleRatioText.split('').reverse().join('');
          }

          menuitem.innerHTML = options.ratioPrefix + scaleRatioText;
        });

        let setScaleRatio = function (scaleRatio) {
          let size = this._map.getSize(),
          dist = scaleRatio * size.x / this._getDpm(),
          bounds = this._map.getBounds(),
          worldRect = options.getWorldRect(this._map, bounds),
          newHeight = dist * worldRect.Height / worldRect.Width;

          worldRect.Left += (worldRect.Width - dist) / 2;
          worldRect.Top += (worldRect.Height - newHeight) / 2 + newHeight;
          worldRect.Height = newHeight;
          worldRect.Width = dist;

          options.setWorldRect(this._map, worldRect);
        };

        let myCustomScale = L.DomUtil.create('div', className + '-ratiomenu-item custom-scale', dropMenu);
        myCustomScale.title = 'Задайте свой масштаб и нажмите Enter';

        let customScaleInput = L.DomUtil.create('input', className + '-customratio-input custom-scale-input', myCustomScale);
        customScaleInput.style.setProperty('padding', '0.2em', 'important');
        customScaleInput.type = 'text';
        customScaleInput.setAttribute('value', options.ratioCustomItemText);
        this._customScaleInput = customScaleInput;
        let _this = this;

        $(customScaleInput).on('focus', function (e) {
          if (this.value === options.ratioCustomItemText) {
            this.value = options.ratioPrefix;

            if (this.createTextRange) { // for IE.
              let r = this.createTextRange();
              r.moveStart('character', this.value.length);
              r.select();
            }
          }

          e.stopPropagation();
        });

        $(customScaleInput).on('keydown', { context: this }, function (e) {
          if (e.which === 13) {
            $(_this._rScaleMenu).dropdown('hide');
            let scaleRatioFound = this.value.replace(' ', '').replace('\'', '').match(/^(1:){0,1}([0-9]*)$/);
            if (!scaleRatioFound || !scaleRatioFound[2] /* ([0-9]*) group */) {
              setTimeout(function () { alert('Пожалуйста, укажите масштаб в формате "1:100000" или "100000"'); }, 1);
              return false;
            }

            myCustomScale.scaleRatio = scaleRatioFound[2];
            $(myCustomScale).click();
            return false;
          }

          return true;
        });

        $(this._rScaleMenu).on('click', '.' + className + '-ratiomenu-item', { context: this }, function (e) {
          if (this.scaleRatio) {
            $.proxy(setScaleRatio, e.data.context)(this.scaleRatio);
          } else {
            e.stopPropagation();
          }
        });

        this._rScaleMenu.style.overflow = 'visible';

        $(this._rScaleMenu).dropdown({
          direction: _this.options.dropdownDirection,
          onShow: function() { _this.onDropdownShow.call(_this); },
        });
      }
    }
  },

  _getDpm: function () {
    let pixelsInMeterWidth = this.options.pixelsInMeterWidth;

    if (typeof pixelsInMeterWidth === "function") {
      return pixelsInMeterWidth();
    } else if (typeof pixelsInMeterWidth === "number") {
      return pixelsInMeterWidth;
    } else {
      throw 'options.pixelsInMeterWidth has wrong type';
    }
  },

  _update: function () {
    let dist,
      bounds = this._map.getBounds(),
      options = this.options;

    if (typeof options.getBoundsWidthInMeters !== "function") {
      let centerLat = bounds.getCenter().lat,
        halfWorldMeters = 6378137 * Math.PI * Math.cos(centerLat * Math.PI / 180);
        dist = halfWorldMeters * (bounds.getNorthEast().lng - bounds.getSouthWest().lng) / 180;
    } else {
      dist = options.getBoundsWidthInMeters(bounds);
    }

    let size = this._map.getSize(),
      physicalScaleRatio = 0;

    if (size.x > 0) {
      if (options.ratio) {
        physicalScaleRatio = this._getDpm() * dist / size.x;
      }
    }

    this._updateScales(options, physicalScaleRatio);
  },

  _updateScales: function (options, physicalScaleRatio) {
    if (options.ratio && physicalScaleRatio) {
      this._updateRatio(physicalScaleRatio);
    }
  },

  _updateRatio: function (physicalScaleRatio) {
    this._rScaleMenuText.innerHTML = this.options.ratioPrefix + Math.round(physicalScaleRatio);
  },
});
