import React, { useState } from 'react';
import { translateText } from '../services/geminiService';
import { LoadingSpinner, TranslateIcon, AlertTriangleIcon } from './Icons';

const languages = [
    { code: 'af', name: 'Afrikan dili', emoji: '🇿🇦' },
    { code: 'sq', name: 'Alban dili', emoji: '🇦🇱' },
    { code: 'am', name: 'Amhar dili', emoji: '🇪🇹' },
    { code: 'ar', name: 'Ərəb dili', emoji: '🇸🇦' },
    { code: 'hy', name: 'Erməni dili', emoji: '🇦🇲' },
    { code: 'az', name: 'Azərbaycan dili', emoji: '🇦🇿' },
    { code: 'eu', name: 'Bask dili', emoji: '🇪🇸' },
    { code: 'be', name: 'Belarus dili', emoji: '🇧🇾' },
    { code: 'bn', name: 'Benqal dili', emoji: '🇧🇩' },
    { code: 'bs', name: 'Bosniya dili', emoji: '🇧🇦' },
    { code: 'bg', name: 'Bolqar dili', emoji: '🇧🇬' },
    { code: 'ca', name: 'Katalan dili', emoji: '🇪🇸' },
    { code: 'ceb', name: 'Sebuano dili', emoji: '🇵🇭' },
    { code: 'ny', name: 'Çiçeva dili', emoji: '🇲🇼' },
    { code: 'zh-CN', name: 'Çin dili (Sadə)', emoji: '🇨🇳' },
    { code: 'zh-TW', name: 'Çin dili (Ənənəvi)', emoji: '🇹🇼' },
    { code: 'co', name: 'Korsika dili', emoji: '🇫🇷' },
    { code: 'hr', name: 'Xorvat dili', emoji: '🇭🇷' },
    { code: 'cs', name: 'Çex dili', emoji: '🇨🇿' },
    { code: 'da', name: 'Danimarka dili', emoji: '🇩🇰' },
    { code: 'nl', name: 'Holland dili', emoji: '🇳🇱' },
    { code: 'en', name: 'İngilis dili', emoji: '🇬🇧' },
    { code: 'eo', name: 'Esperanto', emoji: '🏳️' },
    { code: 'et', name: 'Eston dili', emoji: '🇪🇪' },
    { code: 'tl', name: 'Filippin dili', emoji: '🇵🇭' },
    { code: 'fi', name: 'Fin dili', emoji: '🇫🇮' },
    { code: 'fr', name: 'Fransız dili', emoji: '🇫🇷' },
    { code: 'fy', name: 'Friz dili', emoji: '🇳🇱' },
    { code: 'gl', name: 'Qalisian dili', emoji: '🇪🇸' },
    { code: 'ka', name: 'Gürcü dili', emoji: '🇬🇪' },
    { code: 'de', name: 'Alman dili', emoji: '🇩🇪' },
    { code: 'el', name: 'Yunan dili', emoji: '🇬🇷' },
    { code: 'gu', name: 'Qucarat dili', emoji: '🇮🇳' },
    { code: 'ht', name: 'Haiti kreol dili', emoji: '🇭🇹' },
    { code: 'ha', name: 'Hausa dili', emoji: '🇳🇬' },
    { code: 'haw', name: 'Havay dili', emoji: '🇺🇸' },
    { code: 'iw', name: 'İvrit dili', emoji: '🇮🇱' },
    { code: 'hi', name: 'Hind dili', emoji: '🇮🇳' },
    { code: 'hmn', name: 'Hmonq dili', emoji: '🇨🇳' },
    { code: 'hu', name: 'Macar dili', emoji: '🇭🇺' },
    { code: 'is', name: 'İsland dili', emoji: '🇮🇸' },
    { code: 'ig', name: 'İqbo dili', emoji: '🇳🇬' },
    { code: 'id', name: 'İndoneziya dili', emoji: '🇮🇩' },
    { code: 'ga', name: 'İrland dili', emoji: '🇮🇪' },
    { code: 'it', name: 'İtalyan dili', emoji: '🇮🇹' },
    { code: 'ja', name: 'Yapon dili', emoji: '🇯🇵' },
    { code: 'jw', name: 'Yava dili', emoji: '🇮🇩' },
    { code: 'kn', name: 'Kannada dili', emoji: '🇮🇳' },
    { code: 'kk', name: 'Qazax dili', emoji: '🇰🇿' },
    { code: 'km', name: 'Kxmer dili', emoji: '🇰🇭' },
    { code: 'ko', name: 'Koreya dili', emoji: '🇰🇷' },
    { code: 'ku', name: 'Kürd dili', emoji: '🇹🇷' },
    { code: 'ky', name: 'Qırğız dili', emoji: '🇰🇬' },
    { code: 'lo', name: 'Lao dili', emoji: '🇱🇦' },
    { code: 'la', name: 'Latın dili', emoji: '🇻🇦' },
    { code: 'lv', name: 'Latış dili', emoji: '🇱🇻' },
    { code: 'lt', name: 'Litva dili', emoji: '🇱🇹' },
    { code: 'lb', name: 'Lüksemburq dili', emoji: '🇱🇺' },
    { code: 'mk', name: 'Makedon dili', emoji: '🇲🇰' },
    { code: 'mg', name: 'Malaqas dili', emoji: '🇲🇬' },
    { code: 'ms', name: 'Malay dili', emoji: '🇲🇾' },
    { code: 'ml', name: 'Malayalam dili', emoji: '🇮🇳' },
    { code: 'mt', name: 'Malta dili', emoji: '🇲🇹' },
    { code: 'mi', name: 'Maori dili', emoji: '🇳🇿' },
    { code: 'mr', name: 'Marati dili', emoji: '🇮🇳' },
    { code: 'mn', name: 'Monqol dili', emoji: '🇲🇳' },
    { code: 'my', name: 'Myanma dili', emoji: '🇲🇲' },
    { code: 'ne', name: 'Nepal dili', emoji: '🇳🇵' },
    { code: 'no', name: 'Norveç dili', emoji: '🇳🇴' },
    { code: 'ps', name: 'Puştu dili', emoji: '🇦🇫' },
    { code: 'fa', name: 'Fars dili', emoji: '🇮🇷' },
    { code: 'pl', name: 'Polyak dili', emoji: '🇵🇱' },
    { code: 'pt', name: 'Portuqal dili', emoji: '🇵🇹' },
    { code: 'pa', name: 'Pəncab dili', emoji: '🇮🇳' },
    { code: 'ro', name: 'Rumın dili', emoji: '🇷🇴' },
    { code: 'ru', name: 'Rus dili', emoji: '🇷🇺' },
    { code: 'sm', name: 'Samoa dili', emoji: '🇼🇸' },
    { code: 'gd', name: 'Şotland kelt dili', emoji: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
    { code: 'sr', name: 'Serb dili', emoji: '🇷🇸' },
    { code: 'st', name: 'Sesoto dili', emoji: '🇱🇸' },
    { code: 'sn', name: 'Şona dili', emoji: '🇿🇼' },
    { code: 'sd', name: 'Sindhi dili', emoji: '🇵🇰' },
    { code: 'si', name: 'Sinxal dili', emoji: '🇱🇰' },
    { code: 'sk', name: 'Slovak dili', emoji: '🇸🇰' },
    { code: 'sl', name: 'Sloven dili', emoji: '🇸🇮' },
    { code: 'so', name: 'Somali dili', emoji: '🇸🇴' },
    { code: 'es', name: 'İspan dili', emoji: '🇪🇸' },
    { code: 'su', name: 'Sundan dili', emoji: '🇮🇩' },
    { code: 'sw', name: 'Suahili dili', emoji: '🇹🇿' },
    { code: 'sv', name: 'İsveç dili', emoji: '🇸🇪' },
    { code: 'tg', name: 'Tacik dili', emoji: '🇹🇯' },
    { code: 'ta', name: 'Tamil dili', emoji: '🇮🇳' },
    { code: 'te', name: 'Teluqu dili', emoji: '🇮🇳' },
    { code: 'th', name: 'Tay dili', emoji: '🇹🇭' },
    { code: 'tr', name: 'Türk dili', emoji: '🇹🇷' },
    { code: 'uk', name: 'Ukrayna dili', emoji: '🇺🇦' },
    { code: 'ur', name: 'Urdu dili', emoji: '🇵🇰' },
    { code: 'uz', name: 'Özbək dili', emoji: '🇺🇿' },
    { code: 'vi', name: 'Vyetnam dili', emoji: '🇻🇳' },
    { code: 'cy', name: 'Uels dili', emoji: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
    { code: 'xh', name: 'Xosa dili', emoji: '🇿🇦' },
    { code: 'yi', name: 'İdiş dili', emoji: '🇮🇱' },
    { code: 'yo', name: 'Yoruba dili', emoji: '🇳🇬' },
    { code: 'zu', name: 'Zulu dili', emoji: '🇿🇦' }
];

const Flag: React.FC<{ code: string }> = ({ code }) => (
    <img 
        src={`https://flagcdn.com/w20/${code.toLowerCase().split('-')[0]}.png`}
        alt={`${code} flag`}
        className="w-5 h-auto inline-block mr-2"
    />
);

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
                            {languages.map(lang => (
                                <option key={lang.code} value={lang.code}>
                                    {lang.emoji} {lang.name}
                                </option>
                            ))}
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