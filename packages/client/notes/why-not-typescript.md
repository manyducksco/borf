# Why Not TypeScript?

- TypeScript affects how you design the API. I won't trade simplicity and convenience to make things easier to statically analyze. Woof's code is written for humans.
- Types aren't always right. You could define the attribute types for a component, but there is no way to truly guarantee the values are what you expect without checking at runtime. This is true even in strongly typed languages like C#.
- TS eliminates certain classes of errors if used responsibly, but you need to unit test your code anyway.
- Type definition files provide autocomplete and inline documentation without littering the code with crap.
