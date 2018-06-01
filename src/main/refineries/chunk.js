// @flow
import { Transform } from 'stream';

import type { ErrorOrNullCallback } from 'types';

export class Chunk extends Transform {
  size: number;
  _buffer: any;
  _offset: number;

  constructor(size: number, options: duplexStreamOptions = {}) {
    super(options);
    this.size = size;
    if (options.objectMode) {
      this._buffer = [];
    } else {
      this._buffer = Buffer.alloc(this.size);
      this._offset = 0;
    }
  }

  _transform(chunk: any, encoding: string, callback: ErrorOrNullCallback) {
    if (this._buffer instanceof Buffer) {
      // Normal mode
      // Retrieve memorized buffer & offset
      let target = this._buffer;
      let targetOffset = this._offset;
      const source = Buffer.from(chunk);
      let sourceOffset = 0;
      do {
        const count = source.copy(target, targetOffset, sourceOffset);
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
      this._buffer.push(chunk);
      if (this._buffer.length >= this.size) {
        this.push(this._buffer);
        this._buffer = [];
      }
    }
    callback(null);
  }

  _flush(callback: ErrorOrNullCallback) {
    if (this._buffer instanceof Buffer && this._offset > 0) {
      const out = Buffer.alloc(this._offset);
      this._buffer.copy(out);
      this.push(out);
      this._buffer = Buffer.alloc(this.size);
      this._offset = 0;
    } else if (this._buffer.length > 0) {
      this.push(this._buffer);
      this._buffer = [];
    }
    callback(null);
  }
}
