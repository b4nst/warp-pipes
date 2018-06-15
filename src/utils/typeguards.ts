/**
 *
 */

function createTestType(func: Function) {
  if (func === Number || func === String || func === Boolean) {
    // Primitive type
    const expected = func.name.toLowerCase();

    return item => typeof item === expected;
  }

  return item => item instanceof func;
}

export function isPureArrayOf<T>(
  array: any[],
  func: new () => T
): array is T[] {
  const testType = createTestType(func);
  for (const item of array) {
    if (!testType(item)) {
      return false;
    }
  }

  return true;
}

// tslint:disable-next-line:no-any
export function isArrayOf<T>(array: any[], func: new () => T): array is T[] {
  const testType = createTestType(func);
  if (array.length === 0 || testType(array[0])) {
    return true;
  }

  return false;
}
