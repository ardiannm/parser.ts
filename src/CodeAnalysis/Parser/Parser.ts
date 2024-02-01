import { SyntaxKind } from "./Kind/SyntaxKind";
import { SyntaxNodeKind } from "./Kind/SyntaxNodeKind";
import { CompositeTokenKind } from "./Kind/CompositeTokenKind";
import { BinaryOperatorKind } from "./Kind/BinaryOperatorKind";
import { UnaryOperatorKind } from "./Kind/UnaryOperatorKind";
import { SyntaxToken, TokenText } from "./SyntaxToken";
import { BinaryExpression } from "./BinaryExpression";
import { UnaryExpression } from "./UnaryExpression";
import { ParenthesizedExpression } from "./ParenthesizedExpression";
import { RangeReference } from "./RangeReference";
import { CellReference } from "./CellReference";
import { SyntaxFacts } from "./SyntaxFacts";
import { ExpressionSyntax } from "./ExpressionSyntax";
import { Program } from "./Program";
import { StatementSyntax } from "./StatementSyntax";
import { CellAssignment } from "./CellAssignment";
import { DiagnosticBag } from "../../Diagnostics/DiagnosticBag";
import { Submission } from "../../Input/Submission";

export class Parser {
  private Index = 0;
  private Tokens: Array<SyntaxToken<SyntaxKind>>;

  constructor(public readonly Input: Submission, public Diagnostics: DiagnosticBag) {
    this.Tokens = Input.Lex(Diagnostics);
  }

  public Parse() {
    if (this.None()) {
      this.Diagnostics.EmptyProgram();
    }
    return this.ParseProgram();
  }

  public ParseProgram() {
    const Members = new Array<StatementSyntax>();
    while (this.Any()) {
      const Token = this.Token;
      const Member = this.ParseStatement();
      Members.push(Member);
      if (this.Token === Token) this.NextToken();
    }
    return new Program(SyntaxNodeKind.Program, Members, this.ExpectToken(SyntaxNodeKind.EndOfFileToken));
  }

  private ParseStatement() {
    const Left = this.ParseBinaryExpression();
    switch (this.Token.Kind) {
      case SyntaxNodeKind.EqualsToken:
        const Keyword = this.NextToken() as SyntaxToken<CompositeTokenKind.GreaterGreaterToken>;
        return new CellAssignment(SyntaxNodeKind.CellAssignment, Left, Keyword, this.ParseBinaryExpression());
    }
    return Left;
  }

  private ParseBinaryExpression(ParentPrecedence = 0): ExpressionSyntax {
    let Left = this.ParseUnaryExpression();
    while (true) {
      const BinaryPrecedence = SyntaxFacts.BinaryPrecedence(this.Token.Kind);
      if (BinaryPrecedence === 0 || BinaryPrecedence <= ParentPrecedence) {
        break;
      }
      const Operator = this.NextToken() as SyntaxToken<BinaryOperatorKind>;
      const Right = this.ParseBinaryExpression(BinaryPrecedence);
      Left = new BinaryExpression(SyntaxNodeKind.BinaryExpression, Left, Operator, Right);
    }
    return Left;
  }

  private ParseUnaryExpression(): ExpressionSyntax {
    const BinaryPrecedence = SyntaxFacts.UnaryPrecedence(this.Token.Kind);
    if (BinaryPrecedence !== 0) {
      const Operator = this.NextToken() as SyntaxToken<UnaryOperatorKind>;
      const Right = this.ParseUnaryExpression();
      return new UnaryExpression(SyntaxNodeKind.UnaryExpression, Operator, Right);
    }
    return this.ParseParenthesis();
  }

  private ParseParenthesis() {
    if (this.MatchToken(SyntaxNodeKind.OpenParenthesisToken)) {
      const Left = this.NextToken();
      const Expression = this.ParseBinaryExpression();
      const Right = this.ExpectToken(SyntaxNodeKind.CloseParenthesisToken);
      return new ParenthesizedExpression(SyntaxNodeKind.ParenthesizedExpression, Left, Expression, Right);
    }
    return this.ParseRangeReference();
  }

  private ParseRangeReference() {
    const Left = this.ParseCellReference();
    if (this.MatchToken(SyntaxNodeKind.ColonToken)) {
      this.NextToken();
      const Right = this.ParseCellReference();
      return new RangeReference(SyntaxNodeKind.RangeReference, Left, Right);
    }
    return Left;
  }

  private ParseCellReference() {
    if (this.MatchToken(SyntaxNodeKind.IdentifierToken, SyntaxNodeKind.NumberToken)) {
      const Left = this.NextToken() as SyntaxToken<SyntaxNodeKind.IdentifierToken>;
      const Right = this.NextToken() as SyntaxToken<SyntaxNodeKind.NumberToken>;
      return new CellReference(SyntaxNodeKind.CellReference, Left, Right);
    }
    return this.ParseLiteral();
  }

  private ParseLiteral() {
    const Kind = this.Token.Kind;
    switch (Kind) {
      // case TokenKind.TrueToken:
      // case TokenKind.FalseToken:
      case SyntaxNodeKind.IdentifierToken:
      case SyntaxNodeKind.NumberToken:
        return this.NextToken();
      default:
        return this.ExpectToken(SyntaxNodeKind.Expression);
    }
  }

  private PeekToken(Offset: number) {
    const Index = this.Index + Offset;
    const LastIndex = this.Tokens.length - 1;
    if (Index > LastIndex) return this.Tokens[LastIndex];
    return this.Tokens[Index];
  }

  private get Token() {
    return this.PeekToken(0);
  }

  private NextToken() {
    const Token = this.Token;
    this.Index++;
    return Token;
  }

  private MatchToken(...Kinds: Array<SyntaxKind>) {
    let Offset = 0;
    for (const Kind of Kinds) {
      if (Kind !== this.PeekToken(Offset).Kind) return false;
      Offset++;
    }
    return true;
  }

  private ExpectToken<Kind extends SyntaxKind>(Kind: Kind): SyntaxToken<Kind> {
    if (this.MatchToken(Kind)) {
      return this.NextToken() as SyntaxToken<Kind>;
    }
    this.Diagnostics.TokenMissmatch(this.Token.Kind, Kind, this.Token.TextSpan().Line().Number);
    return new SyntaxToken(this.Token.Kind as Kind, this.Token.Text as TokenText<Kind>, this.Token.TextSpan());
  }

  private Any() {
    return !this.MatchToken(SyntaxNodeKind.EndOfFileToken);
  }

  private None() {
    return !this.Any();
  }
}
