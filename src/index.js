import { Log } from 'chimee-helper';
import { CustEvent } from 'chimee-helper';
import { isNumber, deepAssign } from 'chimee-helper';
import Native from './native/index';
import defaultConfig from './config';

export default class Kernel extends CustEvent {
	/**
	 * kernelWrapper
	 * @param {any} wrap videoElement
	 * @param {any} option
	 * @class kernel
	 */
	constructor (videoElement, config) {
		super();
		this.tag = 'kernel';
		this.config = deepAssign({}, defaultConfig, config);
		this.video = videoElement;
		this.videokernel = this.selectKernel();
		this.bindEvents(this.videokernel, this.video);
		this.timer = null;
	}

	/**
	 * bind events
	 * @memberof kernel
	 */
	bindEvents (videokernel, video) {
		if(!videokernel) {
			return;
		}

		videokernel.on('mediaInfo', (mediaInfo) => {
			this.emit('mediaInfo', mediaInfo);
		});

		video.addEventListener('canplay', ()=> {
			clearTimeout(this.timer);
			this.timer = null;
		});
	}

	/**
	 * select kernel
	 * @memberof kernel
	 */
	selectKernel () {
		const config = this.config;
		let box = config.box;
		const src = config.src.toLowerCase();
		// 根据 src 判断 box
		if(!box) {
			if(src.indexOf('.flv') !== -1) {
				box = 'flv';
			} else if(src.indexOf('.m3u8') !== -1) {
				box = 'hls';
			} else if(src.indexOf('.mp4') !== -1) {
				box = 'mp4';
			}
		}
		// 如果是自定义 box，就检测 box 有没有安装
		// 因为 native 和 mp4 都可以有原生方案支持，所以不用检测。
		if((box !== 'native' || box !== 'mp4') && !config.preset[box]) {
			Log.error(this.tag, `You want to play for ${box}, but you have not installed the kernel.`);
			return;
		}
		
		if(box === 'mp4') {
			if(!config.preset[box] || !config.preset[box].isSupport()) {
				Log.verbose(this.tag, 'browser is not support mp4 decode, auto switch native player');
				box = 'native';
			}
		}

		// 调用各个 box
		switch(box) {
			case 'native':
				return new Native(this.video, config);
			case 'mp4':
			case 'flv':
			case 'hls':
				return new config.preset[box](this.video, config);
			default:
				Log.error(this.tag, 'not mactch any player, please check your config');
				return;
		}
	}

	/**
	 * select attachMedia
	 * @memberof kernel
	 */
	attachMedia () {
		if(!this.videokernel) {
			return Log.error(this.tag, 'videokernel is not already, must init player');
		}

		this.videokernel.attachMedia();
	}
	/**
	 * load source
	 * @param {string} src 
	 * @memberof kernel
	 */
	load (src) {
		this.config.src = src || this.config.src;
		if(!this.videokernel || !this.config.src) {
			return Log.error(this.tag, 'videokernel is not already, must init player');
		}

		this.videokernel.load(this.config.src);
		if(!this.timer && this.box !== 'hls') {
			this.timer = setTimeout(()=>{
				this.timer = null;
				this.pause();
				this.refresh();
			}, this.config.reloadTime);
		}
	}
	/**
	 * destory kernel
	 * @memberof kernel
	 */
	destroy () {
		if(!this.videokernel) {
			return Log.error(this.tag, 'videokernel is not exit');
		}

		this.videokernel.destroy();
		clearTimeout(this.timer);
		this.timer = null;
	}
	/**
	 * to play
	 * @memberof kernel
	 */
	play () {
		if(!this.videokernel) {
			return Log.error(this.tag, 'videokernel is not already, must init player');;
		}

		this.videokernel.play();
	}
	/**
	 * pause
	 * @memberof kernel
	 */
	pause () {
		if(!this.videokernel || !this.config.src) {
			return 
			Log.error(this.tag, 'videokernel is not already, must init player');;
		}
		this.videokernel.pause();
	}
	/**
	 * get video currentTime
	 * @memberof kernel
	 */
	get currentTime () {
		if (this.videokernel) {
			return this.video.currentTime;
		}
		return 0;
	}
	/**
	 * seek to a point
	 * @memberof kernel
	 */
	seek (seconds) {
		if (!isNumber(seconds)) {
			Log.error(this.tag, 'seek params must be a number');
			return;
		}
		if(this.videokernel) {
			return this.videokernel.seek(seconds);
		} else {
			Log.error(this.tag, 'videokernel is not already, must init player');
		}
	}
	/**
	 * refresh kernel
	 * @memberof kernel
	 */
	refresh () {
		if(!this.videokernel) {
			return 
			Log.error(this.tag, 'videokernel is not already, must init player');
		}
		this.videokernel.refresh();
	}
	/**
	 * get video duration
	 * @memberof kernel
	 */
	get duration () {
		return this.video.duration;
	}
	/**
	 * get video volume
	 * @memberof kernel
	 */
	get volume () {
		return this.video.volume;
	}
	 /**
	 * set video volume
	 * @memberof kernel
	 */
	set volume (value) {
		this.video.volume = value;
	}
	/**
	 * get video muted
	 * @memberof kernel
	 */
	get muted () {
		return this.video.muted;
	}
	/**
	 * set video muted
	 * @memberof kernel
	 */
	set muted (muted) {
		this.video.muted = muted;
	}
	 /**
	 * get video buffer
	 * @memberof kernel
	 */
	get buffered () {
		return this.video.buffered;
	}
}
