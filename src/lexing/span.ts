import { SourceText } from "./source.text";

export class Span {
  constructor(protected sourceText: SourceText, public start: number, public end: number) {}

  get line() {
    return this.sourceText.getLineNumber(this.start);
  }

  get column() {
    return this.sourceText.getColumnNumber(this.start);
  }

  get text(): string {
    /**
     // TODO:
     * this method must work correctly without the conditional check as it does for all normal tokens
     * but it does fail for tokens generated by lines wich suggests that those start-end boundries are being calculated incorrectly
     */
    return this.start < this.end ? this.sourceText.text.substring(this.start, this.end) : "";
  }
}
