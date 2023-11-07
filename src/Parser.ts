import { Lexer } from "./Lexer";
import { SyntaxKind } from "./SyntaxKind";
import { SyntaxToken } from "./SyntaxToken";
import { RangeNode, CellNode, RowNode, ColumnNode } from "./SyntaxNode";

export class Parser {
  private tokenizer = new Lexer("");
  constructor(public input: string) {
    this.tokenizer.input = input;
  }

  private tokens = new Array<SyntaxToken>();
  private pointer = 0;

  match(...kinds: Array<SyntaxKind>): boolean {
    const start = this.pointer;
    for (const kind of kinds) {
      if (this.pointer >= this.tokens.length) this.tokens.push(this.tokenizer.getNextToken());
      if (kind !== this.tokens[this.pointer].kind) {
        this.pointer = start;
        return false;
      }
      this.pointer = this.pointer + 1;
    }
    this.pointer = start;
    return true;
  }

  parse() {
    return this.parseRange();
  }

  parseRange() {
    if (this.match(SyntaxKind.IndentifierToken, SyntaxKind.NumberToken, SyntaxKind.ColonToken) || this.match(SyntaxKind.IndentifierToken, SyntaxKind.ColonToken) || this.match(SyntaxKind.IndentifierToken, SyntaxKind.ColonToken)) {
      const left = this.parseCell();
      this.parseToken();
      const right = this.parseCell();
      return new RangeNode(SyntaxKind.RangeNode, left, right);
    }
    if (this.match(SyntaxKind.IndentifierToken, SyntaxKind.NumberToken)) return this.parseCell();
    return this.parseToken();
  }

  parseCell() {
    const left = this.parseColumn();
    const right = this.parseRow();
    return new CellNode(SyntaxKind.CellNode, left, right);
  }

  parseRow() {
    const repr = this.match(SyntaxKind.NumberToken) ? this.parseToken().repr : "";
    return new RowNode(SyntaxKind.RowNode, repr);
  }

  parseColumn() {
    const repr = this.match(SyntaxKind.IndentifierToken) ? this.parseToken().repr : "";
    return new ColumnNode(SyntaxKind.ColumnNode, repr);
  }

  parseToken() {
    if (this.tokens.length > 0) return this.tokens.shift();
    return this.tokenizer.getNextToken();
  }
}
