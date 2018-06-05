// // @flow
// import { expect } from 'chai';
// import { Transform } from 'stream';
// import { ReadableMock, WritableMock } from 'stream-mock';
// import e2p from 'event-to-promise';
// import _ from 'lodash';
// import MultiStream from 'complex-streams/multi-stream';
// import Chance from 'chance';

// const chance = new Chance();

// describe('multi stream', () => {
//   context('object mode', () => {
//     const opt = { objectMode: true };
//     const sourceCount = 3;
//     const datas = Array(sourceCount).fill(
//       chance.n(chance.integer, chance.integer({ min: 2, max: 4 }))
//     );
//     let sources: ReadableMock[], sink: WritableMock;

//     const drained = async () => e2p(sink, 'finish');

//     beforeEach(() => {
//       sources = _.range(sourceCount).map(
//         idx => new ReadableMock(datas[idx], opt)
//       );
//       sink = new WritableMock(opt);
//     });

//     it('should merge streams', async () => {
//       const multiSreams = new MultiStream(sources, opt);
//       multiSreams.merge().pipe(sink);
//       await drained();
//       const expected = _.flatten(datas);
//       expect(sink.data).to.have.members(expected);
//     });
//   });

//   // context('normal (Buffer) mode', () => {
//   //   const data = chance.n(() => Buffer.from(chance.word()), 100);
//   //   let source: ReadableMock, sink: WritableMock;

//   //   const drained = async () => e2p(sink, 'finish');

//   //   beforeEach(() => {
//   //     source = new ReadableMock(data);
//   //     sink = new WritableMock();
//   //   });

//   //   it('should map data with provided function', async () => {
//   //     const map = new Map(_.toUpper);
//   //     source.pipe(map).pipe(sink);
//   //     await drained();
//   //     expect(sink.data.toString()).to.equals(data.join('').toUpperCase());
//   //   });
//   // });
// });
