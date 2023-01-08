import { h, joinStates, makeState, makeView } from "@woofjs/client";

export default makeView((ctx) => {
  ctx.name = "7guis:CRUD";

  const $$people = makeState([
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
  const $$nextId = makeState(4);
  const $$selectedId = makeState(1);
  const $$nameInput = makeState("");
  const $$surnameInput = makeState("");
  const $$filterPrefix = makeState("");

  const $filteredPeople = joinStates(
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
    <div class="example">
      <header>
        <h3>CRUD</h3>
      </header>

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
            {h.repeat($filteredPeople, ($person) => {
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
    </div>
  );
});
