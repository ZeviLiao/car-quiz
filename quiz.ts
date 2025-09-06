import * as readlineSync from 'readline-sync';
import * as fs from 'fs';
import * as path from 'path';

// Color constants for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  bright: '\x1b[1m'
};

// Helper functions for colored output
function greenText(text: string): string {
  return `${colors.green}${text}${colors.reset}`;
}

function redText(text: string): string {
  return `${colors.red}${text}${colors.reset}`;
}

function yellowText(text: string): string {
  return `${colors.yellow}${text}${colors.reset}`;
}

// Define the question data structure
interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false';
  text: string;
  correctAnswer: string;
  options?: {
    [key: string]: string;
  };
  explanation?: string; // For true/false questions, provide explanation when wrong
}

// Persistent data structure
interface QuizData {
  failedQuestions: Question[];
  answeredQuestions: Question[]; // Track correctly answered questions
  markedQuestions: Question[]; // Questions marked with '-' (never show again)
  lastQuestionCount?: number;
}

let failedQuestions: Question[] = [];
let answeredQuestions: Question[] = [];
let markedQuestions: Question[] = [];
let questionCount: number = 20;
const DATA_FILE = path.join(__dirname, 'quiz-data.json');

// Function to load questions from a JSON file
function loadQuestions(): Question[] {
  try {
    const filePath = path.join(__dirname, 'questions.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const questions = JSON.parse(fileContent);
    
    // 過濾掉爭議題目034 - 確保永不出現
    // 同時過濾掉被標記的題目 (markedQuestions)
    const filteredQuestions = questions.filter((q: Question) => 
      q.id !== '034' && !markedQuestions.some(marked => marked.id === q.id)
    );
    
    return filteredQuestions;
  } catch (error) {
    console.error('讀取題目檔案時發生錯誤:', error);
    return [];
  }
}

// Function to load persistent quiz data
function loadQuizData(): QuizData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
      const data = JSON.parse(fileContent);
      
      // 向後相容：如果舊檔案沒有 markedQuestions，則添加空陣列
      return {
        failedQuestions: data.failedQuestions || [],
        answeredQuestions: data.answeredQuestions || [],
        markedQuestions: data.markedQuestions || [], // 向後相容
        lastQuestionCount: data.lastQuestionCount
      };
    }
  } catch (error) {
    console.error('讀取進度檔案時發生錯誤:', error);
  }
  return { failedQuestions: [], answeredQuestions: [], markedQuestions: [] };
}

// Function to save persistent quiz data
function saveQuizData(data: QuizData): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('儲存進度檔案時發生錯誤:', error);
  }
}

