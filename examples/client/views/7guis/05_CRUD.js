export default function CRUD() {
  this.name = "7guis:CRUD";
  this.defaultState = {
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

  const $filteredPeople = this.merge(
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
  const create = () => {
    const id = this.get("nextId");
    const nameInput = this.get("nameInput");
    const surnameInput = this.get("surnameInput");

    this.set("people", (current) => {
      current.push({
        id,
        name: nameInput,
        surname: surnameInput,
      });
    });

    this.set("nextId", (current) => current + 1);
  };

  // Sets the selected person's name to the current input values.
  const update = () => {
    const selectedId = this.get("selectedId");
    const nameInput = this.get("nameInput");
    const surnameInput = this.get("surnameInput");

    this.set("people", (current) => {
      const person = current.find((p) => p.id === selectedId);

      person.name = nameInput;
      person.surname = surnameInput;
    });
  };

  // Deletes the selected person.
  const del = () => {
    const selectedId = this.get("selectedId");

    this.set("people", (current) => {
      return current.filter((p) => p.id !== selectedId);
    });
  };

  // Update fields when selection changes.
  this.observe("selectedId", (id) => {
    const person = this.get("people").find((p) => p.id === id);

    if (person) {
      this.set("nameInput", person.name);
      this.set("surnameInput", person.surname);
    }
  });

  return (
    <div class="example">
      <header>
        <h3>CRUD</h3>
      </header>

      <div>
        <div>
          Filter prefix: <input value={this.writable("filterPrefix")} />
        </div>
        <div>
          <select
            size={$filteredPeople.to((fp) => Math.max(fp.length, 2))}
            value={this.readable("selectedId")}
            onchange={(e) => {
              this.set("selectedId", Number(e.target.value));
            }}
          >
            {this.repeat($filteredPeople, function FilterOption() {
              const $person = this.readable("value");

              return (
                <option value={$person.to((p) => p.id)}>
                  {$person.to((p) => p.surname)}, {$person.to((p) => p.name)}
                </option>
              );
            })}
          </select>
        </div>
        <div>
          <input type="text" value={this.writable("nameInput")} />
          <input type="text" value={this.writable("surnameInput")} />
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
