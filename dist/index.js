"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const vscode_languageserver_1 = require("vscode-languageserver");
const interpolationMode_1 = require("vue-language-server/dist/modes/template/interpolationMode");
const javascript_1 = require("vue-language-server/dist/modes/script/javascript");
const serviceHost_1 = require("vue-language-server/dist/services/typescriptService/serviceHost");
const languageModelCache_1 = require("vue-language-server/dist/embeddedSupport/languageModelCache");
const embeddedSupport_1 = require("vue-language-server/dist/embeddedSupport/embeddedSupport");
const typescript_1 = __importDefault(require("typescript"));
const progress_1 = __importDefault(require("progress"));
const print_1 = require("./print");
function check(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const { workspace, onlyTemplate = false } = options;
        const srcDir = options.srcDir || options.workspace;
        const docs = traverse(srcDir);
        yield getDiagnostics({ docs, workspace, onlyTemplate });
    });
}
exports.check = check;
function traverse(root) {
    const docs = [];
    function walk(dir) {
        fs.readdirSync(dir).forEach(p => {
            const joinedP = path.join(dir, p);
            const stats = fs.statSync(joinedP);
            if (stats.isDirectory()) {
                walk(joinedP);
            }
            else if (path.extname(p) === ".vue") {
                var newPath = `file://${joinedP}`.replace(/\\/g, "/");
                if (process.platform == "win32") {
                    if (joinedP.length > 1 && joinedP[1] == ':') {
                        newPath = `file:///${joinedP}`.replace(/\\/g, "/");
                    }
                    else {
                        newPath = `file:///${process.cwd()}/${joinedP}`.replace(/\\/g, "/");
                    }
                }
                console.log(newPath);
                docs.push(vscode_languageserver_1.TextDocument.create(newPath, "vue", 0, fs.readFileSync(joinedP, "utf8")));
            }
        });
    }
    walk(root);
    return docs;
}
function getDiagnostics({ docs, workspace, onlyTemplate }) {
    return __awaiter(this, void 0, void 0, function* () {
        const documentRegions = languageModelCache_1.getLanguageModelCache(10, 60, document => embeddedSupport_1.getVueDocumentRegions(document));
        const scriptRegionDocuments = languageModelCache_1.getLanguageModelCache(10, 60, document => {
            const vueDocument = documentRegions.refreshAndGet(document);
            return vueDocument.getSingleTypeDocument("script");
        });
        let hasError = false;
        try {
            const serviceHost = serviceHost_1.getServiceHost(typescript_1.default, workspace, scriptRegionDocuments);
            const vueMode = new interpolationMode_1.VueInterpolationMode(typescript_1.default, serviceHost);
            const scriptMode = yield javascript_1.getJavascriptMode(serviceHost, scriptRegionDocuments, workspace);
            const bar = new progress_1.default("checking [:bar] :current/:total", {
                total: docs.length,
                width: 20,
                clear: true
            });
            for (const doc of docs) {
                const vueTplResults = vueMode.doValidation(doc);
                let scriptResults = [];
                if (!onlyTemplate && scriptMode.doValidation) {
                    scriptResults = scriptMode.doValidation(doc);
                }
                const results = vueTplResults.concat(scriptResults);
                if (results.length) {
                    hasError = true;
                    for (const result of results) {
                        const total = doc.lineCount;
                        const lines = print_1.getLines({
                            start: result.range.start.line,
                            end: result.range.end.line,
                            total
                        });
                        print_1.printError(`Error in ${doc.uri}`);
                        print_1.printMessage(`${result.range.start.line}:${result.range.start.character} ${result.message}`);
                        for (const line of lines) {
                            const code = doc
                                .getText({
                                start: { line, character: 0 },
                                end: { line, character: Infinity }
                            })
                                .replace(/\n$/, "");
                            const isError = line === result.range.start.line;
                            print_1.printLog(print_1.formatLine({ number: line, code, isError }));
                            if (isError) {
                                print_1.printLog(print_1.formatCursor(result.range));
                            }
                        }
                    }
                }
                bar.tick();
            }
        }
        catch (error) {
            hasError = true;
            console.error(error);
        }
        finally {
            documentRegions.dispose();
            scriptRegionDocuments.dispose();
            process.exit(hasError ? 1 : 0);
        }
    });
}
