import { BoundExpression } from "./BoundExpression";
import { BoundKind } from "./BoundKind";

export class BoundRangeReference extends BoundExpression {
  constructor(public Kind: BoundKind.RangeReference, public Reference: string) {
    super(Kind);
  }
}
