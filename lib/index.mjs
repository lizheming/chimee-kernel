import _Object$getPrototypeOf from 'babel-runtime/core-js/object/get-prototype-of';
import _classCallCheck from 'babel-runtime/helpers/classCallCheck';
import _createClass from 'babel-runtime/helpers/createClass';
import _possibleConstructorReturn from 'babel-runtime/helpers/possibleConstructorReturn';
import _inherits from 'babel-runtime/helpers/inherits';
import { CustEvent, Log, deepAssign, isNumber } from 'chimee-helper';
import _Object$getOwnPropertyDescriptor from 'babel-runtime/core-js/object/get-own-property-descriptor';

var defaultConfig = {
  type: 'vod',
  box: 'native',
  lockInternalProperty: false
};

/**
 * native player
 *
 * @export
 * @class Native
 */

var Native = function (_CustEvent) {
  _inherits(Native, _CustEvent);

  /**
   * Creates an instance of Native.
   * @param {any} videodom video dom
   * @param {any} config 
   * @memberof Native
   */
  function Native(videodom, config) {
    _classCallCheck(this, Native);

    var _this2 = _possibleConstructorReturn(this, (Native.__proto__ || _Object$getPrototypeOf(Native)).call(this));

    _this2.video = videodom;
    _this2.box = 'native';
    _this2.config = defaultConfig;
    deepAssign(_this2.config, config);
    _this2.bindEvents();
    return _this2;
  }

  _createClass(Native, [{
    key: 'internalPropertyHandle',
    value: function internalPropertyHandle() {
      if (!_Object$getOwnPropertyDescriptor) {
        return;
      }
      var _this = this;
      var time = _Object$getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'currentTime');

      Object.defineProperty(this.video, 'currentTime', {
        get: function get() {
          return time.get.call(_this.video);
        },
        set: function set(t) {
          if (!_this.currentTimeLock) {
            throw new Error('can not set currentTime by youself');
          } else {
            return time.set.call(_this.video, t);
          }
        }
      });
    }
  }, {
    key: 'bindEvents',
    value: function bindEvents() {
      var _this3 = this;

      if (this.video && this.config.lockInternalProperty) {
        this.video.addEventListener('canplay', function () {
          _this3.internalPropertyHandle();
        });
      }
    }
  }, {
    key: 'load',
    value: function load(src) {
      this.config.src = src || this.config.src;
      this.video.setAttribute('src', this.config.src);
    }
  }, {
    key: 'unload',
    value: function unload() {
      this.video.src = '';
      this.video.removeAttribute('src');
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      if (this.video) {
        this.unload();
      }
    }
  }, {
    key: 'play',
    value: function play() {
      return this.video.play();
    }
  }, {
    key: 'pause',
    value: function pause() {
      return this.video.pause();
    }
  }, {
    key: 'refresh',
    value: function refresh() {
      this.video.src = this.config.src;
    }
  }, {
    key: 'attachMedia',
    value: function attachMedia() {}
  }, {
    key: 'seek',
    value: function seek(seconds) {
      this.currentTimeLock = true;
      this.video.currentTime = seconds;
      this.currentTimeLock = false;
    }
  }]);

  return Native;
}(CustEvent);

var defaultConfig$1 = {
  isLive: true, // vod or live
  box: 'native', // box type : native mp4 hls flv
  lockInternalProperty: false,
  reloadTime: 1500 // video can't play when this time to reload
};

