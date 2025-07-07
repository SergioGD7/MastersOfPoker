'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PlayingCard, type Rank, type Suit } from "@/components/playing-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from './i18n-provider';
import { ChipIcon } from './icons';

const ranks: Rank[] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
const suits: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
const CHIP_VALUES = [5, 10, 20, 25, 50];

type Player = {
    id: number;
    name: string;
    hand: {rank: Rank, suit: Suit}[];
    stack: number;
    isUser: boolean;
    showHand: boolean;
    hasFolded: boolean;
    currentBet: number;
    isAllIn: boolean;
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

const ChipStack = ({ amount }: { amount: number }) => {
    if (amount === 0) return null;
    return (
        <div className="absolute -bottom-10 flex items-center justify-center gap-1 bg-black/20 px-2 py-1 rounded-full">
            <ChipIcon className="w-5 h-5 text-yellow-400" />
            <span className="text-white font-bold text-sm">${amount}</span>
        </div>
    );
};


export function PokerTable() {
    const { t } = useI18n();
    const [gameState, setGameState] = useState<'setup' | 'pre-deal' | 'dealing' | 'pre-flop' | 'flop' | 'turn' | 'river' | 'showdown'>('setup');
    const [pot, setPot] = useState(0);
    const [players, setPlayers] = useState<Player[]>([]);
    const [numPlayers, setNumPlayers] = useState(2);
    const [communityCards, setCommunityCards] = useState<{rank: Rank, suit: Suit}[]>([]);
    const [isDealing, setIsDealing] = useState(false);
    const [betAmount, setBetAmount] = useState<number | ''>(50);
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
            currentBet: 0,
            isAllIn: false,
        }));
        setPlayers(initialPlayers);
    }, [numPlayers, t]);

    const dealNewHand = useCallback(() => {
        setIsDealing(true);
        setGameState('dealing');
        
        let playersInGame = players.filter(p => p.stack > 0);
        if (playersInGame.length <= 1) {
            toast({ title: t('Game Over'), description: t('A player has run out of chips.') });
            setGameState('showdown');
            setIsDealing(false);
            return;
        }

        const newDeck = shuffleDeck(createDeck());
        
        const dealtHands: {rank: Rank, suit: Suit}[][] = Array.from({ length: playersInGame.length }, () => []);

        let cardIndex = 0;
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < playersInGame.length; j++) {
                dealtHands[j].push(newDeck[cardIndex++]);
            }
        }
        setCommunityCards(newDeck.slice(cardIndex, cardIndex + 5));

        const p1Blind = 10;
        const p2Blind = 20;
        
        setPot(p1Blind + p2Blind);
        setPlayers(prevPlayers => {
            const currentPlayersInGame = prevPlayers.filter(p => p.stack > 0);
            return currentPlayersInGame.map((p, index) => ({
                ...p,
                hand: [],
                showHand: p.isUser ? p.showHand : false,
                hasFolded: false,
                currentBet: index === 0 ? p1Blind : (index === 1 ? p2Blind : 0),
                isAllIn: false,
                stack: index === 0 ? p.stack - p1Blind : (index === 1 ? p.stack - p2Blind : p.stack)
            }));
        });
        
        let dealTimeout = 0;
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < playersInGame.length; j++) {
                dealTimeout += 150;
                setTimeout(() => {
                    setPlayers(prev => {
                        const newPlayers = [...prev];
                        const playerIndex = newPlayers.findIndex(p => p.id === playersInGame[j].id);
                        if (newPlayers[playerIndex]) {
                           newPlayers[playerIndex].hand = dealtHands[j].slice(0, i + 1);
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

    }, [players, toast, t]);
    
    const handleShowdown = useCallback(() => {
        setGameState('showdown');
        setPlayers(prevPlayers => {
            const activePlayers = prevPlayers.filter(p => !p.hasFolded);
            if (activePlayers.length === 1) {
                const winner = activePlayers[0];
                 toast({ title: t('{name} wins.', { name: winner.name }), description: t('{name} won the pot of ${pot}.', { name: winner.name, pot }) });
                 return prevPlayers.map(p => p.id === winner.id ? { ...p, stack: p.stack + pot, showHand: true } : { ...p, showHand: true });
            }

            if(activePlayers.length === 0) return prevPlayers.map(p => ({...p, showHand: true}));;

            // Simplified winner determination
            const winner = activePlayers[Math.floor(Math.random() * activePlayers.length)];
            if (!winner) return prevPlayers.map(p => ({...p, showHand: true}));
    
            if (winner.isUser) {
                toast({ title: t('You win!'), description: t('You won the pot of ${pot}.', { pot }) });
            } else {
                toast({ title: t('{name} wins.', { name: winner.name }), description: t('{name} won the pot of ${pot}.', { name: winner.name, pot }) });
            }
            
            const newPlayers = prevPlayers.map(p => {
                if (p.id === winner.id) {
                    return {...p, stack: p.stack + pot, showHand: true};
                }
                return {...p, showHand: true};
            });
            return newPlayers;
        });
    }, [pot, t, toast]);
    
    const advanceState = useCallback(() => {
        setPlayers(p => p.map(player => ({ ...player, currentBet: 0 })));
        switch (gameState) {
            case 'pre-flop': setGameState('flop'); break;
            case 'flop': setGameState('turn'); break;
            case 'turn': setGameState('river'); break;
            case 'river': handleShowdown(); break;
            default: break;
        }
    }, [gameState, handleShowdown]);

    useEffect(() => {
        const activePlayers = players.filter(p => !p.hasFolded && !p.isAllIn);
        const nonFoldedPlayers = players.filter(p => !p.hasFolded);
        const highestBet = Math.max(...players.map(p => p.currentBet));
        const allHaveBet = activePlayers.every(p => p.currentBet === highestBet || p.isAllIn);

        if (gameState !== 'setup' && gameState !== 'pre-deal' && gameState !== 'dealing' && gameState !== 'showdown') {
             if (nonFoldedPlayers.length === 1) {
                handleShowdown();
                return;
            }
            if (allHaveBet && activePlayers.length > 1) {
                const roundPot = players.reduce((sum, p) => sum + p.currentBet, 0);
                setPot(p => p + roundPot);
                setPlayers(p => p.map(player => ({ ...player, currentBet: 0 })));
                advanceState();
            }
        }
    }, [players, gameState, advanceState, handleShowdown]);

    const handleFold = () => {
        setPlayers(prev => prev.map(p => p.isUser ? { ...p, hasFolded: true, currentBet: 0 } : p));
        runOpponentActions({ type: 'fold' });
    };

    const handleCheck = () => {
        runOpponentActions({ type: 'check' });
        // advanceState(); // This should be handled by the useEffect
    };

    const handleBet = (betValue?: number) => {
        const user = players.find(p => p.isUser);
        if (!user) return;
        const amount = betValue !== undefined ? betValue : (typeof betAmount === 'number' ? betAmount : 0);

        if (amount <= 0) {
            toast({ variant: "destructive", title: t('Invalid Bet'), description: t('Bet amount must be positive.') });
            return;
        }
        if (amount % 5 !== 0) {
            toast({ variant: "destructive", title: t('Invalid Bet'), description: `Bet must be a multiple of 5.` });
            return;
        }

        if (amount > user.stack) {
            toast({ variant: "destructive", title: t('Not enough chips'), description: t('You cannot bet more than you have.') });
            return;
        }

        const isAllIn = amount >= user.stack;
        const finalBet = isAllIn ? user.stack : amount;
        
        setPlayers(prev => prev.map(p => {
            if (p.isUser) {
                return { ...p, stack: p.stack - finalBet, currentBet: p.currentBet + finalBet, isAllIn };
            }
            return p;
        }));
        
        toast({ title: t('You bet {amount}', { amount: finalBet }) });
        runOpponentActions({ type: 'bet', amount: finalBet });
    };

    const runOpponentActions = ({ type, amount }: {type: 'fold' | 'check' | 'bet', amount?: number}) => {
        let betToCall = amount || Math.max(...players.map(p => p.currentBet));

        const updatedPlayers = players.map(p => {
             if (p.isUser || p.hasFolded || p.isAllIn) {
                return p;
            }
            
            // Simple AI
            const hasPair = p.hand.length === 2 && p.hand[0].rank === p.hand[1].rank;
            const hasHighCard = p.hand.some(c => ['A', 'K', 'Q'].includes(c.rank));
            const handStrength = (hasPair ? 0.5 : 0) + (hasHighCard ? 0.2 : 0) + Math.random() * 0.3;
            
            const highestBetOnTable = Math.max(...players.map(pl => pl.currentBet));
            const neededToCall = highestBetOnTable - p.currentBet;
            
            if (neededToCall > 0) { // Someone has bet
                if (handStrength < 0.4 && neededToCall > p.stack * 0.2) { // Fold on weak hand and significant bet
                    toast({ description: t('{name} folds.', { name: p.name }) });
                    return { ...p, hasFolded: true };
                } else { // Call
                    const callAmount = Math.min(neededToCall, p.stack);
                    const isAllIn = callAmount >= p.stack;
                    toast({ description: t('{name} calls.', { name: p.name }) });
                    return { ...p, stack: p.stack - callAmount, currentBet: p.currentBet + callAmount, isAllIn };
                }
            } else { // Can check or bet
                 if (handStrength > 0.6) { // Opponent decides to bet
                    const betValue = Math.min(p.stack, Math.max(50, Math.floor(p.stack * 0.15)));
                    toast({ description: `${p.name} bets ${betValue}`});
                    return {...p, stack: p.stack - betValue, currentBet: p.currentBet + betValue};
                 } else { // Opponent checks
                    toast({ description: `${p.name} checks` });
                    return p;
                 }
            }
        });

        setPlayers(updatedPlayers);
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
    
    const handleAllIn = () => {
        const user = players.find(p => p.isUser);
        if(user) {
            setBetAmount(user.stack);
            handleBet(user.stack);
        }
    }

    const actionButtonsDisabled = isDealing || gameState === 'setup' || gameState === 'showdown' || gameState === 'dealing' || gameState === 'pre-deal' || players.find(p=>p.isUser)?.hasFolded;
    const userPlayer = players.find(p => p.isUser);
    const opponents = players.filter(p => !p.isUser);
    const gameOver = useMemo(() => players.filter(p => p.stack > 0).length <= 1 && players.length > 1 && gameState === 'showdown', [players, gameState]);

    return (
        <div className="w-full aspect-[16/10] bg-primary rounded-3xl p-4 md:p-8 relative flex flex-col items-center justify-between shadow-inner border-4 border-yellow-900/50" style={{boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)'}}>
            
            <div className="absolute top-4 left-4 z-20">
              <Select value={String(numPlayers)} onValueChange={(val) => setNumPlayers(parseInt(val))} disabled={gameState !== 'setup'}>
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

            <div className="flex justify-center gap-x-8 gap-y-16 flex-wrap">
                {opponents.map(player => (
                    <div key={player.id} className="flex flex-col items-center relative">
                        <div className="text-lg font-bold text-white/90 mb-1 font-headline">{player.name}</div>
                        <div className="text-md font-bold text-accent mb-2">{t('Stack')}: ${player.stack}</div>
                        <div className="flex space-x-2 h-36">
                             {player.hand.length > 0 ? player.hand.map((card, i) => 
                                <div key={i} className="animate-in fade-in duration-300">
                                   <PlayingCard {...card} hidden={gameState !== 'showdown'}/>
                                </div>
                            ) : (
                                <>
                                   <div className="w-24 h-36 rounded-lg bg-muted/20 border-2 border-dashed border-white/20" />
                                   <div className="w-24 h-36 rounded-lg bg-muted/20 border-2 border-dashed border-white/20" />
                                </>
                            )}
                        </div>
                        <ChipStack amount={player.currentBet} />
                    </div>
                ))}
            </div>

            <div className="flex flex-col items-center space-y-4">
                 {gameState === 'setup' ? (
                     <div className="flex justify-center items-center h-36 min-h-[9rem]">
                        <Button onClick={dealNewHand} size="lg" className="bg-accent hover:bg-accent/90">{t('Start Game')}</Button>
                    </div>
                ) : (
                    <div className="flex space-x-2 h-36 min-h-[9rem] items-center">
                        {displayedCommunityCards().map((card, i) => (
                             <div key={`${card.rank}-${card.suit}`} className="animate-in fade-in-0 zoom-in-95 duration-500" style={{animationDelay: `${i * 100}ms`}}>
                                <PlayingCard {...card} />
                             </div>
                        ))}
                    </div>
                )}
                <div className="bg-black/30 text-accent font-bold text-xl px-6 py-2 rounded-full border-2 border-accent/50">
                    {t('Pot')}: ${pot}
                </div>
            </div>

            {userPlayer && (
                <div className="flex flex-col items-center relative">
                    <div className="flex space-x-2 mb-2 h-36">
                         {userPlayer.hand.length > 0 ? userPlayer.hand.map((card, i) => 
                            <div key={i} className="animate-in fade-in duration-300">
                               <PlayingCard {...card} hidden={!userPlayer.showHand && gameState !== 'showdown'} />
                            </div>
                         ) : (
                            <>
                               <div className="w-24 h-36 rounded-lg bg-muted/20 border-2 border-dashed border-white/20" />
                               <div className="w-24 h-36 rounded-lg bg-muted/20 border-2 border-dashed border-white/20" />
                            </>
                         )}
                    </div>
                    <div className="text-lg font-bold text-white/90 font-headline">{userPlayer.name}</div>
                    <div className="text-md font-bold text-accent mt-2">{t('Stack')}: ${userPlayer.stack}</div>
                    <ChipStack amount={userPlayer.currentBet} />
                </div>
            )}

            <div className="absolute bottom-4 left-4 flex flex-col sm:flex-row gap-2">
                <Button onClick={handleFold} variant="destructive" disabled={actionButtonsDisabled}>{t('Fold')}</Button>
                <Button onClick={handleCheck} disabled={actionButtonsDisabled}>{t('Check')}</Button>
                <div className="flex items-center gap-2">
                    <Button onClick={() => handleBet()} disabled={actionButtonsDisabled}>{t('Bet')}</Button>
                    <Input type="number" value={betAmount} onChange={e => setBetAmount(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-24 bg-background/80" disabled={actionButtonsDisabled} />
                    <Button onClick={handleAllIn} variant="destructive" className="bg-red-800 hover:bg-red-700" disabled={actionButtonsDisabled}>All-in</Button>
                </div>
            </div>

            <div className="absolute bottom-4 right-4 flex flex-col sm:flex-row gap-2">
                {gameState === 'showdown' && <Button onClick={dealNewHand} className="bg-accent hover:bg-accent/90" disabled={gameOver}>{t('New Hand')}</Button>}
                <Button onClick={() => handleShowCards(userPlayer ? !userPlayer.showHand : false)} variant="outline" disabled={actionButtonsDisabled || gameState === 'showdown'}>{userPlayer?.showHand ? t('Hide My Cards') : t('Show My Cards')}</Button>
            </div>
        </div>
    );
}
