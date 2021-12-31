import { Service, makeState } from "@manyducksco/woof";
import setup from "$bundle";

export default class TestBed extends Service {
  selected = makeState(null);
  suites = makeState([], {
    methods: {
      add: (current, path, suite) => [...current, { path, ...suite }],
    },
  });

  _created() {
    setup((path, suite) => {
      this.suites.add(path, this.#loadSuite(suite));
    });

    this.suites.watch((items) => {
      console.log(items);
    });
  }

  getSuite(path) {
    const suite = this.suites.get().find((s) => s.path === path);

    return suite;
  }

  #loadSuite(suite) {
    let tests = [];
    let views = [];

    const test = (name, fn) => {
      tests.push({ name, fn });
    };

    test.beforeEach = () => {};
    test.afterEach = () => {};
    test.beforeAll = () => {};
    test.afterAll = () => {};

    const view = (name, fn) => {
      views.push({ name, fn });
    };

    suite({ test, view });

    return {
      tests,
      views,
    };
  }
}
