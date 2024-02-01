import { BoundKind } from "./Kind/BoundKind";
import { BoundExpression } from "./BoundExpression";
import { BoundUnaryOperatorKind } from "./Kind/BoundUnaryOperatorKind";

export class BoundUnaryExpression extends BoundExpression {
  constructor(
    public override Kind: BoundKind.UnaryExpression,
    public OperatorKind: BoundUnaryOperatorKind,
    public Right: BoundExpression
  ) {
    super(Kind);
  }
}