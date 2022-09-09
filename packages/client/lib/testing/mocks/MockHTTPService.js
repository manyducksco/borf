export function MockHTTPService() {
  function explode() {
    throw new Error("Pass a mock 'http' service to use 'http' in a wrapper.");
  }

  return {
    request: explode,
    use: explode,
    get: explode,
    put: explode,
    patch: explode,
    post: explode,
    delete: explode,
    head: explode,
  };
}
