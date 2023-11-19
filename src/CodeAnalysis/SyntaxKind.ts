export enum SyntaxKind {
  // Tokens
  EndOfFileToken = "EndOfFileToken",
  BadToken = "BadToken",
  SpaceToken = "SpaceToken",
  IdentifierToken = "IdentifierToken",
  NumberToken = "NumberToken",
  PlusToken = "PlusToken",
  MinusToken = "MinusToken",
  SlashToken = "SlashToken",
  StarToken = "StarToken",
  ColonToken = "ColonToken",
  OpenParenToken = "OpenParenToken",
  CloseParenToken = "CloseParenToken",
  GreaterToken = "GreaterToken",
  // Keywords
  FalseToken = "FalseToken",
  TrueToken = "TrueToken",
  // Compound Tokens
  PointerToken = "PointerToken",
  // Expressions
  CellReference = "CellReference",
  RangeReference = "RangeReference",
  ParenthesizedExpression = "ParenthesizedExpression",
  UnaryExpression = "UnaryExpression",
  BinaryExpression = "BinaryExpression",
  ReferenceDeclaration = "ReferenceDeclaration",
}
