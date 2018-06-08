// @flow
import _ from 'lodash';
import e2p from 'event-to-promise';
import sinon from 'sinon';
import { Map } from 'transformers';
import { PassThrough } from 'stream';
import { ReadableMock, WritableMock } from 'stream-mock';
import { StreamWrap, ComplexStream } from 'complex-streams';
import { expect } from 'chai';

describe('complex stream', () => {
  it('should forward error event', () => {
    const reader = new PassThrough();
    const stream = new ComplexStream([reader]);
    const error = new Error('jarjarbinks');
    const spy = sinon.spy();
    stream.once('error', spy);
    reader.emit('error', error);
    expect(spy.calledOnce).to.be.true;
  });

  it('should be a sink if created with writable', () => {
    const stream = new ComplexStream([new WritableMock()]);
    expect(stream.isSink).to.be.true;
  });

  it('should not be a sink if created with Duplex', () => {
    const stream = new ComplexStream([new PassThrough()]);
    expect(stream.isSink).to.be.false;
  });

  it('should emit finish only when all inner streams are done', async () => {
    const sink1 = new WritableMock();
    const sink2 = new WritableMock();
    const stream = new ComplexStream([sink1, sink2]);
    const spy = sinon.spy();
    let _done = false;

    stream.once('finish', spy);
    sink1.on('finish', () => {
      expect(spy.notCalled).to.be.true;
      _done = true;
    });
    new ReadableMock([]).pipe(sink1);
    new ReadableMock(_.range(100)).pipe(sink2);
    await e2p(stream, 'finish');
    expect(_done, 'Expected spy to be tested').to.be.true;
  });

  context('merge', () => {
    it('should return a StreamWrap', () => {
      const stream = new ComplexStream([new PassThrough()]);
      expect(stream.merge()).to.be.an.instanceof(StreamWrap);
    });

    it('should throw if is a sink', () => {
      const stream = new ComplexStream([new WritableMock()]);
      expect(stream.merge).to.throw();
    });

    it('should forward error', () => {
      const inner = new PassThrough();
      const stream = new ComplexStream([inner]);
      const merge = stream.merge();
      const spy = sinon.spy();
      const error = 'error';
      merge.once('error', spy);
      inner.emit('error', error);
      expect(
        spy.calledOnceWith(error),
        'Expected spy to be called once with error'
      ).to.be.true;
    });

    context('object mode', () => {
      const opts = { objectMode: true };
      const data = _.range(100);

      it('should merge stream', async () => {
        const destinations = [new PassThrough(opts), new PassThrough(opts)];
        const sink = StreamWrap.wrap(new ReadableMock(data, opts))
          .fork(destinations, opts)
          .merge()
          .pipe(new WritableMock(opts));
        await e2p(sink, 'finish');
        // $FlowFixMe StreamWrap should be parametrized
        expect(sink.data).to.have.members(_.concat(data, data));
      });
    });
  });

  context('pipe', () => {
    it('should return a ComplexStream', () => {
      const stream = new ComplexStream([new PassThrough()]);
      expect(stream.pipe(new PassThrough())).to.be.an.instanceof(ComplexStream);
    });

    it('should throw if is a sink', () => {
      const stream = new ComplexStream([new WritableMock()]);
      expect(() => stream.pipe([new PassThrough()])).to.throw(
        'This stream is a sink'
      );
    });

    it('should throw on incorrect number of args', () => {
      const stream = new ComplexStream([new PassThrough()]);
      expect(() => stream.pipe()).to.throw(
        'Incorrect number of streams to pipe'
      );
      expect(() => stream.pipe(new PassThrough(), new PassThrough())).to.throw(
        'Incorrect number of streams to pipe'
      );
    });

    context('object mode', () => {
      const opts = { objectMode: true };
      const data = _.range(100);

      it('should pipe multiple streams', async () => {
        const destinations = [new PassThrough(opts), new PassThrough(opts)];
        const func1 = n => n * 2;
        const func2 = n => n + 2;
        const sink = StreamWrap.wrap(new ReadableMock(data, opts))
          .fork(destinations, opts)
          .pipe(new Map(func1, opts), new Map(func2, opts))
          .merge()
          .pipe(new WritableMock(opts));
        await e2p(sink, 'finish');
        const expected = _.concat(_.map(data, func1), _.map(data, func2));
        // $FlowFixMe StreamWrap should be parametrized
        expect(sink.data).to.have.members(expected);
      });
    });
  });
});
