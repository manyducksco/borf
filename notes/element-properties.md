# Markup Element Properties

When you pass values to Markup elements you are passing DOM node properties; _not_ HTML attributes.

Event handlers for standard events can be supplied as properties which appear in all lowercase, just like you set them
on an element. Props starting with "on" followed by a capital letter are stripped of "on" and converted to lowercase to
be added with `.addEventListener`. An `onSomeEvent` property would become a `someevent` listener.

```jsx
// DOM API style with plain JS

const button = document.createElement("button");

button.className = "special-button";

button.onclick = () => {
  alert("YOU CLICKED AS A PROPERTY CALLBACK");
};

button.addEventListener("click", () => {
  alert("YOU CLICKED AS AN EVENT LISTENER");
});
```

```jsx
// Markup style with JSX

<button
  className="special-button"
  // NOTE: all lowercase event names for known events are set as props, while "on" + capital letter is transformed to lowercase as an event handler name.
  onclick={() => {
    alert("YOU CLICKED AS A PROPERTY CALLBACK");
  }}
  onClick={() => {
    alert("YOU CLICKED AS AN EVENT LISTENER");
  }}
/>
```

## Event Handlers with Non-Standard Names

It could happen that a custom element emits events with a `-` in them, for example, which can't be expressed in the
camel-to-lower conversion. For these, or if you prefer to do it this way, events could be attached like so:

```jsx
<custom-element
  eventListeners={{
    "weird-event": () => {
      alert("A WEIRD EVENT HAS BEEN EMITTED")
    }
  }}

  // Maybe alias this to 'on'? Less self explanatory and doesn't mirror the DOM APIs nicely like `eventListeners`, but it could be cleaner.
  on={{
    "weird-event": () => {
      alert("A WEIRD EVENT HAS BEEN EMITTED")
    }
  }}
/>
```

## Passing attributes verbatim

Everything passed to an element at the top level is handled as a property. There is a lot of overlap for HTML elements
where props typically mirror attributes, but for custom elements that usually isn't the case. Using the `attributes`
object you can pass any attributes you want while keeping the top level reserved for properties.

```jsx
<custom-element numValue={5} attributes={{ "some-weird-attribute": "value" }} />
```

## Attribute-aliased Properties

Markup elements make a few exceptions by accepting some props that aren't actually props, which are instead set as
attributes. Usually this is done in the case of read-only props whose values are set through an attribute.

```jsx

```
