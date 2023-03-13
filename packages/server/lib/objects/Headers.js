/**
 * An object for working with headers. Based on the Fetch spec: https://fetch.spec.whatwg.org/#headers-class
 */
export class Headers {
  #list = [];

  constructor(init) {
    if (Array.isArray(init)) {
      for (const entry of init) {
        if (!Array.isArray(entry)) {
          throw new TypeError(`Expected an array of [name, value] arrays.`);
        }
        this.append(entry[0], entry[1]);
      }
    } else if (init != null && typeof init === "object") {
      for (const [key, value] of Object.entries(init)) {
        this.append(key, value);
      }
    }
  }

  /**
   * Appends a header.
   */
  append(name, value) {
    this.#list.push({
      name: this.#normalizeName(name),
      value: this.#normalizeValue(value),
    });
  }

  /**
   * Removes a header.
   */
  delete(name) {
    name = this.#normalizeName(name);
    this.#list = this.#list.filter((header) => {
      return header.name !== name;
    });
  }

  /**
   * Returns as a string the values of all headers whose name is name, separated by a comma and a space.
   */
  get(name) {
    name = this.#normalizeName(name);
    const values = [];

    for (const header of this.#list) {
      if (header.name === name) {
        values.push(header.value);
      }
    }

    return values.join(", ");
  }

  /**
   * Returns whether there is a header whose name is name.
   */
  has(name) {
    name = this.#normalizeName(name);
    return !!this.#list.find((header) => header.name === name);
  }

  /**
   * Replaces the value of the first header whose name is name with value and removes any remaining headers whose name is name.
   */
  set(name, value) {
    name = this.#normalizeName(name);
    value = this.#normalizeValue(value);

    const first = this.#list.find((header) => header.name === name);

    if (first) {
      first.value = value;

      // Remove headers with the same name that aren't `first`.
      this.#list = this.#list.filter((header) => {
        return header.name !== name || header === first;
      });
    } else {
      this.#list.push({ name, value });
    }
  }

  // TODO: Iterable

  toJSON() {
    const byName = {};

    for (const header of this.#list) {
      if (!byName[header.name]) {
        byName[header.name] = [];
      }

      byName[header.name].push(header.value);
    }

    const headers = {};

    for (const [name, values] of Object.entries(byName)) {
      headers[name] = values.join(", ");
    }

    return headers;
  }

  #normalizeName(name) {
    return String(name).toLowerCase();
  }

  #normalizeValue(value) {
    return String(value).trim();
  }
}
