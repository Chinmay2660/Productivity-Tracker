/**
 * Dependency-free auto formatter for brace-style code (JS/TS/Java/C-like).
 * 1) If the snippet is squashed onto few lines, breaks after `{`, `;` and around `}`.
 * 2) Re-indents every line by bracket depth (2 spaces).
 * Non-brace text (prose, Python, etc.) is returned untouched.
 */
const INDENT = "  ";

function looksSquashed(code: string): boolean {
  const lines = code.split("\n").filter((l) => l.trim());
  return lines.length <= 2 && code.length > 60 && /[{;]/.test(code);
}

function breakLines(code: string): string {
  let out = "";
  let paren = 0;
  for (let i = 0; i < code.length; i++) {
    const c = code[i];
    const two = code.slice(i, i + 2);
    if (two === "//") {
      const end = code.indexOf("\n", i);
      const stop = end === -1 ? code.length : end;
      out += code.slice(i, stop);
      i = stop - 1;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      let j = i + 1;
      while (j < code.length && code[j] !== c) j += code[j] === "\\" ? 2 : 1;
      out += code.slice(i, j + 1);
      i = j;
      continue;
    }
    if (c === "(") paren++;
    if (c === ")") paren = Math.max(0, paren - 1);
    if (c === "}") out = out.trimEnd() + "\n}";
    else out += c;
    if (c === "{" || (c === ";" && paren === 0)) out += "\n";
    else if (c === "}") {
      const next = code.slice(i + 1).trimStart();
      if (!/^(else|catch|finally|while|[,;)])/.test(next)) out += "\n";
    }
  }
  return out;
}

export function formatCode(code: string): string {
  if (!/[{}]/.test(code)) return code;
  let text = code.replace(/\r\n/g, "\n").replace(/\t/g, INDENT);
  if (looksSquashed(text)) text = breakLines(text);

  let depth = 0;
  const result: string[] = [];
  let inBlockComment = false;
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) {
      result.push("");
      continue;
    }
    if (inBlockComment) {
      result.push(INDENT.repeat(depth) + " " + line);
      if (line.includes("*/")) inBlockComment = false;
      continue;
    }
    // strip strings/comments to count brackets only
    const bare = line
      .replace(/\/\/.*$/, "")
      .replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/g, "");
    let opens = 0;
    let closes = 0;
    let leadingCloses = 0;
    let seenOther = false;
    for (const ch of bare) {
      if ("{[(".includes(ch)) { opens++; seenOther = true; }
      else if ("}])".includes(ch)) {
        closes++;
        if (!seenOther) leadingCloses++;
      } else if (!/\s/.test(ch)) seenOther = true;
    }
    result.push(INDENT.repeat(Math.max(0, depth - leadingCloses)) + line);
    depth = Math.max(0, depth + opens - closes);
    if (line.includes("/*") && !line.includes("*/")) inBlockComment = true;
  }
  return result.join("\n");
}
