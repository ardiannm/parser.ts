import { Cell } from "../../Cell";
import { DiagnosticBag } from "../../Diagnostics/DiagnosticBag";
import { BoundKind } from "./Kind/BoundKind";
import { BoundNumericLiteral } from "./BoundNumericLiteral";

export class BoundScope {
  private Cells = new Map<string, Cell>();

  constructor(public ParentScope: BoundScope | null) {}

  ConstructCell(Name: string) {
    const Scope = this.ResolveScopeForCell(Name);
    let Document: Cell;
    if (Scope) {
      Document = Scope.Cells.get(Name) as Cell;
    } else {
      const Expression = new BoundNumericLiteral(BoundKind.NumericLiteral, 0);
      Document = new Cell(BoundKind.Cell, Name, false, 0, Expression, new Map<string, Cell>(), new Map<string, Cell>(), "0");
    }
    this.Cells.set(Name, Document);
    return Document;
  }

  private ResolveScopeForCell(Name: string): BoundScope | null {
    if (this.Cells.has(Name)) {
      return this;
    }
    if (this.ParentScope) {
      return this.ParentScope.ResolveScopeForCell(Name);
    }
    return null;
  }

  GetCells() {
    return this.Cells.values();
  }

  GetCell(Name: string) {
    const Scope = this.ResolveScopeForCell(Name);
    if (Scope) return Scope.Cells.get(Name) as Cell;
    return null;
  }

  CheckDeclarations(Diagnostics: DiagnosticBag) {
    this.Cells.forEach((Cell) => {
      if (!Cell.Declared) {
        Diagnostics.UndeclaredCell(Cell.Name);
      }
      Cell.Subjects.forEach((Subject) => {
        if (!Subject.Declared) {
          Diagnostics.UndeclaredCell(Subject.Name);
        }
      });
      Cell.Contains(Cell, Diagnostics);
    });
  }

  get Count() {
    return this.Cells.size;
  }

  MoveCellsToParent() {
    if (this.ParentScope) {
      for (const Cell of this.GetCells()) {
        this.ParentScope.Cells.set(Cell.Name, Cell);
      }
    }
    this.Cells.clear();
  }
}
