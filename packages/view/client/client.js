import { makeApp } from "@woofjs/client";

const app = makeApp();

app.route("*", AppLayout);

function AppLayout($attrs, self) {
  const { $params } = self.getService("@router");

  self.watchState($params.map("wildcard"), self.debug.log);

  return (
    <div>
      <iframe src="/frame.html"></iframe>
    </div>
  );
}

app.connect("#app");
