/**
 * Map test file
 */
import { expect } from 'chai';
import * as Chance from 'chance';
import * as e2p from 'event-to-promise';
import * as _ from 'lodash';
import { Transform } from 'stream';
import { ReadableMock, WritableMock } from 'stream-mock';
import { Map } from '../../src/transformers';

describe('map', () => {
  let chance;

  before(() => {
    chance = new Chance();
  });

  it('should be an instance of Transform stream', () => {
    const filter = new Map(_.identity);
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

    it('should map data with provided function', async () => {
      const map = new Map(Math.sqrt, opt);
      source.pipe(map).pipe(sink);
      await drained();
      expect(sink.data.length).to.equals(data.value().length);
      expect(sink.data).to.deep.equals(data.map(Math.sqrt).value());
    });
  });

  context('normal (Buffer) mode', () => {
    let data: Buffer[];
    let source: ReadableMock;
    let sink: WritableMock;

    const drained = async () => e2p(sink, 'finish');

    beforeEach(() => {
      data = chance.n(() => Buffer.from(chance.word()), 100);
      source = new ReadableMock(data);
      sink = new WritableMock();
    });

    it('should map data with provided function', async () => {
      const map = new Map(_.toUpper);
      source.pipe(map).pipe(sink);
      await drained();
      const actual = Array.isArray(sink.data)
        ? sink.data.join('')
        : sink.data.toString(); // TODO fix stream-mock #8
      expect(actual).to.equals(data.join('').toUpperCase());
    });
  });
});
