// @flow

import type { ConditionFunc } from 'types';

export class ConditionWritable {
  stream: any;
  condition: ConditionFunc;

  constructor(
    condition: ConditionFunc,
    stream: stream$Writable | stream$Duplex
  ) {
    this.stream = stream;
    this.condition = condition;
  }

  met(...args: any): boolean {
    return this.condition(...args);
  }
}
