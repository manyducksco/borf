import { repeat, bind, makeState, mergeStates } from "@woofjs/client";

export default function CRUD(self) {
  self.debug.name = "7GUIs:CRUD";

  const $people = makeState([
    {
      id: 1,
      name: "Hans",
      surname: "Emil",
    },
    {
      id: 2,
      name: "Max",
      surname: "Mustermann",
    },
    {
      id: 3,
      name: "Roman",
      surname: "Tisch",
    },
  ]);
  const $nextId = makeState(4);
  const $selectedId = makeState(1);

  const $nameInput = makeState("");
  const $surnameInput = makeState("");

  const $filterPrefix = makeState("");

  // TODO: Concert to State.merge
  const $filteredPeople = mergeStates($people, $filterPrefix).into(
    (people, prefix) => {
      if (prefix.trim() === "") {
        return people;
      }

      return people.filter((person) =>
        person.surname.toLowerCase().startsWith(prefix.toLowerCase())
      );
    }
  );

  // Creates a new person from the current input values.
  function create() {
    $people.set((current) => {
      // Get next ID and increment by 1.
      const id = $nextId.get();
      $nextId.set((current) => current + 1);

      // Add the new person.
      current.push({
        id,
        name: $nameInput.get(),
        surname: $surnameInput.get(),
      });
    });
  }

  // Sets the selected person's name to the current input values.
  function update() {
    $people.set((current) => {
      const person = current.find((p) => p.id === $selectedId.get());

      person.name = $nameInput.get();
      person.surname = $surnameInput.get();
    });
  }

  // Deletes the selected person.
  function del() {
    $people.set((current) => {
      return current.filter((p) => p.id !== $selectedId.get());
    });
  }

  // Update fields when selection changes.
  self.subscribeTo($selectedId, (id) => {
    const person = $people.get().find((p) => p.id === id);

    if (person) {
      $nameInput.set(person.name);
      $surnameInput.set(person.surname);
    }
  });

  return (
    <div class="example">
      <header>
        <h3>CRUD</h3>
      </header>

      <div>
        <div>
          Filter prefix: <input value={bind($filterPrefix)} />
        </div>
        <div>
          <select
            size={$filteredPeople.map((fp) => Math.max(fp.length, 2))}
            value={$selectedId}
            onchange={(e) => {
              $selectedId.set(Number(e.target.value));
            }}
          >
            {repeat(
              $filteredPeople,
              function FilterOption() {
                const $person = this.$attrs.map((a) => a.value);

                return (
                  <option value={$person.map((p) => p.id)}>
                    {$person.map((p) => p.surname)},{" "}
                    {$person.map((p) => p.name)}
                  </option>
                );
              },
              (person) => person.id
            )}
          </select>
        </div>
        <div>
          <input type="text" value={bind($nameInput)} />
          <input type="text" value={bind($surnameInput)} />
        </div>
        <div>
          <button onclick={create}>Create</button>
          <button onclick={update}>Update</button>
          <button onclick={del}>Delete</button>
        </div>
      </div>
    </div>
  );
}
