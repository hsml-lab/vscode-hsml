import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadWASM, OnigScanner, OnigString } from 'vscode-oniguruma';
import { type IGrammar, INITIAL, Registry, parseRawGrammar } from 'vscode-textmate';

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
  return tokens.find((t) => t.scopes.some((s) => s === scope));
}

beforeAll(async () => {
  const wasmBin = readFileSync(
    join(import.meta.dirname, '../node_modules/vscode-oniguruma/release/onig.wasm'),
  ).buffer;

  await loadWASM(wasmBin);

  const registry = new Registry({
    onigLib: Promise.resolve({
      createOnigScanner: (patterns: string[]) => new OnigScanner(patterns),
      createOnigString: (s: string) => new OnigString(s),
    }),
    loadGrammar: async (scopeName) => {
      if (scopeName === 'text.hsml') {
        const grammarPath = join(import.meta.dirname, '../syntaxes/hsml.tmLanguage.json');
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

describe('doctype', () => {
  it('should tokenize doctype keyword', () => {
    const tokens = tokenize('doctype html');
    expect(findToken(tokens, 'keyword.other.doctype.hsml')?.text).toBe('doctype');
  });

  it('should tokenize doctype type', () => {
    const tokens = tokenize('doctype html');
    expect(findToken(tokens, 'entity.name.type.hsml')?.text).toBe('html');
  });
});

describe('tag names', () => {
  it('should tokenize a tag followed by space', () => {
    const tokens = tokenize('div Hello');
    expect(findToken(tokens, 'entity.name.tag.hsml')?.text).toBe('div');
  });

  it('should tokenize a tag followed by dot', () => {
    const tokens = tokenize('div.container ');
    expect(findToken(tokens, 'entity.name.tag.hsml')?.text).toBe('div');
  });

  it('should tokenize a tag followed by hash', () => {
    const tokens = tokenize('div#myid ');
    expect(findToken(tokens, 'entity.name.tag.hsml')?.text).toBe('div');
  });

  it('should tokenize a tag followed by parenthesis', () => {
    const tokens = tokenize('img(src="photo.jpg")');
    expect(findToken(tokens, 'entity.name.tag.hsml')?.text).toBe('img');
  });

  it('should tokenize alphanumeric tags', () => {
    const tokens = tokenize('h1 Title');
    expect(findToken(tokens, 'entity.name.tag.hsml')?.text).toBe('h1');
  });

  it('should tokenize custom elements with hyphens', () => {
    const tokens = tokenize('my-component Hello');
    expect(findToken(tokens, 'entity.name.tag.hsml')?.text).toBe('my-component');
  });
});

describe('IDs', () => {
  it('should tokenize an ID selector', () => {
    const tokens = tokenize('div#myid ');
    expect(findToken(tokens, 'entity.other.attribute-name.id.css.hsml')?.text).toBe('myid');
  });

  it('should tokenize the hash separator', () => {
    const tokens = tokenize('div#myid ');
    expect(findToken(tokens, 'meta.attribute-name.id.css.hsml')?.text).toBe('#');
  });

  it('should tokenize IDs with hyphens', () => {
    const tokens = tokenize('div#my-id ');
    expect(findToken(tokens, 'entity.other.attribute-name.id.css.hsml')?.text).toBe('my-id');
  });

  it('should tokenize tag with ID and class', () => {
    const tokens = tokenize('div#myid.myclass ');
    expect(findToken(tokens, 'entity.name.tag.hsml')?.text).toBe('div');
    expect(findToken(tokens, 'entity.other.attribute-name.id.css.hsml')?.text).toBe('myid');
    expect(findToken(tokens, 'entity.other.attribute-name.class.css.hsml')?.text).toBe('myclass');
  });
});

describe('classes', () => {
  it('should tokenize a class name', () => {
    const tokens = tokenize('div.container ');
    expect(findToken(tokens, 'entity.other.attribute-name.class.css.hsml')?.text).toBe('container');
  });

  it('should tokenize the dot separator', () => {
    const tokens = tokenize('div.container ');
    expect(findToken(tokens, 'meta.attribute-name.class.css.hsml')).toBeDefined();
  });

  it('should tokenize multiple classes', () => {
    const tokens = tokenize('div.foo.bar ');
    const classTokens = tokens.filter((t) =>
      t.scopes.some((s) => s === 'entity.other.attribute-name.class.css.hsml'),
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

  it('should tokenize implicit div with class', () => {
    const tokens = tokenize('.container ');
    expect(findToken(tokens, 'entity.other.attribute-name.class.css.hsml')?.text).toBe('container');
  });
});

describe('attributes', () => {
  it('should tokenize attribute name inside parens', () => {
    const tokens = tokenize('img(src="photo.jpg")');
    expect(findToken(tokens, 'entity.other.attribute-name.hsml')?.text).toBe('src');
  });

  it('should tokenize attribute value inside parens', () => {
    const tokens = tokenize('img(src="photo.jpg")');
    expect(findToken(tokens, 'string.quoted.hsml')?.text).toBe('"photo.jpg"');
  });

  it('should tokenize hyphenated attribute names', () => {
    const tokens = tokenize('div(data-id="123")');
    expect(findToken(tokens, 'entity.other.attribute-name.hsml')?.text).toBe('data-id');
  });

  it('should tokenize single-quoted attribute values', () => {
    const tokens = tokenize("div(title='hello')");
    expect(findToken(tokens, 'string.quoted.hsml')?.text).toBe("'hello'");
  });

  it('should tokenize Vue binding attributes', () => {
    const tokens = tokenize('img(:src="imageUrl")');
    expect(findToken(tokens, 'entity.other.attribute-name.hsml')?.text).toBe(':src');
  });

  it('should tokenize Vue event attributes', () => {
    const tokens = tokenize('button(@click="handler")');
    expect(findToken(tokens, 'entity.other.attribute-name.hsml')?.text).toBe('@click');
  });

  it('should tokenize Vue directives', () => {
    const tokens = tokenize('div(v-if="show")');
    expect(findToken(tokens, 'entity.other.attribute-name.hsml')?.text).toBe('v-if');
  });

  it('should tokenize opening paren', () => {
    const tokens = tokenize('div(class="foo")');
    expect(findToken(tokens, 'punctuation.section.attributes.begin.hsml')?.text).toBe('(');
  });

  it('should tokenize closing paren', () => {
    const tokens = tokenize('div(class="foo")');
    expect(findToken(tokens, 'punctuation.section.attributes.end.hsml')?.text).toBe(')');
  });
});

describe('text block', () => {
  it('should tokenize text block marker', () => {
    const tokens = tokenize('p.text-lg.');
    expect(findToken(tokens, 'punctuation.definition.text-block.hsml')?.text).toBe('.');
  });
});
