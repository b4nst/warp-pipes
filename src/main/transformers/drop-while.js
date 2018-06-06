// @flow
import { Transform } from 'stream';

import type { ErrorOrNullCallback, ConditionFunc } from 'types';

export class DropWhile extends Transform {
  condition: ConditionFunc;
  _closed: boolean;
  _index: number;

  constructor(condition: ConditionFunc, options: duplexStreamOptions = {}) {
    super(options);
    this.condition = condition;
    this._closed = true;
    this._index = 0;
  }

  _transform(chunk: any, encoding: string, callback: ErrorOrNullCallback) {
    if (this._closed) {
      if (!this.condition(chunk, this._index)) {
        this.push(chunk);
        this._closed = false;
      }
    } else {
      this.push(chunk);
    }
    this._index++;
    callback(null);
  }
}
