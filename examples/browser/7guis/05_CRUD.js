import { State, View } from "@borf/browser";
import { ExampleFrame } from "../views/ExampleFrame";

class CRUD extends View {
  static label = "7guis:CRUD";

  setup(ctx, m) {
    const $$people = new State([
      { id: 1, name: "Hans", surname: "Emil" },
      { id: 2, name: "Max", surname: "Mustermann" },
      { id: 3, name: "Roman", surname: "Tisch" },
    ]);
    const $$nextId = new State(4);
    const $$selectedId = new State(1);
    const $$nameInput = new State("");
    const $$surnameInput = new State("");
    const $$filterPrefix = new State("");

    const $filteredPeople = State.merge(
      $$people,
      $$filterPrefix,
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
        current.push({
          id,
          name: nameInput,
          surname: surnameInput,
        });
      });

      $$nextId.update((current) => current + 1);
    }

    // Sets the selected person's name to the current input values.
    function update() {
      const selectedId = $$selectedId.get();
      const nameInput = $$nameInput.get();
      const surnameInput = $$surnameInput.get();

      $$people.update((current) => {
        const person = current.find((p) => p.id === selectedId);

        person.name = nameInput;
        person.surname = surnameInput;
      });
    }

    // Deletes the selected person.
    function del() {
      const selectedId = $$selectedId.get();

      $$people.update((current) => {
        return current.filter((p) => p.id !== selectedId);
      });
    }

    // Update fields when selection changes.
    ctx.observe($$selectedId, (id) => {
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
            Filter prefix: <input value={$$filterPrefix} />
          </div>
          <div>
            <select
              size={$filteredPeople.as((fp) => Math.max(fp.length, 2))}
              value={$$selectedId.readable()}
              onchange={(e) => {
                $$selectedId.set(Number(e.target.value));
              }}
            >
              {m.repeat($filteredPeople, ($person) => {
                const $id = $person.as((p) => p.id);
                const $name = $person.as((p) => p.name);
                const $surname = $person.as((p) => p.surname);

                return (
                  <option value={$id}>
                    {$surname}, {$name}
                  </option>
                );
              })}
            </select>
          </div>
          <div>
            <input type="text" value={$$nameInput} />
            <input type="text" value={$$surnameInput} />
          </div>
          <div>
            <button onclick={create}>Create</button>
            <button onclick={update}>Update</button>
            <button onclick={del}>Delete</button>
          </div>
        </div>
      </ExampleFrame>
    );
  }
}

export default CRUD;
