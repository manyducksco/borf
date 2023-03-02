# Web Components

To use views and stores as web components, create a new `WebComponentHub`, add the views and stores and connect it. Views added to a hub can access stores on that same hub, or local stores registered as elements that they are children of.

WebComponentHub can be thought of as a lightweight alternative to App when all you need is to add some views to an otherwise HTML-based website. When you need full on routing that basically treats the browser like an app runtime, go for App instead.

WebComponentHub is also useful for using Woofe components in other frameworks. Web components are registered as HTML tags, so they can be used anywhere those tags are invoked on a page where a hub exists that defines those elements.

```ts
import { WebComponentHub } from "woofe";

// Hubs are for registering views as custom elements. They are the simplest way to add frameworke to your frontend.
const hub = new WebComponentHub();

// Elements can use stores that live on the same hub.
hub.addStore(SomeStore);
hub.addElement("some-view", SomeView);
hub.addElement("some-store", SomeStore); // To use local stores in HTML.

hub.connect(); // Set up stores and register HTML tags.
hub.disconnect(); // Tear down elements and stores.
```
