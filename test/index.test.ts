/**
 * import all files for coverage
 */

import * as complexStream from '../src/complex-streams';
import * as transformers from '../src/transformers';
import * as utils from '../src/utils';
import { expect } from 'chai';

describe('Import all for coverage', () => {
  it('complex-streams', () => {
    expect(complexStream).to.exist;
  });

  it('transformers', () => {
    expect(transformers).to.exist;
  });

  it('utils', () => {
    expect(utils).to.exist;
  });
});
