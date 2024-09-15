import styles from "../styles/tree.module.scss";

import { JSX, For, Show } from "solid-js";
import { BoundNode } from "../../../src/analysis/binder/bound.node";
import { BoundCompilationUnit } from "../../../src/analysis/binder/bound.compilation.unit";
import { BoundKind } from "../../../src/analysis/binder/kind/bound.kind";
import { BoundBinaryExpression } from "../../../src/analysis/binder/binary.expression";
import { BoundNumericLiteral } from "../../../src/analysis/binder/bound.numeric.literal";
import { BoundUnaryExpression } from "../../../src/analysis/binder/bound.unary.expression";
import { BoundCell, BoundCellAssignment, BoundCellReference } from "../../../src/analysis/binder";
import { BoundErrorExpression } from "../../../src/analysis/binder/bound.error.expression";

export class Tree {
  render<Kind extends BoundNode>(node: Kind): JSX.Element {
    type NodeType<T> = Kind & T;
    switch (node.kind) {
      case BoundKind.BoundCompilationUnit:
        return this.renderBoundCompilationUnit(node as NodeType<BoundCompilationUnit>);
      case BoundKind.BoundCellReference:
        return this.renderBoundCellReference(node as NodeType<BoundCellReference>);
      case BoundKind.BoundBinaryExpression:
        return this.renderBoundBinaryExpression(node as NodeType<BoundBinaryExpression>);
      case BoundKind.BoundUnaryExpression:
        return this.renderBoundUnaryExpression(node as NodeType<BoundUnaryExpression>);
      case BoundKind.BoundNumericLiteral:
        return this.renderBoundNumericLiteral(node as NodeType<BoundNumericLiteral>);
      case BoundKind.BoundCellAssignment:
        return this.renderBoundCellAssignment(node as NodeType<BoundCellAssignment>);
      case BoundKind.BoundCell:
        return this.renderBoundCell(node as NodeType<BoundCell>);
    }
    if (node instanceof BoundErrorExpression) return <div class={styles.BoundErrorExpression}>{(node as NodeType<BoundErrorExpression>).nodeKind}</div>;
    return <div class={styles.BoundErrorExpression}>{(node as NodeType<BoundErrorExpression>).kind}</div>;
  }

  private renderBoundCell(node: BoundCell): JSX.Element {
    return (
      <>
        <div class={styles.BoundCell}>{node.name}</div>
        {/* <Show when={node.dependencies.length}>
          <div class={styles.Dependencies}>
            <For each={node.dependencies}>{(dependency) => this.render(dependency)}</For>
          </div>
        </Show> */}
        {/* <Show when={node.observers.size}>
          <div class={styles.Observers}>
            <For each={[...node.observers.values()]}>{(dependency) => <div class={styles.BoundCellReference}>{dependency.name}</div>}</For>
          </div>
        </Show> */}
        {/* <Show when={node.main.size}>
          <div class={styles.Observers}>
            <For each={[...node.main.values()]}>{(dependency) => <div class={styles.BoundNumericLiteral}>{dependency.name}</div>}</For>
          </div>
        </Show> */}
      </>
    );
  }

  private renderBoundCellAssignment(node: BoundCellAssignment): JSX.Element {
    return (
      <div class={styles.BoundCellAssignment}>
        <span class={styles.BoundCellAssignmentTree}>
          {/* <Show when={node.assignee.observers.size}>
            <div class={styles.Observers}>
              <For each={[...node.assignee.observers.values()]}>{(dependency) => this.render(dependency)}</For>
            </div>
          </Show> */}
          {this.render(node.assignee)}
          {this.render(node.expression)}
        </span>
        <span class={styles.BoundCellAssignmentInfo}>
          {/* <span>dependencies: {node.assignee.dependencies.length}</span> */}
          <span>
            location: {node.assignee.span.line}:{node.assignee.span.offset}
          </span>
        </span>
      </div>
    );
  }

  private renderBoundCellReference(node: BoundCellReference): JSX.Element {
    return <div class={styles.BoundCellReference}>{node.assignment.assignee.name}</div>;
  }

  private renderBoundUnaryExpression(node: BoundUnaryExpression): JSX.Element {
    return (
      <div class={styles.BoundUnaryExpression}>
        {/* {node.operatorKind === BoundUnaryOperatorKind.Identity ? "+" : "-"} */}
        {this.render(node.right)}
      </div>
    );
  }

  private renderBoundNumericLiteral(node: BoundNumericLiteral): JSX.Element {
    return <div class={styles.BoundNumericLiteral}>{node.value}</div>;
  }

  private renderBoundBinaryExpression(node: BoundBinaryExpression): JSX.Element {
    return (
      <div class={styles.BoundBinaryExpression}>
        {this.render(node.left)}
        {/* {node.operatorKind === BoundBinaryOperatorKind.Addition ? "+" : "-"} */}
        {this.render(node.right)}
      </div>
    );
  }

  renderBoundCompilationUnit(node: BoundCompilationUnit): JSX.Element {
    return (
      <div class={styles.BoundCompilationUnit}>
        <For each={node.root}>
          {(statement) => (
            <div class={styles.Statement}>
              {/* Render child node here */}
              {/* {statement.kind} */}
              {this.render(statement)}
            </div>
          )}
        </For>
      </div>
    );
  }
}
