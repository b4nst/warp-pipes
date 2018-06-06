// @flow
import { Transform } from 'stream';

import type { ErrorOrNullCallback, ConditionFunc } from 'types';

export class TakeWhile extends Transform {
  condition: ConditionFunc;
  _index: number;
  _closed: boolean;

  constructor(condition: ConditionFunc, options: duplexStreamOptions = {}) {
    super(options);
    this.condition = condition;
    this._index = 0;
    this._closed = false;
  }

  _transform(chunk: any, encoding: string, callback: ErrorOrNullCallback) {
    if (!this._closed) {
      if (this.condition(chunk, this._index)) {
        this.push(chunk);
      } else {
        this._closed = true;
      }
      this._index++;
    }

    callback(null);
  }
}
