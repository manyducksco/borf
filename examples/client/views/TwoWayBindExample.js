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
        Two way data binding with <code>.writable()</code>
      </h3>
      <div>
        <input value={this.writable("text")} />
        <input value={this.writable("size")} type="number" />{" "}
        {/* number value gets converted back to number */}
        <p
          style={{
            fontSize: this.readable("size").to((s) => s + "px"),
          }}
        >
          {this.readable("text")}
        </p>
      </div>
    </div>
  );
}
