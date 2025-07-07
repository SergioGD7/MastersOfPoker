'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';

const translations = {
    en: {
        'Masters of Poker': 'Masters of Poker',
        'Visualizer': 'Visualizer',
        'Hand Simulator': 'Hand Simulator',
        'Stat Tracker': 'Stat Tracker',
        'Cards dealt. Fortunes made. Are you a master?': 'Cards dealt. Fortunes made. Are you a master?',
        'Player': 'Player',
        'You': 'You',
        'Stack': 'Stack',
        'Pot': 'Pot',
        'Fold': 'Fold',
        'Check': 'Check',
        'Bet': 'Bet',
        'New Hand': 'New Hand',
        'Show My Cards': 'Show My Cards',
        'Hide My Cards': 'Hide My Cards',
        'Game Over': 'Game Over',
        'A player has run out of chips.': 'A player has run out of chips.',
        'You folded': 'You folded',
        '{name} wins the pot.': '{name} wins the pot.',
        'You check': 'You check',
        'Everyone checks.': 'Everyone checks.',
        'Invalid Bet': 'Invalid Bet',
        'Bet amount must be positive.': 'Bet amount must be positive.',
        'Not enough chips': 'Not enough chips',
        'You cannot bet more than you have.': 'You cannot bet more than you have.',
        'You bet {amount}': 'You bet {amount}',
        'Everyone calls.': 'Everyone calls.',
        'You win!': 'You win!',
        'You won the pot of ${pot}.': 'You won the pot of ${pot}.',
        '{name} wins.': '{name} wins.',
        '{name} won the pot of ${pot}.': '{name} won the pot of ${pot}.',
        'Number of players': 'Number of players',
        'Players': 'Players',
        'Pre-Flop Win Probability': 'Pre-Flop Win Probability',
        'Select two hands and simulate their equity before the flop.': 'Select two hands and simulate their equity before the flop.',
        'Player 1': 'Player 1',
        'Player 2': 'Player 2',
        'Select a card': 'Select a card',
        'Simulate': 'Simulate',
        'Results': 'Results',
        'Player 1 Win': 'Player 1 Win',
        'Player 2 Win': 'Player 2 Win',
        'Tie': 'Tie',
        'Performance Stats': 'Performance Stats',
        'Analyze your hand history and track your win rates.': 'Analyze your hand history and track your win rates.',
        'Import Hand History (Coming Soon)': 'Import Hand History (Coming Soon)',
        'Hand Performance': 'Hand Performance',
        'Hand': 'Hand',
        'Times Played': 'Times Played',
        'Net Won ($)': 'Net Won ($)',
        'Win Rate (%)': 'Win Rate (%)',
        'Win Rate by Blind Level': 'Win Rate by Blind Level',
    },
    es: {
        'Masters of Poker': 'Maestros del Poker',
        'Visualizer': 'Visualizador',
        'Hand Simulator': 'Simulador de Manos',
        'Stat Tracker': 'Seguidor de Estadísticas',
        'Cards dealt. Fortunes made. Are you a master?': 'Cartas repartidas. Fortunas hechas. ¿Eres un maestro?',
        'Player': 'Jugador',
        'You': 'Tú',
        'Stack': 'Fichas',
        'Pot': 'Bote',
        'Fold': 'Retirarse',
        'Check': 'Pasar',
        'Bet': 'Apostar',
        'New Hand': 'Nueva Mano',
        'Show My Cards': 'Mostrar Mis Cartas',
        'Hide My Cards': 'Ocultar Mis Cartas',
        'Game Over': 'Fin del Juego',
        'A player has run out of chips.': 'Un jugador se ha quedado sin fichas.',
        'You folded': 'Te has retirado',
        '{name} wins the pot.': '{name} gana el bote.',
        'You check': 'Pasas',
        'Everyone checks.': 'Todos pasan.',
        'Invalid Bet': 'Apuesta Inválida',
        'Bet amount must be positive.': 'La apuesta debe ser positiva.',
        'Not enough chips': 'No hay suficientes fichas',
        'You cannot bet more than you have.': 'No puedes apostar más de lo que tienes.',
        'You bet {amount}': 'Apuestas {amount}',
        'Everyone calls.': 'Todos igualan la apuesta.',
        'You win!': '¡Ganas!',
        'You won the pot of ${pot}.': 'Ganaste el bote de ${pot}.',
        '{name} wins.': '{name} gana.',
        '{name} won the pot of ${pot}.': '{name} ganó el bote de ${pot}.',
        'Number of players': 'Número de jugadores',
        'Players': 'Jugadores',
        'Pre-Flop Win Probability': 'Probabilidad de Ganar Pre-Flop',
        'Select two hands and simulate their equity before the flop.': 'Selecciona dos manos y simula su equity antes del flop.',
        'Player 1': 'Jugador 1',
        'Player 2': 'Jugador 2',
        'Select a card': 'Selecciona una carta',
        'Simulate': 'Simular',
        'Results': 'Resultados',
        'Player 1 Win': 'Victoria Jugador 1',
        'Player 2 Win': 'Victoria Jugador 2',
        'Tie': 'Empate',
        'Performance Stats': 'Estadísticas de Rendimiento',
        'Analyze your hand history and track your win rates.': 'Analiza tu historial de manos y sigue tus tasas de victoria.',
        'Import Hand History (Coming Soon)': 'Importar Historial de Manos (Próximamente)',
        'Hand Performance': 'Rendimiento por Mano',
        'Hand': 'Mano',
        'Times Played': 'Veces Jugada',
        'Net Won ($)': 'Ganancia Neta ($)',
        'Win Rate (%)': 'Tasa de Victoria (%)',
        'Win Rate by Blind Level': 'Tasa de Victoria por Nivel de Ciegas',
    }
};

type Locale = keyof typeof translations;
type TranslationKey = keyof (typeof translations)['en'];

const I18nContext = createContext<{ locale: Locale, t: (key: TranslationKey, params?: Record<string, string | number>) => string } | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
    const [locale, setLocale] = useState<Locale>('en');

    useEffect(() => {
        const browserLang = navigator.language.split('-')[0];
        if (browserLang === 'es') {
            setLocale('es');
        }
    }, []);

    const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
        let translation = translations[locale][key] || translations['en'][key];
        if (!translation) return key;

        if (params) {
            Object.entries(params).forEach(([paramKey, value]) => {
                const regex = new RegExp(`\\{\\s*${paramKey}\\s*\\}`, 'g');
                translation = translation.replace(regex, String(value));
            });
        }
        return translation;
    };

    return (
        <I18nContext.Provider value={{ locale, t }}>
            {children}
        </I18nContext.Provider>
    );
}

export function useI18n() {
    const context = useContext(I18nContext);
    if (context === undefined) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
}
