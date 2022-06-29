import "./runner.css";

import { makeApp } from "@woofjs/client";

import view from "./services/view.js";
import AppLayout from "./components/AppLayout";

const app = makeApp();

app.service("view", view);
app.route("*", AppLayout);

app.connect("#app");
