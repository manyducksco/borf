# Objects in Woof

To get started with Woof, you need to know what objects there are and how they fit together. This is a list of those objects with a brief explanation. The code itself should be clean and well commented enough to serve as documentation. Documentation should only need to cover the high level concepts.

## App

- App: The main app class - serves as a container for mounting routes and services
- Service: A singleton accessible to other services and Components by calling this.service(name)
- Component: A chunk of view logic - renders DOM elements from local state or state from a service
- state: Container for variables that can be watched for changes

App holds the overall structure.
Service holds state and logic used in more than one place.
Component renders DOM elements.
state is the container for any values in the app that may change over time.

## Server

- Server: The main server class - equivalent to App but on the server side
- Service: A singleton accessible to other services, on the request context and in Resources
- Resource: A logical grouping of routes related to a particular API resource (e.g. Users, Movies, Profiles, etc.)
- Context: Object passed to all route handler functions - contains request and response details

Server defines the routes and services.
Service holds persistent state and utilities shared between routes.
Resource groups related routes into a single object so the routes are easier to think about. Created and destroyed per-request?
Context holds info about the current request and response.