import { SyntaxNodeKind } from "./kind/syntax.node.kind";
import { SyntaxNode } from "./syntax.node";
import { SyntaxExpression } from "./syntax.expression";
import { SyntaxTree } from "../../runtime/syntax.tree";
import { SyntaxKind } from "./kind/syntax.kind";
import { SyntaxToken } from "./syntax.token";

export class SyntaxParenthesis extends SyntaxExpression {
  constructor(
    public override tree: SyntaxTree,
    public openParen: SyntaxToken<SyntaxNodeKind.OpenParenthesisToken>,
    public expression: SyntaxNode,
    public closeParen: SyntaxToken<SyntaxNodeKind.CloseParenthesisToken>
  ) {
    super(tree, SyntaxNodeKind.SyntaxParenthesis);
  }

  override getFirstChild(): SyntaxToken<SyntaxKind> {
    return this.openParen;
  }

  override getLastChild(): SyntaxToken<SyntaxKind> {
    return this.closeParen;
  }
}
