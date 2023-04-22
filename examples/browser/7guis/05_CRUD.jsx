import { Readable, Writable, m, repeat } from "@borf/browser";
import { ExampleFrame } from "../views/ExampleFrame";

export default function (self) {
  self.setName("7GUIs:CRUD");

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

  const $filteredPeople = Readable.merge(
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
  self.observe($$selectedId, (id) => {
    const person = $$people.get().find((p) => p.id === id);

    if (person) {
      $$nameInput.set(person.name);
      $$surnameInput.set(person.surname);
    }
  });

  return m(ExampleFrame, { title: "5. CRUD" }, [
    m("div", [
      m("div", ["Filter prefix: ", m("input", { value: $$filterPrefix })]),
      m("div", [
        m(
          "select",
          {
            size: $filteredPeople.map((fp) => Math.max(fp.length, 2)),
            value: $$selectedId.toReadable(),
            onchange: (e) => {
              $$selectedId.set(Number(e.target.value));
            },
          },
          [
            repeat($filteredPeople, ($person) => {
              const $id = $person.map((p) => p.id);
              const $name = $person.map((p) => p.name);
              const $surname = $person.map((p) => p.surname);

              return m("option", { value: $id }, $surname, ", ", $name);
            }),
          ]
        ),
      ]),
      m("div", [
        m("input", { type: "text", value: $$nameInput }),
        m("input", { type: "text", value: $$surnameInput }),
      ]),
      m("div", [
        m("button", { onclick: create }, "Create"),
        m("button", { onclick: update }, "Update"),
        m("button", { onclick: del }, "Delete"),
      ]),
    ]),
  ]);
}
