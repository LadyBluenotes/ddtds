import { remark } from "remark";
import { visit } from "unist-util-visit";
import { parseSync, type ParserOptions, type StaticImport } from "oxc-parser";
import { SUPPORTED_LANGS, ANNOTATIONS } from "./constants.ts";

type OxcStatement = {
  type: string;
  start: number;
  end: number;
  declare?: boolean;
  id?: unknown;
  declaration?: OxcStatement | null;
};

type OxcProgram = {
  body: OxcStatement[];
};

type Edit = {
  start: number;
  end: number;
  text: string;
};

export class CodeBlock {
  readonly #code: string;
  readonly lang: string;
  readonly #meta: string;
  readonly line: number;

  constructor(code: string, lang: string, meta: string | null | undefined, line: number) {
    this.#code = code;
    this.lang = lang;
    this.#meta = meta ?? "";
    this.line = line;
  }

  get outputExtension(): "ts" | "tsx" {
    return this.isJsx() ? "tsx" : "ts";
  }

  isJsx(): boolean {
    return this.lang === "tsx" || this.lang === "jsx";
  }

  isSkipped(): boolean {
    return this.#meta.includes(ANNOTATIONS.NO_RUN) || this.#meta.includes(ANNOTATIONS.COMPILE_FAIL);
  }

  shouldThrow(): boolean {
    return this.#meta.includes(ANNOTATIONS.SHOULD_THROW);
  }

  splitImports(): { imports: string[]; body: string } {
    const lang = this.parserLang();
    const parsed = parseSync(`block.${lang}`, this.#code, {
      lang,
      sourceType: "module",
    });
    const program = parsed.program as OxcProgram;
    const imports = parsed.module.staticImports.map((staticImport) =>
      sliceImport(this.#code, staticImport),
    );
    const edits: Edit[] = parsed.module.staticImports.map((staticImport) =>
      removeStatement(this.#code, staticImport.start, staticImport.end),
    );

    for (const statement of program.body) {
      edits.push(...sanitizeStatement(this.#code, statement));
    }

    return {
      imports,
      body: applyEdits(this.#code, edits).replace(/^\n+/, "").trimEnd(),
    };
  }

  parserLang(): NonNullable<ParserOptions["lang"]> {
    if (this.lang === "javascript") return "js";
    if (this.lang === "typescript") return "ts";
    if (this.lang === "jsx") return "jsx";
    if (this.lang === "tsx") return "tsx";
    return "ts";
  }
}

export function parseCodeFences(source: string): CodeBlock[] {
  const tree = remark().parse(source);
  const blocks: CodeBlock[] = [];

  visit(tree, "code", (node) => {
    const { lang, meta } = node;
    if (!lang || !SUPPORTED_LANGS.has(lang)) return;
    if ((meta ?? "").split(" ").includes(ANNOTATIONS.SKIP)) return;

    blocks.push(new CodeBlock(node.value, lang, meta, node.position!.start.line));
  });

  return blocks;
}

function sanitizeStatement(source: string, statement: OxcStatement): Edit[] {
  if (statement.type === "ImportDeclaration") {
    return [];
  }

  if (isDeclareStatement(statement)) {
    return [removeStatement(source, statement.start, statement.end)];
  }

  if (statement.type === "ExportNamedDeclaration") {
    if (!statement.declaration || isDeclareStatement(statement.declaration)) {
      return [removeStatement(source, statement.start, statement.end)];
    }

    return [removePrefix(statement.start, statement.declaration.start)];
  }

  if (statement.type === "ExportAllDeclaration") {
    return [removeStatement(source, statement.start, statement.end)];
  }

  if (statement.type === "ExportDefaultDeclaration") {
    const declaration = statement.declaration;
    if (!declaration) return [removeStatement(source, statement.start, statement.end)];

    if (
      (declaration.type === "ClassDeclaration" || declaration.type === "FunctionDeclaration") &&
      declaration.id
    ) {
      return [removePrefix(statement.start, declaration.start)];
    }

    return [{ start: statement.start, end: declaration.start, text: "const _default = " }];
  }

  return [];
}

function isDeclareStatement(statement: OxcStatement): boolean {
  return statement.declare === true || statement.type === "TSDeclareFunction";
}

function sliceImport(source: string, staticImport: StaticImport): string {
  return source.slice(staticImport.start, includeSemicolon(source, staticImport.end)).trimEnd();
}

function removePrefix(start: number, end: number): Edit {
  return { start, end, text: "" };
}

function removeStatement(source: string, start: number, end: number): Edit {
  let adjustedEnd = includeSemicolon(source, end);
  while (
    adjustedEnd < source.length &&
    (source[adjustedEnd] === " " || source[adjustedEnd] === "\t" || source[adjustedEnd] === "\r")
  ) {
    adjustedEnd++;
  }
  if (source[adjustedEnd] === "\n") adjustedEnd++;
  return { start, end: adjustedEnd, text: "" };
}

function includeSemicolon(source: string, end: number): number {
  return source[end] === ";" ? end + 1 : end;
}

function applyEdits(source: string, edits: Edit[]): string {
  return edits
    .toSorted((a, b) => b.start - a.start)
    .reduce(
      (output, edit) => output.slice(0, edit.start) + edit.text + output.slice(edit.end),
      source,
    );
}
