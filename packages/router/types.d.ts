declare module "@woofjs/router" {
  export type RouterProps<PropsType> = {
    [key in keyof PropsType]: PropsType[key];
  };

  export type MatchOptions<PropsType> = {
    willMatch(route: MatchedRoute<PropsType>): boolean;
  };

  export type MatchedRoute<PropsType> = {
    path: string;
    route: string;
    params: {
      [name: string]: string;
    };
    query: {
      [name: string]: string;
    };
    wildcard: string | null;
    props: PropsType;
  };

  export type Router<PropsType> = {
    on(path: string, props: RouterProps<PropsType>): () => void;
    on(path: string, props: Router<any>): () => void;
    match(path: string, options?: MatchOptions<PropsType>): MatchedRoute<PropsType> | undefined;
  };

  export function makeRouter<PropsType>(): Router<PropsType>;
}
