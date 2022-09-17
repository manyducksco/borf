import { makeView } from "@woofjs/client";

export default makeView((ctx) => {
  ctx.name = "7guis:CRUD";
  ctx.defaultState = {
    people: [
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
    ],
    nextId: 4,
    selectedId: 1,

    nameInput: "",
    surnameInput: "",

    filterPrefix: "",
  };

  const $filteredPeople = ctx.merge(
    "people",
    "filterPrefix",
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
    const id = ctx.get("nextId");
    const nameInput = ctx.get("nameInput");
    const surnameInput = ctx.get("surnameInput");

    ctx.set("people", (current) => {
      current.push({
        id,
        name: nameInput,
        surname: surnameInput,
      });
    });

    ctx.set("nextId", (current) => current + 1);
  }

  // Sets the selected person's name to the current input values.
  function update() {
    const selectedId = ctx.get("selectedId");
    const nameInput = ctx.get("nameInput");
    const surnameInput = ctx.get("surnameInput");

    ctx.set("people", (current) => {
      const person = current.find((p) => p.id === selectedId);

      person.name = nameInput;
      person.surname = surnameInput;
    });
  }

  // Deletes the selected person.
  function del() {
    const selectedId = ctx.get("selectedId");

    ctx.set("people", (current) => {
      return current.filter((p) => p.id !== selectedId);
    });
  }

  // Update fields when selection changes.
  ctx.observe("selectedId", (id) => {
    const person = ctx.get("people").find((p) => p.id === id);

    if (person) {
      ctx.set("nameInput", person.name);
      ctx.set("surnameInput", person.surname);
    }
  });

  return (
    <div class="example">
      <header>
        <h3>CRUD</h3>
      </header>

      <div>
        <div>
          Filter prefix: <input value={ctx.writable("filterPrefix")} />
        </div>
        <div>
          <select
            size={$filteredPeople.to((fp) => Math.max(fp.length, 2))}
            value={ctx.readable("selectedId")}
            onchange={(e) => {
              ctx.set("selectedId", Number(e.target.value));
            }}
          >
            {ctx.repeat($filteredPeople, ($person) => {
              const $id = $person.to((p) => p.id);
              const $name = $person.to((p) => p.name);
              const $surname = $person.to((p) => p.surname);

              return (
                <option value={$id}>
                  {$surname}, {$name}
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <input type="text" value={ctx.writable("nameInput")} />
          <input type="text" value={ctx.writable("surnameInput")} />
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
