import { View } from "woofe";
import logLifecycle from "../utils/logLifecycle";

export class AppLayout extends View {
  static label = "🐕"; // Override class name label in debug messages
  static about =
    "Top level layout for the app. All other routes are rendered in this one's ctx.outlet()";
  static attrs = {};

  setup(ctx) {
    ctx.log("hi");

    logLifecycle(ctx);

    const page = ctx.global("@page");
    const mouse = ctx.global("mouse");

    // Display current mouse coordinates as tab title
    ctx.observe(mouse.$position, (pos) => {
      page.$$title.set(`x:${Math.round(pos.x)} y:${Math.round(pos.y)}`);
    });

    ctx.observe(page.$visibility, (status) => {
      ctx.log(`visibility: ${status}`);
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

        {ctx.outlet()}
      </div>
    );
  }
}

// export const AppLayout = makeView({
//   name: "🐕",
//   setup: (ctx) => {
//     ctx.log("hi");

//     logLifecycle(ctx);

//     const page = ctx.global("@page");
//     const mouse = ctx.global("mouse");

//     // Display current mouse coordinates as tab title
//     ctx.observe(mouse.$position, (pos) => {
//       page.$$title.set(`x:${Math.round(pos.x)} y:${Math.round(pos.y)}`);
//     });

//     ctx.observe(page.$visibility, (status) => {
//       ctx.log(`visibility: ${status}`);
//     });

//     return (
//       <div class="demo">
//         <nav class="nav">
//           <ul>
//             <li>
//               <a href="/examples">Examples</a>
//             </li>
//             <li>
//               <a href="/7guis">7 GUIs</a>
//             </li>
//             <li>
//               <a href="/router-test">Router Test</a>
//             </li>
//             <li>
//               <a href="/nested/one">Nested: #1</a>
//             </li>
//             <li>
//               <a href="/nested/two">Nested: #2</a>
//             </li>
//             <li>
//               <a href="/nested/invalid">Nested: Redirect *</a>
//             </li>
//           </ul>
//         </nav>

//         {ctx.outlet()}
//       </div>
//     );
//   },
// });
