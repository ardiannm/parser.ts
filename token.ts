import { format } from "./format.ts";
import { Primitive } from "./primitive.ts";

export class Token {
  public token = format(this.constructor.name);

  prettyPrint(indentation = "") {
    if (this instanceof Primitive) return `(${this.constructor.name} ${this.value})`;

    const properties = Object.entries(this)
      .filter(([_k, v]) => v instanceof Token)
      .map(([k, v]) => `${indentation}    ${k} -> ${v.prettyPrint(indentation + "    ")}`)
      .join("\n");

    return `(${this.constructor.name} ->\n${properties}\n${indentation})`;
  }
}
