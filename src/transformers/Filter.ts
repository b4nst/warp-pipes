/**
 * @module filter
 * @requires stream
 */
import { Transform, TransformCallback, TransformOptions } from 'stream';

import { ConditionFunction } from '../types';

/**
 * Create a stransform stream which will filter chunks with the provided function
 * @extends stream.Transform
 * @memberOf module:filter
 */
export class Filter extends Transform {
  public filter: ConditionFunction;

  constructor(filter: ConditionFunction, options: TransformOptions = {}) {
    super(options);
    this.filter = filter;
  }

  // tslint:disable-next-line
  _transform(chunk: any, encoding: string, callback: TransformCallback): void {
    if (this.filter(chunk)) {
      this.push(chunk);
    }
    callback(null);
  }
}
