/**
 *
 */
import * as $stream from 'stream';

import { BaseComplexStream } from '.';

/**
 * Multiple Writable streams
 */
export class WritableComplexStream extends BaseComplexStream<$stream.Writable> {
  private _finish: number;

  constructor(
    streams: $stream.Writable[],
    opts: $stream.TransformOptions = {}
  ) {
    super(streams, opts);
    this._finish = 0;
    this.streams.forEach(stream => {
      stream.on('finish', () => {
        this._incFinishedStream();
      });
    });
  }

  private _incFinishedStream(): void {
    this._finish += 1;
    if (this._finish >= this.streams.length) {
      this.emit('finish');
    }
  }
}
