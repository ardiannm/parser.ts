import { SyntaxKind } from "./parser/kind/syntax.kind";
import { SyntaxNodeKind } from "./parser/kind/syntax.node.kind";
import { BinaryOperatorKind } from "./parser/kind/binary.operator.kind";
import { SyntaxToken, TokenText, TokenTextMapper } from "./parser/syntax.token";
import { SyntaxFacts } from "./parser/syntax.facts";
import { CompositeTokenKind } from "./parser/kind/composite.token.kind";
import { SyntaxTriviaKind } from "./parser/kind/syntax.trivia.kind";
import { SourceText } from "./input/source.text";
import { DiagnosticBag } from "./diagnostics/diagnostic.bag";
import { TokenSpan } from "./input/token.span";

export class Lexer {
  private Kind: SyntaxKind;
  private End: number;
  private Start: number;

  constructor(public readonly Input: SourceText, private Diagnostics: DiagnosticBag) {
    this.Kind = SyntaxNodeKind.EndOfFileToken;
    this.End = 0;
    this.Start = this.End;
  }

  public Lex(): SyntaxToken<SyntaxKind> {
    this.Start = this.End;
    this.Kind = SyntaxFacts.SyntaxKind(this.Char) as keyof TokenTextMapper;
    switch (this.Kind) {
      case SyntaxNodeKind.BadToken:
        return this.LexBadToken();
      case SyntaxNodeKind.HashToken:
        return this.LexCommentToken();
      case BinaryOperatorKind.MinusToken:
        return this.LexMinusToken();
      case SyntaxNodeKind.GreaterToken:
        return this.LexGreaterGreaterToken();
      case SyntaxNodeKind.ColonToken:
        return this.LexColonColonToken();
    }
    this.Next();
    return new SyntaxToken(this.Kind, this.Text, this.SetTokenSpan());
  }

  private LexBadToken(): SyntaxToken<SyntaxKind> {
    if (this.IsLetter) {
      return this.LexIdentifier();
    }
    if (this.IsDigit) {
      return this.LexNumberToken();
    }
    if (this.IsSpace) {
      return this.LexSpaceToken();
    }
    this.Diagnostics.BadTokenFound(this.Char);
    this.Next();
    return new SyntaxToken(this.Kind, this.Text, this.SetTokenSpan());
  }

  private LexCommentToken(): SyntaxToken<SyntaxKind> {
    do {
      this.Next();
    } while (!(this.Match(SyntaxTriviaKind.LineBreakTrivia) || this.Match(SyntaxNodeKind.EndOfFileToken)));
    return new SyntaxToken(SyntaxTriviaKind.CommentTrivia, this.Text, this.SetTokenSpan());
  }

  private LexMinusToken(): SyntaxToken<SyntaxKind> {
    this.Next();
    this.Kind = BinaryOperatorKind.MinusToken;
    if (this.Match(SyntaxNodeKind.GreaterToken)) {
      this.Next();
      this.Kind = CompositeTokenKind.PointerToken;
    }
    return new SyntaxToken(this.Kind, this.Text as TokenText<typeof this.Kind>, this.SetTokenSpan());
  }

  private LexGreaterGreaterToken(): SyntaxToken<SyntaxKind> {
    this.Next();
    this.Kind = SyntaxNodeKind.GreaterToken;
    if (this.Match(SyntaxNodeKind.GreaterToken)) {
      this.Next();
      this.Kind = CompositeTokenKind.GreaterGreaterToken;
    }
    return new SyntaxToken(this.Kind, this.Text as TokenText<typeof this.Kind>, this.SetTokenSpan());
  }

  private LexColonColonToken(): SyntaxToken<SyntaxKind> {
    this.Next();
    this.Kind = SyntaxNodeKind.ColonToken;
    if (this.Match(SyntaxNodeKind.ColonToken)) {
      this.Next();
      this.Kind = CompositeTokenKind.ColonColonToken;
    }
    return new SyntaxToken(this.Kind, this.Text as TokenText<typeof this.Kind>, this.SetTokenSpan());
  }

  private LexIdentifier(): SyntaxToken<SyntaxKind> {
    while (this.IsLetter) this.Next();
    return new SyntaxToken(SyntaxFacts.KeywordOrIdentifer(this.Text), this.Text, this.SetTokenSpan());
  }

  private LexSpaceToken(): SyntaxToken<SyntaxKind> {
    while (this.IsSpace) this.Next();
    return new SyntaxToken(SyntaxTriviaKind.SpaceTrivia, this.Text, this.SetTokenSpan());
  }

  private LexNumberToken(): SyntaxToken<SyntaxKind> {
    while (this.IsDigit) this.Next();
    if (this.Match(SyntaxNodeKind.DotToken)) {
      this.Next();
      if (!this.IsDigit) {
        this.Diagnostics.BadFloatingPointNumber();
      }
    }
    while (this.IsDigit) this.Next();
    const NumberText = this.Text as TokenText<SyntaxNodeKind.NumberToken>;
    return new SyntaxToken(SyntaxNodeKind.NumberToken, NumberText, this.SetTokenSpan());
  }

  private get Text() {
    return this.Input.Text.substring(this.Start, this.End);
  }

  private SetTokenSpan(): TokenSpan {
    return this.Input.SetTokenSpan(this.Start, this.End);
  }

  private get IsSpace(): boolean {
    const Char = this.Char;
    return Char === " " || Char === "\t" || Char === "\r";
  }

  private get IsDigit(): boolean {
    const charCode = this.Char.charCodeAt(0);
    return charCode >= 48 && charCode <= 57;
  }

  private get IsLetter(): boolean {
    const CharCode = this.Char.charCodeAt(0);
    return (CharCode >= 65 && CharCode <= 90) || (CharCode >= 97 && CharCode <= 122);
  }

  private Peek(Offset: number): string {
    return this.Input.Text.charAt(this.End + Offset);
  }

  private get Char() {
    return this.Peek(0);
  }

  private Next() {
    this.End = this.End + 1;
  }

  private Match(...Kinds: Array<SyntaxKind>) {
    let Offset = 0;
    for (const Kind of Kinds) {
      if (Kind !== SyntaxFacts.SyntaxKind(this.Peek(Offset))) return false;
      Offset++;
    }
    return true;
  }
}
