'use strict';

// Promise-chain mutex serializing async DB mutation tasks.
let tail = Promise.resolve();

function run(fn) {
  const p = tail.then(fn);
  tail = p.catch(function () {});
  return p;
}

module.exports = { run: run };
