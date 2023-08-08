import ExclamationMark from "./exclamation.mark.ts";
import Number from "./number.ts";
import Identifier from "./identifier.ts";
import OpenParenthesis from "./open.parenthesis.ts";
import QuestionMark from "./question.mark.ts";
import Division from "./division.ts";
import Multiplication from "./multiplication.ts";
import Space from "./space.ts";
import Token from "./token.ts";
import Quote from "./quote.ts";
import LessThan from "./less.than.ts";
import GreaterThan from "./greater.than.ts";
import UnknownCharacter from "./unknown.character.ts";
import Exponentiation from "./exponentiation.ts";
import Addition from "./addition.ts";
import Substraction from "./substraction.ts";
import EOF from "./eof.ts";
import ClosingParenthesis from "./closing.parenthesis.ts";
import Equals from "./equals.ts";

export default class Lexer {
  private space = false;
  protected position = 0;
  constructor(public input: string) {}

  public hasMoreTokens(): boolean {
    return !(this.peekToken() instanceof EOF);
  }

  private getCharacter() {
    return this.input.charAt(this.position);
  }

  public getNextCharacter() {
    const character = this.getCharacter();
    this.position = this.position + 1;
    return character;
  }

  public keepSpace() {
    this.space = true;
  }

  public ignoreSpace() {
    this.space = false;
  }

  private getIdentifier() {
    const startsAt = this.position;
    let raw = "";
    while (/[a-zA-Z]/.test(this.getCharacter())) raw += this.getNextCharacter();
    return new Identifier(raw, startsAt, this.position);
  }

  private getNumber() {
    const startsAt = this.position;
    let raw = "";
    while (/[0-9]/.test(this.getCharacter())) raw += this.getNextCharacter();
    return new Number(raw, startsAt, this.position);
  }

  private getSpace() {
    const startsAt = this.position;
    let raw = "";
    while (/\s/.test(this.getCharacter())) raw += this.getNextCharacter();
    if (this.space) return new Space(raw, startsAt, this.position);
    return this.getNextToken();
  }

  public peekToken() {
    const startsAt = this.position;
    const token = this.getNextToken();
    this.position = startsAt;
    return token;
  }

  public backtrack(token: Token) {
    this.position = token.from;
  }

  public getNextToken(): Token {
    const char = this.getCharacter();

    if (/[0-9]/.test(char)) return this.getNumber();
    if (/\s/.test(char)) return this.getSpace();
    if (/[a-zA-Z]/.test(char)) return this.getIdentifier();

    const from = this.position;
    const next = this.getNextCharacter();
    const to = this.position;

    if (char == "(") return new OpenParenthesis(next, from, to);
    if (char == ")") return new ClosingParenthesis(next, from, to);
    if (char == "!") return new ExclamationMark(next, from, to);
    if (char == "?") return new QuestionMark(next, from, to);
    if (char == '"') return new Quote(next, from, to);
    if (char == "<") return new LessThan(next, from, to);
    if (char == ">") return new GreaterThan(next, from, to);
    if (char == "=") return new Equals(next, from, to);

    if (char == "+") return new Addition(next, from, to);
    if (char == "-") return new Substraction(next, from, to);
    if (char == "*") return new Multiplication(next, from, to);
    if (char == "/") return new Division(next, from, to);
    if (char == "^") return new Exponentiation(next, from, to);

    if (next) return new UnknownCharacter(next, from, to);

    return new EOF(from, from);
  }
}
