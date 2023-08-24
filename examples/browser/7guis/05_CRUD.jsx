import { writable, readable, computed, repeat } from "@borf/browser";
import { produce } from "immer";
import { ExampleFrame } from "../views/ExampleFrame";

export default function (_, c) {
  c.name = "7GUIs:CRUD";

  const $$people = writable([
    { id: 1, name: "Hans", surname: "Emil" },
    { id: 2, name: "Max", surname: "Mustermann" },
    { id: 3, name: "Roman", surname: "Tisch" },
  ]);
  const $$nextId = writable(4);
  const $$selectedId = writable(1);
  const $$nameInput = writable("");
  const $$surnameInput = writable("");
  const $$filterPrefix = writable("");

  const $filteredPeople = computed(
    [$$people, $$filterPrefix],
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
    const id = $$nextId.get();
    const nameInput = $$nameInput.get();
    const surnameInput = $$surnameInput.get();

    $$people.update((current) => {
      return [
        ...current,
        {
          id,
          name: nameInput,
          surname: surnameInput,
        },
      ];
    });

    $$nextId.update((current) => current + 1);
  }

  // Sets the selected person's name to the current input values.
  function update() {
    const selectedId = $$selectedId.get();
    const nameInput = $$nameInput.get();
    const surnameInput = $$surnameInput.get();

    $$people.update(
      produce((current) => {
        const person = current.find((p) => p.id === selectedId);

        person.name = nameInput;
        person.surname = surnameInput;
      })
    );
  }

  c.observe($$people, (people) => {
    c.log(people);
  });

  // Deletes the selected person.
  function del() {
    const selectedId = $$selectedId.get();

    $$people.update((current) => {
      return current.filter((p) => p.id !== selectedId);
    });
  }

  // Update fields when selection changes.
  c.observe($$selectedId, (id) => {
    const person = $$people.get().find((p) => p.id === id);

    if (person) {
      $$nameInput.set(person.name);
      $$surnameInput.set(person.surname);
    }
  });

  return (
    <ExampleFrame title="5. CRUD">
      <div>
        <div>
          Filter prefix: <input $$value={$$filterPrefix} />
        </div>
        <div>
          <select
            size={8}
            value={$$selectedId}
            onChange={(e) => {
              c.log(e.target, e.target.value);

              $$selectedId.set(Number(e.target.value));
            }}
          >
            {repeat(
              $filteredPeople,
              (person) => person.id,
              ($person) => {
                const $id = computed($person, (p) => p.id);
                const $name = computed($person, (p) => p.name);
                const $surname = computed($person, (p) => p.surname);

                return (
                  <option value={$id}>
                    {$surname}, {$name}
                  </option>
                );
              }
            )}
          </select>
        </div>
        <div>
          <input $$value={$$nameInput} />
          <input $$value={$$surnameInput} />
        </div>
        <div>
          <button onClick={create}>Create</button>
          <button onClick={update}>Update</button>
          <button onClick={del}>Delete</button>
        </div>
      </div>
    </ExampleFrame>
  );
}
