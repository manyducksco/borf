import { makeApp } from "@woofjs/app";
import TestBedService from "./services/TestBed.js";
import ViewsService from "./services/Views.js";
import Content from "./components/Content.js";
import Sidebar from "./components/Sidebar.js";

const app = makeApp();

app.service("testbed", TestBedService);
app.service("views", ViewsService);

app.route("*", function ($) {
  return $("div", { class: "layout" })($(Sidebar), $(Content));
});

app.setup(() => {
  document.querySelector(".static-loader").remove();
});

app.connect("#tests");
