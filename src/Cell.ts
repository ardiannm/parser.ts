import { BoundExpression } from "./CodeAnalysis/Binding/BoundExpression";
import { BoundKind } from "./CodeAnalysis/Binding/Kind/BoundKind";
import { BoundNode } from "./CodeAnalysis/Binding/BoundNode";
import { DiagnosticBag } from "./Diagnostics/DiagnosticBag";

export class Cell extends BoundNode {
  constructor(
    public override Kind: BoundKind.Cell,
    public Name: string,
    public Declared: boolean,
    public Value: number,
    public Expression: BoundExpression,
    public Subjects: Map<string, Cell>,
    public Observers: Map<string, Cell>,
    public Formula: string
  ) {
    super(Kind);
  }

  Watch(Subject: Cell) {
    this.Subjects.set(Subject.Name, Subject);
    Subject.Notify(this);
  }

  Notify(Observer: Cell) {
    this.Observers.set(Observer.Name, Observer);
  }

  private ClearObserver(Observer: Cell) {
    this.Observers.delete(Observer.Name);
  }

  HasSubject(Subject: Cell, Diagnostics: DiagnosticBag, CheckingCells: Set<Cell> = new Set()): null | Cell {
    if (CheckingCells.has(this)) {
      Diagnostics.InvalidCellState(this);
      return this;
    }
    if (this.Subjects.has(Subject.Name)) {
      Diagnostics.CircularDependency(Subject.Name, this.Name);
      return this;
    }
    CheckingCells.add(this);
    for (const Sub of this.Subjects.values()) {
      const Result = Sub.HasSubject(Subject, Diagnostics, CheckingCells);
      if (Result !== null) {
        CheckingCells.delete(this);
        return Result;
      }
    }
    CheckingCells.delete(this);
    return null;
  }

  ClearSubjects() {
    this.Subjects.forEach((Subject) => Subject.ClearObserver(this));
    this.Subjects.clear();
  }
}
