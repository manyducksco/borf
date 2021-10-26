# Web Framework

A not-yet-named web framework with these goals:

- Made up of individual tools that compose well together
- Doesn't require any transpiling or build system
- Runs the minimal amount of logic to get the job done (including DOM updates)

## TODO

Utilities

- Function to set page title
- HTTP request wrapper with built in auth and parsing

Extras

- Add a toast notification system (accessible)
- Add a modal component (accessible)
- Add consistently designed input components (accessible)
  - date / time / datetime picker (with time zone support)

## Test

```js

```

## Naming

Receptor?

Call a subscription a receptor instead. Use the biology metaphor. The central idea is sending and receiving things. Elements are for setting up the DOM to receive new data. Pipes are for sending and receiving across the app, or between client and server, or server and server. I want to see how many things I can apply this send/receive pattern to.

```js
// get an instance
const receptor = state.receive("items");

// define a handler
state.receive("items", (value) => {
  // ...
});

// text receives the title when it changes
h1({ children: [text(state.receive("title"))] });

// input is bound and will update state when it changes
input({
  type: "text",
  value: state.bind("title"),
});

// receive from a Pipe
pipe.receive((value) => {
  console.log(value);
});

pipe.send(value, (response) => {
  // send data and process replies
});

pipe.receive((value, reply) => {
  // receive value and optionally reply
});
```

## Terminology

- Transmitter: The main source of data. Elements can receive transmitted properties and update when they change.
- Component:
- State: Type of Transmitter that retains data and transmits when it changes

## Problems a Web Framework Should Solve

- Keep state close to the place where it's being used (component state)
- Effortlessly keep the DOM in sync with the data. You should never even need to think about this.
- Guide you toward doing things correctly, especially when you don't know what that looks like
  - Conventions should steer you toward good solutions (a.k.a "Pit of Success")
- Solve all the major problems without stepping out of the framework
  - Views
  - Routes
  - State management
  - Local data caching (API calls)
  - HTTP requests
- Should be easy to think about what all the parts are and how they're related

```js
import webframework from "webframework";

const app = webframework();

app.route(/* ... */);

app.route("/", ({ cache, route, ...state }, next) => {
  const title = new PageTitleState();
  state.setTitle("New Page Title");
  emit(events.DOMTITLECHANGE, "New Title");

  title.set("New Page Title");

  SomeInput({
    value,
  });

  console.log(state.title);
});

function SomeInput({ value, onClick }) {
  return E("input", {
    value: value.bind(),
  });
}

function Layout(route) {
  return E("div", {
    class: "layout",
    children: [
      ChannelSidebar(route),
      E("main", {
        children: [
          route.switch([
            ["", emptyPage],
            ["all/tasks", allTasksPage],
            ["profile/:id", profilePage],
            ["channel/:id", channelPage],
            [
              "*",
              (route) => {
                route.redirect("");
              },
            ],
          ]),
        ],
      }),
    ],
  });
}

function ChannelSidebar(route) {}

const router = new Router();

router.on(
  "",
  (route) => {
    fetch("/some-data")
      .then((res) => res.json())
      .then((json) => {
        route.next(json);
      });

    return LoadingScreen();
  },
  (route, data) => {
    return Component(data);
  }
);

router.on("*", (route) => {
  route.redirect("/somewhere/else");
});

router.connect("#root");
```
