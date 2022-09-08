import logLifecycle from "../utils/logLifecycle";

export function AppLayout() {
  this.debug.name = "🐕";
  this.debug.log("hi");

  logLifecycle(this);

  const page = this.getService("page");
  const mouse = this.getService("mouse");

  // this.loadRoute(({ show, done }) => {
  //   // When the done() function is called, this content is removed and the real component is connected.

  //   return show(
  //     <div>
  //       <h1>WELCOME</h1>
  //       <p>This page has examples of things woof can do.</p>
  //       <p>
  //         Click the button below to demonstrate calling <code>done()</code> in a
  //         route component's loadRoute hook. When it's triggered by an event, you
  //         can create disclaimer pages like this. Generally you would use this to
  //         show temp content while making API calls.
  //       </p>
  //       <button
  //         onclick={() => done()}
  //         title="demonstrate calling done() in a component's preload hook"
  //       >
  //         Continue
  //       </button>
  //     </div>
  //   );
  // });

  // Display current mouse coordinates as tab title
  this.subscribeTo(mouse.$position, (pos) => {
    page.$title.set(`x:${Math.round(pos.x)} y:${Math.round(pos.y)}`);
  });

  return (
    <div class="demo">
      <nav class="nav">
        <ul>
          <li>
            <a href="/examples">Examples</a>
          </li>
          <li>
            <a href="/7guis">7 GUIs</a>
          </li>
          <li>
            <a href="/router-test">Router Test</a>
          </li>
          <li>
            <a href="/nested/one">Nested: #1</a>
          </li>
          <li>
            <a href="/nested/two">Nested: #2</a>
          </li>
          <li>
            <a href="/nested/invalid">Nested: Redirect *</a>
          </li>
        </ul>
      </nav>

      {this.children}
    </div>
  );
}
