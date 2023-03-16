import path from "path";
import xxhash from "xxhashjs";
/**
 * Generates class names for compiled CSS modules.
 */
export function generateScopedClassName(name, filename, css) {
    const file = path.basename(filename, ".module.css");
    const hash = xxhash.h64().update(css).digest().toString(16).slice(0, 5);
    return file + "_" + name + "_" + hash;
}
//# sourceMappingURL=generateScopedClassName.js.map