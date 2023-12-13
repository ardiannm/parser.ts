import { BoundExpression } from "./BoundExpression";
import { BoundKind } from "./BoundKind";
import { BoundStatement } from "./BoundStatement";

export class BoundIsStatement extends BoundStatement {
  constructor(public Kind: BoundKind, public Name: string, public Expression: BoundExpression, public Dependencies: Set<string>) {
    super(Kind);
  }
}
