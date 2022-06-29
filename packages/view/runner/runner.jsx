import "./runner.css";

import { makeApp } from "@woofjs/client";

import screen from "./services/screen.js";
import view from "./services/view.js";
import AppLayout from "./components/AppLayout";

const app = makeApp();

app.service("screen", screen);
app.service("view", view);
app.route("*", AppLayout);

app.connect("#app");
