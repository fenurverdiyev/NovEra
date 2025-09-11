import React from 'react';
import { SpaceAnimation } from './SpaceAnimation';
import { NatureAnimation } from './NatureAnimation';
import { NebulaAnimation } from './NebulaAnimation';

export interface ThemeAnimationProps {
    scrollOffset?: number;
    analyserNode?: AnalyserNode | null;
}

interface Theme {
    id: string;
    name: string;
    description: string;
    colors: string[];
    animation: React.FC<ThemeAnimationProps>;
}

export const THEMES: Theme[] = [
    { 
        id: 'novera', 
        name: 'NovEra', 
        description: 'Dərin, çoxqatlı parallaks effekti ilə kosmosda səyahət edin. Fəaliyyətsiz qaldıqda gizli bürcləri kəşf edin.',
        colors: ['#0d0f19', '#1b2026', '#58A6FF'],
        animation: SpaceAnimation,
    },
    { 
        id: 'terra', 
        name: 'Terra', 
        description: 'Ekranın kənarları boyunca zərif şəkildə böyüyən və kursorunuza reaksiya verən canlı sarmaşıqlarla təbiəti hiss edin.',
        colors: ['#0d0f19', '#1b2026', '#6ee7b7'],
        animation: NatureAnimation,
    },
    { 
        id: 'nebula', 
        name: 'Nebula', 
        description: 'Səslə canlanan, musiqiyə və səsə reaksiya verən interaktiv bir dumanlığa qərq olun. Ulduz tozuna çevirmək üçün kürələrə toxunun.',
        colors: ['#0d0f19', '#1b2026', '#c084fc'],
        animation: NebulaAnimation,
    },
];
