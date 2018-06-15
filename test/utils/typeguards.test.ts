/**
 * typeguards test file
 */
import { expect } from 'chai';
import * as Chance from 'chance';
import * as e2p from 'event-to-promise';
import * as _ from 'lodash';
import { Transform } from 'stream';
import { ReadableMock, WritableMock } from 'stream-mock';
import * as typeguards from '../../src/utils/typeguards';

describe('typeguards', () => {
  let chance: Chance.Chance;

  before(() => {
    chance = new Chance();
  });

  context('isPureArrayOf', () => {
    it('should return true if array contains only items of expected type', () => {
      const array = chance.n(chance.timezone, 100);
      expect(typeguards.isPureArrayOf(array, Object)).to.equal(
        true,
        'expected isPureArrayOf to return true'
      );
    });

    context('should be usable with primitive types', () => {
      it('Number', () => {
        const array = chance.n(chance.integer, 100);
        expect(typeguards.isPureArrayOf(array, Number)).to.equal(
          true,
          'expected isPureArrayOf to return true'
        );
      });

      it('Boolean', () => {
        const array = chance.n(chance.bool, 100);
        expect(typeguards.isPureArrayOf(array, Boolean)).to.equal(
          true,
          'expected isPureArrayOf to return true'
        );
      });

      it('String', () => {
        const array = chance.n(chance.string, 100);
        expect(typeguards.isPureArrayOf(array, String)).to.equal(
          true,
          'expected isPureArrayOf to return true'
        );
      });
    });

    it('should return false if one item is not of expected type', () => {
      const array: (Chance.Timezone | string)[] = chance.n(
        chance.timezone,
        100
      );
      array.push('NaN');
      expect(typeguards.isPureArrayOf(array, Object)).to.equal(
        false,
        'expected isPureArrayOf to return false'
      );
    });
  });

  context('isArrayOf', () => {
    it('should return true if first item in Array is of expected type', () => {
      const array = chance.n(chance.timezone, 100);
      expect(typeguards.isArrayOf(array, Object)).to.equal(
        true,
        'expected isArrayOf to return true'
      );
    });

    it('should return false if first item in Array is not expected type', () => {
      const array: (Chance.Timezone | string)[] = ['NaN'];
      array.push(...chance.n(chance.timezone, 100));
      expect(typeguards.isArrayOf(array, Object)).to.equal(
        false,
        'expected isArrayOf to return false'
      );
    });
  });
});
