# Passing Attributes

This example illustrates how to pass attributes to a subview, and how to access them from the subview.

Attributes can be passed in three forms:

- Writable (two-way binding; if the subview sets the attribute value, the original binding will receive the new value)
- Readable (one-way binding; the subview receives changes, but cannot set this attribute's value)
- Static (plain value; the subview receives the initial value, but it can't be written and won't change while the component is connected)
