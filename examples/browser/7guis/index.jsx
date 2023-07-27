export default function (props, c) {
  return (
    <div>
      <p style={{ padding: "1rem 1rem 0 1rem" }}>
        This is an implementation of{" "}
        <a href="https://eugenkiss.github.io/7guis/">7GUIs</a>, a system for
        evaluating UI frameworks.
      </p>

      <div>{c.outlet()}</div>
    </div>
  );
}
