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

class CsvToJsonConverter {
  private dataDir: string;
  private outputPath: string;

  constructor() {
    this.dataDir = path.join(__dirname, '..', 'src_data');
    this.outputPath = path.join(__dirname, '..', 'data', 'questions.json');
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      
      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        // Check for escaped quote
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // Skip the next quote
        } else {
          inQuotes = false;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
      i++;
    }
    
    result.push(current);
    return result;
  }

  private parseMultipleChoiceCsv(): Question[] {
    const csvPath = path.join(this.dataDir, 'multiple-choice-questions.csv');
    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.trim().split('\n');
    const questions: Question[] = [];

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const fields = this.parseCsvLine(lines[i]);
      if (fields.length >= 5) {
        const [id, type, text, optionsJson, correctAnswer] = fields;
        
        try {
          // Parse options JSON and unescape quotes
          const unescapedJson = optionsJson.replace(/""/g, '"');
          const options = JSON.parse(unescapedJson);
          
          questions.push({
            id: id.padStart(3, '0'),
            type: 'multiple-choice',
            text: text,
            options: options,
            correctAnswer: correctAnswer
          });
        } catch (error) {
          console.warn(`Failed to parse multiple-choice question ${id}: ${error}`);
        }
      }
    }

    return questions;
  }

  // 說明對應表
  private explanationMap: { [key: string]: string } = {
    // 柴油引擎錯誤觀念
    '柴油引擎，是用火星塞點火的': '柴油引擎靠壓縮空氣產生高溫使燃料著火燃燒',
    '柴油引擎若因缺油不能發動，應拆開柴油噴射泵檢查': '應檢查燃料供應系統，不應隨意拆卸精密部件',
    '柴油引擎在高轉速時，容易產生爆震': '柴油引擎較不易產生爆震，汽油引擎才容易在高轉速時爆震',
    '柴油引擎裝設預熱塞是為了行駛中，柴油容易著火燃燒': '預熱塞是為了冷車啟動時提供額外熱源，幫助冷引擎發動',
    '柴油進入汽缸是靠化油器供應燃料': '柴油進入汽缸是靠噴射泵與噴油嘴',
    
    // 安全作業錯誤觀念
    '可傾斜式駕駛室例行的檢查保養，由於工作簡單，只要將駕駛室傾斜到一 半，即可進行作業，無須先做好其它安全配合措施': '必須將駕駛室完全傾斜到定位，並確實掛上安全鉤才能進行作業',
    
    // 煞車系統錯誤觀念
    '發現空氣壓縮機充氣時間比平時長，只要氣壓足夠，可不必理會': '充氣時間變長表示系統有問題，需立即檢修',
    '煞車壓力警告燈未熄滅，且蜂鳴器未停止鳴叫，以低速行駛並不會有危 險': '這是危險警訊，不可繼續行駛',
    '煞車時，若車輪鎖死，則煞車效能會增加，但車子會失去方向控制性能': '車輪鎖死時煞車效能會降低，且車子會失去方向控制性能',
    '為節省油料及減少引擎負荷，行駛下坡路段時，可換空檔或踩下離合器踏 板': '下坡時應使用適當檔位配合引擎煞車，不可空檔滑行',
    
    // 冷卻系統錯誤觀念  
    '冷卻系統只要副水箱在滿水位，主水箱不必檢查也不會有問題': '主水箱也需要定期檢查水位和水質',
    '引擎冷卻水內含有防凍液或防銹劑，可不必更換': '冷卻水需要定期更換，防凍液和防銹劑會隨時間失效',
    '引擎運轉中，冷卻系統副水箱液面愈來愈低，表示正常現象': '這表示冷卻系統有洩漏，需要檢修',
    
    // 其他錯誤觀念
    '煞車時有異音，是正常的情況，不必檢修': '煞車時有異音是煞車系統不正常的現象，應停車檢查',
    '手煞車未放鬆，對起步沒有什麼影響': '手煞車未放鬆會影響起步並造成煞車片磨損',
    '手煞車與腳煞車不能同時併用': '在某些情況下可以併用，如駐車時',
    '汽車行駛中發現前有障礙物，由踩煞車時算起直到車子完全停止的距離叫 做反應距離': '這是煞車距離，反應距離是指駕駛人發現危險到開始踩煞車的距離',
    '煞車總泵的油量不足，空氣不會滲入': '油量不足時空氣容易滲入系統',
    '輪胎上沾有機油、黃油並無害處': '會影響輪胎性能和安全性',
    '輪胎因長時間行駛而發熱時，應潑冷水冷卻': '不應用冷水沖洗，會造成輪胎損傷',
    '汽車裝載超重，不影響轉向機構': '會影響轉向機構和其他底盤系統',
    '動力轉向之汽車，引擎熄火後，轉向所需操作力不受影響': '引擎熄火後轉向會變得沉重',
    '由前進檔換入倒檔，或由倒檔換入前進檔，不一定要停車後再操作': '一定要汽車完全停止後再操作',
    '輪胎氣壓逾高，與地面摩擦阻力逾大': '氣壓過高時與地面接觸面積減小，摩擦阻力較小',
    '碟式煞車與鼓式煞車，均須調整來令片的間隙': '碟式煞車會自動調整間隙',
    '為了節省煞車油，使用過的煞車油可再重複使用': '煞車油需定期更換，不可重複使用',
    '同時混用不同廠牌、規格之煞車油，可以確保煞車系統作用正常': '不可混用不同規格的煞車油',
    '汽車陷入泥沼中，需以高速檔來使汽車脫離泥沼': '應使用低速檔提供較大扭力',
    '自排車起動引擎時，一定要將排檔桿置於Ｄ檔才能使起動馬達運轉': '應置於P檔或N檔',
    '檢查自動變速箱油量時，如發現有燒焦味，且顏色變黑色或白色乳狀，表 示正常現象': '這是異常現象，需要檢修',
    '自動變速箱油（ＡＴＦ）之正常顏色為藍色': '正常顏色為透明的紅色',
    '自排車上陡坡時，排檔桿要置於Ｄ檔': '需排入較低檔位',
    '動力轉向系統漏油時，方向盤就完全無法轉動': '仍可轉動但會變得沉重',
    '有ＡＢＳ煞車系統的汽車，煞車性能較優，可以不用保持適當的安全距離': '仍需保持適當安全距離',
    '同軸的車輪，可以裝用不同花紋與不同規格之輪胎': '同軸車輪應使用相同規格輪胎',
    '電瓶放電後，不再充電，則電瓶液比重會升高': '電瓶放電後比重會降低',
    '引擎發動失敗後，不必等到引擎完全靜止，可再立即運轉起動馬達': '應等引擎完全停止後再啟動',
    '保險絲燒斷，可用銅線代替，以免燒斷再換，增添麻煩': '需更換安培數相同之保險絲',
    '汽車上之起動馬達，是用來發電': '起動馬達是用來啟動引擎',
    '電瓶蓋上的通氣孔是添加電瓶液用，不應該使它阻塞': '通氣孔是用來通氣，不是添加電瓶液用',
    '流向火星塞之電流，是低壓電流': '是高壓電流',
    '高壓線圈是用來將高壓電變成低壓電': '是將低壓電變成高壓電',
    '引擎發動中，充電指示燈熄滅，表示電瓶放電': '表示發電機正常發電',
    '冷引擎運轉，電動式冷卻風扇，隨著引擎轉動即開始不停地送風冷卻': '電動風扇由溫度控制，不隨引擎轉動',
    '電瓶無電或電力不足，不會影響高壓電': '會影響高壓電的產生',
    '起動引擎時所用的電源，是發電機供給的': '是電瓶供給的',
    '電瓶液不足使極板裸露，若繼續使用，不會影響電瓶壽命': '會嚴重影響電瓶壽命',
    '裝觸媒轉換器之汽油車可以添加高級汽油': '必須使用無鉛汽油',
    '檢查引擎機油時，車子要停在平坦地面且在引擎運轉中檢查': '應在引擎停止且冷卻後檢查',
    '為提升引擎動力，可拆下消音器': '不應拆下消音器，會增加噪音污染',
    '拆下引擎冷卻系統之節溫器，可節省燃料消耗': '會影響引擎正常工作溫度，不節省燃料',
    '拆下引擎冷卻系統之節溫器，並不影響引擎壽命': '會影響引擎壽命',
    '汽車行駛速度愈高愈省油，故引擎轉速可以無限制地提升': '有最佳經濟車速，過高轉速反而耗油',
    '汽油車排放黑煙是正常現象': '汽油車排放黑煙是異常現象',
    '汽車耗費燃油之原因係引擎機件不良所引起，與駕駛行為無關': '駕駛行為也會影響油耗',
    '只要冷卻水足夠，引擎就不會過熱': '還需要冷卻系統其他部件正常工作',
    '自動排檔汽車，當電瓶電力不足以起動引擎時，可以用推車方式使引擎發 動': '自排車無法用推車方式發動引擎',
    '自動排檔汽車將排檔桿放置於Ｎ或Ｐ檔以外之檔位，仍可起動引擎': '只能在P檔或N檔起動引擎',
    '引擎運轉中電動式冷卻風扇不轉動，可用手撥動': '不可用手撥動，危險且可能損壞',
    '夜間黑暗處檢查電瓶液時，可用打火機點火在電瓶附近當作照明工具': '絕對不可使用明火，電瓶會產生易燃氣體',
    '拆除汽車上的電瓶時，應先拆除電瓶的火線（正極）': '應先拆除負極',
    '汽車冷氣壓縮機內之冷凍油，可以使用一般引擎機油': '需使用專用冷凍油',
    '４ＷＤ代表四輪轉向的意思': '4WD代表四輪驅動',
    '4WD代表四輪轉向的意思': '4WD代表四輪驅動',
    '手自排與自手排汽車之變速箱內部的構造與零件，是完全一樣': '構造和零件不完全一樣',
    '柴油引擎裝設預熱塞之目的，是使汽車行駛中柴油容易著火燃燒': '預熱塞是為了冷車啟動時提供額外熱源，幫助冷引擎發動',
    '發現空氣壓縮機充氣的時間比平時長，只要氣壓足夠可不必理會': '充氣時間變長表示系統有問題，需立即檢修',
    '引擎運轉中冷卻系統副水箱之液面愈來愈低，表示正常現象': '這表示冷卻系統有洩漏，需要檢修'
  };

  private getExplanationForQuestion(text: string, correctAnswer: string): string | undefined {
    if (correctAnswer !== 'X') {
      return undefined; // 只有答案為X的是非題才需要說明
    }
    
    // 清理題目文本 - 移除編號、標點、空格
    const cleanText = text
      .replace(/^\d+\s*/, '') // 移除開頭編號
      .replace(/[，。、：；]/g, '') // 移除中文標點
      .replace(/\s+/g, '') // 移除所有空格
      .trim();
    
    // 直接匹配
    if (this.explanationMap[cleanText]) {
      return this.explanationMap[cleanText];
    }
    
    // 智能匹配 - 清理對應表的key並比較
    for (const key in this.explanationMap) {
      const cleanKey = key
        .replace(/[，。、：；]/g, '') // 移除中文標點
        .replace(/\s+/g, '') // 移除所有空格
        .trim();
      
      // 完全匹配
      if (cleanText === cleanKey) {
        return this.explanationMap[key];
      }
      
      // 相似度匹配 (80%以上相似)
      if (cleanText.length > 10 && cleanKey.length > 10) {
        const similarity = this.calculateSimilarity(cleanText, cleanKey);
        if (similarity > 0.8) {
          return this.explanationMap[key];
        }
      }
    }
    
    return undefined;
  }
  
  // 計算字符串相似度
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
      return 1.0;
    }
    
    let matches = 0;
    const minLength = Math.min(str1.length, str2.length);
    
    // 計算共同字符數
    for (let i = 0; i < minLength; i++) {
      if (str1[i] === str2[i]) {
        matches++;
      }
    }
    
    // 也檢查包含關係
    if (longer.includes(shorter) || shorter.includes(longer)) {
      return Math.max(matches / longer.length, shorter.length / longer.length);
    }
    
    return matches / longer.length;
  }

  private parseTrueFalseCsv(): Question[] {
    const csvPath = path.join(this.dataDir, 'true-false-questions.csv');
    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.trim().split('\n');
    const questions: Question[] = [];

    // Skip header line
    for (let i = 1; i < lines.length; i++) {
      const fields = this.parseCsvLine(lines[i]);
      if (fields.length >= 4) {
        const [id, type, text, correctAnswer] = fields;
        
        const question: Question = {
          id: id.padStart(3, '0'),
          type: 'true-false',
          text: text,
          correctAnswer: correctAnswer
        };

        // 自動添加說明（如果答案是X）
        const explanation = this.getExplanationForQuestion(text, correctAnswer);
        if (explanation) {
          question.explanation = explanation;
        }

        questions.push(question);
      }
    }

    return questions;
  }

  private sortQuestions(questions: Question[]): Question[] {
    return questions.sort((a, b) => {
      // First sort by type (multiple-choice first, then true-false)
      if (a.type !== b.type) {
        return a.type === 'multiple-choice' ? -1 : 1;
      }
      // Then sort by id within each type
      return a.id.localeCompare(b.id);
    });
  }

  async convertCsvToJson(): Promise<void> {
    try {
      console.log('正在讀取選擇題CSV檔案...');
      const multipleChoiceQuestions = this.parseMultipleChoiceCsv();
      console.log(`成功讀取 ${multipleChoiceQuestions.length} 題選擇題`);

      console.log('正在讀取是非題CSV檔案...');
      const trueFalseQuestions = this.parseTrueFalseCsv();
      console.log(`成功讀取 ${trueFalseQuestions.length} 題是非題`);

      // Combine and sort questions
      const allQuestions = [...multipleChoiceQuestions, ...trueFalseQuestions];
      const sortedQuestions = this.sortQuestions(allQuestions);

      // Write to JSON file
      const jsonContent = JSON.stringify(sortedQuestions, null, 2);
      fs.writeFileSync(this.outputPath, jsonContent, 'utf-8');

      console.log(`成功生成 questions.json 檔案: ${this.outputPath}`);
      console.log(`總題數: ${sortedQuestions.length} 題`);
      console.log(`選擇題: ${multipleChoiceQuestions.length} 題`);
      console.log(`是非題: ${trueFalseQuestions.length} 題`);

    } catch (error) {
      console.error('轉換過程發生錯誤:', error);
      throw error;
    }
  }
}

// Main execution
async function main() {
  const converter = new CsvToJsonConverter();
  await converter.convertCsvToJson();
}

if (require.main === module) {
  main().catch(console.error);
}

export { CsvToJsonConverter };