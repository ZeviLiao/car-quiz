import * as readlineSync from 'readline-sync';
import * as fs from 'fs';
import * as path from 'path';
import { Question, QuizData, colors } from './types';

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


let failedQuestions: Question[] = [];
let answeredQuestions: Question[] = [];
let markedQuestions: Question[] = [];
const DATA_FILE = path.join(__dirname, '..', 'src', 'data', 'quiz-data.json');

// Function to load questions from a JSON file
function loadQuestions(excludeMarked: Question[] = []): Question[] {
  try {
    const filePath = path.join(__dirname, '..', 'src', 'data', 'questions.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const questions = JSON.parse(fileContent);
    
    // 過濾掉爭議題目034和被標記的題目
    return questions.filter((q: Question) => 
      q.id !== '034' && !excludeMarked.some(marked => marked.id === q.id)
    );
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
      
      return {
        failedQuestions: data.failedQuestions || [],
        answeredQuestions: data.answeredQuestions || [],
        markedQuestions: data.markedQuestions || []
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

// Helper function to save progress immediately
function saveProgressImmediately(): void {
  const quizData: QuizData = {
    failedQuestions: failedQuestions,
    answeredQuestions: answeredQuestions,
    markedQuestions: markedQuestions
  };
  saveQuizData(quizData);
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
function runQuiz(questions: Question[]): boolean {
  if (questions.length === 0) {
    console.log('沒有題目可供測驗。');
    return true;
  }
  
  let correctCount = 0;
  let wrongCount = 0;
  questions = shuffleArray(questions);

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    console.log(`\n第 ${i + 1} 題：${q.text}`);

    if (q.type === 'multiple-choice') {
      for (const option in q.options) {
        console.log(`  (${option}) ${q.options[option]}`);
      }
    } else {
      console.log('  請選擇：');
      console.log('  (1) 正確 (O)');
      console.log('  (2) 錯誤 (X)');
      console.log('  或直接回答 O/o (正確) 或 X/x (錯誤)');
    }
    
    console.log('  或輸入：');
    console.log('    - : 標記此題永不再出現');
    console.log('    ? : 不知道答案，顯示答案後加入錯題');
    console.log('    q : 返回主選單');

    const userAnswer = readlineSync.question('您的答案：');
    
    // Check if user wants to quit
    if (userAnswer.toLowerCase() === 'q') {
      // Show round summary before quitting
      const totalAnswered = correctCount + wrongCount;
      if (totalAnswered > 0) {
        const percentage = Math.round((correctCount / totalAnswered) * 100);
        console.log('\n--- 本輪測驗成果 ---');
        console.log(`總答題數：${totalAnswered}`);
        console.log(`答對：${correctCount}`);
        console.log(`答錯：${wrongCount}`);
        console.log(`正確率：${percentage}%`);
      }
      console.log('\n返回主選單...');
      return false;
    }
    
    // Handle special commands
    if (userAnswer === '-') {
      console.log('📝 此題已標記為永不再出現');
      console.log(`正確答案是：${q.correctAnswer}`);
      markedQuestions.push(q);
      
      if (q.type === 'true-false' && q.correctAnswer === 'X' && q.explanation) {
        console.log(yellowText(`說明：${q.explanation}`));
      }
      
      saveProgressImmediately();
      continue;
    }
    
    if (userAnswer === '?') {
      console.log('❓ 不知道答案...');
      console.log(`正確答案是：${q.correctAnswer}`);
      wrongCount++;
      
      const exists = failedQuestions.some(failed => failed.id === q.id);
      if (!exists) {
        failedQuestions.push(q);
      }
      
      if (q.type === 'true-false' && q.correctAnswer === 'X' && q.explanation) {
        console.log(yellowText(`說明：${q.explanation}`));
      }
      
      saveProgressImmediately();
      continue;
    }
    
    // Check answer
    let normalizedAnswer = userAnswer.toUpperCase();
    
    // Convert numeric input for true/false questions
    if (q.type === 'true-false') {
      const numericMap: { [key: string]: string } = { '1': 'O', '2': 'X' };
      normalizedAnswer = numericMap[userAnswer] || normalizedAnswer;
    }
    
    const isCorrect = normalizedAnswer === q.correctAnswer;

    if (isCorrect) {
      console.log(greenText('✔ 答對了！'));
      correctCount++;
      
      const exists = answeredQuestions.some(answered => answered.id === q.id);
      if (!exists) {
        answeredQuestions.push(q);
      }
      
      // Remove from failed questions if answered correctly
      failedQuestions = failedQuestions.filter(failed => failed.id !== q.id);
    } else {
      console.log(redText('✘ 答錯了！'));
      console.log(`正確答案是：${q.correctAnswer}。`);
      wrongCount++;
      
      const exists = failedQuestions.some(failed => failed.id === q.id);
      if (!exists) {
        failedQuestions.push(q);
      }
    }
    
    // Show explanation for true-false X questions
    if (q.type === 'true-false' && q.correctAnswer === 'X' && q.explanation) {
      console.log(yellowText(`說明：${q.explanation}`));
    }
    
    // Save progress immediately after each question
    saveProgressImmediately();
  }

  console.log('\n---');
  console.log('測驗結束！');
  console.log(`總題數：${questions.length}`);
  console.log(`答對：${correctCount}`);
  console.log(`答錯：${wrongCount}`);
  
  return true;
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
  // Determine the type(s) from selectedQuestions
  const selectedTypes = [...new Set(selectedQuestions.map(q => q.type))];
  
  // Filter failed questions by the same type(s)
  const failedOfSelectedType = failedQuestions.filter(failed => 
    selectedTypes.includes(failed.type)
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
  // Load previous quiz data first
  const savedData = loadQuizData();
  failedQuestions = savedData.failedQuestions || [];
  answeredQuestions = savedData.answeredQuestions || [];
  markedQuestions = savedData.markedQuestions || [];

  while (true) {
    // Reload quiz data at the start of each loop (important for reset)
    const currentData = loadQuizData();
    failedQuestions = currentData.failedQuestions || [];
    answeredQuestions = currentData.answeredQuestions || [];
    markedQuestions = currentData.markedQuestions || [];
    
    // Load questions with current filtering (updates after reset)
    const allQuestions: Question[] = loadQuestions(markedQuestions);
    // Filter out already answered questions for available pool
    const unansweredQuestions = allQuestions.filter(q => 
      !answeredQuestions.some(answered => answered.id === q.id)
    );
    
    // Show progress info with type breakdown
    const totalAvailableQuestions = allQuestions.length;
    const totalTrueFalse = allQuestions.filter(q => q.type === 'true-false').length;
    const totalMultipleChoice = allQuestions.filter(q => q.type === 'multiple-choice').length;
    
    const markedTrueFalse = markedQuestions.filter(q => q.type === 'true-false').length;
    const markedMultipleChoice = markedQuestions.filter(q => q.type === 'multiple-choice').length;
    
    const answeredTrueFalse = answeredQuestions.filter(q => q.type === 'true-false').length;
    const answeredMultipleChoice = answeredQuestions.filter(q => q.type === 'multiple-choice').length;
    
    const failedTrueFalse = failedQuestions.filter(q => q.type === 'true-false').length;
    const failedMultipleChoice = failedQuestions.filter(q => q.type === 'multiple-choice').length;
    
    const remainingTrueFalse = unansweredQuestions.filter(q => q.type === 'true-false').length;
    const remainingMultipleChoice = unansweredQuestions.filter(q => q.type === 'multiple-choice').length;
    
    console.log('\n=== 測驗進度 ===');
    console.log(`可用題數：${totalAvailableQuestions} (是非${totalTrueFalse}題, 選擇${totalMultipleChoice}題)`);
    console.log(`已標記永不出現：${markedQuestions.length} (是非${markedTrueFalse}題, 選擇${markedMultipleChoice}題)`);
    console.log(`已答對：${answeredQuestions.length} (是非${answeredTrueFalse}題, 選擇${answeredMultipleChoice}題)`);
    console.log(`答錯待重做：${failedQuestions.length} (是非${failedTrueFalse}題, 選擇${failedMultipleChoice}題)`);
    console.log(`尚未作答：${unansweredQuestions.length} (是非${remainingTrueFalse}題, 選擇${remainingMultipleChoice}題)`);
    
    // Show available questions breakdown for question type selection
    const availableForTestingTF = remainingTrueFalse + failedTrueFalse;
    const availableForTestingMC = remainingMultipleChoice + failedMultipleChoice;
    console.log(`--- 可測驗題目分析 ---`);
    console.log(`可測驗是非題：${availableForTestingTF} = 未答${remainingTrueFalse} + 答錯${failedTrueFalse}`);
    console.log(`可測驗選擇題：${availableForTestingMC} = 未答${remainingMultipleChoice} + 答錯${failedMultipleChoice}`);
    
    // Create available question pool (unanswered + failed, but avoid duplicates)
    const failedQuestionIds = new Set(failedQuestions.map(q => q.id));
    const availableQuestions = [
      ...unansweredQuestions.filter(q => !failedQuestionIds.has(q.id)),
      ...failedQuestions
    ];
    
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
        markedQuestions: markedQuestions
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
        markedQuestions: []
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
      
      console.log(`\n開始測驗！共 ${questionsToAsk.length} 題，隨時可按 q 離開。`);
      runQuiz(questionsToAsk);
      
      break; // Return to type selection after quiz
    }
  }
}

main();