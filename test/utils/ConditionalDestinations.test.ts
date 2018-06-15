/**
 * ConditionalDestinations test file
 */
import * as _ from 'lodash';
import { expect } from 'chai';
import { Writable } from 'stream';

import { ConditionalDestinations } from '../../src/utils';

describe('ConditionalDestination', () => {
  it('should extend basic array', () => {
    expect(new ConditionalDestinations()).to.be.an.instanceof(Array);
  });

  it('should accept size in constructor', () => {
    const size = 10;
    expect(new ConditionalDestinations(size)).to.have.lengthOf(size);
  });

  it('should accept items in constructors', () => {
    const size = 10;
    const items = Array(size).fill({
      stream: new Writable(),
      condition: _.identity
    });
    const cd = new ConditionalDestinations(...items);
    expect(cd).to.have.deep.members(items);
  });

  context('streamOrDefault', () => {
    it('should return matching stream', () => {
      const goodStream = { stream: new Writable(), condition: () => true };
      const others = Array(10).fill({
        stream: new Writable(),
        condition: _.identity
      });
      const cd = new ConditionalDestinations(goodStream, ...others);
      const actual = cd.streamOrDefault({ chunk: false });
      expect(actual).to.deep.equal(goodStream.stream);
    });

    it('should return default value if no matching stream found', () => {
      const cd = new ConditionalDestinations();
      const expected = new Writable();
      const actual = cd.streamOrDefault({ chunk: {} }, expected);
      expect(actual).to.deep.equal(expected);
    });

    it('should return first matching stream if multiple match found', () => {
      const first = { stream: new Writable(), condition: () => true };
      const second = { stream: new Writable(), condition: () => true };
      const cd = new ConditionalDestinations(first, second);
      const actual = cd.streamOrDefault({ chunk: {} });
      expect(actual).to.deep.equal(first.stream);
    });
  });
});
