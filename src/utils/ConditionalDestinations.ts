/**
 */
import { Writable } from 'stream';
import { StreamCondition } from '../types';

/**
 * Array of stream and conditions
 */
export class ConditionalDestinations extends Array<StreamCondition> {
  constructor(args: number);
  constructor(...args: StreamCondition[]);
  constructor(...args) {
    super(...args);
  }

  public streamOrDefault(
    conditionParams: { chunk: {}; index?: number },
    defaultDestination?: Writable
  ): Writable {
    const found: StreamCondition = this.find(
      (el: StreamCondition) =>
        el.condition(conditionParams.chunk, conditionParams.index) === true
    );

    return found === undefined ? defaultDestination : found.stream;
  }
}
