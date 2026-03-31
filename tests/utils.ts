export interface Token {
  text: string;
  scopes: string[];
}

export function findToken(tokens: Token[], scope: string): Token | undefined {
  return tokens.find((t) => t.scopes.some((s) => s === scope));
}
