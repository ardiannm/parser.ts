import { DiagnosticBag } from "../Diagnostics/DiagnosticBag";
import { DiagnosticKind } from "../Diagnostics/DiagnosticKind";
import { BinaryExpression } from "../Parser/BinaryExpression";
import { Facts } from "../Parser/Facts";
import { ParenthesizedExpression } from "../Parser/ParenthesizedExpression";
import { Program } from "../Parser/Program";
import { SyntaxKind } from "../Parser/SyntaxKind";
import { SyntaxNode } from "../Parser/SyntaxNode";
import { SyntaxToken } from "../Parser/SyntaxToken";
import { UnaryExpression } from "../Parser/UnaryExpression";

export class Rewriter {
  private Diagnostics = new DiagnosticBag(DiagnosticKind.Rewriter);

  Rewrite<Kind extends SyntaxNode>(Node: Kind): SyntaxNode {
    type NodeType<T> = Kind & T;
    switch (Node.Kind) {
      case SyntaxKind.NumberToken:
      case SyntaxKind.CellReference:
      case SyntaxKind.RangeReference:
        return Node;
      case SyntaxKind.Program:
        return this.RewriteProgram(Node as NodeType<Program>);
      case SyntaxKind.UnaryExpression:
        return this.RewriteUnaryExpression(Node as NodeType<UnaryExpression>);
      case SyntaxKind.ParenthesizedExpression:
        return this.RewriteParenthesizedExpression(Node as NodeType<ParenthesizedExpression>);
      case SyntaxKind.BinaryExpression:
        return this.RewriteBinaryExpression(Node as NodeType<BinaryExpression>);
      default:
        throw this.Diagnostics.MissingMethod(Node.Kind);
    }
  }

  private RewriteProgram(Node: Program) {
    Node.Root = Node.Root.map((Statement) => this.Rewrite(Statement));
    return Node;
  }

  private RewriteUnaryExpression(Node: UnaryExpression) {
    const Right = this.Rewrite(Node.Right) as UnaryExpression;
    if (Right.Kind === SyntaxKind.UnaryExpression && Right.Operator.Kind === Node.Operator.Kind) {
      return this.Rewrite(Right.Right);
    }
    Node.Right = this.Rewrite(Node.Right);
    if (Node.Operator.Kind === SyntaxKind.PlusToken) return this.Rewrite(Node.Right);
    return Node;
  }

  private RewriteParenthesizedExpression(Node: ParenthesizedExpression) {
    return this.Rewrite(Node.Expression);
  }

  private RewriteBinaryExpression(Node: BinaryExpression) {
    Node.Left = this.Rewrite(Node.Left);

    if (Node.Left.Kind === SyntaxKind.UnaryExpression) {
      Node.Left = this.SwitchOperator(Node.Left);
    }

    if (Node.Operator.Kind === SyntaxKind.MinusToken && Node.Right.Kind === SyntaxKind.ParenthesizedExpression) {
      Node.Right = this.SwitchOperator(Node.Right);
    }

    Node.Right = this.Rewrite(Node.Right);

    var Right = Node.Right as BinaryExpression;
    if (Right.Kind === SyntaxKind.BinaryExpression) {
      const Precedence = Facts.BinaryPrecedence(Right.Operator.Kind) === Facts.BinaryPrecedence(Node.Operator.Kind);
      if (Precedence) {
        const Left = new BinaryExpression(SyntaxKind.BinaryExpression, Node.Left, Node.Operator, this.Rewrite(Right.Left));
        const Written = new BinaryExpression(SyntaxKind.BinaryExpression, Left, Right.Operator, this.Rewrite(Right.Right));
        return this.Rewrite(Written);
      }
    }
    return Node;
  }

  SwitchOperator<Kind extends SyntaxNode>(Node: Kind): SyntaxNode {
    type NodeType<T> = Kind & T;
    switch (Node.Kind) {
      case SyntaxKind.NumberToken:
      case SyntaxKind.CellReference:
      case SyntaxKind.RangeReference:
        return Node;
      case SyntaxKind.BinaryExpression:
        return this.SwitchBinaryExpression(Node as NodeType<BinaryExpression>);
      case SyntaxKind.ParenthesizedExpression:
        return this.SwitchOperator((Node as NodeType<ParenthesizedExpression>).Expression);
      case SyntaxKind.UnaryExpression:
        return this.SwitchOperator((Node as NodeType<UnaryExpression>).Right);
      default:
        throw this.Diagnostics.MissingSwitchMethod(Node.Kind);
    }
  }

  private SwitchBinaryExpression(Node: BinaryExpression) {
    switch (Node.Operator.Kind) {
      case SyntaxKind.PlusToken:
        return new BinaryExpression(SyntaxKind.BinaryExpression, this.SwitchOperator(Node.Left), new SyntaxToken(SyntaxKind.MinusToken, "-"), this.SwitchOperator(Node.Right));
      case SyntaxKind.MinusToken:
        return new BinaryExpression(SyntaxKind.BinaryExpression, this.SwitchOperator(Node.Left), new SyntaxToken(SyntaxKind.PlusToken, "+"), this.SwitchOperator(Node.Right));
    }
    Node.Left = this.Rewrite(Node.Left);
    Node.Right = this.Rewrite(Node.Right);
    return Node;
  }
}
