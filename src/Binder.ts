import { DiagnosticBag } from "./CodeAnalysis/Diagnostics/DiagnosticBag";
import { SyntaxKind } from "./CodeAnalysis/SyntaxKind";
import { SyntaxNode } from "./CodeAnalysis/SyntaxNode";
import { SyntaxTree } from "./CodeAnalysis/SyntaxTree";
import { ReferenceDeclaration } from "./CodeAnalysis/ReferenceDeclaration";
import { BinaryExpression } from "./CodeAnalysis/BinaryExpression";
import { RangeReference } from "./CodeAnalysis/RangeReference";
import { CellReference } from "./CodeAnalysis/CellReference";
import { SyntaxToken } from "./CodeAnalysis/SyntaxToken";
import { BoundBinaryExpression } from "./CodeAnalysis/Binding/BoundBinaryExpression";
import { BoundCellReference } from "./CodeAnalysis/Binding/BoundCellReference";
import { BoundIdentifier } from "./CodeAnalysis/Binding/BoundIdentifier";
import { BoundKind } from "./CodeAnalysis/Binding/BoundKind";
import { BoundNumber } from "./CodeAnalysis/Binding/BoundNumber";
import { BoundBinaryOperatorKind } from "./CodeAnalysis/Binding/BoundBinaryOperatorKind";
import { BoundRangeReference } from "./CodeAnalysis/Binding/BoundRangeReference";
import { BoundReferenceDeclaration } from "./CodeAnalysis/Binding/BoundReferenceDeclaration";
import { BoundSyntaxTree } from "./CodeAnalysis/Binding/BoundSyntaxTree";
import { BoundHasReference } from "./CodeAnalysis/Binding/BoundHasReference";
import { UnaryExpression } from "./CodeAnalysis/UnaryExpression";
import { BoundUnaryExpression } from "./CodeAnalysis/Binding/BoundUnaryExpression";
import { BoundUnaryOperatorKind } from "./CodeAnalysis/Binding/BoundUnaryOperatorKind";
import { ParenthesizedExpression } from "./CodeAnalysis/ParenthesizedExpression";
import { BoundNode } from "./CodeAnalysis/Binding/BoundNode";
import { Environment } from "./Environment";

// Binder class responsible for binding syntax nodes to their corresponding bound nodes.

export class Binder {
  // Logger for reporting DiagnosticBag and errors during binding.
  public Diagnostics = new DiagnosticBag();

  constructor(public Env: Environment) {}

  // Bind method takes a SyntaxNode and returns the corresponding BoundNode.
  Bind<Kind extends SyntaxNode>(Node: Kind): BoundNode {
    type NodeType<T> = Kind & T;
    switch (Node.Kind) {
      case SyntaxKind.SyntaxTree:
        return this.BindSyntaxTree(Node as NodeType<SyntaxTree>);
      case SyntaxKind.IdentifierToken:
        return this.BindIdentifier(Node as NodeType<SyntaxToken>);
      case SyntaxKind.NumberToken:
        return this.BindNumber(Node as NodeType<SyntaxToken>);
      case SyntaxKind.CellReference:
        return this.BindCellReference(Node as NodeType<CellReference>);
      case SyntaxKind.RangeReference:
        return this.BindRangeReference(Node as NodeType<RangeReference>);
      case SyntaxKind.ParenthesizedExpression:
        return this.BindParenthesizedExpression(Node as NodeType<ParenthesizedExpression>);
      case SyntaxKind.UnaryExpression:
        return this.BindUnaryExpression(Node as NodeType<UnaryExpression>);
      case SyntaxKind.BinaryExpression:
        return this.BindBinaryExpression(Node as NodeType<BinaryExpression>);
      case SyntaxKind.ReferenceDeclaration:
        return this.BindReferenceDeclaration(Node as NodeType<ReferenceDeclaration>);
      default:
        throw this.Diagnostics.MissingBindingMethod(Node.Kind);
    }
  }

