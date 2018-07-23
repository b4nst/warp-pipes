/**
 * StreamWrap
 */
import * as EventEmitter from 'events';
import { Duplex, Readable, TransformOptions, Writable } from 'stream';

import { Chunk, DropWhile, Filter, Flatten, Map, TakeWhile } from '../transformers';
import { ConditionFunction, StreamCondition } from '../types';
import { ConditionalDestinations, isArrayOf } from '../utils';
import { DuplexComplexStream, Splitter, WritableComplexStream } from './';

/**
 * Wrap around a readable (readable, duplex or transform) stream
 */
export class ReadableWrap<T extends Readable> extends EventEmitter {
  public stream: T;

  constructor(stream: T) {
    super();
    this.stream = stream;
    this.on(
      'newListener',
      (event: string, listener: (...args: any[]) => void) =>
        this.stream.addListener(event, listener)
    );
    this.on(
      'removeListener',
      (event: string, listener: (...args: any[]) => void) =>
        this.stream.removeListener(event, listener)
    );
  }

  public static wrap<T extends Readable>(stream: T): ReadableWrap<T> {
    return new ReadableWrap(stream);
  }

  public chunk(
    size: number,
    opts: TransformOptions = {}
  ): ReadableWrap<Duplex> {
    return this.pipe(new Chunk(size, opts));
  }

  public dropWhile(
    conditiom: ConditionFunction,
    opts: TransformOptions = {}
  ): ReadableWrap<Duplex> {
    return this.pipe(new DropWhile(conditiom, opts));
  }

  public filter(
    condition: ConditionFunction,
    opts: TransformOptions = {}
  ): ReadableWrap<Duplex> {
    return this.pipe(new Filter(condition, opts));
  }

  public flatten(opts: TransformOptions = {}): ReadableWrap<Duplex> {
    return this.pipe(new Flatten(opts));
  }

  public fork(
    destinations: Duplex[],
    opts?: TransformOptions
  ): DuplexComplexStream;
  public fork(
    desinations: Writable[],
    opts?: TransformOptions
  ): WritableComplexStream;
  public fork(
    destinations: Writable[] | Duplex[],
    opts: TransformOptions = {}
  ): WritableComplexStream | DuplexComplexStream {
    if (isArrayOf(destinations, Duplex)) {
      destinations.forEach(stream => this.stream.pipe(stream));

      return new DuplexComplexStream(destinations, opts);
    } else {
      destinations.forEach(stream => this.stream.pipe(stream));

      return new WritableComplexStream(destinations, opts);
    }
  }

  public map(
    mapper: Function,
    opts: TransformOptions = {}
  ): ReadableWrap<Duplex> {
    return this.pipe(new Map(mapper, opts));
  }

  public pipe(stream: Writable): Writable;
  public pipe(stream: Duplex): ReadableWrap<Duplex>;
  public pipe(stream) {
    this.stream.pipe(stream);

    return stream instanceof Duplex ? ReadableWrap.wrap(stream) : stream;
  }

  public split(
    destinations: StreamCondition[],
    opts: TransformOptions
  ): WritableComplexStream | DuplexComplexStream {
    const cws = new ConditionalDestinations(...destinations);
    const splitter = new Splitter(cws, opts);
    this.stream.pipe(splitter);
    const streams = cws.map(d => d.stream);
    if (isArrayOf(streams, Duplex)) {
      return new DuplexComplexStream(streams, opts);
    } else {
      return new WritableComplexStream(streams, opts);
    }
  }

  public takeWhile(
    condition: ConditionFunction,
    opts: TransformOptions = {}
  ): ReadableWrap<Duplex> {
    return this.pipe(new TakeWhile(condition, opts));
  }
}
