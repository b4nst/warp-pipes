// @flow
import { Transform } from 'stream';

import type { ErrorOrNullCallback, ConditionFunc } from 'types';

export class Filter extends Transform {
  filter: ConditionFunc;

  constructor(filter: ConditionFunc, options: duplexStreamOptions = {}) {
    super(options);
    this.filter = filter;
  }

  _transform(chunk: any, encoding: string, callback: ErrorOrNullCallback) {
    if (this.filter(chunk)) this.push(chunk);
    callback(null);
  }
}
