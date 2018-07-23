/**
 * Chunk test file
 */
import { expect } from 'chai';
import * as Chance from 'chance';
import * as e2p from 'event-to-promise';
import * as _ from 'lodash';
import { Transform } from 'stream';
import { ReadableMock, WritableMock } from 'stream-mock';

import { Flatten } from '../../src/transformers';

describe('chunk', () => {
  let chance;

  before(() => {
    chance = new Chance();
  });

  it('should be an instance of Transform stream', () => {
    const flatten = new Flatten();
    expect(flatten).to.be.an.instanceOf(Transform);
  });

  it('should throw when objectMode = false', () => {
    expect(() => new Flatten({ objectMode: false })).to.throw(
      'Flatten transform operate in objectMode only'
    );
  });

  context('object mode', () => {
    const opt = { objectMode: true };
    const count = 100;
    let data: any[];
    let source: ReadableMock;
    let sink: WritableMock;

    const drained = async () => e2p(sink, 'finish');

    it('should flatten array', async () => {
      data = [[1, 2, 3], ['foo', 'bar', 'baz'], 4];
      source = new ReadableMock(data, opt);
      sink = new WritableMock(opt);
      const flatten = new Flatten(opt);
      source.pipe(flatten).pipe(sink);
      await drained();

      const expected = [1, 2, 3, 'foo', 'bar', 'baz', 4];
      expect(sink.data).to.have.members(expected);
    });
  });
});
