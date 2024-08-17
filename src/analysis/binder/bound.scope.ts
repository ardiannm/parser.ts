import { BoundCell } from "./bound.cell";

export class BoundScope {
  values = new Map<string, number>();
  declarations = new Map<string, BoundCell>();

  constructor(public parent: BoundScope | null) {}
}
