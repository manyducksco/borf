/**
 * Takes a list of patterns and returns a function to match a value against them.
 */
export function match<I, O>(patterns: PatternList<I, O>): (value: I) => O | undefined;

/**
 * Takes a list of patterns and a value; returns the value of the matched pattern.
 */
export function match<I, O>(patterns: PatternList<I, O>, value: I): O | undefined;

/**
 * Takes a list of patterns and returns a function to match a value against them.
 */
export function match<I, O>(patterns: PatternListWithFallback<I, O>): (value: I) => O;

/**
 * Takes a list of patterns and a value; returns the value of the matched pattern.
 */
export function match<I, O>(patterns: PatternListWithFallback<I, O>, value: I): O;

export function match<I, O>(patterns: PatternList<I, O>, value?: I) {
  function compute(value: I) {
    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];

      if (Array.isArray(pattern)) {
        const [key, result] = pattern;

        if (typeof key === "function") {
          if (key(value)) {
            if (typeof result === "function") {
              return result(value);
            } else {
              return result;
            }
          }
        } else if (key === value) {
          if (typeof result === "function") {
            return result(value);
          } else {
            return result;
          }
        }
      } else if (i + 1 === patterns.length) {
        // Fallback value can be a function or a value
        if (typeof pattern === "function") {
          return pattern(value);
        } else {
          return pattern;
        }
      } else {
        throw new Error(`Unexpected pattern type at index ${i}: ${typeof pattern}`);
      }
    }

    return undefined; // No match
  }

  if (value === undefined) {
    return compute;
  } else {
    return compute(value);
  }
}

const ordinal = match([[1, "once"], [2, "twice"], [3, "thrice"], (value) => `${value} times`]);

const fizzify = match<number, string>([
  [dividesBy(15), "fizzbuzz"],
  [dividesBy(3), "fizz"],
  [dividesBy(5), "buzz"],
  // Fallback returns the value as a string:
  (n) => n.toString(),
]);

function dividesBy(n: number) {
  return (value: number) => value % n === 0;
}

type PatternKey<I> = I | ((value: I) => boolean);
type PatternResult<I, O> = O | ((value: I) => O);
type MatchablePattern<I, O> = [PatternKey<I>, PatternResult<I, O>];
type FallbackResult<I, O> = O | ((value: I) => O);
type PatternList<I, O> =
  | [MatchablePattern<I, O>]
  | [MatchablePattern<I, O>, MatchablePattern<I, O>]
  | [MatchablePattern<I, O>, MatchablePattern<I, O>, MatchablePattern<I, O>]
  | [MatchablePattern<I, O>, MatchablePattern<I, O>, MatchablePattern<I, O>, MatchablePattern<I, O>]
  | [
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>
    ]
  | [
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>
    ]
  | [
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>
    ]
  | [
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>
    ]
  | [
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>
    ]
  | [
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>
    ]
  | [
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>
    ]
  | [
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>
    ];

type PatternListWithFallback<I, O> =
  | [MatchablePattern<I, O>, FallbackResult<I, O>]
  | [MatchablePattern<I, O>, MatchablePattern<I, O>, FallbackResult<I, O>]
  | [MatchablePattern<I, O>, MatchablePattern<I, O>, MatchablePattern<I, O>, FallbackResult<I, O>]
  | [
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      FallbackResult<I, O>
    ]
  | [
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      FallbackResult<I, O>
    ]
  | [
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      FallbackResult<I, O>
    ]
  | [
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      FallbackResult<I, O>
    ]
  | [
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      FallbackResult<I, O>
    ]
  | [
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      FallbackResult<I, O>
    ]
  | [
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      FallbackResult<I, O>
    ]
  | [
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      FallbackResult<I, O>
    ]
  | [
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      MatchablePattern<I, O>,
      FallbackResult<I, O>
    ];