// Fisher-Yates shuffle algorithm
function shuffleArray(array: Question[]): Question[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// Main quiz function
function runQuiz(questions: Question[], requestedCount: number): boolean {
  if (questions.length === 0) {
    console.log('沒有題目可供測驗。');
    return true;
  }
  
  let correctCount = 0;
  let wrongCount = 0;
  let currentFailedQuestions: Question[] = [];
  let currentAnsweredQuestions: Question[] = [];

  questions = shuffleArray(questions);
  const quizQuestions = questions.slice(0, requestedCount);

  for (let i = 0; i < quizQuestions.length; i++) {
    const q = quizQuestions[i];
    console.log(`\n第 ${i + 1} 題：${q.text}`);

    if (q.type === 'multiple-choice') {
      for (const option in q.options) {
        console.log(`  (${option}) ${q.options[option]}`);
      }
    } else {
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
        console.log(yellowText(`說明：${q.explanation}`));
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
        console.log(yellowText(`說明：${q.explanation}`));
      }
      continue;
    }
    
    const normalizedAnswer = userAnswer.toUpperCase();

    let isCorrect = false;
    if (q.type === 'multiple-choice') {
      isCorrect = normalizedAnswer === q.correctAnswer;
    } else {
      isCorrect = normalizedAnswer === q.correctAnswer;
    }

    if (isCorrect) {
      console.log(greenText('✔ 答對了！'));
      correctCount++;
      currentAnsweredQuestions.push(q);
    } else {
      console.log(redText('✘ 答錯了！'));
      console.log(`正確答案是：${q.correctAnswer}。`);
      wrongCount++;
      currentFailedQuestions.push(q);
    }
    
    // 是非題且標準答案是X時，一定顯示說明（不論答對錯）
    if (q.type === 'true-false' && q.correctAnswer === 'X' && q.explanation) {
      console.log(yellowText(`說明：${q.explanation}`));
    }
  }

  // Update failed questions (remove duplicates and add new ones)
  for (const newFailed of currentFailedQuestions) {
    const exists = failedQuestions.some(q => q.id === newFailed.id);
    if (!exists) {
      failedQuestions.push(newFailed);
    }
  }
  
  // Update answered questions (remove duplicates and add new ones)
  for (const newAnswered of currentAnsweredQuestions) {
    const exists = answeredQuestions.some(q => q.id === newAnswered.id);
    if (!exists) {
      answeredQuestions.push(newAnswered);
    }
    
    // Remove from failed questions if answered correctly
    failedQuestions = failedQuestions.filter(q => q.id !== newAnswered.id);
  }
  
  // Save progress
  const quizData: QuizData = {
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
function getQuestionCount(maxQuestions: number, lastCount?: number): number {
  const minQuestions = Math.min(1, maxQuestions);
  const defaultCount = lastCount && lastCount >= minQuestions ? lastCount : Math.min(20, maxQuestions);
  
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

// Function to select question type
function selectQuestionType(availableQuestions: Question[]): Question[] | 'exit' | 'reset' | 'reset-all' {
  const trueFalseAvailable = availableQuestions.filter(q => q.type === 'true-false');
  const multipleChoiceAvailable = availableQuestions.filter(q => q.type === 'multiple-choice');
  
  const typeOptions = [
    {
      key: '1',
      label: `是非題 (${trueFalseAvailable.length} 題)`,
      condition: () => trueFalseAvailable.length > 0,
      questions: trueFalseAvailable
    },
    {
      key: '2', 
      label: `選擇題 (${multipleChoiceAvailable.length} 題)`,
      condition: () => multipleChoiceAvailable.length > 0,
      questions: multipleChoiceAvailable
    },
    {
      key: '3',
      label: `混合題型 (${availableQuestions.length} 題)`,
      condition: () => availableQuestions.length > 0,
      questions: availableQuestions
    },
    {
      key: 'r',
      label: 'reset 重新開始 (清除答對/答錯記錄，保留標記)',
      condition: () => true
    },
    {
      key: 'R',
      label: 'reset-all 完全重置 (清除所有記錄包含標記)',
      condition: () => true
    },
    {
      key: 'q',
      label: '離開',
      condition: () => true
    }
  ];
  
  console.log('\n=== 第一步：選擇題型 ===');
  typeOptions.forEach(option => {
    if (option.condition()) {
      console.log(`${option.key}. ${option.label}`);
    }
  });
  
  const choice = readlineSync.question('請選擇題型：');
  
  const selectedOption = typeOptions.find(option => option.key === choice && option.condition());
  if (!selectedOption) {
    console.log('無效的選擇，請重新選擇。');
    return selectQuestionType(availableQuestions);
  }
  
  if (choice === 'q') return 'exit';
  if (choice === 'r') return 'reset';
  if (choice === 'R') return 'reset-all';
  
  return selectedOption.questions || [];
}

// Function to select answer history filter  
function selectAnswerFilter(selectedQuestions: Question[], failedQuestions: Question[]): Question[] | 'back' {
  const failedOfSelectedType = failedQuestions.filter(failed => 
    selectedQuestions.some(q => q.id === failed.id)
  );
  
  const filterOptions = [
    {
      key: '1',
      label: `只測驗答錯的題目 (${failedOfSelectedType.length} 題)`,
      condition: () => failedOfSelectedType.length > 0,
      questions: failedOfSelectedType
    },
    {
      key: '2',
      label: `測驗所有可用題目 (${selectedQuestions.length} 題)`,
      condition: () => selectedQuestions.length > 0,
      questions: selectedQuestions
    },
    {
      key: 'b',
      label: '返回題型選擇',
      condition: () => true
    }
  ];
  
  console.log('\n=== 第二步：選擇範圍 ===');
  filterOptions.forEach(option => {
    if (option.condition()) {
      console.log(`${option.key}. ${option.label}`);
    }
  });
  
  const choice = readlineSync.question('請選擇測驗範圍：');
  
  const selectedOption = filterOptions.find(option => option.key === choice && option.condition());
  if (!selectedOption) {
    console.log('無效的選擇，請重新選擇。');
    return selectAnswerFilter(selectedQuestions, failedQuestions);
  }
  
  if (choice === 'b') return 'back';
  
  return selectedOption.questions || [];
}

// Main function to run the application
function main(): void {
  const allQuestions: Question[] = loadQuestions();
  
  // Load previous quiz data
  const savedData = loadQuizData();
  failedQuestions = savedData.failedQuestions || [];
  answeredQuestions = savedData.answeredQuestions || [];
  markedQuestions = savedData.markedQuestions || [];
  questionCount = savedData.lastQuestionCount || 20;

  while (true) {
    // Filter out already answered questions for available pool
    const unansweredQuestions = allQuestions.filter(q => 
      !answeredQuestions.some(answered => answered.id === q.id)
    );
    
    // Show progress info
    const totalAvailableQuestions = allQuestions.length;
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
    
    // Two-stage selection process
    const typeSelection = selectQuestionType(availableQuestions);
    
    if (typeSelection === 'exit') {
      console.log('測驗已結束，謝謝使用。');
      break;
    }
    
    if (typeSelection === 'reset') {
      console.log('重設答對/答錯記錄 (保留標記)...');
      failedQuestions = [];
      answeredQuestions = [];
      const resetData: QuizData = {
        failedQuestions: [],
        answeredQuestions: [],
        markedQuestions: markedQuestions,
        lastQuestionCount: questionCount
      };
      saveQuizData(resetData);
      console.log('已清除答對/答錯記錄，標記的題目依然不會出現。');
      continue;
    }
    
    if (typeSelection === 'reset-all') {
      console.log('完全重置所有記錄 (包含標記)...');
      failedQuestions = [];
      answeredQuestions = [];
      markedQuestions = [];
      const resetAllData: QuizData = {
        failedQuestions: [],
        answeredQuestions: [],
        markedQuestions: [],
        lastQuestionCount: questionCount
      };
      saveQuizData(resetAllData);
      console.log('已清除所有記錄，包含標記的題目，所有題目將重新可用。');
      continue;
    }
    
    // Second stage: select answer history filter
    while (true) {
      const filterSelection = selectAnswerFilter(typeSelection as Question[], failedQuestions);
      
      if (filterSelection === 'back') {
        break; // Go back to type selection
      }
      
      const questionsToAsk = filterSelection as Question[];
      if (questionsToAsk.length === 0) {
        console.log('沒有符合條件的題目可供測驗。');
        continue;
      }
      
      const currentQuestionCount = getQuestionCount(questionsToAsk.length, questionCount);
      const quizCompleted = runQuiz(questionsToAsk, currentQuestionCount);
      
      // Always save progress, regardless of whether quiz was completed or quit early
      questionCount = currentQuestionCount;
      const updatedData: QuizData = {
        failedQuestions: failedQuestions,
        answeredQuestions: answeredQuestions,
        markedQuestions: markedQuestions,
        lastQuestionCount: questionCount
      };
      saveQuizData(updatedData);
      
      break; // Return to type selection after quiz
    }
  }
}

main();
