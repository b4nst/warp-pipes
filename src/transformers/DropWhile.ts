/**
 * @module dropwhile
 * @requires stream
 */
import { Transform, TransformCallback, TransformOptions } from 'stream';

import { ConditionFunction } from '../types';

/**
 * Create a transform stream which drop chunks while condition return true
 * @extends stream.Transform
 * @memberOf module:chunk
 */
export class DropWhile extends Transform {
  public condition: ConditionFunction;
  private _closed: boolean;
  private _index: number;

  constructor(condition: ConditionFunction, options: TransformOptions = {}) {
    super(options);
    this.condition = condition;
    this._closed = true;
    this._index = 0;
  }

  // tslint:disable-next-line:function-name
  public _transform(
    // tslint:disable-next-line:no-any
    chunk: any,
    encoding: string,
    callback: TransformCallback
  ): void {
    if (this._closed) {
      if (!this.condition(chunk, this._index)) {
        this.push(chunk);
        this._closed = false;
      }
    } else {
      this.push(chunk);
    }
    this._index += 1;
    callback(null);
  }
}
