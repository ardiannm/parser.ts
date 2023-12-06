import { DiagnoseKind } from "./DiagnosticKind";
import { Diagnose } from "./Diagnostic";
import { SyntaxToken } from "./SyntaxToken";
import { SyntaxKind } from "./SyntaxKind";
import { BoundKind } from "./Binding/BoundKind";

export class DiagnosticBag {
  private Stack = new Array<Diagnose>();

  Any() {
    return this.Stack.length > 0;
  }

  Clear() {
    this.Stack = new Array<Diagnose>();
  }

  private ReportError(Diagnose: Diagnose) {
    this.Stack.push(Diagnose);
    return Diagnose;
  }

  BadTokenFound(Token: SyntaxToken) {
    return this.ReportError(new Diagnose(DiagnoseKind.Lexer, `Bad Character '${Token.Text}' Found.`));
  }

  TokenNotAMatch(Expected: SyntaxKind, Matched: SyntaxKind) {
    return this.ReportError(new Diagnose(DiagnoseKind.Parser, `Expected <${Expected}>; Found <${Matched}>.`));
  }

  UndeclaredVariable(Reference: string) {
    return this.ReportError(new Diagnose(DiagnoseKind.Environment, `Reference '${Reference}' Has Not Been Declared.`));
  }

  MissingEvaluationMethod(Kind: BoundKind) {
    return this.ReportError(new Diagnose(DiagnoseKind.Evaluator, `Method For Evaluating <${Kind}> Is Missing.`));
  }

  MissingOperatorKind(Kind: SyntaxKind) {
    return this.ReportError(new Diagnose(DiagnoseKind.Binder, `Unexpected Operator Kind <${Kind}>.`));
  }

  CircularDependency(Reference: string) {
    return this.ReportError(new Diagnose(DiagnoseKind.Binder, `Circular Dependency For '${Reference}' Detected.`));
  }

  MissingBindingMethod(Kind: SyntaxKind) {
    return this.ReportError(new Diagnose(DiagnoseKind.Binder, `Method For Binding <${Kind}> Is Missing.`));
  }

  CantUseAsAReference(Unexpected: SyntaxKind) {
    return this.ReportError(new Diagnose(DiagnoseKind.Binder, `<${Unexpected}> Can't Be Used As A Reference.`));
  }

  ReferenceCannotBeFound(Reference: string) {
    return this.ReportError(new Diagnose(DiagnoseKind.Binder, `Cannot Find Reference '${Reference}'.`));
  }

  CannotRedeclareReference(Reference: string) {
    return this.ReportError(new Diagnose(DiagnoseKind.Binder, `'${Reference}' Already Exists. Reference Re-Assignments Are Not Allowed.`));
  }

  EmptySyntaxForEvaluator() {
    return this.ReportError(new Diagnose(DiagnoseKind.Evaluator, `Syntax Program Cannot Be Empty.`));
  }

  ValueDoesNotExist(Reference: string) {
    return this.ReportError(new Diagnose(DiagnoseKind.Environment, `Value For '${Reference}' Does Not Exist.`));
  }

  UsedBeforeDeclaration(Reference: string) {
    return this.ReportError(new Diagnose(DiagnoseKind.Binder, `'${Reference}' Reference Used Before Its Declaration.`));
  }
}