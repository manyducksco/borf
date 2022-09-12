export function ComponentAttrsExample() {
  this.defaultState = {
    message: "test",
  };

  const $$message = this.writable("message");

  return (
    <div class="example">
      <h3>Component Attributes</h3>
      <div>
        <input type="text" value={$$message} />
        <hr />
        <SubComponent message={$$message} />
      </div>
    </div>
  );
}

function SubComponent() {
  this.name = "SubComponent";

  return (
    <div>
      <p>Message: {this.readable("message")}</p>
      <button
        onclick={() => {
          // Sets the value which should set the parent component's message as well because it's two-way bound.
          this.set("message", "test");
        }}
      >
        Reset State
      </button>
    </div>
  );
}
