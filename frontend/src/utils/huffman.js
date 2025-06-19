// utils/huffman.js

export function huffmanEncode(text) {
  const freq = {};
  for (const char of text) {
    freq[char] = (freq[char] || 0) + 1;
  }

  const nodes = Object.entries(freq).map(([char, freq]) => ({ char, freq }));
  while (nodes.length > 1) {
    nodes.sort((a, b) => a.freq - b.freq);
    const left = nodes.shift();
    const right = nodes.shift();
    nodes.push({ freq: left.freq + right.freq, left, right });
  }

  const tree = nodes[0];
  const codes = {};
  function buildCode(node, path = '') {
    if (node.char !== undefined) {
      codes[node.char] = path;
    } else {
      buildCode(node.left, path + '0');
      buildCode(node.right, path + '1');
    }
  }

  buildCode(tree);

  const encoded = text.split('').map((char) => codes[char]).join('');

  return { encoded, tree };
}

export function huffmanDecode(encoded, tree) {
  let result = '';
  let node = tree;

  for (const bit of encoded) {
    node = bit === '0' ? node.left : node.right;
    if (node.char !== undefined) {
      result += node.char;
      node = tree;
    }
  }

  return result;
}
