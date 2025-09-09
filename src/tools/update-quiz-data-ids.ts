#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';

interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false';
  text: string;
  correctAnswer: string;
  options?: { [key: string]: string };
  explanation?: string;
}

interface QuizData {
  failedQuestions: Question[];
  answeredQuestions: Question[];
  markedQuestions: Question[];
}

function updateQuizDataIds() {
  const questionsPath = path.join(__dirname, '..', '..', 'src', 'data', 'questions.json');
  const quizDataPath = path.join(__dirname, '..', '..', 'src', 'data', 'quiz-data.json');
  const backupPath = path.join(__dirname, '..', '..', 'src', 'data', 'quiz-data.json.backup');
  
  console.log('Loading updated questions database...');
  const questions: Question[] = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));
  
  console.log('Loading quiz data...');
  const quizData: QuizData = JSON.parse(fs.readFileSync(quizDataPath, 'utf-8'));
  
  // Create backup
  console.log('Creating backup...');
  fs.copyFileSync(quizDataPath, backupPath);
  
  // Create mapping from old ID + type to new ID
  const idMapping = new Map<string, string>();
  
  questions.forEach(q => {
    if (q.id.startsWith('TF')) {
      // True-false question, old ID would be the number part
      const oldId = q.id.substring(2).replace(/^0+/, '') || '0';
      idMapping.set(`${oldId}-true-false`, q.id);
    } else if (q.id.startsWith('MC')) {
      // Multiple-choice question
      const oldId = q.id.substring(2).replace(/^0+/, '') || '0';
      idMapping.set(`${oldId}-multiple-choice`, q.id);
    }
  });
  
  console.log(`Created ${idMapping.size} ID mappings`);
  
  function updateQuestionArray(questionArray: Question[], arrayName: string): Question[] {
    const updated: Question[] = [];
    let updatedCount = 0;
    let notFoundCount = 0;
    
    questionArray.forEach(q => {
      const key = `${q.id}-${q.type}`;
      const newId = idMapping.get(key);
      
      if (newId) {
        // Find the full question data with new ID
        const fullQuestion = questions.find(fq => fq.id === newId);
        if (fullQuestion) {
          updated.push(fullQuestion);
          updatedCount++;
        } else {
          console.log(`Warning: Question with new ID ${newId} not found in database`);
          notFoundCount++;
        }
      } else {
        console.log(`Warning: No mapping found for ${arrayName} question ID ${q.id} type ${q.type}`);
        notFoundCount++;
      }
    });
    
    console.log(`${arrayName}: Updated ${updatedCount}, Not found ${notFoundCount}`);
    return updated;
  }
  
  const updatedQuizData: QuizData = {
    failedQuestions: updateQuestionArray(quizData.failedQuestions, 'Failed'),
    answeredQuestions: updateQuestionArray(quizData.answeredQuestions, 'Answered'),
    markedQuestions: updateQuestionArray(quizData.markedQuestions, 'Marked')
  };
  
  console.log('Writing updated quiz data...');
  fs.writeFileSync(quizDataPath, JSON.stringify(updatedQuizData, null, 2), 'utf-8');
  
  console.log('✅ Quiz data IDs updated successfully!');
  console.log(`Failed: ${updatedQuizData.failedQuestions.length}`);
  console.log(`Answered: ${updatedQuizData.answeredQuestions.length}`);
  console.log(`Marked: ${updatedQuizData.markedQuestions.length}`);
}

if (require.main === module) {
  updateQuizDataIds();
}