var Kernel = function (_CustEvent) {
	_inherits(Kernel, _CustEvent);

	/**
  * kernelWrapper
  * @param {any} wrap videoElement
  * @param {any} option
  * @class kernel
  */
	function Kernel(videoElement, config) {
		_classCallCheck(this, Kernel);

		var _this = _possibleConstructorReturn(this, (Kernel.__proto__ || _Object$getPrototypeOf(Kernel)).call(this));

		_this.tag = 'kernel';
		_this.config = deepAssign({}, defaultConfig$1, config);
		_this.video = videoElement;
		_this.videokernel = _this.selectKernel();
		_this.bindEvents(_this.videokernel, _this.video);
		_this.timer = null;
		return _this;
	}

	/**
  * bind events
  * @memberof kernel
  */


	_createClass(Kernel, [{
		key: 'bindEvents',
		value: function bindEvents(videokernel, video) {
			var _this2 = this;

			if (videokernel) {
				videokernel.on('mediaInfo', function (mediaInfo) {
					_this2.emit('mediaInfo', mediaInfo);
				});

				video.addEventListener('canplay', function () {
					clearTimeout(_this2.timer);
					_this2.timer = null;
				});
			}
		}

		/**
   * select kernel
   * @memberof kernel
   */

	}, {
		key: 'selectKernel',
		value: function selectKernel() {
			var config = this.config;

			var box = config.box;
			if (!box) {
				if (config.src.indexOf('.flv') !== -1) {
					box = 'flv';
				} else if (config.src.indexOf('.m3u8') !== -1) {
					box = 'hls';
				} else if (config.src.indexOf('.mp4') !== -1) {
					box = 'mp4';
				}
			}
			if (box !== 'native' && !config.preset[box]) {
				Log.error(this.tag, 'You want to play for ' + box + ', but you have not installed the kernel.');
				return;
			}
			if (box === 'native') {
				return new Native(this.video, config);
			} else if (box === 'flv') {
				return new config.preset[box](this.video, config);
			} else if (box === 'hls') {
				return new config.preset[box](this.video, config);
			} else if (box === 'mp4') {
				if (config.preset[box] && config.preset[box].isSupport()) {
					return new config.preset[box](this.video, config);
				} else {
					Log.verbose(this.tag, 'browser is not support mp4 decode, auto switch native player');
					return new Native(this.video, config);
				}
			} else {
				Log.error(this.tag, 'not mactch any player, please check your config');
				return null;
			}
		}

		/**
   * select attachMedia
   * @memberof kernel
   */

	}, {
		key: 'attachMedia',
		value: function attachMedia() {
			if (this.videokernel) {
				this.videokernel.attachMedia();
			} else {
				Log.error(this.tag, 'videokernel is not already, must init player');
			}
		}
		/**
   * load source
   * @param {string} src 
   * @memberof kernel
   */

	}, {
		key: 'load',
		value: function load(src) {
			var _this3 = this;

			this.config.src = src || this.config.src;
			if (this.videokernel && this.config.src) {
				this.videokernel.load(this.config.src);
				if (!this.timer && this.box !== 'hls') {
					this.timer = setTimeout(function () {
						_this3.timer = null;
						_this3.pause();
						_this3.refresh();
					}, this.config.reloadTime);
				}
			} else {
				Log.error(this.tag, 'videokernel is not already, must init player');
			}
		}
		/**
   * destory kernel
   * @memberof kernel
   */

	}, {
		key: 'destroy',
		value: function destroy() {
			if (this.videokernel) {
				this.videokernel.destroy();
				clearTimeout(this.timer);
				this.timer = null;
			} else {
				Log.error(this.tag, 'videokernel is not exit');
			}
		}
		/**
   * to play
   * @memberof kernel
   */

	}, {
		key: 'play',
		value: function play() {
			if (this.videokernel) {
				this.videokernel.play();
			} else {
				Log.error(this.tag, 'videokernel is not already, must init player');
			}
		}
		/**
   * pause
   * @memberof kernel
   */

	}, {
		key: 'pause',
		value: function pause() {
			if (this.videokernel && this.config.src) {
				this.videokernel.pause();
			} else {
				Log.error(this.tag, 'videokernel is not already, must init player');
			}
		}
		/**
   * get video currentTime
   * @memberof kernel
   */

	}, {
		key: 'seek',

		/**
   * seek to a point
   * @memberof kernel
   */
		value: function seek(seconds) {
			if (!isNumber(seconds)) {
				Log.error(this.tag, 'seek params must be a number');
				return;
			}
			if (this.videokernel) {
				return this.videokernel.seek(seconds);
			} else {
				Log.error(this.tag, 'videokernel is not already, must init player');
			}
		}
		/**
   * refresh kernel
   * @memberof kernel
   */

	}, {
		key: 'refresh',
		value: function refresh() {
			if (this.videokernel) {
				this.videokernel.refresh();
			} else {
				Log.error(this.tag, 'videokernel is not already, must init player');
			}
		}
		/**
   * get video duration
   * @memberof kernel
   */

	}, {
		key: 'currentTime',
		get: function get() {
			if (this.videokernel) {
				return this.video.currentTime;
			}
			return 0;
		}
	}, {
		key: 'duration',
		get: function get() {
			return this.video.duration;
		}
		/**
   * get video volume
   * @memberof kernel
   */

	}, {
		key: 'volume',
		get: function get() {
			return this.video.volume;
		}
		/**
  * set video volume
  * @memberof kernel
  */
		,
		set: function set(value) {
			this.video.volume = value;
		}
		/**
   * get video muted
   * @memberof kernel
   */

	}, {
		key: 'muted',
		get: function get() {
			return this.video.muted;
		}
		/**
   * set video muted
   * @memberof kernel
   */
		,
		set: function set(muted) {
			this.video.muted = muted;
		}
		/**
  * get video buffer
  * @memberof kernel
  */

	}, {
		key: 'buffered',
		get: function get() {
			return this.video.buffered;
		}
	}]);

	return Kernel;
}(CustEvent);

export default Kernel;
