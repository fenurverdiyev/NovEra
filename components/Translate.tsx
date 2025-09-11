import React, { useState } from 'react';
import { translateText } from '../services/geminiService';
import { LoadingSpinner, TranslateIcon, AlertTriangleIcon } from './Icons';

const languages = [
    { code: 'af', name: 'Afrikan dili' },
    { code: 'sq', name: 'Alban dili' },
    { code: 'am', name: 'Amhar dili' },
    { code: 'ar', name: 'Ərəb dili' },
    { code: 'hy', name: 'Erməni dili' },
    { code: 'az', name: 'Azərbaycan dili' },
    { code: 'eu', name: 'Bask dili' },
    { code: 'be', name: 'Belarus dili' },
    { code: 'bn', name: 'Benqal dili' },
    { code: 'bs', name: 'Bosniya dili' },
    { code: 'bg', name: 'Bolqar dili' },
    { code: 'ca', name: 'Katalan dili' },
    { code: 'ceb', name: 'Sebuano dili' },
    { code: 'ny', name: 'Çiçeva dili' },
    { code: 'zh-CN', name: 'Çin dili (Sadələşdirilmiş)' },
    { code: 'zh-TW', name: 'Çin dili (Ənənəvi)' },
    { code: 'co', name: 'Korsika dili' },
    { code: 'hr', name: 'Xorvat dili' },
    { code: 'cs', name: 'Çex dili' },
    { code: 'da', name: 'Danimarka dili' },
    { code: 'nl', name: 'Holland dili' },
    { code: 'en', name: 'İngilis dili' },
    { code: 'eo', name: 'Esperanto' },
    { code: 'et', name: 'Eston dili' },
    { code: 'tl', name: 'Filippin dili' },
    { code: 'fi', name: 'Fin dili' },
    { code: 'fr', name: 'Fransız dili' },
    { code: 'fy', name: 'Friz dili' },
    { code: 'gl', name: 'Qalisian dili' },
    { code: 'ka', name: 'Gürcü dili' },
    { code: 'de', name: 'Alman dili' },
    { code: 'el', name: 'Yunan dili' },
    { code: 'gu', name: 'Qucarat dili' },
    { code: 'ht', name: 'Haiti kreol dili' },
    { code: 'ha', name: 'Hausa dili' },
    { code: 'haw', name: 'Havay dili' },
    { code: 'iw', name: 'İvrit dili' },
    { code: 'hi', name: 'Hind dili' },
    { code: 'hmn', name: 'Hmonq dili' },
    { code: 'hu', name: 'Macar dili' },
    { code: 'is', name: 'İsland dili' },
    { code: 'ig', name: 'İqbo dili' },
    { code: 'id', name: 'İndoneziya dili' },
    { code: 'ga', name: 'İrland dili' },
    { code: 'it', name: 'İtalyan dili' },
    { code: 'ja', name: 'Yapon dili' },
    { code: 'jw', name: 'Yava dili' },
    { code: 'kn', name: 'Kannada dili' },
    { code: 'kk', name: 'Qazax dili' },
    { code: 'km', name: 'Kxmer dili' },
    { code: 'ko', name: 'Koreya dili' },
    { code: 'ku', name: 'Kürd dili (Kurmanci)' },
    { code: 'ky', name: 'Qırğız dili' },
    { code: 'lo', name: 'Lao dili' },
    { code: 'la', name: 'Latın dili' },
    { code: 'lv', name: 'Latış dili' },
    { code: 'lt', name: 'Litva dili' },
    { code: 'lb', name: 'Lüksemburq dili' },
    { code: 'mk', name: 'Makedon dili' },
    { code: 'mg', name: 'Malaqas dili' },
    { code: 'ms', name: 'Malay dili' },
    { code: 'ml', name: 'Malayalam dili' },
    { code: 'mt', name: 'Malta dili' },
    { code: 'mi', name: 'Maori dili' },
    { code: 'mr', name: 'Marati dili' },
    { code: 'mn', name: 'Monqol dili' },
    { code: 'my', name: 'Myanma (Birma) dili' },
    { code: 'ne', name: 'Nepal dili' },
    { code: 'no', name: 'Norveç dili' },
    { code: 'ps', name: 'Puştu dili' },
    { code: 'fa', name: 'Fars dili' },
    { code: 'pl', name: 'Polyak dili' },
    { code: 'pt', name: 'Portuqal dili' },
    { code: 'pa', name: 'Pəncab dili' },
    { code: 'ro', name: 'Rumın dili' },
    { code: 'ru', name: 'Rus dili' },
    { code: 'sm', name: 'Samoa dili' },
    { code: 'gd', name: 'Şotland kelt dili' },
    { code: 'sr', name: 'Serb dili' },
    { code: 'st', name: 'Sesoto dili' },
    { code: 'sn', name: 'Şona dili' },
    { code: 'sd', name: 'Sindhi dili' },
    { code: 'si', name: 'Sinxal dili' },
    { code: 'sk', name: 'Slovak dili' },
    { code: 'sl', name: 'Sloven dili' },
    { code: 'so', name: 'Somali dili' },
    { code: 'es', name: 'İspan dili' },
    { code: 'su', name: 'Sundan dili' },
    { code: 'sw', name: 'Suahili dili' },
    { code: 'sv', name: 'İsveç dili' },
    { code: 'tg', name: 'Tacik dili' },
    { code: 'ta', name: 'Tamil dili' },
    { code: 'te', name: 'Teluqu dili' },
    { code: 'th', name: 'Tay dili' },
    { code: 'tr', name: 'Türk dili' },
    { code: 'uk', name: 'Ukrayna dili' },
    { code: 'ur', name: 'Urdu dili' },
    { code: 'uz', name: 'Özbək dili' },
    { code: 'vi', name: 'Vyetnam dili' },
    { code: 'cy', name: 'Uels dili' },
    { code: 'xh', name: 'Xosa dili' },
    { code: 'yi', name: 'İdiş dili' },
    { code: 'yo', name: 'Yoruba dili' },
    { code: 'zu', name: 'Zulu dili' }
];

