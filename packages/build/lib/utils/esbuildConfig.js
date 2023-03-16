import { merge } from "lodash";
export function makeConfig(options) {
    const defaults = {
        bundle: true,
        sourcemap: true,
        write: false,
        target: "es2018",
        format: "iife",
        loader: {
            ".js": "jsx",
            ".png": "file",
            ".jpg": "file",
            ".jpeg": "file",
            ".svg": "file",
            ".webp": "file",
            ".ttf": "file",
            ".otf": "file",
            ".woff": "file",
            ".woff2": "file",
        },
        jsx: "automatic",
        jsxImportSource: "@borf/browser",
    };
    return merge(defaults, options);
}
//# sourceMappingURL=esbuildConfig.js.map