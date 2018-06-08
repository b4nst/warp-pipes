// @flow
import Chance from 'chance';
import _ from 'lodash';
import e2p from 'event-to-promise';
import { PassThrough } from 'stream';
import { ReadableMock, WritableMock } from 'stream-mock';
import { StreamWrap, ComplexStream } from 'complex-streams';
import { expect } from 'chai';

const chance = new Chance();

describe('stream wrap', () => {
  it('should wrap a readable stream', () => {
    const stream = new ReadableMock([]);
    expect(StreamWrap.wrap(stream)).to.be.an.instanceof(StreamWrap);
    expect(new StreamWrap(stream)).to.be.an.instanceof(StreamWrap);
  });

  it('should forward events from inner stream', () => {
    const eventName = chance.string();
    const wrap = StreamWrap.wrap(new ReadableMock([]));
    const callback = _.identity;
    wrap.on(eventName, callback);
    expect(wrap.stream.listeners(eventName)).to.deep.include(callback);
    wrap.removeListener(eventName, callback);
    expect(wrap.stream.listenerCount(eventName)).to.equals(0);
  });

  context('object mode', () => {
    const opts = { objectMode: true };
    const data = _.range(100);
    let source, sink, wrap;

    const drained = async () => e2p(sink, 'finish');

    beforeEach(() => {
      source = new ReadableMock(data, opts);
      wrap = StreamWrap.wrap(source);
      sink = new WritableMock(opts);
    });

    context('split', () => {
      it('should return a ComplexStream', () => {
        const destinations = [
          [_.identity, new WritableMock(opts)],
          [_.identity, new WritableMock(opts)]
        ];
        const stream = wrap.split(destinations, opts);
        expect(stream).to.be.an.instanceof(ComplexStream);
      });

      it('should split a stream following conditions', async () => {
        const sink2 = new WritableMock(opts);
        const sinkCond = n => n < 50;
        const sink2Cond = n => !sinkCond(n);
        const stream = wrap.split([[sinkCond, sink], [sink2Cond, sink2]], opts);
        await e2p(stream, 'finish');
        expect(sink.data).to.have.members(data.filter(sinkCond));
        expect(sink2.data).to.have.members(data.filter(sink2Cond));
      });
    });

    context('fork', () => {
      it('should return a ComplexStream', () => {
        const destinations: Array<stream$Writable> = [
          new WritableMock(opts),
          new WritableMock(opts)
        ];
        const stream = wrap.fork(destinations, opts);
        expect(stream).to.be.an.instanceof(ComplexStream);
      });

      it('should fork a stream', async () => {
        const sink2 = new WritableMock(opts);
        const stream = wrap.fork([sink, sink2], opts);
        await e2p(stream, 'finish');
        expect(sink.data).to.have.members(data);
        expect(sink2.data).to.have.members(data);
      });
    });

    context('pipe', () => {
      it('should return an other StreamWrap if piped with duplex', () => {
        const actual = wrap.pipe(new PassThrough(opts));
        expect(actual).to.be.an.instanceof(StreamWrap);
      });

      it('should return writable if piped with writable', () => {
        const actual = wrap.pipe(sink);
        expect(actual).to.be.an.instanceof(WritableMock);
      });

      it('should pipe into writable', async () => {
        wrap.pipe(sink);
        await drained();
        expect(sink.data).to.have.members(data);
      });
    });

    context('filter', () => {
      it('should return a StreamWrap', () => {
        expect(wrap.filter(_.identity, opts)).to.be.an.instanceof(StreamWrap);
      });

      it('should filter input', async () => {
        const filter = n => n % 2 === 0;
        wrap.filter(filter, opts).pipe(sink);
        await drained();
        const expected = data.filter(filter);
        expect(sink.data).to.have.members(expected);
      });
    });

    context('map', () => {
      it('should return a StreamWrap', () => {
        expect(wrap.map(_.identity, opts)).to.be.an.instanceof(StreamWrap);
      });

      it('should map input', async () => {
        const mapper = n => n * 2;
        wrap.map(mapper, opts).pipe(sink);
        await drained();
        const expected = data.map(mapper);
        expect(sink.data).to.have.members(expected);
      });
    });

    context('chunk', () => {
      it('should return a StreamWrap', () => {
        expect(wrap.chunk(10, opts)).to.be.an.instanceof(StreamWrap);
      });

      it('should chunk input', async () => {
        const chunkSize = 8;
        wrap.chunk(chunkSize, opts).pipe(sink);
        await drained();
        const expected = _.chunk(data, chunkSize);
        expect(sink.data).to.have.deep.members(expected);
      });
    });

    context('dropWhile', () => {
      it('should return a StreamWrap', () => {
        expect(wrap.dropWhile(_.identity, opts)).to.be.an.instanceof(
          StreamWrap
        );
      });

      it('should block input until condition is met', async () => {
        const test = n => n < 50;
        wrap.dropWhile(test, opts).pipe(sink);
        await drained();
        const expected = _.dropWhile(data, test);
        expect(sink.data).to.have.members(expected);
      });
    });

    context('takeWhile', () => {
      it('should return a StreamWrap', () => {
        expect(wrap.takeWhile(_.identity, opts)).to.be.an.instanceof(
          StreamWrap
        );
      });

      it('should block input until condition is met', async () => {
        const test = n => n < 50;
        wrap.takeWhile(test, opts).pipe(sink);
        await drained();
        const expected = _.takeWhile(data, test);
        expect(sink.data).to.have.members(expected);
      });
    });
  });
});
