import { SyntaxKind } from "./SyntaxKind";
import { SyntaxToken } from "./SyntaxToken";
import { Expression } from "./Expression";

export class CellReference extends Expression {
  constructor(public Kind: SyntaxKind, public Left: SyntaxToken, public Right: SyntaxToken) {
    super(Kind);
  }
}