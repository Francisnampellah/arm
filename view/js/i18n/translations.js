import { en } from './en.js';
import { ja } from './ja.js';

const translations = { en, ja };
let currentLang = localStorage.getItem('language') || 'en';

export function t(key, params = {}) {
    let text = translations[currentLang][key] || translations['en'][key] || key;
    
    // Replace {variable} with values
    Object.keys(params).forEach(param => {
        text = text.replace(`{${param}}`, params[param]);
    });
    
    return text;
}

export function setLanguage(lang) {
    if (translations[lang]) {
        currentLang = lang;
        localStorage.setItem('language', lang);
        return true;
    }
    return false;
}

export function getCurrentLanguage() {
    return currentLang;
}

export function getSupportedLanguages() {
    return Object.keys(translations);
}