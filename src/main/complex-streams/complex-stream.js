// @flow
import EventEmitter from 'events';
import { PassThrough, Readable } from 'stream';
import { StreamWrap } from 'complex-streams';

export class ComplexStream extends EventEmitter {
  streams: any[];
  isSink: boolean;
  _ended: number;
  _opts: duplexStreamOptions;

  constructor(streams: Array<any>, opts: duplexStreamOptions = {}) {
    super();
    this.streams = streams;
    this._ended = 0;
    this._opts = opts;
    this.isSink = streams.reduce(
      (result, stream) => result && !(stream instanceof Readable),
      true
    );
    this.on('newListener', (event, listener) => {
      if (event !== 'finish' && event !== 'end') {
        this.streams.forEach(stream => stream.addListener(event, listener));
      }
    });
    this.on('removeListener', (event, listener) => {
      if (event !== 'finish' && event !== 'end') {
        this.streams.forEach(stream => stream.removeListener(event, listener));
      }
    });
    this.streams.forEach(stream => {
      stream.on('finish', () => this._incFinishedStream());
    });
  }

  _incFinishedStream() {
    this._ended++;
    if (this._ended >= this.streams.length) {
      if (this.isSink) this.emit('finish');
      else this.emit('end');
    }
  }

  merge(): StreamWrap {
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
    return StreamWrap.wrap(out);
  }

  pipe(...args: any[]): ComplexStream {
    if (this.isSink) throw new Error('This stream is a sink');
    if (args.length !== this.streams.length)
      throw new Error('Incorrect number of streams to pipe');
    args.forEach((stream, idx) => this.streams[idx].pipe(stream));
    return new ComplexStream(args, this._opts);
  }
}
