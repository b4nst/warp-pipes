// @flow
import { Transform } from 'stream';

import type { ErrorOrNullCallback } from 'types';

export default class Filter extends Transform {
  filter: any => boolean;

  constructor(filter: any => boolean, options: duplexStreamOptions = {}) {
    super(options);
    this.filter = filter;
  }

  _transform(chunk: any, encoding: string, callback: ErrorOrNullCallback) {
    if (this.filter(chunk)) this.push(chunk);
    callback(null);
  }
}
