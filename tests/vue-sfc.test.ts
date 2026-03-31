import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadWASM, OnigScanner, OnigString } from 'vscode-oniguruma';
import type { IGrammar, IOnigLib } from 'vscode-textmate';
import { INITIAL, Registry, parseRawGrammar } from 'vscode-textmate';
import type { Token } from './utils.js';
import { findToken } from './utils.js';

let grammar: IGrammar;

beforeAll(async () => {
  const wasmBin = readFileSync(
    join(import.meta.dirname, '../node_modules/vscode-oniguruma/release/onig.wasm'),
  ).buffer;

  await loadWASM(wasmBin);

  const onigLib: IOnigLib = {
    createOnigScanner: (patterns: string[]) => new OnigScanner(patterns),
    createOnigString: (s: string) => new OnigString(s),
  };

  const registry = new Registry({
    onigLib: Promise.resolve(onigLib),
    loadGrammar: async (scopeName) => {
      if (scopeName === 'text.hsml') {
        const grammarPath = join(import.meta.dirname, '../syntaxes/hsml.tmLanguage.json');
        return parseRawGrammar(readFileSync(grammarPath, 'utf-8'), grammarPath);
      }
      if (scopeName === 'vue.hsml.codeblock') {
        const grammarPath = join(import.meta.dirname, '../syntaxes/vue-hsml.tmLanguage.json');
        return parseRawGrammar(readFileSync(grammarPath, 'utf-8'), grammarPath);
      }
      if (scopeName === 'text.html.vue') {
        // Minimal Vue grammar that includes our injection
        return parseRawGrammar(
          JSON.stringify({
            scopeName: 'text.html.vue',
            patterns: [{ include: 'vue.hsml.codeblock' }],
          }),
          'vue.json',
        );
      }
      return null;
    },
  });

  const loaded = await registry.loadGrammar('text.html.vue');
  if (!loaded) throw new Error('Failed to load grammar');
  grammar = loaded;
});

function tokenizeLines(lines: string[]): { line: string; tokens: Token[] }[] {
  let ruleStack = INITIAL;
  return lines.map((line) => {
    const r = grammar.tokenizeLine(line, ruleStack);
    ruleStack = r.ruleStack;
    return {
      line,
      tokens: r.tokens.map((t) => ({
        text: line.substring(t.startIndex, t.endIndex),
        scopes: t.scopes,
      })),
    };
  });
}

describe('Vue SFC HSML embedding', () => {
  it('should highlight template tag name', () => {
    const results = tokenizeLines(['<template lang="hsml">', '</template>']);
    expect(findToken(results[0]!.tokens, 'entity.name.tag.template.html.vue')).toBeDefined();
  });

  it('should highlight lang attribute', () => {
    const results = tokenizeLines(['<template lang="hsml">', '</template>']);
    expect(findToken(results[0]!.tokens, 'entity.other.attribute-name.html.vue')?.text).toBe(
      'lang',
    );
  });

  it('should highlight hsml as string value', () => {
    const results = tokenizeLines(['<template lang="hsml">', '</template>']);
    expect(findToken(results[0]!.tokens, 'string.quoted.html.vue')?.text).toBe('hsml');
  });

  it('should highlight opening quote of lang value', () => {
    const results = tokenizeLines(['<template lang="hsml">', '</template>']);
    expect(
      findToken(results[0]!.tokens, 'punctuation.definition.string.begin.html.vue')?.text,
    ).toBe('"');
  });

  it('should highlight closing quote of lang value', () => {
    const results = tokenizeLines(['<template lang="hsml">', '</template>']);
    expect(findToken(results[0]!.tokens, 'punctuation.definition.string.end.html.vue')?.text).toBe(
      '"',
    );
  });

  it('should highlight single quotes for lang value', () => {
    const results = tokenizeLines(["<template lang='hsml'>", '</template>']);
    expect(
      findToken(results[0]!.tokens, 'punctuation.definition.string.begin.html.vue')?.text,
    ).toBe("'");
    expect(findToken(results[0]!.tokens, 'punctuation.definition.string.end.html.vue')?.text).toBe(
      "'",
    );
  });

  it('should highlight closing >', () => {
    const results = tokenizeLines(['<template lang="hsml">', '</template>']);
    expect(findToken(results[0]!.tokens, 'punctuation.definition.tag.end.html.vue')?.text).toBe(
      '>',
    );
  });

  it('should highlight HSML tag names inside template', () => {
    const results = tokenizeLines(['<template lang="hsml">', 'div.container', '</template>']);
    expect(findToken(results[1]!.tokens, 'entity.name.tag.hsml')?.text).toBe('div');
  });

  it('should highlight HSML classes inside template', () => {
    const results = tokenizeLines(['<template lang="hsml">', 'div.container', '</template>']);
    expect(findToken(results[1]!.tokens, 'entity.other.attribute-name.class.css.hsml')?.text).toBe(
      'container',
    );
  });

  it('should highlight closing template tag', () => {
    const results = tokenizeLines(['<template lang="hsml">', 'div', '</template>']);
    expect(findToken(results[2]!.tokens, 'punctuation.definition.tag.begin.html.vue')?.text).toBe(
      '</',
    );
    expect(findToken(results[2]!.tokens, 'entity.name.tag.template.html.vue')).toBeDefined();
  });

  it('should work with single-quoted lang attribute', () => {
    const results = tokenizeLines(["<template lang='hsml'>", 'h1 Hello', '</template>']);
    expect(findToken(results[1]!.tokens, 'entity.name.tag.hsml')?.text).toBe('h1');
  });
});
