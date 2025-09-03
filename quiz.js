"use strict";
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
var readlineSync = require("readline-sync");
var fs = require("fs");
var path = require("path");
var failedQuestions = [];
var answeredQuestions = [];
var questionCount = 20;
var DATA_FILE = path.join(__dirname, 'quiz-data.json');
// Function to load questions from a JSON file
function loadQuestions() {
    try {
        var filePath = path.join(__dirname, 'questions.json');
        var fileContent = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(fileContent);
    }
    catch (error) {
        console.error('讀取題目檔案時發生錯誤:', error);
        return [];
    }
}
// Function to load persistent quiz data
function loadQuizData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            var fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
            return JSON.parse(fileContent);
        }
    }
    catch (error) {
        console.error('讀取進度檔案時發生錯誤:', error);
    }
    return { failedQuestions: [], answeredQuestions: [] };
}
// Function to save persistent quiz data
function saveQuizData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    }
    catch (error) {
        console.error('儲存進度檔案時發生錯誤:', error);
    }
}
// Fisher-Yates shuffle algorithm
function shuffleArray(array) {
    var _a;
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        _a = [array[j], array[i]], array[i] = _a[0], array[j] = _a[1];
    }
    return array;
}
// Main quiz function
function runQuiz(questions, requestedCount) {
    if (questions.length === 0) {
        console.log('沒有題目可供測驗。');
        return true;
    }
    var correctCount = 0;
    var wrongCount = 0;
    var currentFailedQuestions = [];
    var currentAnsweredQuestions = [];
    questions = shuffleArray(questions);
    var quizQuestions = questions.slice(0, requestedCount);
    for (var i = 0; i < quizQuestions.length; i++) {
        var q = quizQuestions[i];
        console.log("\n\u7B2C ".concat(i + 1, " \u984C\uFF1A").concat(q.text));
        if (q.type === 'multiple-choice') {
            for (var option in q.options) {
                console.log("  (".concat(option, ") ").concat(q.options[option]));
            }
        }
        else {
            console.log('  請回答 O/o (正確) 或 X/x (錯誤)，或輸入 q 返回主選單');
        }
        var userAnswer = readlineSync.question('您的答案：');
        // Check if user wants to quit
        if (userAnswer.toLowerCase() === 'q') {
            console.log('\n返回主選單...');
            return false; // Indicate quiz was interrupted
        }
        var normalizedAnswer = userAnswer.toUpperCase();
        var isCorrect = false;
        if (q.type === 'multiple-choice') {
            isCorrect = normalizedAnswer === q.correctAnswer;
        }
        else {
            isCorrect = normalizedAnswer === q.correctAnswer;
        }
        if (isCorrect) {
            console.log('✔ 答對了！');
            correctCount++;
            currentAnsweredQuestions.push(q);
        }
        else {
            console.log("\u2718 \u7B54\u932F\u4E86\uFF01");
            console.log("\u6B63\u78BA\u7B54\u6848\u662F\uFF1A".concat(q.correctAnswer, "\u3002"));
            wrongCount++;
            currentFailedQuestions.push(q);
        }
        // 是非題且標準答案是X時，一定顯示說明（不論答對錯）
        if (q.type === 'true-false' && q.correctAnswer === 'X' && q.explanation) {
            console.log("\u8AAA\u660E\uFF1A".concat(q.explanation));
        }
    }
    failedQuestions = currentFailedQuestions;
    var _loop_1 = function (newAnswered) {
        var exists = answeredQuestions.some(function (q) { return q.id === newAnswered.id; });
        if (!exists) {
            answeredQuestions.push(newAnswered);
        }
    };
    // Update answered questions (remove duplicates and add new ones)
    for (var _i = 0, currentAnsweredQuestions_1 = currentAnsweredQuestions; _i < currentAnsweredQuestions_1.length; _i++) {
        var newAnswered = currentAnsweredQuestions_1[_i];
        _loop_1(newAnswered);
    }
    // Save progress
    var quizData = {
        failedQuestions: failedQuestions,
        answeredQuestions: answeredQuestions,
        lastQuestionCount: requestedCount
    };
    saveQuizData(quizData);
    console.log('\n---');
    console.log('測驗結束！');
    console.log("\u7E3D\u984C\u6578\uFF1A".concat(quizQuestions.length));
    console.log("\u7B54\u5C0D\uFF1A".concat(correctCount));
    console.log("\u7B54\u932F\uFF1A".concat(wrongCount));
    return true; // Quiz completed normally
}
// Function to get question count from user
function getQuestionCount(maxQuestions, lastCount) {
    var minQuestions = Math.min(20, maxQuestions);
    var defaultCount = lastCount && lastCount >= minQuestions ? lastCount : minQuestions;
    console.log("\n\u8ACB\u9078\u64C7\u51FA\u984C\u6578\u91CF (\u6700\u5C11 ".concat(minQuestions, " \u984C\uFF0C\u6700\u591A ").concat(maxQuestions, " \u984C)"));
    if (lastCount) {
        console.log("\u4E0A\u6B21\u9078\u64C7\uFF1A".concat(lastCount, " \u984C"));
    }
    var input = readlineSync.question("\u8ACB\u8F38\u5165\u984C\u6578 [\u9810\u8A2D: ".concat(defaultCount, "]\uFF1A"));
    if (!input.trim()) {
        return defaultCount;
    }
    var count = parseInt(input);
    if (isNaN(count) || count < minQuestions || count > maxQuestions) {
        console.log("\u7121\u6548\u7684\u984C\u6578\uFF0C\u4F7F\u7528\u9810\u8A2D\u503C\uFF1A".concat(defaultCount, " \u984C"));
        return defaultCount;
    }
    return count;
}
// Main function to run the application
function main() {
    var allQuestions = loadQuestions();
    // Load previous quiz data
    var savedData = loadQuizData();
    failedQuestions = savedData.failedQuestions || [];
    answeredQuestions = savedData.answeredQuestions || [];
    questionCount = savedData.lastQuestionCount || 20;
    while (true) {
        var questionsToAsk = void 0;
        var currentQuestionCount = void 0;
        // Filter out already answered questions for available pool
        var unansweredQuestions = allQuestions.filter(function (q) {
            return !answeredQuestions.some(function (answered) { return answered.id === q.id; });
        });
        // Show progress info
        var totalQuestions = allQuestions.length;
        var answeredCount = answeredQuestions.length;
        var failedCount = failedQuestions.length;
        var remainingCount = unansweredQuestions.length;
        console.log('\n=== 測驗進度 ===');
        console.log("\u7E3D\u984C\u6578\uFF1A".concat(totalQuestions));
        console.log("\u5DF2\u7B54\u5C0D\uFF1A".concat(answeredCount));
        console.log("\u7B54\u932F\u5F85\u91CD\u505A\uFF1A".concat(failedCount));
        console.log("\u5C1A\u672A\u4F5C\u7B54\uFF1A".concat(remainingCount));
        // Create available question pool (unanswered + failed)
        var availableQuestions = __spreadArray(__spreadArray([], unansweredQuestions, true), failedQuestions, true);
        if (availableQuestions.length === 0) {
            console.log('\n🎉 恭喜！您已完成所有題目！');
            console.log('選擇 reset 重新開始全部題目');
        }
        console.log('\n=== 選單 ===');
        if (failedCount > 0) {
            console.log('1. 只測驗答錯的題目');
        }
        if (availableQuestions.length > 0) {
            console.log('2. 測驗可用題目 (未答過 + 答錯)');
        }
        console.log('3. reset 重新開始 (清除所有記錄)');
        console.log('4. 離開');
        var choice = readlineSync.question('請輸入您的選擇：');
        console.log('---');
        if (choice === '1' && failedCount > 0) {
            questionsToAsk = failedQuestions;
            currentQuestionCount = getQuestionCount(questionsToAsk.length, Math.min(questionCount, questionsToAsk.length));
        }
        else if (choice === '2' && availableQuestions.length > 0) {
            questionsToAsk = availableQuestions;
            currentQuestionCount = getQuestionCount(questionsToAsk.length, questionCount);
        }
        else if (choice === '3') {
            console.log('重設所有記錄...');
            failedQuestions = [];
            answeredQuestions = [];
            var resetData = {
                failedQuestions: [],
                answeredQuestions: [],
                lastQuestionCount: questionCount
            };
            saveQuizData(resetData);
            console.log('已清除所有記錄，可重新開始測驗。');
            continue;
        }
        else if (choice === '4') {
            console.log('測驗已結束，謝謝使用。');
            break;
        }
        else {
            console.log('無效的選擇，請重新選擇。');
            continue;
        }
        var quizCompleted = runQuiz(questionsToAsk, currentQuestionCount);
        if (quizCompleted) {
            questionCount = currentQuestionCount; // Remember the question count for next time
        }
    }
}
main();
