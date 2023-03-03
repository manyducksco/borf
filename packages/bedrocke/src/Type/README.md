# Type

> Type checking swiss army knife.

The `typeof` and `instanceof` keywords only go so far and have some awkward edge cases. For example, yes, an array _is_ an `"object"` according to `typeof`, but that's not really what programmers mean by object. An object is this thing: `{}`.

Type is an attempt to create a consistent type checking system that can identify more specific types.

## Use

```js
import { Type } from "@frameworke/bedrocke";

const value = "number";

if (Type.isNumber(value)) {
  console.log("value is a number", value);
} else if (Type.isObject(value)) {
  console.log("value is an object", value);
} else {
  console.log("value is", Type.of(value));
}
```

## Methods

### `Type.of(value: any): string`

Takes anything and returns a string that represents its type. `of` behaves much like the `typeof` keyword, but it can also identify `"class"`, `"observable"`, `"promise"` and others.

### "Is Type" Methods

These methods start with `is` and test if a value is of a certain type or not, returning the result as a boolean. All methods are listed below with links for the ones that require more of an explanation.

- `isArray`
- [`isArrayOf`]()
- `isBoolean`
- `isString`
- `isNumber`
- `isInteger`
- `isBigInt`
- `isFunction`
- `isObject`
- `isClass`
- [`isInstanceOf`]()
- [`extends`]()
- `isPromise`
- `isObservable`
- `isIterable`
- `isMap`
- `isSet`
- `isNull`
- `isUndefined`
- [`isEmpty`]()

#### `isArrayOf`

Determines whether value is an array where all items pass a check function. That check function can be custom or one of the `is` methods on `Type`.

```js
const numbers = [1, 2, "3"];
const strings = ["red", "green", "blue"];

Type.isArrayOf(Type.isNumber, numbers); // false
Type.isArrayOf(Type.isString, strings); // true

// Returns a function when called without a value:
const isNumericArray = Type.isArrayOf((n) => {
  return !isNaN(Number(n));
});

isNumericArray(numbers); // true
```

#### `isInstanceOf`

Determines whether value is an instance of a class or a subclass of that class. This behaves identically to the `instanceof` keyword.

```js
class Super {}
class Sub extends Super {}
class Unrelated {}

const instanceOfSuper = new Super();
const instanceOfSub = new Sub();
const instanceOfUnrelated = new Unrelated();

Type.isInstanceOf(Super, instanceOfSuper); // true
Type.isInstanceOf(Super, instanceOfSub); // true
Type.isInstanceOf(Super, instanceOfUnrelated); // false

// Returns a function when called without a value:
const isSuper = Type.isInstanceOf(Super);

isSuper(instanceOfSuper); // true
isSuper(instanceOfSub); // true
isSuper(instanceOfUnrelated); // false
```

#### `extends`

Determines whether one class extends another.

```js
class Super {}
class Sub extends Super {}
class Unrelated {}

Type.extends(Super, Sub); // true
Type.extends(Super, Unrelated); // false

// Returns a function if called without a value:
const extendsSuper = Type.extends(Super);

extendsSuper(Sub); // true
extendsSuper(Unrelated); // false
```

#### `isEmpty`

Determines whether value is an "empty" or _nullish_ type.

```js
Type.isEmpty(undefined); // true
Type.isEmpty(null); // true

Type.isEmpty(false); // false
Type.isEmpty(0); // false
Type.isEmpty(""); // false
Type.isEmpty([]); // false

// Equivalent to:
value == null;
// or
value === null || value === undefined;
```

### Assert Methods

All `is` methods have an `assert` counterpart that throws a TypeError where the equivalent `is` method would return false.

In code:

```js
function process(value) {
  // Validate function args at runtime, for example
  Type.assertString(value);

  return value.toLowerCase();
}

process("TEST"); // "test"
process(5); // throws TypeError: "Expected a string. Got: 5"
```

#### Custom Error Messages

Assert methods take a custom error message as a final argument. Supports placeholders `%t` for type name and `%v` for value.

```js
Type.assertString(value, "Value must be a string. Got type: %t, value: %v");
```

The complete list of assert methods:

- `assertArray`
- `assertArrayOf`
- `assertBoolean`
- `assertString`
- `assertNumber`
- `assertInteger`
- `assertBigInt`
- `assertFunction`
- `assertObject`
- `assertClass`
- `assertInstanceOf`
- `assertExtends`
- `assertPromise`
- `assertObservable`
- `assertIterable`
- `assertMap`
- `assertSet`
- `assertNull`
- `assertUndefined`
- `assertEmpty`
