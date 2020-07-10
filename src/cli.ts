#!/usr/bin/env node
import * as path from "path";
import minimist from "minimist";
import { check } from "./index";

let { workspace, srcDir, onlyTemplate } = minimist(process.argv.slice(2));

if (!workspace) {
  //throw new Error("--workspace is required");
  workspace = "";
}

if (!srcDir){
  srcDir = "src";
}

const cwd = process.cwd();

check({
  workspace: path.resolve(cwd, workspace),
  srcDir: srcDir && path.resolve(cwd, srcDir),
  onlyTemplate
});
