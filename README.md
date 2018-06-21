# super-mario [beta]

Stream util library for nodejs.

## Description

Provide transformers and some utility class to extends node stream funcionality.

* Transformers: Chunk, DropWhile, Filter, Map, TakeWhile
* Utility: fork, pipe, split and all transforms

## Installation

```shell
yarn add super-mario
```

## Quickstart

```typescript
import { Chunk, Map, ReadableWrap } from 'super-mario';
import { WritableMock } from 'stream-mock';

const opts = { objectMode: true };

const setAdult = chunk => Object.assign({}, chunk, { adult: true });
const unsetAdult = chunk => Object.assign({}, chunk, { adult: false });

// readable is a Readable stream
const sink = ReadableWrap.wrap(readable) // create a wrap around readable
  .dropWhile(chunk => chunk.name === undefined, opts) // Drop while name is not defined
  .filter(chunk => chunk.name.startsWith('A'), opts) // Filter names starting with `A`
  .split(
    [
      {
        stream: new Map(setAdult, opts), // pipe to Map stream applying setAdult function to each chunk
        condition: chunk => chunk.age >= 18 // condition to send to setAdult mapper
      },
      {
        stream: new Map(unsetAdult, opts), // pipe to Map stream applying unsetAdult function to each chunk
        condition: chunk => chunk.age < 18 // // condition to send to unsetAdult mapper
      }
    ],
    opts
  )
  .pipe([
    // pipe each stream into another stream
    new Chunk(10, opts), // Chunk data by 10
    new Chunk(5, opts) // Chunk data by 5
  ])
  .merge() // Merge both stream in a simple one
  .pipe(new WritableMock(opts)); // Pipe resulting data in to a WritableMock

sink.on('finish', () => console.log(sink.data));
```

## Caveheats

super-mario is currently on beta stage. Here are some caveheats :

* Test coverage is not high enough for streams in buffer mode
* API is not definitive (that's why the API doc is in WIP state)
* No benchamarks.

## Road map

* Improve test coverage
* Add more transformers
* Add performance tests
* Add docs

## Contributing

Feel free to open any bug, feature, or pull request. When making a pr, just remember to cover your code with unit tests. And please follow the code style through `tslint` (but we can discuss about tslint rules).
