"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const readlineSync = __importStar(require("readline-sync"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let failedQuestions = [];
let answeredQuestions = [];
let markedQuestions = [];
let questionCount = 20;
const DATA_FILE = path.join(__dirname, 'quiz-data.json');
// Function to load questions from a JSON file
function loadQuestions() {
    try {
        const filePath = path.join(__dirname, 'questions.json');
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const questions = JSON.parse(fileContent);
        // 過濾掉爭議題目034 - 確保永不出現
        // 同時過濾掉被標記的題目 (markedQuestions)
        const filteredQuestions = questions.filter((q) => q.id !== '034' && !markedQuestions.some(marked => marked.id === q.id));
        return filteredQuestions;
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
            const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
            return JSON.parse(fileContent);
        }
    }
    catch (error) {
        console.error('讀取進度檔案時發生錯誤:', error);
    }
    return { failedQuestions: [], answeredQuestions: [], markedQuestions: [] };
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
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
// Main quiz function
function runQuiz(questions, requestedCount) {
    if (questions.length === 0) {
        console.log('沒有題目可供測驗。');
        return true;
    }
    let correctCount = 0;
    let wrongCount = 0;
    let currentFailedQuestions = [];
    let currentAnsweredQuestions = [];
    questions = shuffleArray(questions);
    const quizQuestions = questions.slice(0, requestedCount);
    for (let i = 0; i < quizQuestions.length; i++) {
        const q = quizQuestions[i];
        console.log(`\n第 ${i + 1} 題：${q.text}`);
        if (q.type === 'multiple-choice') {
            for (const option in q.options) {
                console.log(`  (${option}) ${q.options[option]}`);
            }
        }
        else {
            console.log('  請回答 O/o (正確) 或 X/x (錯誤)');
        }
        console.log('  或輸入：');
        console.log('    - : 標記此題永不再出現');
        console.log('    ? : 不知道答案，顯示答案後加入錯題');
        console.log('    q : 返回主選單');
        const userAnswer = readlineSync.question('您的答案：');
        // Check if user wants to quit
        if (userAnswer.toLowerCase() === 'q') {
            console.log('\n返回主選單...');
            return false; // Indicate quiz was interrupted
        }
        // Handle marking options
        if (userAnswer === '-') {
            console.log('📝 此題已標記為永不再出現');
            console.log(`正確答案是：${q.correctAnswer}`);
            markedQuestions.push(q);
            // Show explanation for true-false questions with X answer
            if (q.type === 'true-false' && q.correctAnswer === 'X' && q.explanation) {
                console.log(`說明：${q.explanation}`);
            }
            continue; // Skip to next question without counting as right/wrong
        }
        if (userAnswer === '?') {
            console.log('❓ 不知道答案...');
            console.log(`正確答案是：${q.correctAnswer}`);
            wrongCount++;
            currentFailedQuestions.push(q);
            // Show explanation for true-false questions with X answer
            if (q.type === 'true-false' && q.correctAnswer === 'X' && q.explanation) {
                console.log(`說明：${q.explanation}`);
            }
            continue;
        }
        const normalizedAnswer = userAnswer.toUpperCase();
        let isCorrect = false;
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
            console.log(`✘ 答錯了！`);
            console.log(`正確答案是：${q.correctAnswer}。`);
            wrongCount++;
            currentFailedQuestions.push(q);
        }
        // 是非題且標準答案是X時，一定顯示說明（不論答對錯）
        if (q.type === 'true-false' && q.correctAnswer === 'X' && q.explanation) {
            console.log(`說明：${q.explanation}`);
        }
    }
    failedQuestions = currentFailedQuestions;
    // Update answered questions (remove duplicates and add new ones)
    for (const newAnswered of currentAnsweredQuestions) {
        const exists = answeredQuestions.some(q => q.id === newAnswered.id);
        if (!exists) {
            answeredQuestions.push(newAnswered);
        }
    }
    // Save progress
    const quizData = {
        failedQuestions: failedQuestions,
        answeredQuestions: answeredQuestions,
        markedQuestions: markedQuestions,
        lastQuestionCount: requestedCount
    };
    saveQuizData(quizData);
    console.log('\n---');
    console.log('測驗結束！');
    console.log(`總題數：${quizQuestions.length}`);
    console.log(`答對：${correctCount}`);
    console.log(`答錯：${wrongCount}`);
    return true; // Quiz completed normally
}
// Function to get question count from user
function getQuestionCount(maxQuestions, lastCount) {
    const minQuestions = Math.min(20, maxQuestions);
    const defaultCount = lastCount && lastCount >= minQuestions ? lastCount : minQuestions;
    console.log(`\n請選擇出題數量 (最少 ${minQuestions} 題，最多 ${maxQuestions} 題)`);
    if (lastCount) {
        console.log(`上次選擇：${lastCount} 題`);
    }
    const input = readlineSync.question(`請輸入題數 [預設: ${defaultCount}]：`);
    if (!input.trim()) {
        return defaultCount;
    }
    const count = parseInt(input);
    if (isNaN(count) || count < minQuestions || count > maxQuestions) {
        console.log(`無效的題數，使用預設值：${defaultCount} 題`);
        return defaultCount;
    }
    return count;
}
// Main function to run the application
function main() {
    const allQuestions = loadQuestions();
    // Load previous quiz data
    const savedData = loadQuizData();
    failedQuestions = savedData.failedQuestions || [];
    answeredQuestions = savedData.answeredQuestions || [];
    markedQuestions = savedData.markedQuestions || [];
    questionCount = savedData.lastQuestionCount || 20;
    while (true) {
        let questionsToAsk;
        let currentQuestionCount;
        // Filter out already answered questions for available pool
        const unansweredQuestions = allQuestions.filter(q => !answeredQuestions.some(answered => answered.id === q.id));
        // Show progress info
        const totalAvailableQuestions = allQuestions.length; // Available questions after filtering marked ones
        const markedCount = markedQuestions.length;
        const answeredCount = answeredQuestions.length;
        const failedCount = failedQuestions.length;
        const remainingCount = unansweredQuestions.length;
        console.log('\n=== 測驗進度 ===');
        console.log(`可用題數：${totalAvailableQuestions}`);
        console.log(`已標記永不出現：${markedCount}`);
        console.log(`已答對：${answeredCount}`);
        console.log(`答錯待重做：${failedCount}`);
        console.log(`尚未作答：${remainingCount}`);
        // Create available question pool (unanswered + failed)
        const availableQuestions = [...unansweredQuestions, ...failedQuestions];
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
        console.log('3. reset 重新開始 (清除答對/答錯記錄，保留標記)');
        console.log('4. reset-all 完全重置 (清除所有記錄包含標記)');
        console.log('5. 離開');
        const choice = readlineSync.question('請輸入您的選擇：');
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
            console.log('重設答對/答錯記錄 (保留標記)...');
            failedQuestions = [];
            answeredQuestions = [];
            const resetData = {
                failedQuestions: [],
                answeredQuestions: [],
                markedQuestions: markedQuestions, // Keep marked questions
                lastQuestionCount: questionCount
            };
            saveQuizData(resetData);
            console.log('已清除答對/答錯記錄，標記的題目依然不會出現。');
            continue;
        }
        else if (choice === '4') {
            console.log('完全重置所有記錄 (包含標記)...');
            failedQuestions = [];
            answeredQuestions = [];
            markedQuestions = [];
            const resetAllData = {
                failedQuestions: [],
                answeredQuestions: [],
                markedQuestions: [],
                lastQuestionCount: questionCount
            };
            saveQuizData(resetAllData);
            console.log('已清除所有記錄，包含標記的題目，所有題目將重新可用。');
            continue;
        }
        else if (choice === '5') {
            console.log('測驗已結束，謝謝使用。');
            break;
        }
        else {
            console.log('無效的選擇，請重新選擇。');
            continue;
        }
        const quizCompleted = runQuiz(questionsToAsk, currentQuestionCount);
        if (quizCompleted) {
            questionCount = currentQuestionCount; // Remember the question count for next time
        }
    }
}
main();
