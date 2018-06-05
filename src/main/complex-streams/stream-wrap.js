// @flow
import { Duplex } from 'stream';
import { Filter, Chunk, Map, BlockUntil, PassUntil } from 'transformers';
import { Splitter, ComplexStream } from 'complex-streams';

import type { Readable, Writable } from 'stream';
import type { ConditionFunc, MapFunc } from 'types';
import type { ConditionWritable } from 'complex-streams';

export class StreamWrap {
  stream: Duplex | Readable;

  constructor(stream: Duplex | Readable) {
    this.stream = stream;
  }

  static wrap(stream: Duplex | Readable) {
    return new StreamWrap(stream);
  }

  forkWith(destinations: ConditionWritable[], opts: duplexStreamOptions = {}) {
    const splitter = new Splitter(destinations, opts);
    this.stream.pipe(splitter);
    // $FlowFixMe #6419
    const streams: [] = destinations.map(d => d.stream);
    return new ComplexStream(streams, opts);
  }

  pipe(stream: Writable | Duplex) {
    const next = this.stream.pipe(stream);
    return next instanceof Duplex ? new StreamWrap(next) : next;
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

  blockUntil(conditiom: ConditionFunc, opts: duplexStreamOptions = {}) {
    const next = new BlockUntil(conditiom, opts);
    return new StreamWrap(this.stream.pipe(next));
  }

  passUntil(condition: ConditionFunc, opts: duplexStreamOptions = {}) {
    const next = new PassUntil(condition, opts);
    return new StreamWrap(this.stream.pipe(next));
  }
}
