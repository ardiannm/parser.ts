"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = exports.Document = void 0;
const mongodb_1 = require("mongodb");
class Document {
    _id = new mongodb_1.ObjectId();
    time = new Date();
}
exports.Document = Document;
class User extends Document {
    username;
    password;
    constructor(username, password) {
        super();
        this.username = username;
        this.password = password;
    }
}
exports.User = User;
