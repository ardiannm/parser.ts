import { BoundExpression } from "./BoundExpression";
import { BoundKind } from "./BoundKind";
import { BoundNumber } from "./BoundNumber";
import { BoundDeclarationStatement } from "./BoundDeclarationStatement";
import { RgbColor } from "../Interpreter/RgbColor";
import { DiagnosticBag } from "../../DiagnosticBag";

export class Cell {
  constructor(
    public Name: string,
    public Value: number,
    public Expression: BoundExpression,
    public Dependencies: Set<string>,
    public Dependents: Set<string>
  ) {}

  Notify(Name: string): void {
    this.Dependents.add(Name);
  }

  DoNotNotify(Name: string): void {
    this.Dependents.delete(Name);
  }
}

export class BoundScope {
  private Expression = new BoundNumber(BoundKind.Number, 0);

  private Data = new Map<string, Cell>();
  private ForChange = new Set<string>();

  Names = new Set<string>();
  Diagnostics = new DiagnosticBag();

  constructor(public Parent?: BoundScope) {}

  PushCell(Name: string) {
    this.Names.add(Name);
  }

  private ResolveScopeForCell(Name: string): BoundScope | undefined {
    if (this.Data.has(Name)) {
      return this;
    }
    if (this.Parent) {
      return this.ResolveScopeForCell(Name);
    }
    return undefined;
  }

  TryDeclareCell(Node: BoundDeclarationStatement): boolean {
    this.DetectCircularDependencies(Node.Name, Node.Dependencies);
    const Scope = this.ResolveScopeForCell(Node.Name) as BoundScope;
    if (Scope === undefined) {
      const Data = new Cell(Node.Name, this.Expression.Value, this.Expression, Node.Dependencies, new Set<string>());
      this.Data.set(Node.Name, Data);
      return true;
    }
    const Data = Scope.Data.get(Node.Name) as Cell;
    for (const Dep of Data.Dependencies) if (!Node.Dependencies.has(Dep)) this.TryLookUpCell(Dep).DoNotNotify(Node.Name);
    Data.Dependencies = Node.Dependencies;
    return false;
  }

  TryLookUpCell(Name: string): Cell {
    const Scope = this.ResolveScopeForCell(Name);
    if (Scope === undefined) {
      throw this.Diagnostics.ReportNameNotFound(Name);
    }
    return Scope.Data.get(Name) as Cell;
  }

  private DetectCircularDependencies(Name: string, Dependencies: Set<string>) {
    if (Dependencies.has(Name)) {
      throw this.Diagnostics.ReportUsedBeforeItsDeclaration(Name);
    }
    for (const Dep of Dependencies) {
      const Deps = this.TryLookUpCell(Dep).Dependencies;
      if (Deps.has(Name)) {
        throw this.Diagnostics.ReportCircularDependency(Dep);
      }
      this.DetectCircularDependencies(Name, Deps);
    }
  }

  Assign(Node: BoundDeclarationStatement, Value: number) {
    const Data = this.TryLookUpCell(Node.Name);
    for (const Dep of Data.Dependencies) if (!Node.Dependencies.has(Dep)) this.TryLookUpCell(Dep).DoNotNotify(Data.Name);
    Data.Dependencies = Node.Dependencies;
    for (const Dep of Data.Dependencies) this.TryLookUpCell(Dep).Notify(Data.Name);
    Data.Expression = Node.Expression;
    Data.Value = Value;
    return this.DetectAndNotifyForChange(Data);
  }

  private *DetectAndNotifyForChange(Node: Cell): Generator<Cell> {
    for (const Dep of Node.Dependents) {
      if (this.ForChange.has(Dep)) continue;
      this.ForChange.add(Dep);
      const NextNode = this.TryLookUpCell(Dep);
      yield NextNode;
      this.DetectAndNotifyForChange(NextNode);
    }
    this.ForChange.clear();
  }

  SetValueForCell(Name: string, Value: number) {
    const Data = this.TryLookUpCell(Name);

    const Diff = Value - Data.Value;
    var Text = Name + " -> " + Value;

    if (Diff !== 0) {
      Text += " (";
      if (Diff > 0) Text += "+";
      else if (Diff < 0) Text += "-";
      Text += Math.abs(Diff) + ")";
    }

    const View = RgbColor.Moss(Text);
    console.log(View);

    Data.Value = Value;
  }

  FactoryReset() {
    this.Data.clear();
  }
}
