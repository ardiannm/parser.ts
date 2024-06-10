import { SyntaxNodeKind } from "./kind/syntax.node.kind";
import { BinaryOperatorKind } from "./kind/binary.operator.kind";
import { SyntaxNode } from "./syntax.node";
import { ExpressionSyntax } from "./expression.syntax";
import { SyntaxToken } from "./syntax.token";

export class BinaryExpression extends ExpressionSyntax {
  constructor(public override kind: SyntaxNodeKind.BinaryExpression, public left: SyntaxNode, public operator: SyntaxToken<BinaryOperatorKind>, public right: SyntaxNode) {
    super(kind);
  }
}
