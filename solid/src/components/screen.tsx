import styles from "../styles/screen.module.scss";

import { SyntaxTree } from "../../../src/runtime/syntax.tree";
import { Diagnostic } from "../../../src/analysis/diagnostics/diagnostic";
import { createEffect, createSignal, For, Show, type Component } from "solid-js";
import { CompilerOptions } from "../../../src/compiler.options";
import { BoundNode } from "../../../src/analysis/binder/bound.node";
import { BoundExpression } from "../../../src/analysis/binder/bound.expression";
import { MapTree } from "./tree";

type Input = InputEvent & {
  currentTarget: HTMLTextAreaElement;
  target: HTMLTextAreaElement;
};

var code = `A1 :: 1
B1 :: A1
C1 :: A1+B1+C1+C1+C1
D1 :: C1+B1+E1`;

const Input: Component = () => {
  const [text, setText] = createSignal(code);
  const [diagnostics, setDiagnostics] = createSignal<Array<Diagnostic>>(new Array());
  const [value, setValue] = createSignal(0);
  const [doEval, setDoEval] = createSignal(false);
  const [explicit] = createSignal(true);
  const [tree, setTree] = createSignal<BoundNode | null>(null);

  createEffect(() => {
    const tree = SyntaxTree.createFrom(text(), new CompilerOptions(explicit()));
    const value = tree.evaluate();
    const d = tree.diagnostics.getDiagnostics(5);
    setDiagnostics(d);
    setValue(value as number);
    setDoEval(tree.diagnostics.canEvaluate());
    setTree(tree.bound);
  });

  const handleTextAreaInput = (e: Input) => setText(e.target.value);

  const mapper = new MapTree();

  return (
    <>
      <div class={styles.input}>
        <div class={styles.curve}></div>
        <div class={styles.buttonTop}></div>
        <div class={styles.buttonBottom}></div>
        <textarea class={styles.textArea} spellcheck={false} oninput={handleTextAreaInput} value={text()} autofocus={true}></textarea>
        <Show when={diagnostics().length || doEval()}>
          <div class={styles.diagnostics}>
            <Show when={doEval()}>{<div class={styles.value}>{value()}</div>} </Show>
            <div class={styles.diagnosticsContainer}>
              <For each={diagnostics()}>
                {(d) => (
                  <div class={styles.diagnostic}>
                    <span class={styles.diagnosticsLocation}>
                      {d.span.line}:{d.span.offset}
                    </span>
                    <span class={styles.diagnosticMessage}> {d.message}</span>
                  </div>
                )}
              </For>
            </div>
          </div>
        </Show>
      </div>
      <Show when={tree()}>{mapper.render(tree() as BoundExpression)}</Show>
    </>
  );
};

export default Input;
