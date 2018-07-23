/**
 * @module takewhile
 * @requires stream
 */
import { Transform, TransformCallback, TransformOptions } from 'stream';

import { ConditionFunction } from '../types';

/**
 * Create a transform stream which take chunks while condition return true
 * @extends stream.Transform
 * @memberOf module:chunk
 */
export class TakeWhile extends Transform {
  public condition: ConditionFunction;
  private _index: number;
  private _closed: boolean;

  constructor(condition: ConditionFunction, options: TransformOptions = {}) {
    super(options);
    this.condition = condition;
    this._index = 0;
    this._closed = false;
  }

  // tslint:disable-next-line:function-name
  public _transform(
    // tslint:disable-next-line:no-any
    chunk: any,
    encoding: string,
    callback: TransformCallback
  ): void {
    if (!this._closed) {
      if (this.condition(chunk, this._index)) {
        this.push(chunk);
      } else {
        this._closed = true;
      }
      this._index += 1;
    }

    callback(null);
  }
}
