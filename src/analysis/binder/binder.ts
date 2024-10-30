import { Cell } from "../../cell";
import { SyntaxBinaryOperatorKind } from "../parsing/kind/syntax.binary.operator.kind";
import { SyntaxNodeKind } from "../parsing/kind/syntax.node.kind";
import { SyntaxUnaryOperatorKind } from "../parsing/kind/syntax.unary.operator.kind";
import { SyntaxBinaryExpression } from "../parsing/syntax.binary.expression";
import { SyntaxBlock } from "../parsing/syntax.block";
import { SyntaxCellAssignment } from "../parsing/syntax.cell.assignment";
import { SyntaxCellReference } from "../parsing/syntax.cell.reference";
import { SyntaxCompilationUnit } from "../parsing/syntax.compilation.unit";
import { SyntaxNode } from "../parsing/syntax.node";
import { SyntaxParenthesis } from "../parsing/syntax.parenthesis";
import { SyntaxToken } from "../parsing/syntax.token";
import { SyntaxUnaryExpression } from "../parsing/syntax.unary.expression";
import { BoundBinaryExpression } from "./binary.expression";
import { BoundBlock } from "./bound.block";
import { BoundCellAssignment } from "./bound.cell.assignment";
import { BoundCellReference } from "./bound.cell.reference";
import { BoundCompilationUnit } from "./bound.compilation.unit";
import { BoundErrorExpression } from "./bound.error.expression";
import { BoundNode } from "./bound.node";
import { BoundNumericLiteral } from "./bound.numeric.literal";
import { BoundScope } from "./bound.scope";
import { BoundStatement } from "./bound.statement";
import { BoundUnaryExpression } from "./bound.unary.expression";
import { BoundBinaryOperatorKind } from "./kind/bound.binary.operator.kind";
import { BoundUnaryOperatorKind } from "./kind/bound.unary.operator.kind";

export class Binder {
  private constructor(private scope = new BoundScope()) {}

  private bind<Kind extends SyntaxNode>(node: Kind): BoundNode {
    type NodeType<T> = Kind & T;
    switch (node.kind) {
      case SyntaxNodeKind.SyntaxCompilationUnit:
        return this.bindCompilationUnit(node as NodeType<SyntaxCompilationUnit>);
      case SyntaxNodeKind.NumberToken:
        return this.bindNumber(node as NodeType<SyntaxToken<SyntaxNodeKind.NumberToken>>);
      case SyntaxNodeKind.SyntaxParenthesis:
        return this.bindParenthesizedExpression(node as NodeType<SyntaxParenthesis>);
      case SyntaxNodeKind.SyntaxUnaryExpression:
        return this.bindUnaryExpression(node as NodeType<SyntaxUnaryExpression>);
      case SyntaxNodeKind.BinaryExpression:
        return this.bindSyntaxBinaryExpression(node as NodeType<SyntaxBinaryExpression>);
      case SyntaxNodeKind.SyntaxBlock:
        return this.bindBlock(node as NodeType<SyntaxBlock>);
      case SyntaxNodeKind.SyntaxCellReference:
        return this.bindCellReference(node as NodeType<SyntaxCellReference>);
      case SyntaxNodeKind.SyntaxCellAssignment:
        return this.bindCellAssignment(node as NodeType<SyntaxCellAssignment>);
    }
    node.tree.diagnostics.binderMethod(node.kind, node.span);
    return new BoundErrorExpression(node.kind, node.span);
  }

  static bindCompilationUnit(node: SyntaxCompilationUnit) {
    return new Binder().bindCompilationUnit(node);
  }

  private bindCompilationUnit(node: SyntaxCompilationUnit) {
    const statements = new Array<BoundStatement>();
    for (const statement of node.root) {
      statements.push(this.bind(statement));
    }
    return new BoundCompilationUnit(this.scope, statements, node.span);
  }

  private bindBlock(node: SyntaxBlock): BoundNode {
    this.scope = new BoundScope(this.scope);
    const statements = new Array<BoundStatement>();
    for (const statement of node.statements) {
      statements.push(this.bind(statement));
    }
    this.scope = this.scope.parent!;
    return new BoundBlock(statements, node.span);
  }

  private bindCellAssignment(node: SyntaxCellAssignment) {
    this.scope.references.length = 0;
    const expression = this.bind(node.expression);
    const reference = this.bindCell(node.left as SyntaxCellReference);
    const bound = new BoundCellAssignment(this.scope, reference, expression, this.scope.references, node.span);
    this.scope.references = new Array<BoundCellReference>();
    return bound;
  }

  private bindCell(node: SyntaxCellReference): Cell {
    const name = node.text;
    if (this.scope.assignments.has(name)) {
      return this.scope.assignments.get(name)!.reference;
    }
    return new Cell(name, 0);
  }

  private bindCellReference(node: SyntaxCellReference) {
    const name = node.text;
    let assigment: BoundCellAssignment;
    if (this.scope.assignments.has(name)) {
      assigment = this.scope.assignments.get(name)!;
    } else {
      const number = new BoundNumericLiteral(0, node.span);
      const dependencies = new Array<BoundCellReference>();
      const value = this.bindCell(node);
      assigment = new BoundCellAssignment(this.scope, value, number, dependencies, node.span);
      if (node.tree.configuration.explicitDeclarations) node.tree.diagnostics.undeclaredCell(name, node.span);
    }
    const bound = new BoundCellReference(assigment, node.span);
    this.scope.references.push(bound);
    return bound;
  }

  private bindSyntaxBinaryExpression(node: SyntaxBinaryExpression) {
    const left = this.bind(node.left);
    const operator = this.bindBinaryOperatorKind(node.operator.kind);
    const right = this.bind(node.right);
    return new BoundBinaryExpression(left, operator, right, node.span);
  }

  private bindBinaryOperatorKind(kind: SyntaxBinaryOperatorKind): BoundBinaryOperatorKind {
    switch (kind) {
      case SyntaxBinaryOperatorKind.PlusToken:
        return BoundBinaryOperatorKind.Addition;
      case SyntaxBinaryOperatorKind.MinusToken:
        return BoundBinaryOperatorKind.Subtraction;
      case SyntaxBinaryOperatorKind.StarToken:
        return BoundBinaryOperatorKind.Multiplication;
      case SyntaxBinaryOperatorKind.SlashToken:
        return BoundBinaryOperatorKind.Division;
      case SyntaxBinaryOperatorKind.HatToken:
        return BoundBinaryOperatorKind.Exponentiation;
    }
  }

  private bindUnaryExpression(node: SyntaxUnaryExpression) {
    const right = this.bind(node.right);
    switch (node.operator.kind) {
      case SyntaxUnaryOperatorKind.MinusToken:
      case SyntaxUnaryOperatorKind.PlusToken:
        const operator = this.bindUnaryOperatorKind(node.operator.kind);
        return new BoundUnaryExpression(operator, right, node.span);
    }
  }

  private bindUnaryOperatorKind(kind: SyntaxUnaryOperatorKind): BoundUnaryOperatorKind {
    switch (kind) {
      case SyntaxUnaryOperatorKind.PlusToken:
        return BoundUnaryOperatorKind.Identity;
      case SyntaxUnaryOperatorKind.MinusToken:
        return BoundUnaryOperatorKind.Negation;
    }
  }

  private bindParenthesizedExpression(node: SyntaxParenthesis) {
    return this.bind(node.expression);
  }

  private bindNumber(node: SyntaxToken<SyntaxNodeKind.NumberToken>) {
    const value = parseFloat(node.text);
    return new BoundNumericLiteral(value, node.span);
  }
}