import { makeComponent, makeState } from "@woofjs/client";

export default makeComponent(($, self) => {
  const $message = makeState("test");

  return (
    <div class="example">
      <h3>Component Attributes</h3>
      <div>
        <input type="text" value={$.bind($message)} />
        <hr />
        {/* states passed to attrs without a $ are unwrapped by the component */}
        <SubComponent $state={$message} unwrapped={$message} />
      </div>
    </div>
  );
});

const SubComponent = makeComponent(($, self) => {
  self.debug.name = "SubComponent";

  const $state = self.$attrs.get("$state"); // get state passed as state
  const unwrapped = self.$attrs.get("unwrapped"); // get unwrapped value once
  const $unwrapped = self.$attrs.map("unwrapped"); // map unwrapped value to new state

  return (
    <div>
      <p>Passed as a state: {$state}</p>
      <p>Got from an unwrapped state: {unwrapped} (doesn't update)</p>
      <p>Mapped from an unwrapped state: {$unwrapped}</p>
      <button
        onclick={() => {
          $state.set("test"); // sets the value on the state that still lives in the parent component, referenced here through attrs.
        }}
      >
        Reset State
      </button>
    </div>
  );
});
