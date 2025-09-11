import React, { useState } from 'react';
import type { NewsArticle } from '../types';
import { ShareIcon, TranslateIcon, SparklesIcon } from './Icons';
import { analyzeNewsArticle } from '../services/geminiService';
import { LoadingSpinner } from './Icons';

const languages = [
    { code: 'af', name: 'Afrikan dili' }, { code: 'sq', name: 'Alban dili' }, { code: 'am', name: 'Amhar dili' },
    { code: 'ar', name: 'Ərəb dili' }, { code: 'hy', name: 'Erməni dili' }, { code: 'az', name: 'Azərbaycan dili' },
    { code: 'eu', name: 'Bask dili' }, { code: 'be', name: 'Belarus dili' }, { code: 'bn', name: 'Benqal dili' },
    { code: 'bs', name: 'Bosniya dili' }, { code: 'bg', name: 'Bolqar dili' }, { code: 'ca', name: 'Katalan dili' },
    { code: 'ceb', name: 'Sebuano dili' }, { code: 'ny', name: 'Çiçeva dili' }, { code: 'zh-CN', name: 'Çin dili (Sadələşdirilmiş)' },
    { code: 'zh-TW', name: 'Çin dili (Ənənəvi)' }, { code: 'co', name: 'Korsika dili' }, { code: 'hr', name: 'Xorvat dili' },
    { code: 'cs', name: 'Çex dili' }, { code: 'da', name: 'Danimarka dili' }, { code: 'nl', name: 'Holland dili' },
    { code: 'en', name: 'İngilis dili' }, { code: 'eo', name: 'Esperanto' }, { code: 'et', name: 'Eston dili' },
    { code: 'tl', name: 'Filippin dili' }, { code: 'fi', name: 'Fin dili' }, { code: 'fr', name: 'Fransız dili' },
    { code: 'fy', name: 'Friz dili' }, { code: 'gl', name: 'Qalisian dili' }, { code: 'ka', name: 'Gürcü dili' },
    { code: 'de', name: 'Alman dili' }, { code: 'el', name: 'Yunan dili' }, { code: 'gu', name: 'Qucarat dili' },
    { code: 'ht', name: 'Haiti kreol dili' }, { code: 'ha', name: 'Hausa dili' }, { code: 'haw', name: 'Havay dili' },
    { code: 'iw', name: 'İvrit dili' }, { code: 'hi', name: 'Hind dili' }, { code: 'hmn', name: 'Hmonq dili' },
    { code: 'hu', name: 'Macar dili' }, { code: 'is', name: 'İsland dili' }, { code: 'ig', name: 'İqbo dili' },
    { code: 'id', name: 'İndoneziya dili' }, { code: 'ga', name: 'İrland dili' }, { code: 'it', name: 'İtalyan dili' },
    { code: 'ja', name: 'Yapon dili' }, { code: 'jw', name: 'Yava dili' }, { code: 'kn', name: 'Kannada dili' },
    { code: 'kk', name: 'Qazax dili' }, { code: 'km', name: 'Kxmer dili' }, { code: 'ko', name: 'Koreya dili' },
    { code: 'ku', name: 'Kürd dili (Kurmanci)' }, { code: 'ky', name: 'Qırğız dili' }, { code: 'lo', name: 'Lao dili' },
    { code: 'la', name: 'Latın dili' }, { code: 'lv', name: 'Latış dili' }, { code: 'lt', name: 'Litva dili' },
    { code: 'lb', name: 'Lüksemburq dili' }, { code: 'mk', name: 'Makedon dili' }, { code: 'mg', name: 'Malaqas dili' },
    { code: 'ms', name: 'Malay dili' }, { code: 'ml', name: 'Malayalam dili' }, { code: 'mt', name: 'Malta dili' },
    { code: 'mi', name: 'Maori dili' }, { code: 'mr', name: 'Marati dili' }, { code: 'mn', name: 'Monqol dili' },
    { code: 'my', name: 'Myanma (Birma) dili' }, { code: 'ne', name: 'Nepal dili' }, { code: 'no', name: 'Norveç dili' },
    { code: 'ps', name: 'Puştu dili' }, { code: 'fa', name: 'Fars dili' }, { code: 'pl', name: 'Polyak dili' },
    { code: 'pt', name: 'Portuqal dili' }, { code: 'pa', name: 'Pəncab dili' }, { code: 'ro', name: 'Rumın dili' },
    { code: 'ru', name: 'Rus dili' }, { code: 'sm', name: 'Samoa dili' }, { code: 'gd', name: 'Şotland kelt dili' },
    { code: 'sr', name: 'Serb dili' }, { code: 'st', name: 'Sesoto dili' }, { code: 'sn', name: 'Şona dili' },
    { code: 'sd', name: 'Sindhi dili' }, { code: 'si', name: 'Sinxal dili' }, { code: 'sk', name: 'Slovak dili' },
    { code: 'sl', name: 'Sloven dili' }, { code: 'so', name: 'Somali dili' }, { code: 'es', name: 'İspan dili' },
    { code: 'su', name: 'Sundan dili' }, { code: 'sw', name: 'Suahili dili' }, { code: 'sv', name: 'İsveç dili' },
    { code: 'tg', name: 'Tacik dili' }, { code: 'ta', name: 'Tamil dili' }, { code: 'te', name: 'Teluqu dili' },
    { code: 'th', name: 'Tay dili' }, { code: 'tr', name: 'Türk dili' }, { code: 'uk', name: 'Ukrayna dili' },
    { code: 'ur', name: 'Urdu dili' }, { code: 'uz', name: 'Özbək dili' }, { code: 'vi', name: 'Vyetnam dili' },
    { code: 'cy', name: 'Uels dili' }, { code: 'xh', name: 'Xosa dili' }, { code: 'yi', name: 'İdiş dili' },
    { code: 'yo', name: 'Yoruba dili' }, { code: 'zu', name: 'Zulu dili' }
];

