export default ($attrs) => {
  return (
    <div>
      <h1>Hello, {$attrs.map("name")}!</h1>
      <p>You are {$attrs.map("quality")}.</p>
      <button onclick={$attrs.get("onclick")}>Click this button</button>
    </div>
  );
};
