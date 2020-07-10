#!/usr/bin/env node
"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const minimist_1 = __importDefault(require("minimist"));
const index_1 = require("./index");
let { workspace, srcDir, onlyTemplate } = minimist_1.default(process.argv.slice(2));
if (!workspace) {
    //throw new Error("--workspace is required");
    workspace = "";
}
if (!srcDir) {
    srcDir = "src";
}
const cwd = process.cwd();
index_1.check({
    workspace: path.resolve(cwd, workspace),
    srcDir: srcDir && path.resolve(cwd, srcDir),
    onlyTemplate
});
