export default function Counter() {
  this.name = "7guis:Counter";
  this.defaultState = {
    count: 0,
  };

  const $count = this.read("count");

  return (
    <div class="example">
      <header>
        <h3>Counter</h3>
      </header>

      <div>
        <input type="text" value={$count} disabled />
        <button
          onclick={() => {
            this.set("count", (n) => n + 1);
          }}
        >
          Increment
        </button>
      </div>
    </div>
  );
}
