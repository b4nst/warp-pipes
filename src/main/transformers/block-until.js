// @flow
import { Transform } from 'stream';

import type { ErrorOrNullCallback, ConditionFunc } from 'types';

export class BlockUntil extends Transform {
  condition: ConditionFunc;
  inclusive: boolean;
  _open: boolean;

  constructor(
    condition: ConditionFunc,
    inclusiveOrOptions: boolean | duplexStreamOptions = true,
    options: duplexStreamOptions = {}
  ) {
    let opt, inclusive;
    if (typeof inclusiveOrOptions === 'boolean') {
      opt = options;
      inclusive = inclusiveOrOptions;
    } else {
      opt = inclusiveOrOptions;
      inclusive = true;
    }
    super(opt);
    this.inclusive = inclusive;
    this.condition = condition;
    this._open = false;
  }

  _transform(chunk: any, encoding: string, callback: ErrorOrNullCallback) {
    if (this._open) {
      this.push(chunk);
    } else {
      this._open = this.condition(chunk);
      if (this._open && this.inclusive) this.push(chunk);
    }
    callback(null);
  }
}
