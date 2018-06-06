// @flow
import { expect } from 'chai';
import { ReadableMock, WritableMock } from 'stream-mock';
import { PassThrough } from 'stream';
import e2p from 'event-to-promise';
import _ from 'lodash';
import { StreamWrap } from 'complex-streams';

describe('stream wrap', () => {
  it('should wrap a readable stream', () => {
    const stream = new ReadableMock([]);
    expect(StreamWrap.wrap(stream)).to.be.an.instanceof(StreamWrap);
    expect(new StreamWrap(stream)).to.be.an.instanceof(StreamWrap);
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

    context.skip('forkWith', () => {
      it('should return a ComplexStream', () => {});

      it('should fork a stream following conditions', () => {});

      it('should follow error event', () => {});
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
