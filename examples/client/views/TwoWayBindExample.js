import logLifecycle from "../utils/logLifecycle.js";

export function TwoWayBindExample() {
  this.name = "TwoWayBindExample";
  this.defaultState = {
    text: "edit me",
    size: 18,
  };

  logLifecycle(this);

  return (
    <div class="example">
      <h3>
        Two way data binding with <code>.readWrite()</code>
      </h3>
      <div>
        <input value={this.readWrite("text")} />
        <input value={this.readWrite("size")} type="number" />{" "}
        {/* number value gets converted back to number */}
        <p
          style={{
            fontSize: this.read("size").to((s) => s + "px"),
          }}
        >
          {this.read("text")}
        </p>
      </div>
    </div>
  );
}
