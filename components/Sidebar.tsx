import React from 'react';
import type { AppView } from '../types';
import { SearchIcon, NewsIcon, WeatherIcon, TranslateIcon, SettingsIcon } from './Icons';
import { Logo } from './Logo';

interface SidebarProps {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
}

const navItems = [
  { id: 'search', icon: SearchIcon, label: 'Axtarış' },
  { id: 'news', icon: NewsIcon, label: 'Xəbərlər' },
  { id: 'weather', icon: WeatherIcon, label: 'Hava' },
  { id: 'translate', icon: TranslateIcon, label: 'Tərcümə' },
  { id: 'settings', icon: SettingsIcon, label: 'Ayarlar' },
] as const;


export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  return (
    <nav className="w-24 bg-bg-slate/80 backdrop-blur-sm flex flex-col items-center py-6 space-y-6">
      <div className="px-2 mb-4">
        <Logo />
      </div>
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveView(item.id)}
          className={`flex flex-col items-center p-2 rounded-lg transition-colors duration-200 group w-full ${
            activeView === item.id ? 'text-accent' : 'text-text-sub hover:text-text-main hover:bg-bg-onyx/50'
          }`}
          aria-label={item.label}
          aria-current={activeView === item.id ? 'page' : undefined}
        >
          <item.icon className="w-7 h-7 mb-1" />
          <span className="text-xs font-medium text-center">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};