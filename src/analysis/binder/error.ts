import { BoundKind } from "./kind/bound.kind";
import { BoundNode } from "./bound.node";
import { SyntaxKind } from "../parser/kind/syntax.kind";

export class BoundError extends BoundNode {
  constructor(public override kind: BoundKind.Error, public nodeKind: SyntaxKind) {
    super(kind);
  }
}
