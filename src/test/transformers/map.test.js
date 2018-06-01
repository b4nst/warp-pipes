// @flow
import { expect } from 'chai';
import { Transform } from 'stream';
import { ReadableMock, WritableMock } from 'stream-mock';
import e2p from 'event-to-promise';
import _ from 'lodash';
import { Map } from 'transformers';
import Chance from 'chance';

const chance = new Chance();

describe('map', () => {
  it('should be an instance of Transform stream', () => {
    const filter = new Map(_.identity);
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

    it('should map data with provided function', async () => {
      const map = new Map(Math.sqrt, opt);
      source.pipe(map).pipe(sink);
      await drained();
      expect(sink.data.length).to.equals(data.__values__.length);
      expect(sink.data).to.deep.equals(data.map(Math.sqrt).value());
    });
  });

  context('normal (Buffer) mode', () => {
    const data = chance.n(() => Buffer.from(chance.word()), 100);
    let source: ReadableMock, sink: WritableMock;

    const drained = async () => e2p(sink, 'finish');

    beforeEach(() => {
      source = new ReadableMock(data);
      sink = new WritableMock();
    });

    it('should map data with provided function', async () => {
      const map = new Map(_.toUpper);
      source.pipe(map).pipe(sink);
      await drained();
      expect(sink.data.toString()).to.equals(data.join('').toUpperCase());
    });
  });
});
