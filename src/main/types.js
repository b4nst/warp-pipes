// @flow
export type ErrorOrNullCallback = (error: ?Error) => void;
export type MapFunc = any => any;
export type ConditionFunc = (...args: any[]) => boolean;
