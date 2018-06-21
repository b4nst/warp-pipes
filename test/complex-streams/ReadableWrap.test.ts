import { expect } from 'chai';
import * as Chance from 'chance';
import * as e2p from 'event-to-promise';
import * as _ from 'lodash';
import { PassThrough, Readable } from 'stream';
import { ReadableMock, WritableMock } from 'stream-mock';

import {
  DuplexComplexStream,
  ReadableWrap,
  WritableComplexStream
} from '../../src/complex-streams';
import {
  Chunk,
  DropWhile,
  Filter,
  Map,
  TakeWhile
} from '../../src/transformers';
import { ConditionalDestinations } from '../../src/utils';

/**
 * ReadableWrap test file
 */

describe('ReadableWrap', () => {
  let chance: Chance.Chance;

  before(() => {
    chance = new Chance();
  });

  it('should wrap a readable stream', () => {
    expect(new ReadableWrap(new PassThrough())).to.be.an.instanceof(
      ReadableWrap
    );
  });

  it('should foward new listener to inner streams', () => {
    const inner = new Readable();
    const wrap = new ReadableWrap(inner);
    const event = 'an_event';
    wrap.on(event, _.identity);
    expect(inner.listeners(event)).to.include(_.identity);
  });

  it('should forward listener removal to all inner streams', () => {
    const inner = new Readable();
    const wrap = new ReadableWrap(inner);
    const event = 'an_event';
    wrap.on(event, _.identity);
    wrap.removeListener(event, _.identity);
    expect(inner.listeners(event)).to.be.empty;
  });

  context('wrap', () => {
    it('should wrap a readable stream', () => {
      expect(ReadableWrap.wrap(new PassThrough())).to.be.an.instanceof(
        ReadableWrap
      );
    });
  });

  context('Object mode', () => {
    const opts = { objectMode: true };
    context('chunk', () => {
      it('should create, pipe and wrap with a chunk', () => {
        const wrap = new ReadableWrap(new ReadableMock([]));
        const count = 10;
        const chunk = wrap.chunk(count, opts);
        expect(chunk).to.be.an.instanceof(ReadableWrap);
        const stream = chunk.stream;
        expect(stream).to.be.an.instanceof(Chunk);
        if (stream instanceof Chunk) {
          expect(stream.size).to.equals(count);
        }
      });

      it('with default options', () => {
        const wrap = new ReadableWrap(new ReadableMock([]));
        const count = 10;
        const chunk = wrap.chunk(count);
        expect(chunk).to.be.an.instanceof(ReadableWrap);
      });
    });

    context('dropWhile', () => {
      it('should create, pipe and wrap with a dropwhile', () => {
        const wrap = new ReadableWrap(new ReadableMock([]));
        const condition = _.identity;
        const dw = wrap.dropWhile(condition, opts);
        expect(dw).to.be.an.instanceof(ReadableWrap);
        const stream = dw.stream;
        expect(stream).to.be.an.instanceof(DropWhile);
        if (stream instanceof DropWhile) {
          expect(stream.condition).to.equals(condition);
        }
      });

      it('with default options', () => {
        const wrap = new ReadableWrap(new ReadableMock([]));
        const condition = _.identity;
        const dw = wrap.dropWhile(condition);
        expect(dw).to.be.an.instanceof(ReadableWrap);
      });
    });

    context('filter', () => {
      it('should create, pipe and wrap with a filter', () => {
        const wrap = new ReadableWrap(new ReadableMock([]));
        const condition = _.identity;
        const filter = wrap.filter(condition, opts);
        expect(filter).to.be.an.instanceof(ReadableWrap);
        const stream = filter.stream;
        expect(stream).to.be.an.instanceof(Filter);
        if (stream instanceof Filter) {
          expect(stream.filter).to.equals(condition);
        }
      });

      it('with default options', () => {
        const wrap = new ReadableWrap(new ReadableMock([]));
        const condition = _.identity;
        const filter = wrap.filter(condition);
        expect(filter).to.be.an.instanceof(ReadableWrap);
      });
    });

    context('fork', () => {
      it('should fork a stream into writables', async () => {
        const data = _([]).range(100);
        const wrap = new ReadableWrap(new ReadableMock(data, opts));
        const destinations = chance.n(() => new WritableMock(opts), 2);
        const complex = wrap.fork(destinations, opts);
        expect(complex).to.be.an.instanceof(WritableComplexStream);
        await e2p(complex, 'finish');
        expect(destinations[0].data).to.have.members(data.value());
        expect(destinations[1].data).to.have.members(data.value());
      });

      it('should fork a stream into duplexes', async () => {
        const data = _([]).range(100);
        const mapper = n => n * 2;
        const wrap = new ReadableWrap(new ReadableMock(data, opts));
        const destinations = chance.n(() => new Map(mapper, opts), 2);
        const complex = wrap.fork(destinations, opts);
        expect(complex).to.be.an.instanceof(DuplexComplexStream);
        const [sink1, sink2] = chance.n(() => new WritableMock(opts), 2);
        await e2p(complex.pipe(sink1, sink2), 'finish');
        const expected = data.map(mapper).value();
        expect(sink1.data).to.have.members(expected);
        expect(sink2.data).to.have.members(expected);
      });

      it('should fork a stream into writables', async () => {
        const data = _([]).range(100);
        const wrap = new ReadableWrap(new ReadableMock(data, opts));
        const destinations = chance.n(() => new WritableMock(opts), 2);
        const complex = wrap.fork(destinations);
        expect(complex).to.be.an.instanceof(WritableComplexStream);
      });
    });

    context('map', () => {
      it('should create, pipe and wrap with a map', () => {
        const wrap = new ReadableWrap(new ReadableMock([]));
        const condition = _.identity;
        const map = wrap.map(condition, opts);
        expect(map).to.be.an.instanceof(ReadableWrap);
        const stream = map.stream;
        expect(stream).to.be.an.instanceof(Map);
        if (stream instanceof Map) {
          expect(stream.mapper).to.equals(condition);
        }
      });

      it('with default options', () => {
        const wrap = new ReadableWrap(new ReadableMock([]));
        const condition = _.identity;
        const map = wrap.map(condition);
        expect(map).to.be.an.instanceof(ReadableWrap);
      });
    });

    context('split', () => {
      it('should split a stream into writables', async () => {
        const data = _([]).range(100);
        const wrap = new ReadableWrap(new ReadableMock(data, opts));
        const [sink1, sink2] = chance.n(() => new WritableMock(opts), 2);
        const condition1 = n => n < 50;
        const condition2 = n => n >= 50 && n < 90;
        const destinations = new ConditionalDestinations(
          {
            stream: sink1,
            condition: condition1
          },
          {
            stream: sink2,
            condition: condition2
          }
        );
        const complex = wrap.split(destinations, opts);
        expect(complex).to.be.an.instanceof(WritableComplexStream);
        await e2p(complex, 'finish');
        expect(sink1.data).to.have.members(data.filter(condition1).value());
        expect(sink2.data).to.have.members(data.filter(condition2).value());
      });

      it('should split a stream into duplexes', async () => {
        const data = _([]).range(100);
        const mapper = n => n * 2;
        const wrap = new ReadableWrap(new ReadableMock(data, opts));
        const [map1, map2] = chance.n(() => new Map(mapper, opts), 2);
        const condition1 = n => n < 50;
        const condition2 = n => n >= 50 && n < 90;
        const destinations = new ConditionalDestinations(
          {
            stream: map1,
            condition: condition1
          },
          {
            stream: map2,
            condition: condition2
          }
        );
        const complex = wrap.split(destinations, opts);
        expect(complex).to.be.an.instanceof(DuplexComplexStream);
        if (!(complex instanceof DuplexComplexStream)) {
          throw new Error();
        }
        const [sink1, sink2] = chance.n(() => new WritableMock(opts), 2);
        await e2p(complex.pipe(sink1, sink2), 'finish');
        const expected = data.map(mapper).value();
        expect(sink1.data).to.have.members(
          data
            .filter(condition1)
            .map(mapper)
            .value()
        );
        expect(sink2.data).to.have.members(
          data
            .filter(condition2)
            .map(mapper)
            .value()
        );
      });
    });

    context('takeWhile', () => {
      it('should create, pipe and wrap with a takeWhile', () => {
        const wrap = new ReadableWrap(new ReadableMock([]));
        const condition = _.identity;
        const tw = wrap.takeWhile(condition, opts);
        expect(tw).to.be.an.instanceof(ReadableWrap);
        const stream = tw.stream;
        expect(stream).to.be.an.instanceof(TakeWhile);
        if (stream instanceof TakeWhile) {
          expect(stream.condition).to.equals(condition);
        }
      });

      it('with default options', () => {
        const wrap = new ReadableWrap(new ReadableMock([]));
        const condition = _.identity;
        const tw = wrap.takeWhile(condition);
        expect(tw).to.be.an.instanceof(ReadableWrap);
      });
    });
  });
});
