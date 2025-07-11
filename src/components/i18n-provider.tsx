
'use client';

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';

const translations = {
    en: {
        'Masters of Poker': 'Masters of Poker',
        'Visualizer': 'Visualizer',
        'Hand Rankings': 'Hand Rankings',
        'Stat Tracker': 'Stat Tracker',
        'Cards dealt. Fortunes made. Are you a master?': 'Cards dealt. Fortunes made. Are you a master?',
        'Player': 'Player',
        'You': 'You',
        'Stack': 'Stack',
        'Pot': 'Pot',
        'Fold': 'Fold',
        'Check': 'Check',
        'Bet': 'Bet',
        'Call {amount}': 'Call ${amount}',
        'You call {amount}': 'You call ${amount}',
        'New Hand': 'New Hand',
        'Show My Cards': 'Show My Cards',
        'Hide My Cards': 'Hide My Cards',
        'Game Over': 'Game Over',
        'A player has run out of chips.': 'A player has run out of chips.',
        'You folded': 'You folded',
        '{name} wins the pot.': '{name} wins the pot.',
        'You check': 'You check',
        'Everyone checks.': 'Everyone checks.',
        'Other players check.': 'Other players check.',
        'Invalid Bet': 'Invalid Bet',
        'Bet amount must be positive.': 'Bet amount must be positive.',
        'Not enough chips': 'Not enough chips',
        'You cannot bet more than you have.': 'You cannot bet more than you have.',
        'You bet {amount}': 'You bet {amount}',
        'Everyone calls.': 'Everyone calls.',
        '{name} folds.': '{name} folds.',
        '{name} calls.': '{name} calls.',
        '{name} checks.': '{name} checks.',
        '{name} bets {amount}': '{name} bets {amount}',
        'You win!': 'You win!',
        'You won the pot of ${pot}.': 'You won the pot of ${pot}.',
        "{name} wins.": "{name} wins.",
        "{name} wins!": "{name} wins!",
        '{name} won the pot of ${pot}.': '{name} won the pot of ${pot}.',
        'Number of players': 'Number of players',
        'Players': 'Players',
        'Performance Stats': 'Performance Stats',
        'Analyze your hand history and track your win rates.': 'Analyze your hand history and track your win rates.',
        'Import Hand History (Coming Soon)': 'Import Hand History (Coming Soon)',
        'Hand Performance': 'Hand Performance',
        'Hand': 'Hand',
        'Times Played': 'Times Played',
        'Net Won ($)': 'Net Won ($)',
        'Win Rate (%)': 'Win Rate (%)',
        'Win Rate by Blind Level': 'Win Rate by Blind Level',
        'Poker Hand Rankings': 'Poker Hand Rankings',
        'The ranking of poker hands, from best to worst.': 'The ranking of poker hands, from best to worst.',
        'Description': 'Description',
        'Example': 'Example',
        'Royal Flush': 'Royal Flush',
        'A, K, Q, J, 10, all in the same suit.': 'A, K, Q, J, 10, all in the same suit.',
        'Straight Flush': 'Straight Flush',
        'Five cards in a sequence, all in the same suit.': 'Five cards in a sequence, all in the same suit.',
        'Four of a Kind': 'Four of a Kind',
        'All four cards of the same rank.': 'All four cards of the same rank.',
        'Full House': 'Full House',
        'Three of a kind with a pair.': 'Three of a kind with a pair.',
        'Flush': 'Flush',
        'Any five cards of the same suit, but not in a sequence.': 'Any five cards of the same suit, but not in a sequence.',
        'Straight': 'Straight',
        'Five cards in a sequence, but not of the same suit.': 'Five cards in a sequence, but not of the same suit.',
        'Three of a Kind': 'Three of a Kind',
        'Three cards of the same rank.': 'Three cards of the same rank.',
        'Two Pair': 'Two Pair',
        'Two different pairs.': 'Two different pairs.',
        'One Pair': 'One Pair',
        'Two cards of the same rank.': 'Two cards of the same rank.',
        'High Card': 'High Card',
        'When you haven\'t made any of the hands above, the highest card plays.': 'When you haven\'t made any of the hands above, the highest card plays.',
        'Start Game': 'Start Game',
        "It's a Tie!": "It's a Tie!",
        "With a {handName}": "With a {handName}",
        'Tie': 'Tie',
    },
    es: {
        'Masters of Poker': 'Maestros del Poker',
        'Visualizer': 'Visualizador',
        'Hand Rankings': 'Ranking de Manos',
        'Stat Tracker': 'Estadísticas',
        'Cards dealt. Fortunes made. Are you a master?': 'Cartas repartidas. Fortunas hechas. ¿Eres un maestro?',
        'Player': 'Jugador',
        'You': 'Tú',
        'Stack': 'Fichas',
        'Pot': 'Bote',
        'Fold': 'Retirarse',
        'Check': 'Pasar',
        'Bet': 'Apostar',
        'Call {amount}': 'Igualar ${amount}',
        'You call {amount}': 'Igualas ${amount}',
        'New Hand': 'Nueva Mano',
        'Show My Cards': 'Mostrar Mis Cartas',
        'Hide My Cards': 'Ocultar Mis Cartas',
        'Game Over': 'Fin del Juego',
        'A player has run out of chips.': 'Un jugador se ha quedado sin fichas.',
        'You folded': 'Te has retirado',
        '{name} wins the pot.': '{name} gana el bote.',
        'You check': 'Pasas',
        'Everyone checks.': 'Todos pasan.',
        'Other players check.': 'El resto de jugadores pasa.',
        'Invalid Bet': 'Apuesta Inválida',
        'Bet amount must be positive.': 'La apuesta debe ser positiva.',
        'Not enough chips': 'No hay suficientes fichas',
        'You cannot bet more than you have.': 'No puedes apostar más de lo que tienes.',
        'You bet {amount}': 'Apuestas {amount}',
        'Everyone calls.': 'Todos igualan la apuesta.',
        '{name} folds.': '{name} se retira.',
        '{name} calls.': '{name} iguala.',
        '{name} checks.': '{name} pasa.',
        '{name} bets {amount}': '{name} apuesta {amount}',
        'You win!': '¡Ganas!',
        'You won the pot of ${pot}.': 'Ganaste el bote de ${pot}.',
        '{name} wins.': '{name} gana.',
        "{name} wins!": "¡{name} gana!",
        '{name} won the pot of ${pot}.': '{name} ganó el bote de ${pot}.',
        'Number of players': 'Número de jugadores',
        'Players': 'Jugadores',
        'Performance Stats': 'Estadísticas de Rendimiento',
        'Analyze your hand history and track your win rates.': 'Analiza tu historial de manos y sigue tus tasas de victoria.',
        'Import Hand History (Coming Soon)': 'Importar Historial de Manos (Próximamente)',
        'Hand Performance': 'Rendimiento por Mano',
        'Hand': 'Mano',
        'Times Played': 'Veces Jugada',
        'Net Won ($)': 'Ganancia Neta ($)',
        'Win Rate (%)': 'Tasa de Victoria (%)',
        'Win Rate by Blind Level': 'Tasa de Victoria por Nivel de Ciegas',
        'Poker Hand Rankings': 'Ranking de Manos de Poker',
        'The ranking of poker hands, from best to worst.': 'La clasificación de las manos de poker, de mejor a peor.',
        'Description': 'Descripción',
        'Example': 'Ejemplo',
        'Royal Flush': 'Flor Imperial',
        'A, K, Q, J, 10, all in the same suit.': 'A, K, Q, J, 10, todas del mismo palo.',
        'Straight Flush': 'Escalera de Color',
        'Five cards in a sequence, all in the same suit.': 'Cinco cartas en secuencia, todas del mismo palo.',
        'Four of a Kind': 'Poker',
        'All four cards of the same rank.': 'Las cuatro cartas del mismo valor.',
        'Full House': 'Full',
        'Three of a kind with a pair.': 'Un trío y una pareja.',
        'Flush': 'Color',
        'Any five cards of the same suit, but not in a sequence.': 'Cinco cartas del mismo palo, sin ser consecutivas.',
        'Straight': 'Escalera',
        'Five cards in a sequence, but not of the same suit.': 'Cinco cartas en secuencia, pero de diferentes palos.',
        'Three of a Kind': 'Trío',
        'Three cards of the same rank.': 'Tres cartas del mismo valor.',
        'Two Pair': 'Doble Pareja',
        'Two different pairs.': 'Dos parejas diferentes.',
        'One Pair': 'Pareja',
        'Two cards of the same rank.': 'Dos cartas del mismo valor.',
        'High Card': 'Carta Alta',
        'When you haven\'t made any of the hands above, the highest card plays.': 'Cuando no se forma ninguna de las manos anteriores, gana la carta más alta.',
        'Start Game': 'Empezar Juego',
        "It's a Tie!": "¡Es un empate!",
        "With a {handName}": "Con un {handName}",
        'Tie': 'Empate',
    }
};

type Locale = keyof typeof translations;
type TranslationKey = keyof (typeof translations)['en'];

const I18nContext = createContext<{ locale: Locale, t: (key: TranslationKey, params?: Record<string, string | number>) => string } | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
    const [locale, setLocale] = useState<Locale>('en');

    useEffect(() => {
        const browserLang = navigator.language.split('-')[0];
        if (browserLang in translations) {
            setLocale(browserLang as Locale);
        }
    }, []);

    const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
        let translation = (translations[locale] && translations[locale][key]) || translations['en'][key];
        if (!translation) return key;

        if (params) {
            Object.entries(params).forEach(([paramKey, value]) => {
                const regex = new RegExp(`\\$\\{\\s*${paramKey}\\s*\\}`, 'g');
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

    