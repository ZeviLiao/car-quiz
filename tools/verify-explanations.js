"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
// 檢查說明的合理性
function verifyExplanations() {
    var questionsPath = path.join(__dirname, 'questions.json');
    var content = fs.readFileSync(questionsPath, 'utf-8');
    var questions = JSON.parse(content);
    var xAnswerQuestions = questions.filter(function (q) {
        return q.type === 'true-false' && q.correctAnswer === 'X' && q.explanation;
    });
    console.log("=== \u6AA2\u67E5 ".concat(xAnswerQuestions.length, " \u984C\u932F\u8AA4\u7B54\u6848\u7684\u8AAA\u660E\u5408\u7406\u6027 ===\n"));
    xAnswerQuestions.forEach(function (q) {
        console.log("\u984C\u76EE ".concat(q.id, ":"));
        console.log("\u554F\u984C: ".concat(q.text));
        console.log("\u6B63\u78BA\u7B54\u6848: ".concat(q.correctAnswer, " (\u932F\u8AA4)"));
        console.log("\u8AAA\u660E: ".concat(q.explanation));
        console.log("---");
    });
}
verifyExplanations();
