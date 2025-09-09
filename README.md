# 汽車維修測驗系統

汽車維修測驗應用程式，包含317題汽車維修題目（選擇題143題，是非題174題）。

## 功能

- 題型選擇：是非題、選擇題、混合題型
- 範圍選擇：只測驗答錯題目或測驗所有題目
- 進度追蹤：已答對、答錯待重做、永久標記
- 即時保存：每次互動後自動保存進度
- 隨機出題：Fisher-Yates 演算法確保隨機

## 使用方法

### 安裝與執行
```bash
npm install
npm run build
npm start
```

### 答題方式
**選擇題**：輸入 `1`、`2`、`3`
**是非題**：輸入 `1`/`2` 或 `O`/`X`

### 指令
- `-`：標記永不再出現
- `?`：顯示答案並加入錯題
- `q`：結束測驗
- `r`：重置答題記錄（保留標記）
- `R`：完全重置

## 開發

### 建置指令
```bash
npm run dev     # 開發模式
npm run build   # 生產建置
npx tsc         # 完整編譯（包含工具）
```

### 資料處理
```bash
npx tsc && node dist/tools/pdf-to-csv.js
npx tsc && node dist/tools/pdf-to-csv-multiple-choice.js
npx tsc && node dist/tools/csv-to-json.js
```

## 專案結構

```
src/
├── quiz.ts                 # 主程式
├── types/index.ts          # 型別定義
├── data/
│   ├── questions.json      # 題庫
│   └── quiz-data.json      # 使用者進度
└── tools/                  # 資料處理工具
```

## 題目格式

### ID格式
- 是非題：TF001-TF174
- 選擇題：MC001-MC143

### 資料格式
```typescript
interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false';
  text: string;
  correctAnswer: string;
  options?: { [key: string]: string };
  explanation?: string;
}
```

## 系統需求

- Node.js 16+
- TypeScript 5.9+