/**
 * types
 */

import { Writable } from 'stream';

// tslint:disable-next-line:no-any
export type ConditionFunction = (chunk: any, index?: number) => boolean;

export type StreamCondition = {
  stream: Writable;
  condition: ConditionFunction;
};
