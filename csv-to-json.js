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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CsvToJsonConverter = void 0;
var fs = require("fs");
var path = require("path");
var CsvToJsonConverter = /** @class */ (function () {
    function CsvToJsonConverter() {
        this.dataDir = path.join(__dirname, 'data');
        this.outputPath = path.join(__dirname, 'questions.json');
    }
    CsvToJsonConverter.prototype.parseCsvLine = function (line) {
        var result = [];
        var current = '';
        var inQuotes = false;
        var i = 0;
        while (i < line.length) {
            var char = line[i];
            if (char === '"' && !inQuotes) {
                inQuotes = true;
            }
            else if (char === '"' && inQuotes) {
                // Check for escaped quote
                if (i + 1 < line.length && line[i + 1] === '"') {
                    current += '"';
                    i++; // Skip the next quote
                }
                else {
                    inQuotes = false;
                }
            }
            else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            }
            else {
                current += char;
            }
            i++;
        }
        result.push(current);
        return result;
    };
    CsvToJsonConverter.prototype.parseMultipleChoiceCsv = function () {
        var csvPath = path.join(this.dataDir, 'multiple-choice-questions.csv');
        var content = fs.readFileSync(csvPath, 'utf-8');
        var lines = content.trim().split('\n');
        var questions = [];
        // Skip header line
        for (var i = 1; i < lines.length; i++) {
            var fields = this.parseCsvLine(lines[i]);
            if (fields.length >= 5) {
                var id = fields[0], type = fields[1], text = fields[2], optionsJson = fields[3], correctAnswer = fields[4];
                try {
                    // Parse options JSON and unescape quotes
                    var unescapedJson = optionsJson.replace(/""/g, '"');
                    var options = JSON.parse(unescapedJson);
                    questions.push({
                        id: id.padStart(3, '0'),
                        type: 'multiple-choice',
                        text: text,
                        options: options,
                        correctAnswer: correctAnswer
                    });
                }
                catch (error) {
                    console.warn("Failed to parse multiple-choice question ".concat(id, ": ").concat(error));
                }
            }
        }
        return questions;
    };
    CsvToJsonConverter.prototype.parseTrueFalseCsv = function () {
        var csvPath = path.join(this.dataDir, 'true-false-questions.csv');
        var content = fs.readFileSync(csvPath, 'utf-8');
        var lines = content.trim().split('\n');
        var questions = [];
        // Skip header line
        for (var i = 1; i < lines.length; i++) {
            var fields = this.parseCsvLine(lines[i]);
            if (fields.length >= 4) {
                var id = fields[0], type = fields[1], text = fields[2], correctAnswer = fields[3], explanation = fields[4];
                var question = {
                    id: id.padStart(3, '0'),
                    type: 'true-false',
                    text: text,
                    correctAnswer: correctAnswer
                };
                // Only add explanation if it exists and is not empty
                if (explanation && explanation.trim()) {
                    question.explanation = explanation.trim();
                }
                questions.push(question);
            }
        }
        return questions;
    };
    CsvToJsonConverter.prototype.sortQuestions = function (questions) {
        return questions.sort(function (a, b) {
            // First sort by type (multiple-choice first, then true-false)
            if (a.type !== b.type) {
                return a.type === 'multiple-choice' ? -1 : 1;
            }
            // Then sort by id within each type
            return a.id.localeCompare(b.id);
        });
    };
    CsvToJsonConverter.prototype.convertCsvToJson = function () {
        return __awaiter(this, void 0, void 0, function () {
            var multipleChoiceQuestions, trueFalseQuestions, allQuestions, sortedQuestions, jsonContent;
            return __generator(this, function (_a) {
                try {
                    console.log('正在讀取選擇題CSV檔案...');
                    multipleChoiceQuestions = this.parseMultipleChoiceCsv();
                    console.log("\u6210\u529F\u8B80\u53D6 ".concat(multipleChoiceQuestions.length, " \u984C\u9078\u64C7\u984C"));
                    console.log('正在讀取是非題CSV檔案...');
                    trueFalseQuestions = this.parseTrueFalseCsv();
                    console.log("\u6210\u529F\u8B80\u53D6 ".concat(trueFalseQuestions.length, " \u984C\u662F\u975E\u984C"));
                    allQuestions = __spreadArray(__spreadArray([], multipleChoiceQuestions, true), trueFalseQuestions, true);
                    sortedQuestions = this.sortQuestions(allQuestions);
                    jsonContent = JSON.stringify(sortedQuestions, null, 2);
                    fs.writeFileSync(this.outputPath, jsonContent, 'utf-8');
                    console.log("\u6210\u529F\u751F\u6210 questions.json \u6A94\u6848: ".concat(this.outputPath));
                    console.log("\u7E3D\u984C\u6578: ".concat(sortedQuestions.length, " \u984C"));
                    console.log("\u9078\u64C7\u984C: ".concat(multipleChoiceQuestions.length, " \u984C"));
                    console.log("\u662F\u975E\u984C: ".concat(trueFalseQuestions.length, " \u984C"));
                }
                catch (error) {
                    console.error('轉換過程發生錯誤:', error);
                    throw error;
                }
                return [2 /*return*/];
            });
        });
    };
    return CsvToJsonConverter;
}());
exports.CsvToJsonConverter = CsvToJsonConverter;
// Main execution
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var converter;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    converter = new CsvToJsonConverter();
                    return [4 /*yield*/, converter.convertCsvToJson()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
if (require.main === module) {
    main().catch(console.error);
}
