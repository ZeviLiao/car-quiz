"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
// 檢查匹配情況
function debugMatching() {
    var questionsPath = path.join(__dirname, 'questions.json');
    var content = fs.readFileSync(questionsPath, 'utf-8');
    var questions = JSON.parse(content);
    var xAnswerQuestions = questions.filter(function (q) {
        return q.type === 'true-false' && q.correctAnswer === 'X';
    });
    var withExplanation = xAnswerQuestions.filter(function (q) { return q.explanation; });
    var withoutExplanation = xAnswerQuestions.filter(function (q) { return !q.explanation; });
    console.log("\u7E3DX\u7B54\u6848\u984C\u76EE: ".concat(xAnswerQuestions.length));
    console.log("\u6709\u8AAA\u660E: ".concat(withExplanation.length));
    console.log("\u7121\u8AAA\u660E: ".concat(withoutExplanation.length));
    console.log('\n=== 無說明的題目 ===');
    withoutExplanation.forEach(function (q) {
        console.log("".concat(q.id, ": ").concat(q.text.substring(0, 50), "..."));
    });
}
debugMatching();
