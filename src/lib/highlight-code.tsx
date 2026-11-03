import type { ReactNode } from "react";

/**
 * Tiny dependency-free highlighter for JS/TS-like snippets (also fine for
 * Java/C-style code). Token colours live in globals.css (.tok-*), themed
 * after VS Code Light+/Dark+.
 */
const KEYWORDS = new Set(
  (
    "const let var function return if else for while do switch case break continue new class extends " +
    "import export from default async await try catch finally throw typeof instanceof in of delete void " +
    "this super static interface type enum implements public private protected yield def self lambda " +
    "int string boolean number"
  ).split(" ")
);
const LITERALS = new Set(["true", "false", "null", "undefined", "NaN", "Infinity", "None", "True", "False"]);

const TOKEN_RE =
  /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)(\s*\()?/g;

export function highlightCode(code: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  for (const m of code.matchAll(TOKEN_RE)) {
    const idx = m.index ?? 0;
    // "#" only counts as a comment at line start/after whitespace (avoid e.g. URLs)
    if (m[1]?.startsWith("#") && idx > 0 && !/\s/.test(code[idx - 1])) continue;
    if (idx > last) out.push(code.slice(last, idx));
    const [, comment, str, num, word, call] = m;
    if (comment) out.push(<span key={key++} className="tok-comment">{comment}</span>);
    else if (str) out.push(<span key={key++} className="tok-string">{str}</span>);
    else if (num) out.push(<span key={key++} className="tok-number">{num}</span>);
    else if (word) {
      const cls = KEYWORDS.has(word)
        ? "tok-keyword"
        : LITERALS.has(word)
          ? "tok-literal"
          : call
            ? "tok-function"
            : /^[A-Z]/.test(word)
              ? "tok-type"
              : null;
      out.push(cls ? <span key={key++} className={cls}>{word}</span> : word);
      if (call) out.push(call);
    }
    last = idx + m[0].length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}
