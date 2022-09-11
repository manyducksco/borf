export default function Timer() {
  this.name = "7guis:Timer";
  this.defaultState = {
    duration: 10, // duration in seconds
    elapsed: 0, // elapsed time in seconds
  };

  let lastTick = null;

  const tick = () => {
    if (this.isConnected) {
      const now = Date.now();

      const elapsed = this.get("elapsed");
      const duration = this.get("duration");

      // Only update if $elapsed hasn't yet reached $duration
      if (elapsed < duration) {
        const difference = (now - lastTick) / 1000;

        this.set("elapsed", (current) => {
          return Math.min(current + difference, duration);
        });
      }

      lastTick = now;
      window.requestAnimationFrame(tick);
    }
  };

  this.afterConnect(() => {
    lastTick = Date.now();

    tick();
  });

  return (
    <div class="example">
      <header>
        <h3>Timer</h3>
      </header>

      <div>
        <div>
          Elapsed Time:{" "}
          <progress max={this.read("duration")} value={this.read("elapsed")} />
        </div>
        <div>{this.read("elapsed").to((seconds) => seconds.toFixed(1))}</div>
        <div>
          Duration:{" "}
          <input
            type="range"
            min={0}
            max={30}
            step={0.1}
            value={this.readWrite("duration")}
          />
        </div>
        <div>
          <button
            onclick={() => {
              this.set("elapsed", 0);
            }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
