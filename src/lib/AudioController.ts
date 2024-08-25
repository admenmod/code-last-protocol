import { Event, EventDispatcher } from 'ver/events';


export class AudioContorller extends EventDispatcher {
	public '@play' = new Event<AudioContorller, []>(this);


	public ctx = new AudioContext();
	public gain = this.ctx.createGain();

	public audio_buffers: Record<string, AudioBuffer> = {};

	constructor() {
		super();

		this.gain.connect(this.ctx.destination);
	}

	public async load(id: string, src: string): Promise<AudioBuffer> {
		const buffer = await fetch(src).then(data => data.arrayBuffer())
		const audio_buffer = await this.ctx.decodeAudioData(buffer);
		this.audio_buffers[id] = audio_buffer;
		return audio_buffer;
	}

	public play(id: string, when: number = 0, offset?: number, duration?: number) {
		const sound = this.ctx.createBufferSource();
		sound.buffer = this.audio_buffers[id];
		sound.connect(this.gain);

		sound.start(this.ctx.currentTime + when, offset, duration);

		this['@play'].emit();
	}

	public wave(time: number, when: number = 0) {
		if(!time) throw new Error('invalid time');

		const oscillator = this.ctx.createOscillator();
		oscillator.connect(this.gain);

		oscillator.frequency.value = 240;

		oscillator.start(this.ctx.currentTime + when);
		oscillator.stop(this.ctx.currentTime + when + time);
	}
}
