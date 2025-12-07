class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.bufferSize = 4096;
        this._buffer = new Float32Array(this.bufferSize);
        this._bytesWritten = 0;
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (!input || !input.length) return true;

        const channel0 = input[0];

        for (let i = 0; i < channel0.length; i++) {
            this._buffer[this._bytesWritten++] = channel0[i];
            if (this._bytesWritten >= this.bufferSize) {
                this.flush();
            }
        }

        return true;
    }

    flush() {
        const bufferToSend = this._buffer.slice(0, this.bufferSize);

        // Calculate RMS
        let sum = 0;
        for (let i = 0; i < bufferToSend.length; i++) {
            sum += bufferToSend[i] * bufferToSend[i];
        }
        const rms = Math.sqrt(sum / bufferToSend.length);

        // Convert to Int16
        const pcm16 = new Int16Array(bufferToSend.length);
        for (let i = 0; i < bufferToSend.length; i++) {
            const s = Math.max(-1, Math.min(1, bufferToSend[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        this.port.postMessage({
            type: 'audio-data',
            buffer: pcm16.buffer,
            rms: rms
        }, [pcm16.buffer]);

        this._bytesWritten = 0;
    }
}

registerProcessor('audio-processor', AudioProcessor);
