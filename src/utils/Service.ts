import Token from "../tokens/basic/Token";
import Constructor from "./Constructor";
import Lexer from "../Lexer";

export default class Service extends Lexer {
  private assert<T extends Token>(instance: Token, tokenType: Constructor<T>): boolean {
    return instance instanceof tokenType;
  }

  protected expect<T extends Token>(token: Token, tokenType: Constructor<T>, message: string): T {
    if (this.assert(token, tokenType)) return token as T;
    this.printf(message);
    throw token;
  }

  protected doNotExpect<T extends Token>(token: Token, tokenType: Constructor<T>, message: string): T {
    if (this.assert(token, tokenType)) {
      this.printf(message);
      throw token;
    }
    return token as T;
  }

  protected printf(message: string) {
    //
    const lineNumber = this.line;
    const lineContent = this.input.split("\n")[lineNumber - 1];
    const lineNumberWidth = this.line.toString().replace(/.+/g, " ");

    console.log();
    console.log(`error: ${message}`);
    console.log(` -- ./dev/tests/tests.txt:${lineNumber}:1`);
    console.log();
    console.log(`${lineNumberWidth}  |  `);
    console.log(`${lineNumber}  |  ${lineContent}`);
    console.log(`${lineNumberWidth}  |  `);
    console.log();
  }

  protected throw(message: string) {
    this.printf(message);
    throw "";
  }
}