  private BindReferenceDeclaration(Node: ReferenceDeclaration) {
    switch (Node.Left.Kind) {
      case SyntaxKind.CellReference:
        const Left = this.Bind(Node.Left) as BoundCellReference;
        const Env = new Environment(this.Diagnostics);
        const BinderFactory = new Binder(Env);
        const Expression = BinderFactory.Bind(Node.Expression);
        const Referecing = BinderFactory.Env.GetStack();
        const Bound = new BoundReferenceDeclaration(BoundKind.BoundReferenceDeclaration, Left.Reference, Referecing, [], Expression);
        return this.Env.RegisterNode(Bound);
      default:
        throw this.Diagnostics.CantUseAsAReference(Node.Kind);
    }
  }

  // Binding method for BinaryExpression syntax node.
  private BindBinaryExpression(Node: BinaryExpression) {
    const Left = this.Bind(Node.Left);
    const Operator = this.BindOperatorKind(Node.Operator.Kind);
    const Right = this.Bind(Node.Right);
    return new BoundBinaryExpression(BoundKind.BoundBinaryExpression, Left, Operator, Right);
  }

  // Method to map syntax binary operator kind to bound binary operator kind.
  private BindOperatorKind(Kind: SyntaxKind): BoundBinaryOperatorKind {
    switch (Kind) {
      case SyntaxKind.PlusToken:
        return BoundBinaryOperatorKind.Addition;
      case SyntaxKind.MinusToken:
        return BoundBinaryOperatorKind.Subtraction;
      case SyntaxKind.StarToken:
        return BoundBinaryOperatorKind.Multiplication;
      case SyntaxKind.SlashToken:
        return BoundBinaryOperatorKind.Division;
      default:
        throw this.Diagnostics.MissingOperatorKind(Kind);
    }
  }

  // Binding method for UnaryExpression syntax node.
  private BindUnaryExpression(Node: UnaryExpression) {
    const Operator = this.BindUnaryOperatorKind(Node.Operator.Kind);
    const Right = this.Bind(Node.Right);
    return new BoundUnaryExpression(BoundKind.BoundUnaryExpression, Operator, Right);
  }

  // Method to map syntax unary operator kind to bound unary operator kind.
  private BindUnaryOperatorKind(Kind: SyntaxKind): BoundUnaryOperatorKind {
    switch (Kind) {
      case SyntaxKind.PlusToken:
        return BoundUnaryOperatorKind.Identity;
      case SyntaxKind.MinusToken:
        return BoundUnaryOperatorKind.Negation;
      default:
        throw this.Diagnostics.MissingOperatorKind(Kind);
    }
  }

  // Binding method for ParenthesizedExpression syntax node.
  private BindParenthesizedExpression(Node: ParenthesizedExpression) {
    return this.Bind(Node.Expression);
  }

  // Binding method for RangeReference syntax node.
  private BindRangeReference(Node: RangeReference) {
    const BoundLeft = this.Bind(Node.Left) as BoundHasReference;
    const BoundRight = this.Bind(Node.Right) as BoundHasReference;
    return new BoundRangeReference(BoundKind.BoundRangeReference, BoundLeft.Reference + ":" + BoundRight.Reference);
  }

  // Binding method for CellReference syntax node.
  private BindCellReference(Node: CellReference) {
    const Reference = Node.Left.Text + Node.Right.Text;
    const Bound = new BoundCellReference(BoundKind.BoundCellReference, Reference);
    this.Env.ReferToCell(Bound);
    return Bound;
  }

  // Binding method for IdentifierToken syntax node.
  private BindIdentifier(Node: SyntaxToken) {
    return new BoundIdentifier(BoundKind.BoundIdentifier, Node.Text, Node.Text);
  }

  // Binding method for NumberToken syntax node.
  private BindNumber(Node: SyntaxToken) {
    const Value = parseFloat(Node.Text);
    return new BoundNumber(BoundKind.BoundNumber, Node.Text, Value);
  }

  // Binding method for SyntaxTree syntax node.
  private BindSyntaxTree(Node: SyntaxTree) {
    const Expressions = Node.Expressions.map((Expression) => this.Bind(Expression));
    return new BoundSyntaxTree(BoundKind.BoundSyntaxTree, Expressions);
  }
}
