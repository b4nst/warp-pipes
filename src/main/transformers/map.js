// @flow
import { Transform } from 'stream';

import type { ErrorOrNullCallback } from 'types';

export class Map extends Transform {
  mapper: Function;

  constructor(mapper: Function, options: duplexStreamOptions = {}) {
    super(options);
    this.mapper = mapper;
  }

  _transform(chunk: any, encoding: string, callback: ErrorOrNullCallback) {
    this.push(this.mapper(chunk));
    callback(null);
  }
}
