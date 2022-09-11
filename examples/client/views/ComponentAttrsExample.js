export function ComponentAttrsExample() {
  this.defaultState = {
    message: "test",
  };

  return (
    <div class="example">
      <h3>Component Attributes</h3>
      <div>
        <input type="text" value={this.readWrite("message")} />
        <hr />
        <SubComponent message={this.readWrite("message")} />
      </div>
    </div>
  );
}

function SubComponent() {
  this.name = "SubComponent";

  return (
    <div>
      <p>Message: {this.read("message")}</p>
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
