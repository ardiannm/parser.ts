import { SyntaxNodeKind } from "./parser/kind/syntax.node.kind";
import { BinaryOperatorKind } from "./parser/kind/binary.operator.kind";
import { UnaryOperatorKind } from "./parser/kind/unary.operator.kind";
import { SyntaxNode } from "./parser/syntax.node";
import { BinaryExpression } from "./parser/binary.expression";
import { CellReference } from "./parser/cell.reference";
import { SyntaxToken } from "./parser/syntax.token";
import { BoundBinaryExpression } from "./binder/binary.expression";
import { BoundNumericLiteral } from "./binder/numeric.literal";
import { BoundBinaryOperatorKind } from "./binder/kind/binary.operator.kind";
import { UnaryExpression } from "./parser/unary.expression";
import { BoundUnaryExpression } from "./binder/unary.expression";
import { BoundUnaryOperatorKind } from "./binder/kind/unary.operator.kind";
import { ParenthesizedExpression } from "./parser/parenthesized.expression";
import { BoundNode } from "./binder/bound.node";
import { BoundErrorExpression } from "./binder/error.expression";
import { CompilationUnit } from "./parser/compilation.unit";
import { BoundStatement } from "./binder/statement";
import { BoundCompilationUnit } from "./binder/compilation.unit";
import { CellAssignment } from "./parser/cell.assignment";
import { CompilerOptions } from "../compiler.options";
import { DiagnosticsBag } from "./diagnostics/diagnostics.bag";
import { Cell } from "../runtime/cell";
import { BoundCellAssignment } from "./binder/cell.assignment";
import { BoundCellReference } from "./binder/cell.reference";

class BoundScope {
  private references = new Array<BoundCellReference>();
  private declared = new Map<string, Cell>();

  createCell(name: string): Cell {
    if (this.declared.has(name)) {
      // console.log(name, "already exists");
      return this.declared.get(name) as Cell;
    }
    // console.log(name, "created");
    return Cell.createFrom(name);
  }

  clearStack() {
    this.references.length = 0;
  }

  storesRef() {
    return this.references.length;
  }

  nextReference() {
    return this.references.shift() as BoundCellReference;
  }

  registerReference(reference: BoundCellReference) {
    this.references.push(reference);
  }

  declareCell(cell: Cell) {
    this.declared.set(cell.name, cell);
  }

  isDeclared(cell: string) {
    return this.declared.has(cell);
  }
}

export class Binder {
  scope = new BoundScope();
  constructor(private diagnosticsBag: DiagnosticsBag, public configuration: CompilerOptions) {}

  public bind<Kind extends SyntaxNode>(node: Kind): BoundNode {
    type NodeType<T> = Kind & T;
    switch (node.kind) {
      case SyntaxNodeKind.CompilationUnit:
        return this.bindProgram(node as NodeType<CompilationUnit>);
      case SyntaxNodeKind.NumberToken:
        return this.bindNumber(node as NodeType<SyntaxToken<SyntaxNodeKind.NumberToken>>);
      case SyntaxNodeKind.CellReference:
        return this.bindCellReference(node as NodeType<CellReference>);
      case SyntaxNodeKind.ParenthesizedExpression:
        return this.bindParenthesizedExpression(node as NodeType<ParenthesizedExpression>);
      case SyntaxNodeKind.UnaryExpression:
        return this.bindUnaryExpression(node as NodeType<UnaryExpression>);
      case SyntaxNodeKind.BinaryExpression:
        return this.bindBinaryExpression(node as NodeType<BinaryExpression>);
      case SyntaxNodeKind.CellAssignment:
        return this.bindCellAssignment(node as NodeType<CellAssignment>);
    }
    this.diagnosticsBag.binderMethod(node.kind, node.span);
    return new BoundErrorExpression(node.kind);
  }

  private bindProgram(node: CompilationUnit) {
    const root = new Array<BoundStatement>();
    for (const statement of node.root) root.push(this.bind(statement));
    return new BoundCompilationUnit(root);
  }

  private bindCellAssignment(node: CellAssignment) {
    switch (node.left.kind) {
      case SyntaxNodeKind.CellReference:
        const left = this.bindCellReference(node.left as CellReference);
        this.scope.clearStack();
        const expression = this.bind(node.expression);
        left.expression = expression;
        left.clearDependencies();
        while (this.scope.storesRef()) {
          const bound = this.scope.nextReference();
          left.track(bound.reference);
          if (bound.reference.doesReference(left)) {
            this.diagnosticsBag.circularDependency(left.name, bound.reference.name, bound.span);
          }
          if (this.scope.isDeclared(bound.reference.name)) continue;
          this.diagnosticsBag.undeclaredCell(bound.reference.name, bound.span);
        }
        this.scope.declareCell(left);
        this.scope.clearStack();
        return new BoundCellAssignment(left, expression);
    }
    this.diagnosticsBag.cantUseAsAReference(node.left.kind, node.left.span);
    this.bind(node.expression)
    return new BoundErrorExpression(node.kind);
  }

  private bindBinaryExpression(node: BinaryExpression) {
    const left = this.bind(node.left);
    const operator = this.bindBinaryOperatorKind(node.operator.kind);
    const right = this.bind(node.right);
    return new BoundBinaryExpression(left, operator, right);
  }

  private bindBinaryOperatorKind(Kind: BinaryOperatorKind): BoundBinaryOperatorKind {
    switch (Kind) {
      case BinaryOperatorKind.PlusToken:
        return BoundBinaryOperatorKind.Addition;
      case BinaryOperatorKind.MinusToken:
        return BoundBinaryOperatorKind.Subtraction;
      case BinaryOperatorKind.StarToken:
        return BoundBinaryOperatorKind.Multiplication;
      case BinaryOperatorKind.SlashToken:
        return BoundBinaryOperatorKind.Division;
      case BinaryOperatorKind.HatToken:
        return BoundBinaryOperatorKind.Exponentiation;
    }
  }

  private bindUnaryExpression(node: UnaryExpression) {
    const right = this.bind(node.right);
    switch (node.operator.kind) {
      case UnaryOperatorKind.MinusToken:
      case UnaryOperatorKind.PlusToken:
        const operator = this.bindUnaryOperatorKind(node.operator.kind);
        return new BoundUnaryExpression(operator, right);
    }
  }

  private bindUnaryOperatorKind(Kind: UnaryOperatorKind): BoundUnaryOperatorKind {
    switch (Kind) {
      case UnaryOperatorKind.PlusToken:
        return BoundUnaryOperatorKind.Identity;
      case UnaryOperatorKind.MinusToken:
        return BoundUnaryOperatorKind.Negation;
    }
  }

  private bindParenthesizedExpression(Node: ParenthesizedExpression) {
    return this.bind(Node.expression);
  }

  private bindCellReference(node: CellReference) {
    const name = node.text;
    const cell = this.scope.createCell(name);
    const bound = new BoundCellReference(cell, node.span);
    this.scope.registerReference(bound);
    return cell;
  }

  private bindNumber(node: SyntaxToken<SyntaxNodeKind.NumberToken>) {
    const value = parseFloat(node.text);
    return new BoundNumericLiteral(value);
  }
}
