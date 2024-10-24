import { SyntaxNodeKind } from "./kind/syntax.node.kind";
import { SyntaxNode } from "./syntax.node";
import { SyntaxToken } from "./syntax.token";
import { SyntaxTree } from "../../runtime/syntax.tree";
import { SyntaxStatement } from "./sytax.statements";
import { SyntaxKind } from "./kind/syntax.kind";

export class SyntaxCompilationUnit extends SyntaxNode {
  constructor(public override tree: SyntaxTree, public root: Array<SyntaxStatement>, public eof: SyntaxToken<SyntaxNodeKind.EndOfFileToken>) {
    super(tree, SyntaxNodeKind.SyntaxCompilationUnit);
  }

  override getFirstChild(): SyntaxToken<SyntaxKind> {
    return this.root.length > 0 ? this.root[0].getFirstChild() : this.getLastChild();
  }

  override getLastChild(): SyntaxToken<SyntaxKind> {
    return this.eof;
  }
}
