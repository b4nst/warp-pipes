/**
 * TakeWhile test file
 */
import { expect } from 'chai';
import * as Chance from 'chance';
import * as e2p from 'event-to-promise';
import * as _ from 'lodash';
import * as sinon from 'sinon';
import { Transform } from 'stream';
import { ReadableMock, WritableMock } from 'stream-mock';
import { TakeWhile } from '../../src/transformers';

describe('take while', () => {
  let chance;

  before(() => {
    chance = new Chance();
  });

  it('should be an instance of Transform stream', () => {
    const pass = new TakeWhile(_.identity);
    expect(pass).to.be.an.instanceOf(Transform);
  });

  it('should send correct args to callback', async () => {
    const str = chance.string();
    const spy = sinon.spy(() => true);
    const stream = new TakeWhile(spy);
    const source = new ReadableMock(str);
    const sink = new WritableMock();
    source.pipe(stream).pipe(sink);

    await e2p(sink, 'finish');
    const expected = _([])
      .range(str.length)
      .map(idx => [Buffer.from(str.charAt(idx)), idx]);
    expect(spy.args).to.have.deep.members(expected.value());
  });

  context('object mode', () => {
    const opt = {
      objectMode: true
    };
    let data;
    let source: ReadableMock;
    let sink: WritableMock;

    const drained = async () => e2p(sink, 'finish');

    beforeEach(() => {
      data = _.range(100);
      source = new ReadableMock(data, opt);
      sink = new WritableMock(opt);
    });

    it('should take data while condition is met', async () => {
      const lte50 = v => v <= 50;
      const pass = new TakeWhile(lte50, opt);
      source.pipe(pass).pipe(sink);
      await drained();
      const expected = _.takeWhile(data, lte50);
      expect(sink.data).to.have.members(expected);
    });
  });

  context('normal (Buffer) mode', () => {
    const data = 'Hello World!';
    let source: ReadableMock;
    let sink: WritableMock;

    const drained = async () => e2p(sink, 'finish');

    beforeEach(() => {
      source = new ReadableMock(data);
      sink = new WritableMock();
    });

    it('should take data while condition is met', async () => {
      const isNotSpace = v => v.toString() !== ' ';
      const pass = new TakeWhile(isNotSpace);
      source.pipe(pass).pipe(sink);
      await drained();
      const expected = 'Hello';
      const actual = Array.isArray(sink.data)
        ? sink.data.join('')
        : sink.data.toString(); // TODO fix stream-mock #8
      expect(actual).to.equals(expected);
    });
  });
});
