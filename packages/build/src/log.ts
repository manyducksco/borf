import { println } from "@ratwizard/cli";

export const colors = {
  build: "blue",
  client: "green",
  proxy: "yellow",
  server: "magenta",
  static: "cyan",
};

export default {
  build: (...args: unknown[]) => colorLog(colors.build, "%c[build]", ...args),
  client: (...args: unknown[]) =>
    colorLog(colors.client, "%c[client]", ...args),
  proxy: (...args: unknown[]) => colorLog(colors.proxy, "%c[proxy]", ...args),
  server: (...args: unknown[]) =>
    colorLog(colors.server, "%c[server]", ...args),
  static: (...args: unknown[]) =>
    colorLog(colors.static, "%c[static]", ...args),
};

/**
 * Wraps any argument starting with '%c' in the specified color.
 */
const colorLog = (color: string, ...args: unknown[]) => {
  println(
    ...args.map((a) => {
      const s = String(a);

      return s.startsWith("%c")
        ? `<${color}>${stripNewLine(s).slice(2)}</${color}>`
        : stripNewLine(s);
    })
  );
};

const stripNewLine = (str: string) => {
  return str.replace(/(\n+)$/, "");
};
