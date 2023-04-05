import { Writable, View } from "@borf/browser";
import { ExampleFrame } from "../views/ExampleFrame";

class CRUD extends View {
  static label = "7guis:CRUD";

  setup(ctx, m) {
    const $$people = new Writable([
      { id: 1, name: "Hans", surname: "Emil" },
      { id: 2, name: "Max", surname: "Mustermann" },
      { id: 3, name: "Roman", surname: "Tisch" },
    ]);
    const $$nextId = new Writable(4);
    const $$selectedId = new Writable(1);
    const $$nameInput = new Writable("");
    const $$surnameInput = new Writable("");
    const $$filterPrefix = new Writable("");

    const $filteredPeople = State.merge(
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
    ctx.subscribe($$selectedId, (id) => {
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
              size={$filteredPeople.map((fp) => Math.max(fp.length, 2))}
              value={$$selectedId.readable()}
              onchange={(e) => {
                $$selectedId.set(Number(e.target.value));
              }}
            >
              {View.forEach($filteredPeople, (ctx) => {
                const $person = ctx.inputs.$("value");

                const $id = $person.map((p) => p.id);
                const $name = $person.map((p) => p.name);
                const $surname = $person.map((p) => p.surname);

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
