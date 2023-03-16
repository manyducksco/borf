import type { BuildOptions, BuildIncremental, BuildResult } from "esbuild";
/**
 * Config object with options that determine how an app is built.
 */
export interface BuilderConfig {
    /**
     * Options for the browser bundle.
     */
    browser?: {
        /**
         * Path to the main entry point file of your browser app.
         */
        entry: string;
        /**
         * Options passed directly to esbuild when creating the client bundle.
         */
        esbuild?: BuildOptions;
        postcss?: any;
    };
    /**
     * Options for the server bundle.
     */
    server?: {
        /**
         * Path to the main entry point file of your server app.
         */
        entry: string;
    };
    static?: {
        path: string;
    };
    output?: {
        path: string;
    };
    optimize?: {
        /**
         * Strips and minimizes assets during build to reduce bundle size.
         * Highly recommended for production builds. Defaults to "production".
         */
        minify?: boolean | "production";
        /**
         * Compresses assets during build to reduce bandwidth required to load the app.
         * Highly recommended for production builds and works out of the box when served by @borf/server.
         * Defaults to "production".
         */
        compress?: boolean | "production";
    };
}
export declare class Builder {
    #private;
    static configure(config: BuilderConfig): BuilderConfig;
    get config(): BuilderConfig;
    constructor(projectRoot: string, config: BuilderConfig);
    /**
     * Builds the app with the provided options.
     */
    build(): Promise<void>;
    /**
     *
     */
    watch(): void;
    /**
     * Ensures that output directories exist and removes any existing files.
     */
    clean(): Promise<void>;
}
interface WriteClientFilesOptions {
    clientBundle: BuildResult | BuildIncremental;
    projectRoot: string;
    staticPath: string;
    buildStaticPath: string;
    clientEntryPath: string;
    buildOptions: {
        compress?: boolean;
        minify?: boolean;
        relativeBundlePaths?: boolean;
    };
    isDevelopment?: boolean;
}
export declare function writeClientFiles({ clientBundle, projectRoot, staticPath, buildStaticPath, clientEntryPath, buildOptions, isDevelopment, }: WriteClientFilesOptions): Promise<({
    path: string;
    contents: Uint8Array;
    text: string;
} | {
    path: string;
})[]>;
interface WriteStaticFilesOptions {
    projectRoot: string;
    staticPath: string;
    buildPath: string;
    buildStaticPath: string;
    clientEntryPath: string;
    buildOptions: {
        compress?: boolean;
    };
}
interface CopiedFile {
    path: string;
}
export declare function writeStaticFiles({ projectRoot, staticPath, buildPath, buildStaticPath, clientEntryPath, buildOptions, }: WriteStaticFilesOptions): Promise<CopiedFile[]>;
export {};
