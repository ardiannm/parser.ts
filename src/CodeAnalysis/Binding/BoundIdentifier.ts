import { BoundExpression } from "./BoundExpression";
import { BoundKind } from "./BoundKind";

export class BoundIdentifier extends BoundExpression {
  constructor(public Kind: BoundKind, public Name: string) {
    super(Kind);
  }
}
