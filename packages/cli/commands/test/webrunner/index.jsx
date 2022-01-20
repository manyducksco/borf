import { makeApp } from "@woofjs/app";
import TestBedService from "./services/TestBedService.js";
import ViewService from "./services/ViewService.js";
import Content from "./components/Content.jsx";
import Sidebar from "./components/Sidebar.jsx";

const app = makeApp();

app.service("testbed", TestBedService);
app.service("views", ViewService);

app.route("*", function ($) {
  return (
    <div class="layout">
      <Sidebar />
      <Content />
    </div>
  );
});

app.setup(() => {
  document.querySelector(".static-loader").remove();
});

app.connect("#tests");
