export default function mockPage() {
  this.defaultState = {
    title: "Test",
  };

  return {
    $$title: this.writable("title"),
  };
}
