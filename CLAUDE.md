# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript-based interactive quiz application for automotive/vehicle maintenance questions. The application presents multiple-choice and true/false questions in Traditional Chinese, tracks incorrect answers, and allows users to retry failed questions.

## Architecture

- **Main Application**: `quiz.ts` - Contains the complete quiz logic, question management, and user interaction flow
- **Question Data**: `questions.json` - JSON file containing all quiz questions with Traditional Chinese text
- **Question Interface**: Defined in `quiz.ts:6-14` with support for multiple-choice and true-false question types

## Key Components

### Question Management
- Questions are loaded from `questions.json` using `loadQuestions()` function
- Questions are shuffled using Fisher-Yates algorithm via `shuffleArray()`
- Failed questions are tracked globally and can be retested separately

### User Interaction Flow
- Uses `readline-sync` for console-based user input
- Supports menu-driven interface for choosing between all questions, failed questions only, or exit
- Provides immediate feedback on correct/incorrect answers with correct answer display

### Question Types
- **Multiple Choice**: Options labeled with numbers (1, 2, 3), stored in `options` object
- **True/False**: Uses 'O' for correct (正確) and 'X' for incorrect (錯誤) answers

## Development Commands

```bash
# Compile TypeScript
npx tsc

# Run the application
node quiz.js
```

## Dependencies
- `readline-sync`: Console input handling
- `@types/node`: Node.js type definitions
- `@types/readline-sync`: TypeScript definitions for readline-sync
- `typescript`: TypeScript compiler

## File Structure
- `quiz.ts`: Main application logic
- `questions.json`: Question database with automotive maintenance questions
- `tsconfig.json`: TypeScript configuration targeting ES2016 with CommonJS modules
- `package.json`: Project dependencies and metadata