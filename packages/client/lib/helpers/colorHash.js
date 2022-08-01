// Adapted from: https://github.com/jonotron/chromahash/blob/master/index.js

function djb2(str) {
  var hash = 5381;
  for (let i = 0; i < str.length; i++) {
    let char = str.charCodeAt(i);
    hash = (hash << 5) + hash + char;
  }
  return hash;
}

function to256ish(i) {
  const k = 5;
  const m = 256 / k;

  return (Math.abs(i) % k) * m;
}

function toHex(d) {
  return ("0" + Number(d).toString(16)).slice(-2);
}

export function colorHash(str) {
  const rStr = "red" + str;
  const gStr = "green" + str;
  const bStr = "blue" + str;

  const rHex = toHex(to256ish(djb2(rStr)));
  const gHex = toHex(to256ish(djb2(gStr)));
  const bHex = toHex(to256ish(djb2(bStr)));

  return `#${rHex}${gHex}${bHex}`;
}
