// @flow
export type ErrorOrNullCallback = (error: ?Error) => void;
export type MapFunction<T> = T => T;
export type ConditionFunc = any => boolean;
