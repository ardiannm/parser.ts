import { Diagnostics } from "./CodeAnalysis/Diagnostics/Diagnostics";
import { ReferenceExpression } from "./CodeAnalysis/SyntaxNode";

export class Environment {
  constructor(private Report: Diagnostics) {}

  private References = new Map<string, ReferenceExpression>();
  private Values = new Map<string, number>();

  public SetValueForReference(Node: ReferenceExpression, Value: number) {
    const Reference = Node.Reference.Reference;
    this.References.set(Reference, Node);
    this.Values.set(Reference, Value);
    this.RegisterSelf(Node);
    return Value;
  }

  public GetValueFromCell(Reference: string) {
    if (this.Values.has(Reference)) return this.Values.get(Reference);
    this.Report.VarUndefined(Reference);
  }

  private RegisterSelf(Node: ReferenceExpression) {
    const Reference = Node.Reference.Reference;
    for (const r of Node.Referencing) {
      this.GetValueFromCell(r);
      const ReferencedBy = this.References.get(r).ReferencedBy;
      if (ReferencedBy.includes(Reference)) continue;
      ReferencedBy.push(Reference);
    }
  }
}
