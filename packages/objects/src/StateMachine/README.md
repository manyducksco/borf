# StateMachine

```ts
type TrafficLights = "red" | "yellow" | "green";

const light = new StateMachine<TrafficLights>("red", {
  green: ["yellow"], // Can transition from green -> yellow
  yellow: ["red"], // Can transition from yellow -> red
  red: ["green"], // Can transition from red -> green
});



light.to("green"); // returns true because transition was successful: red -> green = ok
light.to("red"); // returns false because transition failed: green -> red = invalid

// Returning a boolean lets you do conditional things like this if the transition was successful:
if (light.to('red')) {
  stopCar();
}

light.state; // "green"

const sub = light.subscribe((state) => {
  if (state === "green") {
    // Called when state changes to "green".
  }
});

enum LoginStatus = {
  LoggedOut: "loggedOut",
  LoggedIn: "loggedIn",
  LoggingIn: "loggingIn",
  LoginError: "loginError",
  LoggingOut: "loggingOut"
}

const userStatus = new StateMachine<LoginStatus>(LoginStatus.LoggedOut, {
  [LoginStatus.LoggedOut]: [LoginStatus.LoggingIn],
  [LoginStatus.LoggingIn]: [LoginStatus.LoggedIn, LoginStatus.LoginError],
  [LoginStatus.LoginError]: [LoginStatus.LoggedOut],
  [LoginStatus.LoggedIn]: [LoginStatus.LoggingOut],
  [LoginStatus.LoggingOut]: [LoginStatus.LoggedOut]
});

userStatus.to(LoginStatus.LoggingIn);

userStatus.subscribe(state => {
  switch (state) {
    case "loggedOut":
      break;
    case "loggingIn":
      break;
    case "loggedIn":
      break;
    case "loginError":
      break;
    case "loggedIn":
      break;
    case ""
  }
})
```
