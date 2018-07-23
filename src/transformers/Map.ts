/**
 * @module map
 * @requires stream
 */
import { Transform, TransformCallback, TransformOptions } from 'stream';

/**
 * Create a transform stream which will apply the map function to all chunks
 * @extends stream.Transform
 * @memberOf module:map
 */
export class Map extends Transform {
  public mapper: Function;

  constructor(mapper: Function, options: TransformOptions = {}) {
    super(options);
    this.mapper = mapper;
  }

  // tslint:disable-next-line
  public _transform(
    // tslint:disable-next-line
    chunk: any,
    encoding: string,
    callback: TransformCallback
  ): void {
    this.push(this.mapper(chunk));
    callback(null);
  }
}
