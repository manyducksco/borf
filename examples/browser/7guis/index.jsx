import { Outlet } from "@borf/browser";

export default function () {
  return (
    <div>
      <p style={{ padding: "1rem 1rem 0 1rem" }}>
        This is an implementation of{" "}
        <a href="https://eugenkiss.github.io/7guis/">7GUIs</a>, a system for
        evaluating UI frameworks.
      </p>

      <div>
        <Outlet />
      </div>
    </div>
  );
}
