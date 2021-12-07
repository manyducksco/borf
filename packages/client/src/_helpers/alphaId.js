const alphabet = "abcdefghijklmnopqrstuvwxyz";

/**
 * A base 26 counting system where an integer is turned into a series of letters.
 */
export default function alphaId(number) {
  let chars = [];
  let index = 0;

  if (number) {
    chars.push(alphabet[0]);

    for (let i = number; i > 0; i--) {
      if (index === alphabet.length) {
        index = 0;
        chars.push(alphabet[0]);
      }

      chars[chars.length - 1] = alphabet[index];

      index++;
    }
  }

  return chars.join("");
}
