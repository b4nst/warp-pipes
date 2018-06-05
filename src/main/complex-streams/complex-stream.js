// @flow
import { PassThrough, Readable } from 'stream';
import EventEmitter from 'events';

export class ComplexStream extends EventEmitter {
  streams: [];
  isSink: boolean;
  _ended: number;
  _opts: duplexStreamOptions;

  constructor(streams: [], opts: duplexStreamOptions = {}) {
    super();
    this.streams = streams;
    this._ended = 0;
    this._opts = opts;
    this.isSink = streams.reduce(
      (result, stream) => result && !(stream instanceof Readable),
      true
    );
    this.streams.forEach(stream => {
      stream.on('error', err => this.emit('error', err));
      stream.on('finish', () => this.streamFinish());
    });
  }

  streamFinish() {
    this._ended++;
    if (this._ended >= this.streams.length) this.emit('end');
  }

  pipe(...args: []): ComplexStream {
    if (this.isSink) throw new Error('This stream is a sink');
    if (args.length !== this.streams.length)
      throw new Error('Incorrect number of streams to pipe');
    args.forEach((stream, idx) => this.streams[idx].pipe(stream));
    return new ComplexStream(args, this._opts);
  }

  merge(): PassThrough {
    if (this.isSink) {
      throw new Error('This stream is a sink');
    }
    const out = new PassThrough(this._opts);
    let endCount = 0;
    this.streams.forEach(stream => {
      stream.once('end', () => {
        endCount++;
        if (endCount >= this.streams.length) out.end();
      });
      stream.on('error', out.emit.bind(out, 'error'));
      stream.pipe(out, { end: false });
    });
    return out;
  }
}
