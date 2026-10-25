const { setWorldConstructor } = require('@cucumber/cucumber');

// Per-scenario access to the browser objects created by driver.js.
// Browser/context live per feature (shared across its scenarios); `state`
// persists across scenarios in the same feature and resets with the context.
class CustomWorld {
  constructor({ attach, parameters }) {
    this.attach = attach;
    this.parameters = parameters;
  }

  get page() { return CustomWorld.shared.page; }
  get context() { return CustomWorld.shared.context; }
  get state() { return CustomWorld.shared.state; }
}

CustomWorld.shared = { page: null, context: null, state: {} };

setWorldConstructor(CustomWorld);

module.exports = { CustomWorld };
