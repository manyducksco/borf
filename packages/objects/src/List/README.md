# List

List is an extension of the built-in array that adds many convenience functions that are missing in JavaScript but present in other languages like C# and Ruby.

```ts
// Similar to an array:

const cats = new List<string>(["Bon", "Tim"]);

cats.has("Tim"); // true
cats.contains("Tim"); // <- .has alias
cats.includes("Tim"); // <- .has alias

cats.at(1); // "Tim"

cats.push("Justin");
cats.add("Justin"); // .push alias

cats.remove("Justin");
cats.remove((item) => item.endsWith("ustin")); // Remove by filter function.
cats.removeAt(1);

cats.clear(); // Remove all items
cats.compact(); // Removes any null/undefined values from the list

cats.copy(); // Get a fresh List with the same data.
cats.clone(); // Get a fresh copy with all data deeply copied.

cats.length; // 2
cats.first(); // "Bon"
cats.first(2); // ["Bon", "Tim"]
cats.last(); // "Tim"
cats.last(2); // ["Bon", "Tim"]

cats.toArray(); // Convert to a regular JS array.

// Immutable versions of typical operations:

const cats = new List<string>(["Bon", "Tim"]);

cats.copy().add("Justin"); // new List with ["Bon", "Tim", "Justin"]
cats.copy().remove("Bon"); // new List with ["Tim", "Justin"]
list.copy().remove((item) => item.at(0) === "B"); // ["Tim"]
list.filter((item) => item !== "Tim"); // new List with []
list.pick(/* args */); // Alias of .filter()

list.map((item) => item.toUpperCase()); // new List with ["BON", "TIM"]

// Static methods:

List.isList(value); // Check type.
List.isParseable(value); // Check if value could be used to create a new list with 'new List(value)'.

// Configure with options:

type Cat = {
  id: number;
  name: string;
};

const cats = new List<Cat>(
  [
    { id: 1, name: "Bon" },
    { id: 2, name: "Tim" },
    { id: 3, name: "Justin" },
  ],
  {
    /**
     * Configure comparisons with .has, .remove and others that compare items by value.
     * By default items are compared with '===' strict equality.
     */
    isEqual(item, other) {
      if (!other) {
        return false;
      }

      if (typeof other !== "object") {
        return false;
      }

      return item.id === other.id;
    },

    /**
     * Validate items being added to the list. An error is thrown if this function returns false.
     */
    isValid(item) {
      if (!item || typeof item !== "object") {
        return false;
      }

      if (typeof item.id !== "number" || typeof item.name !== "string") {
        return false;
      }

      return true;
    },

    /**
     * This sorting function will keep all records sorted ascending by `id`.
     */
    sortBy(one, two) {
      if (one.id < two.id) {
        return -1;
      } else if (one.id > two.id) {
        return +1;
      } else {
        return 0;
      }
    },
  }
);

// Will match the first record by ID according to the isEqual() function, so the first item with name: "Bon" will be removed.
cats.remove({ id: 1 });

// Will throw an error because isValid() returned false.
cats.add({ id: "woooooo", name: 1 });
```
