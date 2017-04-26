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
    pixelsInMeterWidth: function() { /* Returns pixels per meter; needed if ratio: true */
      let div = document.createElement("div");
      div.style.cssText = "position: absolute;  left: -100%;  top: -100%;  width: 100cm;";
      document.body.appendChild(div);
      let px = div.offsetWidth;
      document.body.removeChild(div);
      return px;
    },
    getMapWidthForLanInMeters: function(currentLan) { /* Returns width of map in meters on specified latitude.*/
      return 6378137 * 2 * Math.PI * Math.cos(currentLan * Math.PI / 180);
    }
  },

  onAdd: function (map) {
    this._map = map;
    this._pixelsInMeterWidth = this.options.pixelsInMeterWidth();

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
          if (scaleRatio) {
            let bounds = this._map.getBounds(),
            centerLat = bounds.getCenter().lat,
            crsScale = this._pixelsInMeterWidth * options.getMapWidthForLanInMeters(centerLat) / scaleRatio;
            this._map.setZoom(this._map.options.crs.zoom(crsScale));
          }
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
          onShow: function() { _this.onDropdownShow.call(_this); },
        });
      }
    }
  },

  _update: function () {
    let dist,
      bounds = this._map.getBounds(),
      options = this.options;

    let centerLat = bounds.getCenter().lat;

    let size = this._map.getSize(),
      physicalScaleRatio = 0;

    if (size.x > 0) {
      if (options.ratio) {
        physicalScaleRatio = this._pixelsInMeterWidth * options.getMapWidthForLanInMeters(centerLat) / this._map.options.crs.scale(this._map.getZoom());
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
