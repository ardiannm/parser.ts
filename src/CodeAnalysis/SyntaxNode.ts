import { SyntaxKind } from "./SyntaxKind";

class ChildNode {
  constructor(public Node: SyntaxNode, public isLast: boolean) {}
}

export class SyntaxNode {
  constructor(public Kind: SyntaxKind) {}

  public *GetChildren() {
    const Children = Object.keys(this)
      .map((key) => this[key])
      .filter((value) => value instanceof SyntaxNode);

    for (let i = 0; i < Children.length; i++) {
      const isLastChild = i === Children.length - 1;
      yield new ChildNode(Children[i], isLastChild);
    }
  }
}

export class SyntaxTree extends SyntaxNode {
  constructor(public Kind: SyntaxKind, public Tree: SyntaxNode) {
    super(Kind);
  }
  public Print(Node: SyntaxNode = this, Indentation = "") {
    var Text = "";
    for (const Child of Node.GetChildren()) {
      Text += Indentation + (Child.isLast ? "└── " : "├── ") + Child.Node.Kind + "\n" + this.Print(Child.Node, Indentation + (Child.isLast ? "    " : "│   "));
    }
    return Text;
  }
}

export class Expression extends SyntaxNode {}

export class CellReference extends SyntaxNode {
  constructor(public Kind: SyntaxKind, public Left: SyntaxNode, public Right: SyntaxNode) {
    super(Kind);
  }
}

export class RangeReference extends SyntaxNode {
  constructor(public Kind: SyntaxKind, public Left: SyntaxNode, public Right: SyntaxNode) {
    super(Kind);
  }
}

export class ParenthesizedExpression extends Expression {
  constructor(public Kind: SyntaxKind, public Left: SyntaxNode, public Expression: SyntaxNode, public Right: SyntaxNode) {
    super(Kind);
  }
}

export class UnaryExpression extends Expression {
  constructor(public Kind: SyntaxKind, public Operator: SyntaxNode, public Right: SyntaxNode) {
    super(Kind);
  }
}

export class BinaryExpression extends Expression {
  constructor(public Kind: SyntaxKind, public Left: SyntaxNode, public Operator: SyntaxNode, public Right: SyntaxNode) {
    super(Kind);
  }
}

export class ReferenceExpression extends Expression {
  constructor(public Kind: SyntaxKind, public Reference: SyntaxNode, public Referencing: Array<string>, public Expression: SyntaxNode) {
    super(Kind);
  }
}
