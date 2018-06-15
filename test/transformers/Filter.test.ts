/**
 * Filter test file
 */
import { expect } from 'chai';
import * as Chance from 'chance';
import * as e2p from 'event-to-promise';
import * as _ from 'lodash';
import { Transform } from 'stream';
import { ReadableMock, WritableMock } from 'stream-mock';
import { Filter } from '../../src/transformers';

describe('filter', () => {
  let chance;

  before(() => {
    chance = new Chance();
  });

  it('should be an instance of Transform stream', () => {
    const filter = new Filter(_.identity);
    expect(filter).to.be.an.instanceOf(Transform);
  });

  context('object mode', () => {
    const opt = { objectMode: true };
    let data: _.LoDashImplicitWrapper<number[]>;
    let source: ReadableMock;
    let sink: WritableMock;

    const drained = async () => e2p(sink, 'finish');

    beforeEach(() => {
      data = _([]).range(100);
      source = new ReadableMock(data, opt);
      sink = new WritableMock(opt);
    });

    it('should filter with provided function', async () => {
      const isEven = num => num % 2 === 0;
      const filter = new Filter(isEven, opt);
      source.pipe(filter).pipe(sink);
      await drained();
      expect(sink.data.length).to.be.below(data.value().length);
      expect(sink.data).to.deep.equals(data.filter(isEven).value());
    });
  });

  context('normal (Buffer) mode', () => {
    let data: _.LoDashExplicitWrapper<Buffer[]>;
    let source: ReadableMock;
    let sink: WritableMock;

    const drained = async () => e2p(sink, 'finish');

    beforeEach(() => {
      data = _.chain(chance.n(chance.buffer, 60)).concat(
        Array(40).fill(Buffer.from('foo', 'utf8'))
      );
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
