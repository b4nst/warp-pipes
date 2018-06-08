// @flow
import EventEmitter from 'events';
import { Duplex } from 'stream';
import { Filter, Chunk, Map, DropWhile, TakeWhile } from 'transformers';
import { Splitter, ComplexStream, ConditionWritable } from 'complex-streams';

import type { ConditionFunc, MapFunc } from 'types';
import type { Readable, Writable } from 'stream';

// TODO parametrize class
export class StreamWrap extends EventEmitter {
  stream: Duplex | Readable;

  constructor(stream: Duplex | Readable) {
    super();
    this.stream = stream;
    this.on('newListener', (event, listener) =>
      this.stream.addListener(event, listener)
    );
    this.on('removeListener', (event, listener) =>
      this.stream.removeListener(event, listener)
    );
  }

  // Static methods

  static wrap(stream: Duplex | Readable) {
    return new StreamWrap(stream);
  }

  // Instance methods

  chunk(size: number, opts: duplexStreamOptions = {}) {
    const next = new Chunk(size, opts);
    return new StreamWrap(this.stream.pipe(next));
  }

  dropWhile(conditiom: ConditionFunc, opts: duplexStreamOptions = {}) {
    const next = new DropWhile(conditiom, opts);
    return new StreamWrap(this.stream.pipe(next));
  }

  filter(condition: ConditionFunc, opts: duplexStreamOptions = {}) {
    const next = new Filter(condition, opts);
    return new StreamWrap(this.stream.pipe(next));
  }

  fork(
    destinations: Array<stream$Duplex | stream$Writable>,
    opts: duplexStreamOptions = {}
  ) {
    destinations.forEach(stream => this.stream.pipe(stream));
    return new ComplexStream(destinations, opts);
  }

  map(mapper: MapFunc, opts: duplexStreamOptions = {}) {
    const next = new Map(mapper, opts);
    return new StreamWrap(this.stream.pipe(next));
  }

  pipe(stream: Writable | Duplex) {
    const next = this.stream.pipe(stream);
    return next instanceof Duplex ? StreamWrap.wrap(next) : next;
  }

  split(
    destinations: [ConditionFunc, stream$Duplex | stream$Writable][],
    opts: duplexStreamOptions = {}
  ) {
    const cws = destinations.map(d => new ConditionWritable(d[0], d[1]));
    const splitter = new Splitter(cws, opts);
    this.stream.pipe(splitter);
    const streams = cws.map(d => d.stream);
    return new ComplexStream(streams, opts);
  }

  takeWhile(condition: ConditionFunc, opts: duplexStreamOptions = {}) {
    const next = new TakeWhile(condition, opts);
    return new StreamWrap(this.stream.pipe(next));
  }
}
