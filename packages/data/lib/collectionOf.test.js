import { makeModel } from "./makeModel.js";
import { collectionOf } from "./collectionOf.js";

const User = makeModel({
  key: "id",
  schema(v) {
    return v
      .object({
        id: v.number(),
        name: v.string(),
        status: v.oneOf("online", "offline"),
      })
      .strict();
  },
});

test("exports", () => {
  const Users = collectionOf(User);

  expect(typeof Users.get).toBe("function");
  expect(typeof Users.set).toBe("function");
  expect(typeof Users.delete).toBe("function");
  expect(typeof Users.clear).toBe("function");
  expect(typeof Users.find).toBe("function");
  expect(typeof Users.filter).toBe("function");
});

test("get, set and delete", async () => {
  const Users = collectionOf(User);

  expect(await Users.get(1)).toBe(undefined);

  await Users.set({
    id: 1,
    name: "Test",
    status: "offline",
  });

  expect(await Users.get(1)).toStrictEqual({
    id: 1,
    name: "Test",
    status: "offline",
  });

  await Users.delete(1);

  expect(await Users.get(1)).toBe(undefined);
});

test("is iterable", async () => {
  const Users = collectionOf(User);

  await Users.set(
    {
      id: 1,
      name: "Test",
      status: "offline",
    },
    {
      id: 2,
      name: "Test 2",
      status: "online",
    },
    {
      id: 3,
      name: "Test 3",
      status: "offline",
    }
  );

  let iterations = 0;

  for (const user of Users) {
    iterations += 1;
  }

  expect(iterations).toBe(3);
});

test("find", async () => {
  const Users = collectionOf(User);

  await Users.set(
    {
      id: 1,
      name: "Test",
      status: "offline",
    },
    {
      id: 2,
      name: "Test 2",
      status: "online",
    },
    {
      id: 3,
      name: "Test 3",
      status: "offline",
    }
  );

  const promisedWithId = await Users.find(2);
  const promisedWithFn = await Users.find((u) => u.id === 3);

  expect(promisedWithId).toStrictEqual({
    id: 2,
    name: "Test 2",
    status: "online",
  });

  expect(promisedWithFn).toStrictEqual({
    id: 3,
    name: "Test 3",
    status: "offline",
  });

  let observed = [];

  const subWithId = Users.find(2).subscribe((user) => {
    observed.push(user);
  });

  expect(observed).toStrictEqual([
    {
      id: 2,
      name: "Test 2",
      status: "online",
    },
  ]);

  // Update observed user. Should see observer fire.
  await Users.set({
    id: 2,
    name: "Updated",
    status: "offline",
  });

  expect(observed.length).toBe(2);

  // Update other user. Observer should not fire.
  await Users.set({
    id: 4,
    name: "New",
    status: "offline",
  });

  expect(observed.length).toBe(2);

  subWithId.unsubscribe();

  observed = [];

  const subWithFunc = Users.find((u) => u.id === 3).subscribe((user) => {
    observed.push(user);
  });

  expect(observed).toStrictEqual([
    {
      id: 3,
      name: "Test 3",
      status: "offline",
    },
  ]);

  // Update observed user. Should see observer fire.
  await Users.set({
    id: 3,
    name: "Updated",
    status: "online",
  });

  expect(observed.length).toBe(2);

  // Update other user. Observer should not fire.
  await Users.set({
    id: 4,
    name: "New",
    status: "offline",
  });

  expect(observed.length).toBe(2);

  subWithFunc.unsubscribe();
});

test("filter", async () => {
  const Users = collectionOf(User);

  await Users.set(
    {
      id: 1,
      name: "Test",
      status: "offline",
    },
    {
      id: 2,
      name: "Test 2",
      status: "online",
    },
    {
      id: 3,
      name: "Test 3",
      status: "offline",
    }
  );

  const promised = await Users.filter((u) => u.status === "online");

  expect(promised).toStrictEqual([{ id: 2, name: "Test 2", status: "online" }]);

  const observed = [];

  const sub = Users.filter((u) => u.status === "online").subscribe((users) => {
    observed.push(users);
  });

  expect(observed).toStrictEqual([
    [{ id: 2, name: "Test 2", status: "online" }],
  ]);

  await Users.set({
    id: 1,
    name: "Test",
    status: "online",
  });

  expect(observed).toStrictEqual([
    [{ id: 2, name: "Test 2", status: "online" }],
    [
      { id: 1, name: "Test", status: "online" },
      { id: 2, name: "Test 2", status: "online" },
    ],
  ]);

  sub.unsubscribe();

  await Users.set({
    id: 3,
    name: "Test 3",
    status: "online",
  });

  // No change expected after unsubscribe.
  expect(observed).toStrictEqual([
    [{ id: 2, name: "Test 2", status: "online" }],
    [
      { id: 1, name: "Test", status: "online" },
      { id: 2, name: "Test 2", status: "online" },
    ],
  ]);
});
