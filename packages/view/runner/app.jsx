import "./app.css";

import { makeApp } from "@woofjs/client";

import AppLayout from "./components/AppLayout";
import view from "./services/view.js";

const app = makeApp();

app.service("view", view);
app.route("*", AppLayout);

app.connect("#app");
