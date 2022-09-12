import logLifecycle from "../utils/logLifecycle.js";

export function ConditionalExample() {
  this.name = "ConditionalExample";
  this.defaultState = {
    show: false,
  };

  logLifecycle(this);

  // TODO: Merge might need a name that makes sense with one key.
  const $label = this.merge("show", (t) => (t ? "Hide Text" : "Show Text"));

  return (
    <div class="example">
      <h3>
        Conditional rendering with <code>when()</code>
      </h3>
      <div>
        <button
          onclick={() => {
            this.set("show", (t) => !t);
          }}
        >
          {$label}
        </button>
        {this.when("show", <span>Hello there!</span>)}
      </div>
    </div>
  );
}
