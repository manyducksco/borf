import { MatchFunction } from "path-to-regexp";
import { History } from "history";
import { Component } from "../Components";

export type RouterOptions = {
  /**
   * Pass your own history instance from the 'history' module.
   */
  history?: History;

  basePath?: string;

  useHash?: boolean;
};

export type RouteHandler = (route: RouteObject, data?: any) => Component | void;
export type RouteArray = [route: string, ...handlers: RouteHandler[]];
export type RouterEntry = {
  path: string;
  match: MatchFunction;
  handlers: RouteHandler[];
};

export type RouteObject = {
  /**
   * Full path as it appears in the URL bar.
   */
  href: string;

  /**
   * Router path as it was written to register the route.
   */
  path: string;

  /**
   * Keys and values for each :param matched in the route.
   */
  params: {
    [name: string]: string;
  };

  /**
   * Keys and values for each query parameter.
   */
  query: {
    [name: string]: any;
  };

  /**
   * Continues to the next handler if there is one. Throws an error if there isn't.
   * Call this function with a value and it will be passed as the second parameter to the next handler.
   */
  next: (data?: any) => void;

  /**
   * Go to another route.
   */
  redirect: (path: string, options?: RouteRedirectOptions) => void;

  /**
   * Define subroutes and render their contents wherever this component is placed when the route is matched.
   */
  switch: (routes: RouteArray[]) => Component;
};

export type RouteRedirectOptions = {
  /**
   * Values to be encoded into a query string. If query params are also present
   * in the redirect path, these keys will overwrite any that are specified in both.
   */
  query?: {
    [name: string]: any;
  };

  /**
   * If true, replace history state instead of pushing a new one.
   */
  replace?: boolean;
};
