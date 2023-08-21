"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const expression_1 = __importDefault(require("./expression"));
class Parenthesis extends expression_1.default {
    id;
    expression;
    constructor(id, expression) {
        super(id);
        this.id = id;
        this.expression = expression;
    }
}
exports.default = Parenthesis;