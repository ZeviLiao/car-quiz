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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfToCsvConverter = void 0;
var fs = require("fs");
var path = require("path");
var pdfParse = require("pdf-parse");
var PdfToCsvConverter = /** @class */ (function () {
    function PdfToCsvConverter(questionType) {
        if (questionType === void 0) { questionType = 'true-false'; }
        this.dataDir = path.join(__dirname, 'data');
        this.questionType = questionType;
        this.outputPath = path.join(this.dataDir, questionType === 'true-false' ? 'true-false-questions.csv' : 'multiple-choice-questions.csv');
    }
    PdfToCsvConverter.prototype.extractTextFromPdf = function (pdfPath) {
        return __awaiter(this, void 0, void 0, function () {
            var pdfBuffer, pdfData, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        console.log("\u6B63\u5728\u8B80\u53D6PDF\u6A94\u6848: ".concat(path.basename(pdfPath)));
                        pdfBuffer = fs.readFileSync(pdfPath);
                        return [4 /*yield*/, pdfParse(pdfBuffer)];
                    case 1:
                        pdfData = _a.sent();
                        return [2 /*return*/, pdfData.text];
                    case 2:
                        error_1 = _a.sent();
                        console.error("\u8B80\u53D6PDF\u6A94\u6848\u5931\u6557: ".concat(error_1));
                        throw error_1;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    PdfToCsvConverter.prototype.parseTrueFalseQuestions = function (text) {
        var questions = [];
        // Split text by lines and filter out empty lines
        var lines = text.split('\n')
            .map(function (line) { return line.trim(); })
            .filter(function (line) { return line.length > 0; });
        var i = 0;
        while (i < lines.length) {
            var line = lines[i];
            // Look for pattern: "題號 答案 題目" like "001 X 柴油引擎，是用火星塞點火的。"
            var match = line.match(/^(\d{3})\s+([○X])\s+(.+)$/);
            if (match) {
                var questionNum = match[1], answer = match[2], questionText = match[3];
                var question = {
                    id: questionNum,
                    type: 'true-false',
                    text: questionText,
                    correctAnswer: answer === '○' ? 'O' : 'X'
                };
                questions.push(question);
            }
            // Handle multi-line questions where answer and question text are on separate lines
            else if (line.match(/^(\d{3})\s+([○X])$/)) {
                var _a = line.match(/^(\d{3})\s+([○X])$/), questionNum = _a[1], answer = _a[2];
                // Look for the question text in the next few lines
                var questionText = '';
                var j = i + 1;
                while (j < lines.length && j < i + 10) { // Look ahead max 10 lines
                    var nextLine = lines[j];
                    // Stop if we hit another question number
                    if (nextLine.match(/^\d{3}\s+[○X]/))
                        break;
                    // Skip page headers and other non-content
                    if (!this.isHeaderOrPageNumber(nextLine) && nextLine.trim().length > 0) {
                        if (questionText)
                            questionText += ' ';
                        questionText += nextLine;
                        // If the line ends with punctuation, it's likely the end of the question
                        if (nextLine.match(/[。！？．]$/)) {
                            j++; // Move past this line
                            break;
                        }
                    }
                    j++;
                }
                if (questionText && this.isValidQuestionText(questionText)) {
                    var question = {
                        id: questionNum,
                        type: 'true-false',
                        text: questionText.trim(),
                        correctAnswer: answer === '○' ? 'O' : 'X'
                    };
                    questions.push(question);
                    i = j - 1; // Skip the lines we've processed
                }
            }
            i++;
        }
        return questions;
    };
    PdfToCsvConverter.prototype.parseMultipleChoiceQuestions = function (text) {
        var questions = [];
        // Split by lines and clean up
        var lines = text.split('\n')
            .map(function (line) { return line.trim(); })
            .filter(function (line) { return line.length > 0; });
        var i = 0;
        while (i < lines.length) {
            var line = lines[i];
            // Look for pattern: "題號 答案" like "001 1" or "004 2 question..."
            var match = line.match(/^(\d{3})\s+(\d)(.*)$/);
            if (match) {
                var questionNum = match[1], answer = match[2], remainder = match[3];
                // Collect all content until we hit the next question number
                var allContent = remainder.trim();
                var j = i + 1;
                while (j < lines.length) {
                    var nextLine = lines[j];
                    // Stop if we hit another question number or header
                    if (nextLine.match(/^\d{3}\s+\d/) || this.isHeaderOrPageNumber(nextLine)) {
                        break;
                    }
                    if (nextLine.trim().length > 0) {
                        allContent += ' ' + nextLine.trim();
                    }
                    j++;
                }
                // Parse the collected content - be more lenient about incomplete options
                if (allContent) {
                    var parsedQuestion = this.parseMultipleChoiceContent(questionNum, answer, allContent);
                    if (parsedQuestion) {
                        questions.push(parsedQuestion);
                    }
                }
                i = j - 1; // Skip processed lines
            }
            i++;
        }
        return questions;
    };
    PdfToCsvConverter.prototype.parseMultipleChoiceContent = function (questionNum, answer, content) {
        // Extract the main question text before the first option (handle both formats)
        var questionMatch = content.match(/^(.+?)[\(（][１1][\)）]/);
        if (!questionMatch) {
            return null;
        }
        var questionText = questionMatch[1].trim().replace(/[：:]$/, '');
        // Parse options from the content
        var options = {};
        // Extract options using regex patterns (handle both formats)
        var option1Match = content.match(/[\(（][１1][\)）]([^（(]+?)(?=[\(（][２2][\)）])/);
        var option2Match = content.match(/[\(（][２2][\)）]([^（(]+?)(?=[\(（][３3][\)）])/);
        var option3Match = content.match(/[\(（][３3][\)）]([^（(]+?)(?:\s*$)/);
        if (option1Match) {
            options['1'] = option1Match[1].trim()
                .replace(/\s+/g, ' ')
                .replace(/[。．]$/, '');
        }
        if (option2Match) {
            options['2'] = option2Match[1].trim()
                .replace(/\s+/g, ' ')
                .replace(/[。．]$/, '');
        }
        if (option3Match) {
            options['3'] = option3Match[1].trim()
                .replace(/\s+/g, ' ')
                .replace(/[。．]$/, '');
        }
        // For questions with incomplete options, try to extract what we can
        if (Object.keys(options).length < 3) {
            // Try alternative parsing for incomplete options with different formats
            var optionMatches = content.match(/[\(（](\d)[\)）]([^()（）]+?)(?=[\(（]\d[\)）]|$)/g);
            if (optionMatches) {
                optionMatches.forEach(function (match) {
                    var optMatch = match.match(/[\(（](\d)[\)）](.+)/);
                    if (optMatch) {
                        var num = optMatch[1], text = optMatch[2];
                        options[num] = text.trim().replace(/\s+/g, ' ').replace(/[。．]$/, '');
                    }
                });
            }
        }
        // Must have at least valid question text and at least one option
        if (!questionText || questionText.length < 5 || Object.keys(options).length === 0) {
            return null;
        }
        return {
            id: questionNum,
            type: 'multiple-choice',
            text: questionText,
            options: options,
            correctAnswer: answer
        };
    };
    PdfToCsvConverter.prototype.isHeaderOrPageNumber = function (text) {
        var headerPatterns = [
            '機械常識是非題',
            '機械常識選擇題',
            '題號',
            '答案',
            '題目',
            /^第\d+頁/, // Page numbers
            /^共\d+頁/, // Total pages
        ];
        for (var _i = 0, headerPatterns_1 = headerPatterns; _i < headerPatterns_1.length; _i++) {
            var pattern = headerPatterns_1[_i];
            if (typeof pattern === 'string') {
                if (text.includes(pattern))
                    return true;
            }
            else {
                if (pattern.test(text))
                    return true;
            }
        }
        return false;
    };
    PdfToCsvConverter.prototype.isValidQuestionText = function (text) {
        // Must have meaningful content and reasonable length
        return text.length > 5 &&
            text.length < 500 && // Not too long
            !text.match(/^[○X\d\s]*$/); // Not just symbols and numbers
    };
    PdfToCsvConverter.prototype.cleanQuestionText = function (text) {
        // Remove question numbers, extra spaces, etc.
        return text.replace(/^\d+\.?\s*/, '').trim();
    };
    PdfToCsvConverter.prototype.extractAnswer = function (text) {
        if (text.includes('(O)') || text.includes('正確'))
            return 'O';
        if (text.includes('(X)') || text.includes('錯誤'))
            return 'X';
        return null;
    };
    PdfToCsvConverter.prototype.questionsToCSV = function (questions) {
        if (this.questionType === 'multiple-choice') {
            return this.multipleChoiceToCSV(questions);
        }
        else {
            return this.trueFalseToCSV(questions);
        }
    };
    PdfToCsvConverter.prototype.trueFalseToCSV = function (questions) {
        var headers = ['id', 'type', 'text', 'correctAnswer', 'explanation'];
        var csvLines = [headers.join(',')];
        questions.forEach(function (q) {
            var row = [
                q.id,
                q.type,
                "\"".concat(q.text.replace(/"/g, '""'), "\""), // Escape quotes
                q.correctAnswer,
                q.explanation ? "\"".concat(q.explanation.replace(/"/g, '""'), "\"") : ''
            ];
            csvLines.push(row.join(','));
        });
        return csvLines.join('\n');
    };
    PdfToCsvConverter.prototype.multipleChoiceToCSV = function (questions) {
        var headers = ['id', 'type', 'text', 'options', 'correctAnswer'];
        var csvLines = [headers.join(',')];
        questions.forEach(function (q) {
            var optionsJson = JSON.stringify(q.options).replace(/"/g, '""');
            var row = [
                q.id,
                q.type,
                "\"".concat(q.text.replace(/"/g, '""'), "\""), // Escape quotes
                "\"".concat(optionsJson, "\""), // JSON stringify options
                q.correctAnswer
            ];
            csvLines.push(row.join(','));
        });
        return csvLines.join('\n');
    };
    PdfToCsvConverter.prototype.convertPdfToCSV = function () {
        return __awaiter(this, void 0, void 0, function () {
            var files, targetPdf, pdfPath, extractedText, questions, csvContent, questionTypeText, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        files = fs.readdirSync(this.dataDir);
                        targetPdf = void 0;
                        if (this.questionType === 'true-false') {
                            targetPdf = files.find(function (file) { return file.includes('是非題') && file.endsWith('.pdf'); });
                            if (!targetPdf) {
                                throw new Error('找不到是非題PDF檔案');
                            }
                        }
                        else {
                            targetPdf = files.find(function (file) { return file.includes('選擇題') && file.endsWith('.pdf'); });
                            if (!targetPdf) {
                                throw new Error('找不到選擇題PDF檔案');
                            }
                        }
                        pdfPath = path.join(this.dataDir, targetPdf);
                        console.log("\u8655\u7406PDF\u6A94\u6848: ".concat(targetPdf));
                        return [4 /*yield*/, this.extractTextFromPdf(pdfPath)];
                    case 1:
                        extractedText = _a.sent();
                        questions = void 0;
                        if (this.questionType === 'true-false') {
                            questions = this.parseTrueFalseQuestions(extractedText);
                        }
                        else {
                            questions = this.parseMultipleChoiceQuestions(extractedText);
                        }
                        if (questions.length === 0) {
                            console.log("\u8B66\u544A: \u672A\u627E\u5230\u4EFB\u4F55".concat(this.questionType === 'true-false' ? '是非題' : '選擇題'));
                            return [2 /*return*/];
                        }
                        csvContent = this.questionsToCSV(questions);
                        // Write to file
                        fs.writeFileSync(this.outputPath, csvContent, 'utf-8');
                        questionTypeText = this.questionType === 'true-false' ? '是非題' : '選擇題';
                        console.log("\u6210\u529F\u8F49\u63DB ".concat(questions.length, " \u984C").concat(questionTypeText, "\u5230 CSV \u6A94\u6848: ").concat(this.outputPath));
                        return [3 /*break*/, 3];
                    case 2:
                        error_2 = _a.sent();
                        console.error('轉換過程發生錯誤:', error_2);
                        throw error_2;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return PdfToCsvConverter;
}());
exports.PdfToCsvConverter = PdfToCsvConverter;
// Main execution for true-false questions (default)
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var converter;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    converter = new PdfToCsvConverter('true-false');
                    return [4 /*yield*/, converter.convertPdfToCSV()];
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
