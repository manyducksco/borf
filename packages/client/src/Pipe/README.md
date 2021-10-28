# Pipe

A message pipe for sending data from place to place. Like a warp pipe from Mario. Somewhere between an event emitter and an observable.

```js
const messages = new Pipe();

messages.send(data);

messages.receive((data) => {
  // process data
});

messages
  .map((data) => data.toUpperCase())
  .receive((data) => {
    // process data
  });

messages
  .filter((data) => data.includes("doggo"))
  .map((data) => data.toUpperCase())
  .receive((data) => {
    // receive messages containing 'doggo' in all UPPERCASE
  });

// receive the latest data pushed within a 300ms window since the last was received
// or immediately if outside the window
messages.debounce(300).receive((data) => {});

// group events and only receive once 5 have accumulated
// if 5 haven't accumulated in 2 seconds, receive whatever is there now
// timeout is optional
messages.buffer(5, 2000).receive((data) => {
  // data is now an array of 1 to 5 items
});

// get a subscription
messages.subscribe();

// data can also be replied to with the .reply function
// reply takes an async function and its resolved value becomes the response
messages.receive((data, reply) => {
  reply("received data #1");
});

// you can pass a function to handle replies
messages.send(data, (reply) => {
  // do something with reply value
  // this function is called once for each reply in the order the replies were sent
  // replies are only received by the sender
});

// pass array of pipe names
const hub = new Hub(["messages", "comments", "todos"]);

hub.send("messages", data);
hub.send("nonexistent", data); // will throw error because pipe isn't registered

// get a reference to the pipe to do whatever you want with it
hub
  .pipe("messages")
  .map((data) => data.toUpperCase())
  .receive((value) => {
    // subscribe to messages, but uppercased
  });
hub.pipe("nonexistent"); // will throw error because pipe isn't registered

hub.receive("messages", (data) => {});
hub.receive("nonexistent", (data) => {}); // will throw error because pipe isn't registered
```

```js
const hub = new Hub({
  pipes: ["user:status"],
});

hub.receive("user:status", (data) => {
  console.log(`user ${data.userId} is ${data.status}`);
});

hub
  .pipe("user:status")
  .filter((data) => data.status === "online")
  .receive((data) => {
    // receive data only when users come online.
  });

hub.send("user:status", {
  userId: 1,
  status: "online",
});
```

There is also a NetworkHub, which works the same way but operates over a websocket connection to a server. The server presumably also uses a NetworkHub to send, receive and reply in the same way.

```js
const hub = new NetworkHub({
  socket: new WebSocket("wss://www.example.com/socket"),
  pipes: ["user:status", "user:lookup"],
});

hub.receive("user:status", (data) => {});

hub.send("user:lookup", userId, (user) => {
  // do something with user data from server
  state.set("name", user.name);
});
```