export const Translate: React.FC = () => {
    const [inputText, setInputText] = useState('');
    const [translatedText, setTranslatedText] = useState('');
    const [targetLang, setTargetLang] = useState('az');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleTranslate = async () => {
        if (!inputText.trim()) return;
        setLoading(true);
        setError(null);
        try {
            const result = await translateText(inputText, targetLang);
            setTranslatedText(result);
        } catch (e: any) {
            setError(e.message || "Tərcümə uğursuz oldu.");
            setTranslatedText('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-grow overflow-y-auto p-8 bg-bg-jet/90 backdrop-blur-sm">
            <h1 className="text-4xl font-bold text-text-main mb-8">Tərcümə</h1>
            <div className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end mb-6">
                     <div>
                        <label className="block text-sm font-medium text-text-sub mb-2">Mənbə Dili</label>
                        <div className="w-full bg-bg-slate p-3 rounded-lg text-text-main">
                            Avtomatik Aşkarlama
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-text-sub mb-2">Hədəf Dil</label>
                        <select
                            value={targetLang}
                            onChange={(e) => setTargetLang(e.target.value)}
                            className="w-full bg-bg-slate p-3 rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-accent"
                        >
                            {languages.map(lang => <option key={lang.code} value={lang.code}>{lang.name}</option>)}
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Tərcümə etmək üçün mətni daxil edin..."
                        className="w-full h-48 bg-bg-slate p-4 rounded-lg text-text-main placeholder-text-sub focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                    />
                    <div className="w-full h-48 bg-bg-slate p-4 rounded-lg text-text-main relative">
                        {loading ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <LoadingSpinner className="w-8 h-8 text-accent"/>
                            </div>
                        ) : error ? (
                             <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-red-400 p-4">
                                <AlertTriangleIcon className="w-8 h-8 mb-2" />
                                <span>{error}</span>
                            </div>
                        ) : (
                            <p className="whitespace-pre-wrap">{translatedText || 'Tərcümə burada görünəcək...'}</p>
                        )}
                    </div>
                </div>
                <div className="mt-6 text-center">
                    <button
                        onClick={handleTranslate}
                        disabled={loading || !inputText.trim()}
                        className="bg-accent text-bg-jet font-bold py-3 px-8 rounded-lg hover:bg-opacity-80 transition-colors disabled:bg-bg-onyx disabled:text-text-sub"
                    >
                        <span className="flex items-center">
                           <TranslateIcon className="w-5 h-5 mr-2"/> Tərcümə et
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
};