interface NewsArticleActionsProps {
  article: NewsArticle;
  onTranslate: (langCode: string) => void;
  isTranslating: boolean;
  isTranslated: boolean;
  onShowOriginal: () => void;
}

export const NewsArticleActions: React.FC<NewsArticleActionsProps> = ({ article, onTranslate, isTranslating, isTranslated, onShowOriginal }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState('');
    const [showLangSelector, setShowLangSelector] = useState(false);

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: article.title,
                    text: article.summary || '',
                    url: article.url,
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            navigator.clipboard.writeText(article.url);
            alert('Link kopyalandı!');
        }
    };

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setAnalysisResult('');
        const result = await analyzeNewsArticle(article);
        setAnalysisResult(result);
        setIsAnalyzing(false);
    };

    const handleLanguageSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const langCode = e.target.value;
        if (langCode) {
            onTranslate(langCode);
            setShowLangSelector(false);
        }
    };

    return (
        <div className="mt-6">
            <div className="flex flex-wrap gap-2 items-center">
                <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 bg-bg-onyx hover:bg-bg-slate rounded-full text-sm">
                    <ShareIcon className="w-4 h-4" /> Paylaş
                </button>
                <button onClick={handleAnalyze} disabled={isAnalyzing} className="flex items-center gap-2 px-4 py-2 bg-bg-onyx hover:bg-bg-slate rounded-full text-sm">
                    <SparklesIcon className="w-4 h-4" /> AI Təhlili
                </button>

                {isTranslated ? (
                    <button onClick={onShowOriginal} className="flex items-center gap-2 px-4 py-2 bg-bg-onyx hover:bg-bg-slate rounded-full text-sm">
                        Orijinalı göstər
                    </button>
                ) : (
                    <div className="relative" onMouseLeave={() => setShowLangSelector(false)}>
                        <button 
                            onClick={() => setShowLangSelector(!showLangSelector)} 
                            onMouseEnter={() => setShowLangSelector(true)}
                            disabled={isTranslating}
                            className="flex items-center gap-2 px-4 py-2 bg-bg-onyx hover:bg-bg-slate rounded-full text-sm disabled:opacity-50"
                        >
                            {isTranslating ? <LoadingSpinner className="w-4 h-4" /> : <TranslateIcon className="w-4 h-4" />}
                            Tərcümə et
                        </button>
                        {showLangSelector && (
                             <div className="absolute bottom-full mb-2 left-0 z-10">
                                <select 
                                    onChange={handleLanguageSelect}
                                    defaultValue=""
                                    className="w-56 h-64 bg-bg-onyx p-2 rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-accent"
                                    size={5} // Show multiple options at once
                                >
                                    <option value="" disabled>Dil seçin...</option>
                                    {languages.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                                </select>
                            </div>
                        )}
                    </div>
                )}
                
                 <a href={article.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-bg-onyx hover:bg-bg-slate rounded-full text-sm">
                    Orijinal Mənbə
                </a>
            </div>

            {isAnalyzing && <div className="mt-4 flex justify-center"><LoadingSpinner className="w-8 h-8 text-accent" /></div>}
            {analysisResult && (
                <div className="mt-4 p-4 bg-bg-slate/50 rounded-lg">
                    <h3 className="font-bold text-accent mb-2 flex items-center gap-2"><SparklesIcon className="w-5 h-5" /> AI Təhlili</h3>
                    <p className="text-text-sub whitespace-pre-wrap">{analysisResult}</p>
                </div>
            )}
        </div>
    );
};