'use client'

import React, { useState } from 'react';
import { PlayingCard, type Rank, type Suit } from "@/components/playing-card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useI18n } from './i18n-provider';

const ranks: Rank[] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
const suits: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];

type Hand = [{rank: Rank, suit: Suit} | null, {rank: Rank, suit: Suit} | null];

export function HandSimulator() {
    const { t } = useI18n();
    const [player1Hand, setPlayer1Hand] = useState<Hand>([null, null]);
    const [player2Hand, setPlayer2Hand] = useState<Hand>([null, null]);
    const [probabilities, setProbabilities] = useState<{p1: number, p2: number, tie: number} | null>(null);

    const handleCardChange = (player: 'p1' | 'p2', cardIndex: 0 | 1, value: string) => {
        const [rank, suit] = value.split('-') as [Rank, Suit];
        const newHand: Hand = player === 'p1' ? [...player1Hand] : [...player2Hand];
        newHand[cardIndex] = { rank, suit };
        if (player === 'p1') {
            setPlayer1Hand(newHand);
        } else {
            setPlayer2Hand(newHand);
        }
        setProbabilities(null);
    };
    
    const getAvailableCards = () => {
        const selectedCards = [
            ...player1Hand.filter(c => c).map(c => `${c!.rank}-${c!.suit}`),
            ...player2Hand.filter(c => c).map(c => `${c!.rank}-${c!.suit}`)
        ];
        const allCards = ranks.flatMap(rank => suits.map(suit => ({ rank, suit, id: `${rank}-${suit}` })));
        return allCards.filter(card => !selectedCards.includes(card.id));
    };

    const simulate = () => {
        // This is a mock simulation. A real one would involve complex calculations.
        if (player1Hand.every(c => c) && player2Hand.every(c => c)) {
            const p1 = Math.random() * 80 + 10;
            const p2 = Math.random() * (90 - p1);
            const tie = 100 - p1 - p2;
            setProbabilities({ p1: Math.round(p1), p2: Math.round(p2), tie: Math.round(tie) });
        }
    };

    const CardSelector = ({ player, cardIndex }: { player: 'p1' | 'p2', cardIndex: 0 | 1 }) => {
        const availableCards = getAvailableCards();
        const currentHand = player === 'p1' ? player1Hand : player2Hand;
        const cardValue = currentHand[cardIndex] ? `${currentHand[cardIndex]!.rank}-${currentHand[cardIndex]!.suit}` : undefined;

        return (
            <Select onValueChange={(val) => handleCardChange(player, cardIndex, val)} value={cardValue}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t('Select a card')} />
                </SelectTrigger>
                <SelectContent>
                    {availableCards.map(card => (
                        <SelectItem key={card.id} value={card.id}>
                            {card.rank} of {card.suit}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        );
    };

    return (
        <Card className="border-accent/20">
            <CardHeader>
                <CardTitle className="font-headline text-accent">{t('Pre-Flop Win Probability')}</CardTitle>
                <CardDescription>{t('Select two hands and simulate their equity before the flop.')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-2xl font-headline">{t('Player 1')}</h3>
                        <div className="flex gap-4 items-center">
                           {player1Hand[0] ? <PlayingCard {...player1Hand[0]} /> : <div className="w-20 h-28 md:w-24 md:h-36 rounded-lg bg-muted/50 border-2 border-dashed" />}
                           {player1Hand[1] ? <PlayingCard {...player1Hand[1]} /> : <div className="w-20 h-28 md:w-24 md:h-36 rounded-lg bg-muted/50 border-2 border-dashed" />}
                        </div>
                        <div className="flex flex-wrap gap-2">
                           <CardSelector player="p1" cardIndex={0} />
                           <CardSelector player="p1" cardIndex={1} />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-2xl font-headline">{t('Player 2')}</h3>
                         <div className="flex gap-4 items-center">
                           {player2Hand[0] ? <PlayingCard {...player2Hand[0]} /> : <div className="w-20 h-28 md:w-24 md:h-36 rounded-lg bg-muted/50 border-2 border-dashed" />}
                           {player2Hand[1] ? <PlayingCard {...player2Hand[1]} /> : <div className="w-20 h-28 md:w-24 md:h-36 rounded-lg bg-muted/50 border-2 border-dashed" />}
                        </div>
                        <div className="flex flex-wrap gap-2">
                           <CardSelector player="p2" cardIndex={0} />
                           <CardSelector player="p2" cardIndex={1} />
                        </div>
                    </div>
                </div>
                <div className="flex justify-center">
                    <Button onClick={simulate} className="bg-accent hover:bg-accent/90" size="lg" disabled={!player1Hand.every(c => c) || !player2Hand.every(c => c)}>{t('Simulate')}</Button>
                </div>
                {probabilities && (
                    <div className="pt-6 space-y-4 animate-in fade-in-50 duration-500">
                        <h3 className="text-2xl font-headline text-center">{t('Results')}</h3>
                        <div className="space-y-2">
                            <label>{t('Player 1 Win')}: {probabilities.p1}%</label>
                            <Progress value={probabilities.p1} className="h-4 [&>div]:bg-chart-2" />
                        </div>
                         <div className="space-y-2">
                            <label>{t('Player 2 Win')}: {probabilities.p2}%</label>
                            <Progress value={probabilities.p2} className="h-4 [&>div]:bg-chart-4"/>
                        </div>
                         <div className="space-y-2">
                            <label>{t('Tie')}: {probabilities.tie}%</label>
                            <Progress value={probabilities.tie} className="h-4 [&>div]:bg-muted" />
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
