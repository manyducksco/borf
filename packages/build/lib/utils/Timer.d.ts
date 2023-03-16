export declare class Timer {
    #private;
    static format(ms: number): string;
    /**
     * Returns total time elapsed since last reset in milliseconds.
     */
    get elapsed(): number;
    /**
     * Returns the timer duration formatted as a string.
     */
    format(): string;
    /**
     * Resets timer duration to 0.
     */
    reset(): void;
}
