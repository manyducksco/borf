type Stringable = { toString(): string };

/**
 * An object for working with headers. Based on the Fetch spec: https://fetch.spec.whatwg.org/#headers-class
 */
export class Headers {
  #list: Record<string, string>[] = [];

  constructor(init?: unknown) {
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
  append(name: Stringable, value: Stringable) {
    this.#list.push({
      name: this.#normalizeName(name),
      value: this.#normalizeValue(value),
    });
  }

  /**
   * Removes a header.
   */
  delete(name: Stringable) {
    name = this.#normalizeName(name);
    this.#list = this.#list.filter((header) => {
      return header.name !== name;
    });
  }

  /**
   * Returns as a string the values of all headers whose name is name, separated by a comma and a space.
   */
  get(name: Stringable) {
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
  has(name: Stringable) {
    name = this.#normalizeName(name);
    return !!this.#list.find((header) => header.name === name);
  }

  /**
   * Replaces the value of the first header whose name is name with value and removes any remaining headers whose name is name.
   */
  set(name: Stringable, value: Stringable) {
    const normalizedName = this.#normalizeName(name);
    const normalizedValue = this.#normalizeValue(value);

    const first = this.#list.find((header) => header.name === normalizedName);

    if (first) {
      first.value = normalizedValue;

      // Remove headers with the same name that aren't `first`.
      this.#list = this.#list.filter((header) => {
        return header.name !== normalizedName || header === first;
      });
    } else {
      this.#list.push({ name: normalizedName, value: normalizedValue });
    }
  }

  // TODO: Iterable

  toJSON() {
    const byName: Record<string, string[]> = {};

    for (const header of this.#list) {
      if (!byName[header.name]) {
        byName[header.name] = [];
      }

      byName[header.name].push(header.value);
    }

    const headers: Record<string, string> = {};

    for (const [name, values] of Object.entries(byName)) {
      headers[name] = values.join(", ");
    }

    return headers;
  }

  #normalizeName(name: Stringable) {
    return name.toString().toLowerCase();
  }

  #normalizeValue(value: Stringable) {
    return value.toString().trim();
  }
}
