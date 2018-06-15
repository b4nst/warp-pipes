/**
 * Splitter test file
 */
import * as _ from 'lodash';
import * as e2p from 'event-to-promise';
import { expect } from 'chai';
import { Writable } from 'stream';
import { ReadableMock, WritableMock } from 'stream-mock';

import { Splitter } from '../../src/complex-streams';
import { ConditionalDestinations } from '../../src/utils';

describe('Splitter', () => {
  it('should be writable', () => {
    const destinations = new ConditionalDestinations();
    expect(new Splitter(destinations)).to.be.an.instanceof(Writable);
  });

  it('should split data', async () => {
    const opts = { objectMode: true };
    const data = _([]).range(100);
    const source = new ReadableMock(data, opts);
    const sink1 = new WritableMock(opts);
    const condition1 = n => n < 50;
    const sink2 = new WritableMock(opts);
    const condition2 = n => !condition1(n) && n < 90;
    const destinations = new ConditionalDestinations(
      { stream: sink1, condition: condition1 },
      { stream: sink2, condition: condition2 }
    );
    const splitter = new Splitter(destinations, opts);
    source.pipe(splitter);
    await e2p(splitter, 'finish');
    expect(sink1.data).to.have.members(data.filter(condition1).value());
    expect(sink2.data).to.have.members(data.filter(condition2).value());
  });
});
