// @flow

import { ConditionWritable } from 'complex-streams';
import { Writable } from 'stream';

import type { ErrorOrNullCallback } from 'types';

export class Splitter extends Writable {
  _destinations: ConditionWritable[];

  constructor(destinations: ConditionWritable[], opts: duplexStreamOptions) {
    super(opts);
    this._destinations = destinations;
    this._destinations.forEach(d => {
      d.stream.on('error', err => this.emit('error', err));
    });
    this.once('finish', () => {
      this._destinations.forEach(d => d.stream.end());
    });
  }

  _selectDestination(chunk: any, enc: string): ?ConditionWritable {
    return this._destinations.find(d => d.met(chunk, enc));
  }

  _write(chunk: any, encoding: string, callback: ErrorOrNullCallback) {
    const destination = this._selectDestination(chunk, encoding);
    if (destination) {
      if (!destination.stream.write(chunk)) {
        destination.stream.once('drain', callback);
      } else {
        callback();
      }
    } else {
      callback();
    }
    return true;
  }
}
