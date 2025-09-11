import React, { useState } from 'react';
import { getWeather } from '../services/geminiService';
import type { WeatherData } from '../types';
import { LoadingSpinner, SunIcon, CloudIcon, CloudRainIcon, CloudSnowIcon, WindIcon, AlertTriangleIcon, SearchIcon, WeatherIcon as WeatherIconComponent } from './Icons';

const WeatherConditionIcon: React.FC<{ condition: string; className: string }> = ({ condition, className }) => {
    const lowerCaseCondition = condition.toLowerCase();
    if (lowerCaseCondition.includes('sun') || lowerCaseCondition.includes('clear') || lowerCaseCondition.includes('açıq')) {
        return <SunIcon className={className} />;
    }
    if (lowerCaseCondition.includes('cloud') || lowerCaseCondition.includes('buludlu')) {
        return <CloudIcon className={className} />;
    }
    if (lowerCaseCondition.includes('rain') || lowerCaseCondition.includes('shower') || lowerCaseCondition.includes('yağış')) {
        return <CloudRainIcon className={className} />;
    }
    if (lowerCaseCondition.includes('snow') || lowerCaseCondition.includes('qar')) {
        return <CloudSnowIcon className={className} />;
    }
    if (lowerCaseCondition.includes('wind') || lowerCaseCondition.includes('külək')) {
        return <WindIcon className={className} />;
    }
    return <CloudIcon className={className} />; // Default icon
};

export const Weather: React.FC = () => {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [location, setLocation] = useState('');

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!location.trim()) return;

        setLoading(true);
        setError(null);
        setWeather(null);
        try {
            const weatherData = await getWeather(location);
            setWeather(weatherData);
        } catch (e: any) {
            setError(e.message || `"${location}" üçün hava məlumatı tapılmadı.`);
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        if (loading) {
            return <div className="flex justify-center items-center h-64"><LoadingSpinner className="w-12 h-12 text-accent" /></div>;
        }
        if (error) {
            return (
                <div className="flex flex-col justify-center items-center h-64 text-center text-text-sub">
                    <AlertTriangleIcon className="w-16 h-16 text-yellow-500 mb-4" />
                    <p className="max-w-md">{error}</p>
                </div>
            );
        }
        if (weather) {
            return (
                <div className="max-w-4xl mx-auto animate-fade-in">
                    <div className="bg-bg-slate p-8 rounded-xl mb-8 flex flex-col md:flex-row items-center justify-between text-center md:text-left">
                        <div>
                            <h2 className="text-3xl font-bold text-text-main">{weather.location}</h2>
                            <p className="text-7xl font-bold text-text-main mt-2">{Math.round(weather.current.temp)}&deg;</p>
                            <p className="text-xl text-text-sub capitalize">{weather.current.condition}</p>
                        </div>
                        <div className="text-accent mt-6 md:mt-0">
                            <WeatherConditionIcon condition={weather.current.condition} className="w-32 h-32" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-text-main mb-4">5 Günlük Proqnoz</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                            {weather.forecast.map((day, index) => (
                                <div key={index} className="bg-bg-slate p-4 rounded-lg flex flex-col items-center">
                                    <p className="font-bold text-lg">{day.day}</p>
                                    <WeatherConditionIcon condition={day.condition} className="w-12 h-12 my-3 text-accent" />
                                    <p className="text-xl font-semibold">{Math.round(day.temp)}&deg;</p>
                                    <p className="text-sm text-text-sub capitalize text-center">{day.condition}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }
        return (
            <div className="text-center text-text-sub mt-16">
                <WeatherIconComponent className="w-24 h-24 mx-auto mb-4" />
                <p>İstədiyiniz məkanın hava proqnozunu görmək üçün axtarış edin.</p>
            </div>
        );
    };

    return (
        <div className="flex-grow overflow-y-auto p-8 bg-bg-jet/90 backdrop-blur-sm">
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out forwards;
                }
            `}</style>
            <h1 className="text-4xl font-bold text-text-main mb-8">Hava</h1>
            <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-12">
                <div className="relative">
                    <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Şəhər və ya bölgə daxil edin..."
                        className="w-full bg-bg-slate p-4 pr-20 rounded-lg text-text-main focus:outline-none focus:ring-2 focus:ring-accent"
                        aria-label="Məkan axtarışı"
                    />
                    <button type="submit" disabled={loading} className="absolute right-2 top-1/2 -translate-y-1/2 bg-accent text-bg-jet p-2 rounded-md hover:bg-opacity-80 transition-colors disabled:bg-bg-onyx" aria-label="Axtar">
                       {loading ? <LoadingSpinner className="w-6 h-6" /> : <SearchIcon className="w-6 h-6" />}
                    </button>
                </div>
            </form>
            {renderContent()}
        </div>
    );
};