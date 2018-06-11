// @flow
import Chance from 'chance';
import _ from 'lodash';
import e2p from 'event-to-promise';
import { Filter } from 'transformers';
import { ReadableMock, WritableMock } from 'stream-mock';
import { Transform } from 'stream';
import { expect } from 'chai';

const chance = new Chance();

describe('filter', () => {
  it('should be an instance of Transform stream', () => {
    const filter = new Filter(_.identity);
    expect(filter).to.be.an.instanceOf(Transform);
  });

  context('object mode', () => {
    const opt = { objectMode: true };
    const data = _.chain(_.range(100));
    let source: ReadableMock, sink: WritableMock;

    const drained = async () => e2p(sink, 'finish');

    beforeEach(() => {
      source = new ReadableMock(data, opt);
      sink = new WritableMock(opt);
    });

    it('should filter with provided function', async () => {
      const isEven = num => num % 2 === 0;
      const filter = new Filter(isEven, opt);
      source.pipe(filter).pipe(sink);
      await drained();
      expect(sink.data.length).to.be.below(data.__values__.length);
      expect(sink.data).to.deep.equals(data.filter(isEven).value());
    });
  });

  context('normal (Buffer) mode', () => {
    const data = _.chain(chance.n(chance.buffer, 60)).concat(
      Array(40).fill(Buffer.from('foo', 'utf8'))
    );
    let source: ReadableMock, sink: WritableMock;

    const drained = async () => e2p(sink, 'finish');

    beforeEach(() => {
      source = new ReadableMock(data);
      sink = new WritableMock();
    });

    it('should filter with provided function', async () => {
      const isFoo = buff => buff.toString('utf8') === 'foo';
      const filter = new Filter(isFoo);
      source.pipe(filter).pipe(sink);
      await drained();
      const actual = Array.isArray(sink.data)
        ? sink.data.join('')
        : sink.data.toString(); // TODO fix stream-mock #8
      expect(actual).to.deep.equals(
        data
          .filter(isFoo)
          .join('')
          .value()
      );
    });
  });
});
