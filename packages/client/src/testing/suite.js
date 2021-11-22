export function suite(fn) {
  return fn;
}

function test() {}

test.beforeEach = function () {};
test.afterEach = function () {};
test.beforeAll = function () {};
test.afterAll = function () {};

function view() {}
