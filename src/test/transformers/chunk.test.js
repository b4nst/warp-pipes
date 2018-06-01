// @flow
import { expect } from 'chai';
import { Transform } from 'stream';
import { ReadableMock, WritableMock } from 'stream-mock';
import e2p from 'event-to-promise';
import _ from 'lodash';
import { Chunk } from 'transformers';
import Chance from 'chance';

const chance = new Chance();

describe('chunk', () => {
  it('should be an instance of Transform stream', () => {
    const chunk = new Chunk(10);
    expect(chunk).to.be.an.instanceOf(Transform);
  });

  context('object mode', () => {
    const opt = { objectMode: true };
    const count = 100;
    const data = _.range(count);
    let source: ReadableMock, sink: WritableMock;

    const drained = async () => e2p(sink, 'finish');

    beforeEach(() => {
      source = new ReadableMock(data, opt);
      sink = new WritableMock(opt);
    });

    it('should chunk array', async () => {
      const chunkCount = 10;
      const chunk = new Chunk(chunkCount, opt);
      source.pipe(chunk).pipe(sink);
      await drained();
      expect(sink.data.length).to.equals(Math.ceil(count / chunkCount));
      expect(sink.flatData).to.deep.equals(data);
    });

    it('should send the remaining elements', async () => {
      const chunkCount = 8;
      const chunk = new Chunk(chunkCount, opt);
      source.pipe(chunk).pipe(sink);
      await drained();
      const rest = _.last(sink.data);
      expect(sink.data.length).to.equals(Math.ceil(count / chunkCount));
      expect(rest.length, 'Rest size').to.equal(count % chunkCount);
      expect(rest).to.deep.equal(_.takeRight(data, count % chunkCount));
      expect(sink.flatData).to.deep.equals(data);
    });
  });

  context('normal (Buffer) mode', () => {
    const length = 100;
    const data = [chance.buffer({ length })];
    let source: ReadableMock;

    beforeEach(() => {
      source = new ReadableMock(data);
    });

    it('should split buffer by chunk', async () => {
      const chunkCount = 10;
      let offset = 0;
      const chunk = new Chunk(chunkCount);
      const bufData = _.first(data);
      source.pipe(chunk);
      chunk.on('data', buf => {
        const expected = Buffer.alloc(chunkCount);
        bufData.copy(expected, 0, offset);
        offset += chunkCount;
        expect(buf.length).to.equals(chunkCount);
        expect(buf).to.deep.equals(expected);
      });
      await e2p(chunk, 'end');
    });

    it('should send last buffer with a smaller length', async () => {
      const chunkCount = 8;
      const chunk = new Chunk(chunkCount);
      const bufData = _.first(data);
      let idx = 0;
      source.pipe(chunk);
      chunk.on('data', buf => {
        if (idx >= Math.floor(length / chunkCount)) {
          const restLength = length % chunkCount;
          const expected = Buffer.alloc(restLength);
          bufData.copy(expected, 0, bufData.length - restLength);
          expect(buf.length).to.equals(restLength);
          expect(buf).to.deep.equals(expected);
        }
        idx++;
      });
      await e2p(chunk, 'end');
    });
  });
});
