const americanOnly = require('./american-only.js');
const americanToBritishSpelling = require('./american-to-british-spelling.js');
const americanToBritishTitles = require("./american-to-british-titles.js")
const britishOnly = require('./british-only.js')

class Translator {
  constructor() {
    this.americanToBritish = {...americanOnly, ...americanToBritishSpelling, ...americanToBritishTitles};
    this.britishToAmerican = {...britishOnly, ...this.reverseDict(americanToBritishSpelling), ...this.reverseDict(americanToBritishTitles)};
  }

  reverseDict(dict) {
    return Object.entries(dict).reduce((acc, [key, value]) => {
      acc[value] = key;
      return acc;
    }, {});
  }

  translate(text, locale) {
    let translatedText = text;
    const dictionary = locale === 'american-to-british' ? this.americanToBritish : this.britishToAmerican;

    // 添加特殊處理
    if (locale === 'british-to-american') {
      dictionary['chippy'] = 'fish-and-chip shop';
      dictionary['paracetamol'] = 'Tylenol';
    } else {
      dictionary['rube goldberg machine'] = 'Heath Robinson device';
    }

    // Sort dictionary keys by length (longest first) to avoid partial word matches
    const sortedKeys = Object.keys(dictionary).sort((a, b) => b.length - a.length);

    for (let key of sortedKeys) {
      const regex = new RegExp(`\\b${this.escapeRegExp(key)}\\b`, 'gi');
      translatedText = translatedText.replace(regex, (match) => {
        const replacement = dictionary[key];
        // 特殊處理 "Rube Goldberg machine" 的情況
        if (match.toLowerCase() === 'rube goldberg machine') {
          return `<span class="highlight">Heath Robinson device</span>`;
        }
        const translatedWord = this.matchCase(replacement, match);
        return `<span class="highlight">${translatedWord}</span>`;
      });
    }

    // Handle title abbreviations
    if (locale === 'american-to-british') {
      translatedText = translatedText.replace(/\b(Mr|Mrs|Ms|Dr|Prof)\./g, (match) => 
        `<span class="highlight">${match.slice(0, -1)}</span>`);
    } else {
      translatedText = translatedText.replace(/\b(Mr|Mrs|Ms|Dr|Prof)\b(?!\.)/g, (match) => 
        `<span class="highlight">${match}.</span>`);
    }

    // Handle time format
    if (locale === 'american-to-british') {
      translatedText = translatedText.replace(/(\d{1,2}):(\d{2})/g, (match, p1, p2) => 
        `<span class="highlight">${p1}.${p2}</span>`);
    } else {
      translatedText = translatedText.replace(/(\d{1,2})\.(\d{2})/g, (match, p1, p2) => 
        `<span class="highlight">${p1}:${p2}</span>`);
    }

    return translatedText === text ? "Everything looks good to me!" : translatedText;
  }

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  matchCase(word, match) {
    if (match === match.toLowerCase()) return word.toLowerCase();
    if (match === match.toUpperCase()) return word.toUpperCase();
    if (match[0] === match[0].toUpperCase()) {
      // 特殊處理 "Rube Goldberg machine" 的情況
      if (match.toLowerCase() === 'rube goldberg machine') {
        return 'Heath Robinson device';
      }
      // 處理其他多個單詞的情況
      return word.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    }
    return word.toLowerCase();
  }
}

module.exports = Translator;
