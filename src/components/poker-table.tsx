'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { PlayingCard, type Rank, type Suit } from "@/components/playing-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from './i18n-provider';

const ranks: Rank[] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
const suits: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];

type Player = {
    id: number;
    name: string;
    hand: {rank: Rank, suit: Suit}[];
    stack: number;
    isUser: boolean;
    showHand: boolean;
    hasFolded: boolean;
};

function createDeck(): {rank: Rank, suit: Suit}[] {
    return ranks.flatMap(rank => suits.map(suit => ({ rank, suit })));
}

function shuffleDeck(deck: {rank: Rank, suit: Suit}[]): {rank: Rank, suit: Suit}[] {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

export function PokerTable() {
    const { t } = useI18n();
    const [gameState, setGameState] = useState<'pre-deal' | 'dealing' | 'pre-flop' | 'flop' | 'turn' | 'river' | 'showdown'>('pre-deal');
    const [pot, setPot] = useState(0);
    const [players, setPlayers] = useState<Player[]>([]);
    const [numPlayers, setNumPlayers] = useState(2);
    const [communityCards, setCommunityCards] = useState<{rank: Rank, suit: Suit}[]>([]);
    const [isDealing, setIsDealing] = useState(false);
    const [betAmount, setBetAmount] = useState(50);
    const { toast } = useToast();

    useEffect(() => {
        const initialPlayers: Player[] = Array.from({ length: numPlayers }, (_, i) => ({
            id: i + 1,
            name: i === 0 ? t('You') : `${t('Player')} ${i + 1}`,
            hand: [],
            stack: 1000,
            isUser: i === 0,
            showHand: false,
            hasFolded: false,
        }));
        setPlayers(initialPlayers);
        setGameState('pre-deal');
    }, [numPlayers, t]);

    const dealNewHand = useCallback(() => {
        setIsDealing(true);
        setGameState('dealing');
        const newDeck = shuffleDeck(createDeck());
        
        const dealtHands: {rank: Rank, suit: Suit}[][] = Array.from({ length: numPlayers }, () => []);

        let cardIndex = 0;
        // Deal 2 cards to each player's hand data structure
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < numPlayers; j++) {
                dealtHands[j].push(newDeck[cardIndex++]);
            }
        }
        setCommunityCards(newDeck.slice(cardIndex, cardIndex + 5));

        const p1Blind = 10;
        const p2Blind = 20;
        
        setPlayers(prevPlayers => {
            let newPot = p1Blind + p2Blind;
            const playersWithResetHands = prevPlayers.map((p, index) => ({
                ...p,
                hand: [],
                showHand: false,
                hasFolded: false,
                stack: index === 0 ? p.stack - p1Blind : (index === 1 ? p.stack - p2Blind : p.stack)
            }));
            setPot(newPot);
            return playersWithResetHands;
        });

        // Animate dealing
        let dealTimeout = 0;
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < numPlayers; j++) {
                dealTimeout += 150;
                setTimeout(() => {
                    setPlayers(prev => {
                        const newPlayers = [...prev];
                        if (newPlayers[j]) {
                           newPlayers[j].hand = dealtHands[j].slice(0, i + 1);
                        }
                        return newPlayers;
                    });
                }, dealTimeout);
            }
        }
        
        setTimeout(() => {
            setGameState('pre-flop');
            setIsDealing(false);
        }, dealTimeout + 200);

    }, [numPlayers]);
    
    const handleShowdown = useCallback(() => {
        setPlayers(prevPlayers => {
            const activePlayers = prevPlayers.filter(p => !p.hasFolded);
            if(activePlayers.length === 0) return prevPlayers;

            const winner = activePlayers[Math.floor(Math.random() * activePlayers.length)];
            if (!winner) return prevPlayers;
    
            if (winner.isUser) {
                toast({ title: t('You win!'), description: t('You won the pot of ${pot}.', { pot }) });
            } else {
                toast({ title: t('{name} wins.', { name: winner.name }), description: t('{name} won the pot of ${pot}.', { name: winner.name, pot }) });
            }
            
            const newPlayers = [...prevPlayers];
            const winnerIdx = newPlayers.findIndex(p => p.id === winner.id);
            if(newPlayers[winnerIdx]) {
                newPlayers[winnerIdx].stack += pot;
            }
            return newPlayers.map(p => ({...p, showHand: true}));
        });
    }, [pot, t, toast]);

    useEffect(() => {
        if (gameState === 'pre-deal' && !isDealing) {
            if (players.length > 1 && players.filter(p => p.stack > 0).length <= 1) {
                toast({ title: t('Game Over'), description: t('A player has run out of chips.') });
                setGameState('showdown');
                return;
            }
            dealNewHand();
        } else if (gameState === 'showdown' && !isDealing) {
            handleShowdown();
        }
    }, [gameState, dealNewHand, handleShowdown, isDealing]);

    const advanceState = useCallback(() => {
        switch (gameState) {
            case 'pre-flop': setGameState('flop'); break;
            case 'flop': setGameState('turn'); break;
            case 'turn': setGameState('river'); break;
            case 'river': setGameState('showdown'); break;
            default: break;
        }
    }, [gameState]);

    const handleFold = () => {
        setPlayers(prev => prev.map(p => p.isUser ? { ...p, hasFolded: true } : p));
        
        const activeOpponents = players.filter(p => !p.isUser && !p.hasFolded);

        if (activeOpponents.length === 1) {
            const winner = activeOpponents[0];
            toast({ title: t('You folded'), description: t('{name} wins the pot.', { name: winner.name }) });
            setPlayers(prev => {
                const newPlayers = [...prev];
                const winnerIndex = newPlayers.findIndex(p => p.id === winner.id);
                if (newPlayers[winnerIndex]) newPlayers[winnerIndex].stack += pot;
                return newPlayers;
            });
        } else {
             toast({ title: t('You folded')});
        }

        setGameState('pre-deal');
    };

    const handleCheck = () => {
        toast({ title: t('You check'), description: t('Other players check.') });
        advanceState();
    };

    const handleBet = () => {
        const user = players.find(p => p.isUser);
        if (!user) return;

        if (betAmount <= 0) {
            toast({ variant: "destructive", title: t('Invalid Bet'), description: t('Bet amount must be positive.') });
            return;
        }
        if (betAmount > user.stack) {
            toast({ variant: "destructive", title: t('Not enough chips'), description: t('You cannot bet more than you have.') });
            return;
        }
        
        let totalPotIncrease = 0;
        const newPlayers = players.map(p => {
            if (p.isUser) {
                totalPotIncrease += betAmount;
                return { ...p, stack: p.stack - betAmount };
            }
            if (p.hasFolded || p.stack === 0) {
                return p;
            }

            const actionChance = Math.random();
            if (actionChance < 0.2) { // 20% chance to fold
                toast({ description: t('{name} folds.', { name: p.name }) });
                return { ...p, hasFolded: true };
            } else { // 80% chance to call
                const callAmount = Math.min(betAmount, p.stack);
                totalPotIncrease += callAmount;
                toast({ description: t('{name} calls.', { name: p.name }) });
                return { ...p, stack: p.stack - callAmount };
            }
        });

        setPlayers(newPlayers);
        setPot(p => p + totalPotIncrease);
        toast({ title: t('You bet {amount}', { amount: betAmount }) });
        
        advanceState();
    };

    const displayedCommunityCards = () => {
        switch(gameState) {
            case 'flop': return communityCards.slice(0, 3);
            case 'turn': return communityCards.slice(0, 4);
            case 'river': case 'showdown': return communityCards.slice(0, 5);
            default: return [];
        }
    };

    const handleShowCards = (show: boolean) => {
        setPlayers(prev => prev.map(p => p.isUser ? { ...p, showHand: show } : p));
    }

    const actionButtonsDisabled = isDealing || gameState === 'showdown' || gameState === 'dealing' || gameState === 'pre-deal';
    const userPlayer = players.find(p => p.isUser);
    const opponents = players.filter(p => !p.isUser);
    const gameOver = players.length > 1 && players.filter(p => p.stack > 0).length <= 1;

    return (
        <div className="w-full aspect-[16/10] bg-primary rounded-3xl p-4 md:p-8 relative flex flex-col items-center justify-between shadow-inner border-4 border-yellow-900/50" style={{boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)'}}>
            
            <div className="absolute top-4 left-4 z-20">
              <Select value={String(numPlayers)} onValueChange={(val) => setNumPlayers(parseInt(val))} disabled={isDealing}>
                <SelectTrigger className="w-40 bg-background/80">
                  <SelectValue placeholder={t('Number of players')} />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5, 6].map(n => (
                    <SelectItem key={n} value={String(n)}>{n} {t('Players')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-center gap-4 flex-wrap">
                {opponents.map(player => (
                    <div key={player.id} className="flex flex-col items-center">
                        <div className="text-lg font-bold text-white/90 mb-1 font-headline">{player.name}</div>
                        <div className="text-md font-bold text-accent mb-2">{t('Stack')}: ${player.stack}</div>
                        <div className="flex space-x-2 h-40 md:h-44">
                             {player.hand.length > 0 ? player.hand.map((card, i) => 
                                <div key={i} className="animate-in fade-in duration-300">
                                   <PlayingCard {...card} hidden={gameState !== 'showdown'}/>
                                </div>
                            ) : (
                                <>
                                   <div className="w-28 h-40 md:w-32 md:h-44 rounded-lg bg-muted/20 border-2 border-dashed border-white/20" />
                                   <div className="w-28 h-40 md:w-32 md:h-44 rounded-lg bg-muted/20 border-2 border-dashed border-white/20" />
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-col items-center space-y-4">
                <div className="flex space-x-2 h-40 md:h-44 min-h-[10rem] md:min-h-[11rem] items-center">
                    {displayedCommunityCards().map((card, i) => (
                         <div key={`${card.rank}-${card.suit}`} className="animate-in fade-in-0 zoom-in-95 duration-500" style={{animationDelay: `${i * 100}ms`}}>
                            <PlayingCard {...card} />
                         </div>
                    ))}
                </div>
                <div className="bg-black/30 text-accent font-bold text-xl px-6 py-2 rounded-full border-2 border-accent/50">
                    {t('Pot')}: ${pot}
                </div>
            </div>

            {userPlayer && (
                <div className="flex flex-col items-center">
                    <div className="flex space-x-2 mb-2 h-40 md:h-44">
                         {userPlayer.hand.length > 0 ? userPlayer.hand.map((card, i) => 
                            <div key={i} className="animate-in fade-in duration-300">
                               <PlayingCard {...card} hidden={!userPlayer.showHand && gameState !== 'showdown'} />
                            </div>
                         ) : (
                            <>
                               <div className="w-28 h-40 md:w-32 md:h-44 rounded-lg bg-muted/20 border-2 border-dashed border-white/20" />
                               <div className="w-28 h-40 md:w-32 md:h-44 rounded-lg bg-muted/20 border-2 border-dashed border-white/20" />
                            </>
                         )}
                    </div>
                    <div className="text-lg font-bold text-white/90 font-headline">{userPlayer.name}</div>
                    <div className="text-md font-bold text-accent mt-2">{t('Stack')}: ${userPlayer.stack}</div>
                </div>
            )}

            <div className="absolute bottom-4 left-4 flex flex-col sm:flex-row gap-2">
                <Button onClick={handleFold} variant="destructive" disabled={actionButtonsDisabled}>{t('Fold')}</Button>
                <Button onClick={handleCheck} disabled={actionButtonsDisabled}>{t('Check')}</Button>
                <div className="flex items-center gap-2">
                    <Button onClick={handleBet} disabled={actionButtonsDisabled}>{t('Bet')}</Button>
                    <Input type="number" value={betAmount} onChange={e => setBetAmount(parseInt(e.target.value) || 0)} className="w-24 bg-background/80" disabled={actionButtonsDisabled} />
                </div>
            </div>

            <div className="absolute bottom-4 right-4 flex flex-col sm:flex-row gap-2">
                {gameState === 'showdown' && <Button onClick={() => setGameState('pre-deal')} className="bg-accent hover:bg-accent/90" disabled={gameOver}>{t('New Hand')}</Button>}
                <Button onClick={() => handleShowCards(userPlayer ? !userPlayer.showHand : false)} variant="outline" disabled={actionButtonsDisabled || gameState === 'showdown'}>{userPlayer?.showHand ? t('Hide My Cards') : t('Show My Cards')}</Button>
            </div>
        </div>
    );
}
