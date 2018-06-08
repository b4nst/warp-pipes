// // @flow
// import { StreamWrap, ConditionWritable } from 'complex-streams';
// import { Map, TakeWhile } from 'transformers';
// import { ReadableMock, WritableMock } from 'stream-mock';
// import { Writable } from 'stream';
// import _ from 'lodash';

// const opts = { objectMode: true };

// const input = new ReadableMock(_.range(100), opts);
// const sink = new WritableMock(opts);

// const destinations = [
//   new ConditionWritable(n => n < 100, new Map(n => -n, opts)),
//   new ConditionWritable(n => n >= 100, new TakeWhile(n => n > 150, opts))
// ];

// const cplx = StreamWrap.wrap(input)
//   .filter(n => n % 2 === 0, opts)
//   .map(n => n * 2, opts)
//   .forkWith(destinations, opts)
//   .pipe(new TakeWhile(n => n < -50, opts), new Map(n => n * 2, opts))
//   .merge()
//   .pipe(sink);

// if (cplx instanceof Writable) {
//   cplx.on('finish', () => console.log(sink.flatData));
// }
