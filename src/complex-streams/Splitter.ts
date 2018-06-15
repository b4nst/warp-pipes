/**
 * @module splitter
 * @requires stream
 */
import { TransformCallback, TransformOptions, Writable } from 'stream';
import { ConditionalDestinations } from '../utils';

/**
 * Create a writable stream which split data according conditions
 * @extends stream.Transform
 */
export class Splitter extends Writable {
  private _destinations: ConditionalDestinations;

  constructor(
    destinations: ConditionalDestinations,
    opts: TransformOptions = {}
  ) {
    super(opts);
    this._destinations = destinations;
    this._destinations.forEach(d => {
      d.stream.on('error', err => this.emit('error', err));
    });
    this.once('finish', () => {
      this._destinations.forEach(d => {
        d.stream.end();
      });
    });
  }

  // tslint:disable-next-line
  public _write(
    // tslint:disable-next-line:no-any
    chunk: any,
    encoding: string,
    callback: TransformCallback
  ): void {
    // tslint:disable-next-line:no-unsafe-any
    const destination = this._destinations.streamOrDefault({ chunk });
    if (destination !== undefined) {
      if (!destination.write(chunk)) {
        destination.once('drain', callback);
      } else {
        callback();
      }
    } else {
      callback();
    }
  }
}
