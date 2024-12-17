import { SyntaxCellReference } from "./syntax.cell.reference";
import { SyntaxKind } from "./syntax.kind";
import { SyntaxNode } from "./syntax.node";
import { SyntaxToken } from "./syntax.token";

export class SyntaxCellAssignment extends SyntaxNode {
  constructor(public left: SyntaxCellReference, public operator: SyntaxToken, public expression: SyntaxNode) {
    super(left.source, SyntaxKind.SyntaxCellAssignment);
  }

  override getFirstChild(): SyntaxToken {
    return this.left.getFirstChild();
  }

  override getLastChild(): SyntaxToken {
    return this.expression.getLastChild();
  }
}
