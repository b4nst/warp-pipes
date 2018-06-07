// @flow
import { Duplex } from 'stream';
import { Filter, Chunk, Map, DropWhile, TakeWhile } from 'transformers';
import { Splitter, ComplexStream } from 'complex-streams';
import EventEmitter from 'events';

import type { Readable, Writable } from 'stream';
import type { ConditionFunc, MapFunc } from 'types';
import type { ConditionWritable } from 'complex-streams';

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

  static wrap(stream: Duplex | Readable) {
    return new StreamWrap(stream);
  }

  forkWith(destinations: ConditionWritable[], opts: duplexStreamOptions = {}) {
    const splitter = new Splitter(destinations, opts);
    this.stream.pipe(splitter);
    const streams = destinations.map(d => d.stream);
    return new ComplexStream(streams, opts);
  }

  pipe(stream: Writable | Duplex) {
    const next = this.stream.pipe(stream);
    return next instanceof Duplex ? StreamWrap.wrap(next) : next;
  }

  filter(condition: ConditionFunc, opts: duplexStreamOptions = {}) {
    const next = new Filter(condition, opts);
    return new StreamWrap(this.stream.pipe(next));
  }

  map(mapper: MapFunc, opts: duplexStreamOptions = {}) {
    const next = new Map(mapper, opts);
    return new StreamWrap(this.stream.pipe(next));
  }

  chunk(size: number, opts: duplexStreamOptions = {}) {
    const next = new Chunk(size, opts);
    return new StreamWrap(this.stream.pipe(next));
  }

  dropWhile(conditiom: ConditionFunc, opts: duplexStreamOptions = {}) {
    const next = new DropWhile(conditiom, opts);
    return new StreamWrap(this.stream.pipe(next));
  }

  takeWhile(condition: ConditionFunc, opts: duplexStreamOptions = {}) {
    const next = new TakeWhile(condition, opts);
    return new StreamWrap(this.stream.pipe(next));
  }
}
