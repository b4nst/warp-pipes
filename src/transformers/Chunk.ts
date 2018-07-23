/**
 * @module chunk
 * @requires stream
 */
import { Transform, TransformCallback, TransformOptions } from 'stream';

/**
 * Create a transform stream which will buffer chunks and send them by batch
 * @extends stream.Transform
 * @memberOf module:chunk
 */
export class Chunk extends Transform {
  public size: number;
  // tslint:disable-next-line:no-any
  private _buffer: any; // FIXME refactor to not have to use any here if possible
  private _offset: number;

  constructor(size: number, options: TransformOptions = {}) {
    super(options);
    this.size = size;
    if (options.objectMode) {
      this._buffer = [];
    } else {
      this._buffer = Buffer.alloc(this.size);
      this._offset = 0;
    }
  }

  // tslint:disable-next-line:function-name
  public _transform(
    // tslint:disable-next-line:no-any
    chunk: any,
    encoding: string,
    callback: TransformCallback
  ): void {
    if (this._buffer instanceof Buffer) {
      // Normal mode
      // Retrieve memorized buffer & offset
      let target: Buffer = this._buffer;
      let targetOffset: number = this._offset;
      // tslint:disable-next-line:no-unsafe-any
      const source: Buffer = Buffer.from(chunk);
      let sourceOffset: number = 0;
      do {
        const count: number = source.copy(target, targetOffset, sourceOffset);
        sourceOffset += count;
        targetOffset += count;
        if (targetOffset >= this.size) {
          this.push(target);
          target = Buffer.alloc(this.size);
          targetOffset = 0;
        }
      } while (sourceOffset < source.length); // While there is more data in source
      // memorize for further call
      this._buffer = target;
      this._offset = targetOffset;
    } else {
      // Object Mode
      // tslint:disable-next-line:no-unsafe-any
      this._buffer.push(chunk);
      // tslint:disable-next-line:no-unsafe-any
      if (this._buffer.length >= this.size) {
        this.push(this._buffer);
        this._buffer = [];
      }
    }
    callback(null);
  }

  private _flush(callback: TransformCallback): void {
    if (this._buffer instanceof Buffer && this._offset > 0) {
      const out: Buffer = Buffer.alloc(this._offset);
      this._buffer.copy(out);
      this.push(out);
      // tslint:disable-next-line:no-unsafe-any
      this._buffer = Buffer.alloc(this.size);
      this._offset = 0;
      // tslint:disable-next-line:no-unsafe-any
    } else if (this._buffer.length > 0) {
      this.push(this._buffer);
      this._buffer = [];
    }
    callback(null);
  }
}
