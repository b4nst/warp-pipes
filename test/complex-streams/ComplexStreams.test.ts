/**
 * ComplexStream test file
 */

import { expect } from 'chai';
import * as Chance from 'chance';
import * as e2p from 'event-to-promise';
import { EventEmitter } from 'events';
import * as _ from 'lodash';
import * as sinon from 'sinon';
import { PassThrough, Readable, Transform, Writable } from 'stream';
import { ReadableMock, WritableMock } from 'stream-mock';

import {
  BaseComplexStream,
  DuplexComplexStream,
  ReadableComplexStream,
  ReadableWrap,
  WritableComplexStream
} from '../../src/complex-streams';
import { Map } from '../../src/transformers';

describe('ComplexStream', () => {
  let chance: Chance.Chance;
  before(() => {
    chance = new Chance();
  });

  context('BaseComplexStream', () => {
    it('should be an event emitter', () => {
      const base = new BaseComplexStream([new Writable()]);
      expect(base).to.be.an.instanceof(EventEmitter);
    });

    it('should foward new listener to all inner streams', () => {
      const sink1 = new Writable();
      const sink2 = new Writable();
      const base = new BaseComplexStream([sink1, sink2]);
      const event = 'an_event';
      base.on(event, _.identity);
      expect(sink1.listeners(event)).to.include(_.identity);
      expect(sink2.listeners(event)).to.include(_.identity);
    });

    it('should forward listener removal to all inner streams', () => {
      const sink1 = new Writable();
      const sink2 = new Writable();
      const base = new BaseComplexStream([sink1, sink2]);
      const event = 'an_event';
      base.on(event, _.identity);
      base.removeListener(event, _.identity);
      expect(sink1.listeners(event)).to.be.empty;
      expect(sink2.listeners(event)).to.be.empty;
    });

    it('should not forward either `finish` or `end` events', () => {
      const sink1 = new Writable();
      const base = new BaseComplexStream([sink1]);
      base.on('finish', _.identity);
      base.on('end', _.identity);
      expect(sink1.listeners('finish')).to.be.empty;
      expect(sink1.listeners('end')).to.be.empty;
    });
  });

  context('WritableComplexStream', () => {
    it('should be a BaseComplexStream', () => {
      expect(new WritableComplexStream([new Writable()])).to.be.an.instanceof(
        BaseComplexStream
      );
    });

    it('should emit `finish` event when all inner streams are finished', () => {
      const sink1 = new Writable();
      const sink2 = new Writable();
      const spy = sinon.spy();
      const complex = new WritableComplexStream([sink1, sink2]);
      complex.on('finish', spy);
      sink1.end();
      expect(spy.callCount).to.equal(0);
      sink2.end();
      expect(spy.callCount).to.equal(1);
    });
  });

  context('ReadableComplexStream', () => {
    it('should be a BaseComplexStream', () => {
      expect(new ReadableComplexStream([new Readable()])).to.be.an.instanceof(
        BaseComplexStream
      );
    });

    it('should emit `end` event when all inner streams are finished', () => {
      const source1 = new Readable();
      const source2 = new Readable();
      const spy = sinon.spy();
      const complex = new ReadableComplexStream([source1, source2]);
      complex.on('end', spy);
      source1.emit('end');
      expect(spy.callCount).to.equal(0);
      source2.emit('end');
      expect(spy.callCount).to.equal(1);
    });

    context('Object mode', () => {
      const opts = { objectMode: true };
      context('merge', () => {
        it('should return a ReadableWrap<Transform>', () => {
          const complex = new ReadableComplexStream([]);
          const actual = complex.merge();
          expect(actual).to.be.an.instanceof(ReadableWrap);
          expect(actual.stream).to.be.an.instanceof(Transform);
        });

        it('should merge 2 readable stream', async () => {
          const data1 = _([]).range(50);
          const data2 = _([]).range(50, 50);
          const sink = new WritableMock(opts);
          const complex = new ReadableComplexStream(
            [new ReadableMock(data1, opts), new ReadableMock(data2, opts)],
            opts
          );
          complex.merge().pipe(sink);
          await e2p(sink, 'finish');
          expect(sink.data).to.have.members(
            data1.concat(data2.value()).value()
          );
        });

        it('should forward error event', () => {
          const source1 = new Readable();
          const source2 = new Readable();
          const complex = new ReadableComplexStream([source1, source2]);
          const merged = complex.merge();
          const spy = sinon.spy();
          merged.on('error', spy);
          source1.emit('error');
          source2.emit('error');
          expect(spy.callCount).to.equal(
            2,
            'Expected error callback to be called 2 times'
          );
        });
      });

      context('pipe', () => {
        it('should throw on incorrect number of args', () => {
          const complex = new ReadableComplexStream([new Readable()]);
          expect(() => complex.pipe()).to.throw(
            'Incorrect number of streams to pipe'
          );
        });

        it('should pipe into writable', async () => {
          const data1 = _([]).range(50);
          const data2 = _([]).range(50, 50);
          const complex = new ReadableComplexStream(
            [new ReadableMock(data1, opts), new ReadableMock(data2, opts)],
            opts
          );
          const [sink1, sink2] = chance.n(() => new WritableMock(opts), 2);
          const pipe = complex.pipe(sink1, sink2);
          expect(pipe).to.be.an.instanceof(WritableComplexStream);
          await e2p(pipe, 'finish');
          expect(sink1.data).to.have.members(data1.value());
          expect(sink2.data).to.have.members(data2.value());
        });

        it('should pipe into duplex', async () => {
          const data1 = _([]).range(50);
          const data2 = _([]).range(50, 50);
          const map = n => n * 2;
          const complex = new ReadableComplexStream(
            [new ReadableMock(data1, opts), new ReadableMock(data2, opts)],
            opts
          );
          const [map1, map2] = chance.n(() => new Map(map, opts), 2);
          const pipe = complex.pipe(map1, map2);
          expect(pipe).to.be.an.instanceof(DuplexComplexStream);
          const sink = new WritableMock(opts);
          pipe.merge().pipe(sink);
          await e2p(sink, 'finish');
          expect(sink.data).to.have.members(
            data1
              .concat(data2.value())
              .map(map)
              .value()
          );
        });
      });
    });
  });

  context('DuplexComplexStream', () => {
    it('should be a BaseComplexStream', () => {
      expect(new DuplexComplexStream([new PassThrough()])).to.be.an.instanceof(
        BaseComplexStream
      );
    });

    it('should emit `end` event when all inner streams are finished', () => {
      const source1 = new PassThrough();
      const source2 = new PassThrough();
      const spy = sinon.spy();
      const complex = new DuplexComplexStream([source1, source2]);
      complex.on('end', spy);
      source1.emit('end');
      expect(spy.callCount).to.equal(0);
      source2.emit('end');
      expect(spy.callCount).to.equal(1);
    });

    it('should emit `finish` event when all inner streams are finished', () => {
      const source1 = new PassThrough();
      const source2 = new PassThrough();
      const spy = sinon.spy();
      const complex = new DuplexComplexStream([source1, source2]);
      complex.on('finish', spy);
      source1.end();
      expect(spy.callCount).to.equal(0);
      source2.end();
      expect(spy.callCount).to.equal(1);
    });

    context('Object mode', () => {
      const opts = { objectMode: true };
      context('merge', () => {
        it('should return a ReadableWrap<Transform>', () => {
          const complex = new DuplexComplexStream([]);
          const actual = complex.merge();
          expect(actual).to.be.an.instanceof(ReadableWrap);
          expect(actual.stream).to.be.an.instanceof(Transform);
        });

        it('should merge 2 readable stream', async () => {
          const data1 = _([]).range(50);
          const data2 = _([]).range(50, 50);
          const sink = new WritableMock(opts);
          const complex = new DuplexComplexStream(
            [new ReadableMock(data1, opts), new ReadableMock(data2, opts)],
            opts
          );
          complex.merge().pipe(sink);
          await e2p(sink, 'finish');
          expect(sink.data).to.have.members(
            data1.concat(data2.value()).value()
          );
        });

        it('should forward error event', () => {
          const source1 = new PassThrough();
          const source2 = new PassThrough();
          const complex = new DuplexComplexStream([source1, source2]);
          const merged = complex.merge();
          const spy = sinon.spy();
          merged.on('error', spy);
          source1.emit('error');
          source2.emit('error');
          expect(spy.callCount).to.equal(
            2,
            'Expected error callback to be called 2 times'
          );
        });
      });

      context('pipe', () => {
        it('should throw on incorrect number of args', () => {
          const complex = new DuplexComplexStream([new PassThrough()]);
          expect(() => complex.pipe()).to.throw(
            'Incorrect number of streams to pipe'
          );
        });

        it('should pipe into writable', async () => {
          const data1 = _([]).range(50);
          const data2 = _([]).range(50, 50);
          const complex = new DuplexComplexStream(
            [new ReadableMock(data1, opts), new ReadableMock(data2, opts)],
            opts
          );
          const [sink1, sink2] = chance.n(() => new WritableMock(opts), 2);
          const pipe = complex.pipe(sink1, sink2);
          expect(pipe).to.be.an.instanceof(WritableComplexStream);
          await e2p(pipe, 'finish');
          expect(sink1.data).to.have.members(data1.value());
          expect(sink2.data).to.have.members(data2.value());
        });

        it('should pipe into duplex', async () => {
          const data1 = _([]).range(50);
          const data2 = _([]).range(50, 50);
          const map = n => n * 2;
          const complex = new DuplexComplexStream(
            [new ReadableMock(data1, opts), new ReadableMock(data2, opts)],
            opts
          );
          const [map1, map2] = chance.n(() => new Map(map, opts), 2);
          const pipe = complex.pipe(map1, map2);
          expect(pipe).to.be.an.instanceof(DuplexComplexStream);
          const sink = new WritableMock(opts);
          pipe.merge().pipe(sink);
          await e2p(sink, 'finish');
          expect(sink.data).to.have.members(
            data1
              .concat(data2.value())
              .map(map)
              .value()
          );
        });
      });
    });
  });
});
