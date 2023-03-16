import { println } from "@ratwizard/cli";
export const colors = {
    build: "blue",
    client: "green",
    proxy: "yellow",
    server: "magenta",
    static: "cyan",
};
export default {
    build: (...args) => colorLog(colors.build, "%c[build]", ...args),
    client: (...args) => colorLog(colors.client, "%c[client]", ...args),
    proxy: (...args) => colorLog(colors.proxy, "%c[proxy]", ...args),
    server: (...args) => colorLog(colors.server, "%c[server]", ...args),
    static: (...args) => colorLog(colors.static, "%c[static]", ...args),
};
/**
 * Wraps any argument starting with '%c' in the specified color.
 */
const colorLog = (color, ...args) => {
    println(...args.map((a) => {
        const s = String(a);
        return s.startsWith("%c")
            ? `<${color}>${stripNewLine(s).slice(2)}</${color}>`
            : stripNewLine(s);
    }));
};
const stripNewLine = (str) => {
    return str.replace(/(\n+)$/, "");
};
//# sourceMappingURL=log.js.map