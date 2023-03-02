export function extendsClass(SuperClass, Class) {
  const check = (Class) => Class.prototype instanceof SuperClass;

  if (Class == null) {
    return check;
  }

  return check(Class);
}
