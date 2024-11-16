import { SyntaxKind } from "../analysis/parsing/syntax.kind";
import { SourceText } from "./source.text";
import { Span } from "./span";
import { Token } from "./token";

export class LineSpan extends Span {
  private constructor(protected override sourceText: SourceText, public override start: number, public override end: number, public lineBreakLength: number) {
    super(sourceText, start, end);
  }

  static createFrom(sourceText: SourceText, start: number, end: number, lineBreakLength: number) {
    return new LineSpan(sourceText, start, end, lineBreakLength);
  }

  override get text(): string {
    return this.sourceText.text.substring(this.start, this.end - this.lineBreakLength);
  }

  get length() {
    return this.end - this.start - this.lineBreakLength;
  }

  *getTokens() {
    let index = this.sourceText.getTokenIndex(this.start);
    const tokens = this.sourceText.getTokens();
    let token: Token;
    do {
      token = tokens[index];
      if (token.kind === SyntaxKind.LineBreakTrivia || token.kind === SyntaxKind.EndOfFileToken) break;
      if (token.span.start >= this.start && token.span.end <= this.end) {
        yield token;
      } else {
        const start = Math.max(this.start, token.span.start);
        const end = Math.min(this.end - this.lineBreakLength, token.span.end);
        const span = new Span(this.sourceText, start, end);
        yield new Token(token.kind, span);
      }
      index++;
    } while (index < tokens.length);
  }
}
