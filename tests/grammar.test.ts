import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadWASM, OnigScanner, OnigString } from 'vscode-oniguruma';
import { type IGrammar, INITIAL, Registry, parseRawGrammar } from 'vscode-textmate';

const __dirname = dirname(fileURLToPath(import.meta.url));

let grammar: IGrammar;

interface Token {
  text: string;
  scopes: string[];
}

function tokenize(line: string): Token[] {
  const result = grammar.tokenizeLine(line, INITIAL);
  return result.tokens.map((token) => ({
    text: line.substring(token.startIndex, token.endIndex),
    scopes: token.scopes,
  }));
}

function findToken(tokens: Token[], scope: string): Token | undefined {
  return tokens.find((t) => t.scopes.some((s) => s.includes(scope)));
}

beforeAll(async () => {
  const wasmBin = readFileSync(
    join(__dirname, '../node_modules/vscode-oniguruma/release/onig.wasm'),
  ).buffer;

  await loadWASM(wasmBin);

  const registry = new Registry({
    onigLib: Promise.resolve({
      createOnigScanner: (patterns: string[]) => new OnigScanner(patterns),
      createOnigString: (s: string) => new OnigString(s),
    }),
    loadGrammar: async (scopeName) => {
      if (scopeName === 'text.hsml') {
        const grammarPath = join(__dirname, '../syntaxes/hsml.tmLanguage.json');
        const data = readFileSync(grammarPath, 'utf-8');
        return parseRawGrammar(data, grammarPath);
      }
      return null;
    },
  });

  const loaded = await registry.loadGrammar('text.hsml');
  if (!loaded) throw new Error('Failed to load grammar');
  grammar = loaded;
});

describe('comments', () => {
  it('should tokenize developer comments', () => {
    const tokens = tokenize('// This is a comment');
    expect(findToken(tokens, 'comment.line.double-slash.hsml')).toBeDefined();
  });

  it('should tokenize HTML comments', () => {
    const tokens = tokenize('//! HTML comment');
    expect(findToken(tokens, 'string.comment.buffered.block.hsml')).toBeDefined();
  });

  it('should distinguish //! from //', () => {
    const htmlTokens = tokenize('//! output comment');
    const devTokens = tokenize('// dev comment');

    expect(findToken(htmlTokens, 'string.comment.buffered.block.hsml')).toBeDefined();
    expect(findToken(htmlTokens, 'comment.line.double-slash.hsml')).toBeUndefined();

    expect(findToken(devTokens, 'comment.line.double-slash.hsml')).toBeDefined();
    expect(findToken(devTokens, 'string.comment.buffered.block.hsml')).toBeUndefined();
  });
});

describe('tag names', () => {
  it('should tokenize a tag followed by space', () => {
    const tokens = tokenize('div Hello');
    expect(findToken(tokens, 'entity.name.tag.hsml')).toBeDefined();
    expect(findToken(tokens, 'entity.name.tag.hsml')?.text).toBe('div');
  });

  it('should tokenize a tag followed by dot', () => {
    const tokens = tokenize('div.container ');
    expect(findToken(tokens, 'entity.name.tag.hsml')).toBeDefined();
    expect(findToken(tokens, 'entity.name.tag.hsml')?.text).toBe('div');
  });

  it('should tokenize a tag followed by parenthesis', () => {
    const tokens = tokenize('img(src="photo.jpg")');
    expect(findToken(tokens, 'entity.name.tag.hsml')).toBeDefined();
    expect(findToken(tokens, 'entity.name.tag.hsml')?.text).toBe('img');
  });

  it('should tokenize alphanumeric tags', () => {
    const tokens = tokenize('h1 Title');
    expect(findToken(tokens, 'entity.name.tag.hsml')?.text).toBe('h1');
  });
});

describe('classes', () => {
  it('should tokenize a class name', () => {
    const tokens = tokenize('div.container ');
    expect(findToken(tokens, 'entity.other.attribute-name.class.css.hsml')).toBeDefined();
    expect(findToken(tokens, 'entity.other.attribute-name.class.css.hsml')?.text).toBe('container');
  });

  it('should tokenize the dot separator', () => {
    const tokens = tokenize('div.container ');
    expect(findToken(tokens, 'meta.attribute-name.class.css.hsml')).toBeDefined();
  });

  it('should tokenize multiple classes', () => {
    const tokens = tokenize('div.foo.bar ');
    const classTokens = tokens.filter((t) =>
      t.scopes.some((s) => s.includes('entity.other.attribute-name.class.css.hsml')),
    );
    expect(classTokens.length).toBeGreaterThanOrEqual(2);
  });

  it('should tokenize classes with colons', () => {
    const tokens = tokenize('div.hover:bg-red ');
    expect(findToken(tokens, 'entity.other.attribute-name.class.css.hsml')).toBeDefined();
  });

  it('should tokenize classes with brackets', () => {
    const tokens = tokenize('div.bg-[#1da1f2] ');
    expect(findToken(tokens, 'entity.other.attribute-name.class.css.hsml')).toBeDefined();
  });
});

describe('attributes', () => {
  it('should tokenize attribute name', () => {
    const tokens = tokenize('src="photo.jpg"');
    expect(findToken(tokens, 'entity.other.attribute-name.hsml')).toBeDefined();
    expect(findToken(tokens, 'entity.other.attribute-name.hsml')?.text).toBe('src');
  });

  it('should tokenize attribute value', () => {
    const tokens = tokenize('src="photo.jpg"');
    expect(findToken(tokens, 'string.quoted.double.hsml')).toBeDefined();
    expect(findToken(tokens, 'string.quoted.double.hsml')?.text).toBe('"photo.jpg"');
  });

  it('should tokenize hyphenated attribute names', () => {
    const tokens = tokenize('data-id="123"');
    expect(findToken(tokens, 'entity.other.attribute-name.hsml')?.text).toBe('data-id');
  });
});
