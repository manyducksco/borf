import alphaId from "./alphaId";

test("encodes numbers as letters in base 26", () => {
  expect(alphaId(0)).toBe("");
  expect(alphaId()).toBe("");
  expect(alphaId(1)).toBe("a");
  expect(alphaId(2)).toBe("b");
  expect(alphaId(25)).toBe("y");
  expect(alphaId(26)).toBe("z");
  expect(alphaId(27)).toBe("za");
  expect(alphaId(58)).toBe("zzf");
});
