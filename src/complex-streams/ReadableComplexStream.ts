/**
 *
 */
import * as $stream from 'stream';

import {
  BaseComplexStream,
  DuplexComplexStream,
  ReadableWrap,
  WritableComplexStream
} from '.';
import { isArrayOf } from '../utils';

/**
 * Multiple Readable streams
 */
export class ReadableComplexStream extends BaseComplexStream<$stream.Readable> {
  private _end: number;

  constructor(
    streams: $stream.Readable[],
    opts: $stream.TransformOptions = {}
  ) {
    super(streams, opts);
    this._end = 0;
    this.streams.forEach(stream => {
      stream.on('end', () => {
        this._incEndedStream();
      });
    });
  }

  public merge(
    opts: $stream.TransformOptions = this._opts
  ): ReadableWrap<$stream.Transform> {
    const out = new $stream.PassThrough(opts);
    let endCount = 0;
    this.streams.forEach(stream => {
      stream.once('end', () => {
        endCount += 1;
        if (endCount >= this.streams.length) {
          out.end();
        }
      });
      stream.on('error', out.emit.bind(out, 'error'));
      stream.pipe(out, { end: false });
    });

    return ReadableWrap.wrap(out);
  }

  public pipe(...streams: $stream.Writable[]): WritableComplexStream;
  public pipe(...streams: $stream.Duplex[]): DuplexComplexStream;
  public pipe(...streams) {
    if (streams.length !== this.streams.length) {
      throw new Error('Incorrect number of streams to pipe');
    }
    streams.forEach((stream, idx) => this.streams[idx].pipe(stream));

    if (isArrayOf(streams, $stream.Duplex)) {
      return new DuplexComplexStream(streams, this._opts);
    } else {
      return new WritableComplexStream(streams, this._opts);
    }
  }

  private _incEndedStream(): void {
    this._end += 1;
    if (this._end >= this.streams.length) {
      this.emit('end');
    }
  }
}
