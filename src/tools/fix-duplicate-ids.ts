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

function fixDuplicateIds() {
  const questionsPath = path.join(__dirname, '..', '..', 'src', 'data', 'questions.json');
  const backupPath = path.join(__dirname, '..', '..', 'src', 'data', 'questions.json.backup');
  
  console.log('Loading questions...');
  const questions: Question[] = JSON.parse(fs.readFileSync(questionsPath, 'utf-8'));
  
  // Create backup
  console.log('Creating backup...');
  fs.copyFileSync(questionsPath, backupPath);
  
  console.log(`Total questions: ${questions.length}`);
  
  // Separate by type and assign new IDs
  const trueFalseQuestions = questions.filter(q => q.type === 'true-false');
  const multipleChoiceQuestions = questions.filter(q => q.type === 'multiple-choice');
  
  console.log(`True-false questions: ${trueFalseQuestions.length}`);
  console.log(`Multiple-choice questions: ${multipleChoiceQuestions.length}`);
  
  // Assign new IDs with type prefixes
  trueFalseQuestions.forEach((q, index) => {
    q.id = `TF${String(index + 1).padStart(3, '0')}`;
  });
  
  multipleChoiceQuestions.forEach((q, index) => {
    q.id = `MC${String(index + 1).padStart(3, '0')}`;
  });
  
  // Combine and sort by new ID
  const fixedQuestions = [...trueFalseQuestions, ...multipleChoiceQuestions]
    .sort((a, b) => a.id.localeCompare(b.id));
  
  console.log('Writing fixed questions...');
  fs.writeFileSync(questionsPath, JSON.stringify(fixedQuestions, null, 2), 'utf-8');
  
  // Verify fix
  const uniqueIds = new Set(fixedQuestions.map(q => q.id));
  console.log(`Fixed! Unique IDs: ${uniqueIds.size}, Total questions: ${fixedQuestions.length}`);
  
  if (uniqueIds.size === fixedQuestions.length) {
    console.log('✅ Success: All IDs are now unique!');
  } else {
    console.log('❌ Error: Still have duplicate IDs!');
  }
  
  // Show sample of new IDs
  console.log('\nSample new IDs:');
  console.log('True-false:', trueFalseQuestions.slice(0, 3).map(q => q.id).join(', '));
  console.log('Multiple-choice:', multipleChoiceQuestions.slice(0, 3).map(q => q.id).join(', '));
}

if (require.main === module) {
  fixDuplicateIds();
}