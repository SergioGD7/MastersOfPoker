
'use client'

import React, { useState, useEffect, useCallback, useMemo, useImperativeHandle, forwardRef } from 'react';
import { PlayingCard, type Rank, type Suit } from "@/components/playing-card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from './i18n-provider';
import { ChipIcon } from './icons';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from './ui/alert-dialog';


const ranks: Rank[] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
const suits: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
const rankToValue: Record<Rank, number> = { 'A': 14, 'K': 13, 'Q': 12, 'J': 11, '10': 10, '9': 9, '8': 8, '7': 7, '6': 6, '5': 5, '4': 4, '3': 3, '2': 2 };

type Card = {rank: Rank, suit: Suit};
export type Player = {
    id: number;
    name: string;
    hand: Card[];
    stack: number;
    isUser: boolean;
    showHand: boolean;
    hasFolded: boolean;
    currentBet: number;
    totalBet: number; 
    isAllIn: boolean;
    hasActed: boolean;
};

export type GameState = 'setup' | 'dealing' | 'pre-flop' | 'flop' | 'turn' | 'river' | 'showdown';

type HandResult = {
  rank: number; // 9: Royal Flush, ..., 1: High Card
  values: number[];
  handName: string;
};

type WinnerInfo = {
    name: string;
    handName: string;
} | null;

export interface PokerTableHandles {
    handlePlayerAction: (action: 'fold' | 'check' | 'bet' | 'call', amount?: number) => void;
    dealNewHand: () => void;
    handleShowCards: (show: boolean) => void;
}

interface PokerTableProps {
    onStateChange: (state: {
        players: Player[];
        gameState: GameState;
        canUserAct: boolean;
        isDealing: boolean;
        gameOver: boolean;
    }) => void;
}

function createDeck(): Card[] {
    return ranks.flatMap(rank => suits.map(suit => ({ rank, suit })));
}

function shuffleDeck(deck: Card[]): Card[] {
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

export const PokerTable = forwardRef<PokerTableHandles, PokerTableProps>(({ onStateChange }, ref) => {
    const { t } = useI18n();
    const [gameState, setGameState] = useState<GameState>('setup');
    const [pot, setPot] = useState(0);
    const [players, setPlayers] = useState<Player[]>([]);
    const [numPlayers, setNumPlayers] = useState(2);
    const [communityCards, setCommunityCards] = useState<Card[]>([]);
    const [deck, setDeck] = useState<Card[]>([]);
    const [isDealing, setIsDealing] = useState(false);
    const { toast } = useToast();
    const [currentPlayerId, setCurrentPlayerId] = useState<number | null>(null);
    const [winnerInfo, setWinnerInfo] = useState<WinnerInfo>(null);

    const initializePlayers = useCallback((count: number) => {
        const initialPlayers: Player[] = Array.from({ length: count }, (_, i) => ({
            id: i + 1,
            name: i === 0 ? t('You') : `${t('Player')} ${i + 1}`,
            hand: [],
            stack: 1000,
            isUser: i === 0,
            showHand: false,
            hasFolded: false,
            currentBet: 0,
            totalBet: 0,
            isAllIn: false,
            hasActed: false,
        }));
        setPlayers(initialPlayers);
    }, [t]);

    const evaluateHand = (hand: Card[]): HandResult => {
        const cardValues = hand.map(c => rankToValue[c.rank]).sort((a, b) => b - a);
        const suits = hand.map(c => c.suit);
        const isFlush = new Set(suits).size === 1;
        
        const valueCounts: Record<number, number> = cardValues.reduce((acc, val) => {
            acc[val] = (acc[val] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);
        
        const counts = Object.values(valueCounts).sort((a, b) => b - a);
        const pairs = Object.keys(valueCounts).filter(k => valueCounts[parseInt(k)] === 2).map(Number).sort((a,b) => b-a);
        const threeOfAKind = Object.keys(valueCounts).filter(k => valueCounts[parseInt(k)] === 3).map(Number);
        const fourOfAKind = Object.keys(valueCounts).filter(k => valueCounts[parseInt(k)] === 4).map(Number);

        const uniqueValues = Array.from(new Set(cardValues));
        const isStraight = uniqueValues.length >= 5 && (uniqueValues[0] - uniqueValues[4] === 4) ||
                           JSON.stringify(uniqueValues.slice(0,5)) === JSON.stringify([14, 5, 4, 3, 2]); // Ace-low straight
        
        const straightHighCard = (JSON.stringify(uniqueValues.slice(0,5)) === JSON.stringify([14, 5, 4, 3, 2])) ? 5 : uniqueValues[0];
        
        if (isStraight && isFlush) {
            if (uniqueValues.slice(0,5).every(v => [14,13,12,11,10].includes(v))) return { rank: 9, values: [14], handName: t('Royal Flush') };
            return { rank: 8, values: [straightHighCard], handName: t('Straight Flush') };
        }
        if (counts[0] === 4) return { rank: 7, values: [fourOfAKind[0], ...cardValues.filter(v => v !== fourOfAKind[0])].slice(0,2), handName: t('Four of a Kind') };
        if (counts[0] === 3 && counts[1] === 2) return { rank: 6, values: [threeOfAKind[0], pairs[0]], handName: t('Full House') };
        if (isFlush) return { rank: 5, values: cardValues.slice(0,5), handName: t('Flush') };
        if (isStraight) return { rank: 4, values: [straightHighCard], handName: t('Straight') };
        if (counts[0] === 3) return { rank: 3, values: [threeOfAKind[0], ...cardValues.filter(v => v !== threeOfAKind[0])].slice(0,3), handName: t('Three of a Kind') };
        if (counts[0] === 2 && counts[1] === 2) return { rank: 2, values: [pairs[0], pairs[1], ...cardValues.filter(v => !pairs.includes(v))].slice(0,3), handName: t('Two Pair') };
        if (counts[0] === 2) return { rank: 1, values: [pairs[0], ...cardValues.filter(v => v !== pairs[0])].slice(0,4), handName: t('One Pair') };
        return { rank: 0, values: cardValues.slice(0,5), handName: t('High Card') };
    };

    const findBestHand = (playerHand: Card[], communityCards: Card[]): HandResult => {
        const allCards = [...playerHand, ...communityCards];
        if (allCards.length < 5) return { rank: -1, values: [], handName: '' };

        let bestHandResult: HandResult = { rank: -1, values: [], handName: '' };

        function getCombinations(array: Card[], size: number): Card[][] {
            const result: Card[][] = [];
            function p(t: Card[], i: number) {
                if (t.length === size) {
                    result.push(t);
                    return;
                }
                if (i + 1 > array.length) {
                    return;
                }
                p(t.concat(array[i]), i + 1);
                p(t, i + 1);
            }
            p([], 0);
            return result;
        }

        const combinations = getCombinations(allCards, 5);
        for (const combo of combinations) {
            const result = evaluateHand(combo);
            if (result.rank > bestHandResult.rank) {
                bestHandResult = result;
            } else if (result.rank === bestHandResult.rank) {
                for (let i = 0; i < result.values.length; i++) {
                    if (result.values[i] > bestHandResult.values[i]) {
                        bestHandResult = result;
                        break;
                    }
                    if (result.values[i] < bestHandResult.values[i]) {
                        break;
                    }
                }
            }
        }
        return bestHandResult;
    }
    
    const handleShowdown = useCallback(() => {
        if (gameState === 'showdown') return;
        
        let activePlayers = players.filter(p => !p.hasFolded);
        const finalPot = pot + players.reduce((sum, p) => sum + p.currentBet, 0);

        let winners: { player: Player, result: HandResult }[] = [];

        if (activePlayers.length === 1) {
            winners = [{ player: activePlayers[0], result: { rank: -1, values: [], handName: 'the only one left' } }];
        } else if (activePlayers.length > 1) {
            const playerHandResults = activePlayers.map(p => ({ player: p, result: findBestHand(p.hand, communityCards) }));
            
            let bestResult = playerHandResults[0].result;
            let currentWinners = [{ player: playerHandResults[0].player, result: bestResult }];

            for (let i = 1; i < playerHandResults.length; i++) {
                const currentResult = playerHandResults[i].result;
                let comparison = currentResult.rank - bestResult.rank;
                if (comparison === 0 && currentResult.values.length > 0 && bestResult.values.length > 0) {
                    for(let j=0; j<Math.min(currentResult.values.length, bestResult.values.length); j++) {
                        if (currentResult.values[j] !== bestResult.values[j]) {
                            comparison = currentResult.values[j] - bestResult.values[j];
                            break;
                        }
                    }
                }

                if (comparison > 0) {
                    bestResult = currentResult;
                    currentWinners = [{ player: playerHandResults[i].player, result: bestResult }];
                } else if (comparison === 0) {
                    currentWinners.push({ player: playerHandResults[i].player, result: currentResult });
                }
            }
            winners = currentWinners;
        }

        setGameState('showdown');
        setCurrentPlayerId(null);

        if (winners.length > 0) {
            const potPerWinner = Math.floor(finalPot / winners.length);
            const winnerHandName = winners[0].result.handName;
            const winnerName = winners.length > 1 ? 'Tie' : winners[0].player.name;

            setWinnerInfo({ name: winnerName, handName: winnerHandName });
            
            setPlayers(currentPlayers => {
                const updatedPlayers = currentPlayers.map(p => {
                    const isWinner = winners.some(w => w.player.id === p.id);
                    return {
                        ...p, 
                        stack: p.stack + (isWinner ? potPerWinner : 0),
                        showHand: true,
                        currentBet: 0,
                    };
                });
                setPot(0);
                return updatedPlayers.map(p => ({...p, totalBet: 0}));
            });
        } else {
            setPlayers(currentPlayers => {
                const playersWithReturnedBets = currentPlayers.map(p => ({
                    ...p, stack: p.stack + p.currentBet, currentBet: 0, totalBet: 0, showHand: true
                }));
                setPot(0);
                return playersWithReturnedBets;
            });
        }

    }, [pot, communityCards, gameState, findBestHand, t, players]);
    
    const advanceRound = useCallback(() => {
        let newCommunityCards = [...communityCards];
        let newGameState: GameState = gameState;
    
        switch (gameState) {
            case 'pre-flop':
                newGameState = 'flop';
                newCommunityCards = deck.slice(0, 3);
                break;
            case 'flop':
                newGameState = 'turn';
                newCommunityCards = deck.slice(0, 4);
                break;
            case 'turn':
                newGameState = 'river';
                newCommunityCards = deck.slice(0, 5);
                break;
            case 'river':
                handleShowdown();
                return;
        }
    
        setCommunityCards(newCommunityCards);
        setGameState(newGameState);
    
        setPlayers(prevPlayers => {
            const currentPot = pot + prevPlayers.reduce((sum, p) => sum + p.currentBet, 0);
            setPot(currentPot);
    
            const playersForNextRound = prevPlayers.map(p => ({
                ...p,
                totalBet: p.totalBet + p.currentBet,
                currentBet: 0,
                hasActed: p.hasFolded || p.isAllIn,
            }));
    
            const firstPlayerToAct = playersForNextRound.find(p => !p.hasFolded && !p.isAllIn);
            setCurrentPlayerId(firstPlayerToAct ? firstPlayerToAct.id : null);
            
            return playersForNextRound;
        });
    
    }, [gameState, communityCards, deck, handleShowdown, pot]);

    const runOpponentActions = useCallback((actingPlayer: Player) => {
        setTimeout(() => {
            setPlayers(currentPlayers => {
                let updatedPlayer = currentPlayers.find(p => p.id === actingPlayer.id);
                if (!updatedPlayer || updatedPlayer.hasActed) return currentPlayers;
    
                updatedPlayer = { ...updatedPlayer, hasActed: true };
    
                const highestBet = Math.max(...currentPlayers.map(p => p.currentBet));
                const neededToCall = highestBet - updatedPlayer.currentBet;
                
                const handStrength = Math.random(); 
        
                if (neededToCall > 0) { 
                    if (handStrength < 0.2 && updatedPlayer.stack > neededToCall) { 
                        updatedPlayer.hasFolded = true;
                        toast({ description: t('{name} folds.', { name: updatedPlayer.name }) });
                    } else { 
                        const callAmount = Math.min(neededToCall, updatedPlayer.stack);
                        updatedPlayer.stack -= callAmount;
                        updatedPlayer.currentBet += callAmount;
                        if (updatedPlayer.stack === 0) updatedPlayer.isAllIn = true;
                        toast({ description: t('{name} calls.', { name: updatedPlayer.name }) });
                    }
                } else {
                    if (handStrength > 0.8 && updatedPlayer.stack > 0) { 
                        const betValue = Math.min(updatedPlayer.stack, 20 + Math.floor(Math.random() * 3) * 5); // Bet 20, 25, or 30
                        updatedPlayer.stack -= betValue;
                        updatedPlayer.currentBet += betValue;
                        if (updatedPlayer.stack === 0) updatedPlayer.isAllIn = true;
                        toast({ description: t('{name} bets {amount}', { name: updatedPlayer.name, amount: betValue }) });
                    } else {
                        toast({ description: t('{name} checks.', { name: updatedPlayer.name }) });
                    }
                }
    
                const newPlayers = currentPlayers.map(p => p.id === updatedPlayer!.id ? updatedPlayer! : p);
                
                const newHighestBet = Math.max(...newPlayers.map(p => p.currentBet));
                if (newHighestBet > highestBet) {
                    return newPlayers.map(p => ({
                        ...p,
                        hasActed: p.id === updatedPlayer!.id || p.isAllIn || p.hasFolded
                    }));
                }
                
                return newPlayers;
            });
        }, 800);
    }, [t, toast]);


    useEffect(() => {
        if (gameState === 'setup') {
            initializePlayers(numPlayers);
        }
    }, [numPlayers, initializePlayers, gameState]);

    const dealNewHand = useCallback(() => {
        setWinnerInfo(null);
        const playersWithChips = players.filter(p => p.stack > 0);
        if (players.length > 1 && playersWithChips.length <= 1 && gameState !== 'setup') {
             setTimeout(() => toast({ title: t('Game Over'), description: t('A player has run out of chips.') }), 0);
            setGameState('showdown');
            return;
        }

        setIsDealing(true);
        setGameState('dealing');
        setCommunityCards([]);
        setPot(0);
        
        const newDeck = shuffleDeck(createDeck());
        
        const playersForNewHand = players
            .filter(p => p.stack > 0)
            .map(p => ({ 
                ...p, 
                hand: [], 
                showHand: p.isUser ? p.showHand : false, 
                hasFolded: false, 
                currentBet: 0,
                totalBet: 0,
                isAllIn: false, 
                hasActed: false 
            }));

        let tempDeck = [...newDeck];
        const playerHands = playersForNewHand.map(() => [tempDeck.pop()!, tempDeck.pop()!]);

        const smallBlind = 10;
        const bigBlind = 20;
        
        let tempPlayers = [...playersForNewHand];
        
        if (tempPlayers.length > 1) {
            const sbPlayerIndex = 0 % tempPlayers.length;
            const bbPlayerIndex = 1 % tempPlayers.length;

            const sbPlayer = tempPlayers[sbPlayerIndex];
            const sbAmount = Math.min(smallBlind, sbPlayer.stack);
            sbPlayer.stack -= sbAmount;
            sbPlayer.currentBet = sbAmount;
            sbPlayer.totalBet = sbAmount;
            if (sbPlayer.stack === 0) sbPlayer.isAllIn = true;

            const bbPlayer = tempPlayers[bbPlayerIndex];
            const bbAmount = Math.min(bigBlind, bbPlayer.stack);
            bbPlayer.stack -= bbAmount;
            bbPlayer.currentBet += bbAmount;
            bbPlayer.totalBet = bbAmount;
            if (bbPlayer.stack === 0) bbPlayer.isAllIn = true;
        }
        
        const finalDeck = tempDeck;
        setDeck(finalDeck);

        const finalPlayerState = tempPlayers.map((p, idx) => ({...p, hand: playerHands[idx]}));
        setPlayers(finalPlayerState);
        setPot(0);
        setGameState('pre-flop');
        const firstToActIndex = tempPlayers.length > 2 ? 2 % tempPlayers.length : 0;
        setCurrentPlayerId(finalPlayerState[firstToActIndex]?.id ?? null);
        setIsDealing(false);
    }, [players, gameState, t, toast]);
    
    // Main Game Loop Effect
    useEffect(() => {
        if (['setup', 'dealing', 'showdown'].includes(gameState) || currentPlayerId === null) return;
    
        const nonFoldedPlayers = players.filter(p => !p.hasFolded);

        if (nonFoldedPlayers.length <= 1) {
             setTimeout(() => handleShowdown(), 1000);
            return;
        }

        const activePlayers = players.filter(p => !p.hasFolded && !p.isAllIn);
        const allHaveActed = activePlayers.length > 0 && activePlayers.every(p => p.hasActed);
        if (allHaveActed) {
            const highestBet = Math.max(...activePlayers.map(p => p.currentBet));
            const allBetsMatched = activePlayers.every(p => p.currentBet === highestBet);
            if (allBetsMatched) {
                advanceRound();
                return;
            }
        }
    
        const actingPlayer = players.find(p => p.id === currentPlayerId);
    
        if (actingPlayer && !actingPlayer.isUser && !actingPlayer.hasActed && !actingPlayer.hasFolded && !actingPlayer.isAllIn) {
            runOpponentActions(actingPlayer);
        } else if(actingPlayer?.hasActed) {
             const currentIndex = players.findIndex(p => p.id === currentPlayerId);
             if (currentIndex === -1) return;
 
             let nextIndex = (currentIndex + 1) % players.length;
             let loopCount = 0;
             while(loopCount < players.length) {
                const nextPlayer = players[nextIndex];
                 if (!nextPlayer.hasFolded && !nextPlayer.isAllIn) {
                     const highestBet = Math.max(...players.map(p => p.currentBet));
                     if (!nextPlayer.hasActed || nextPlayer.currentBet < highestBet) {
                         setCurrentPlayerId(nextPlayer.id);
                         return;
                     }
                 }
                 nextIndex = (nextIndex + 1) % players.length;
                 loopCount++;
             }
        }
    
    }, [players, gameState, currentPlayerId, advanceRound, handleShowdown, runOpponentActions]);


    const handlePlayerAction = (action: 'fold' | 'check' | 'bet' | 'call', amount?: number) => {
        setPlayers(currentPlayers => {
            let updatedPlayers = [...currentPlayers];
            const userIndex = updatedPlayers.findIndex(p => p.isUser);
            if (userIndex === -1 || !canUserAct) return updatedPlayers;

            const user = updatedPlayers[userIndex];
            let updatedUser = { ...user, hasActed: true };
            const highestBet = Math.max(...updatedPlayers.map(p => p.currentBet));

            if (action === 'fold') {
                updatedUser.hasFolded = true;
                toast({ description: t('You folded') });
            } else if (action === 'check') {
                if(user.currentBet < highestBet) {
                    toast({ variant: "destructive", title: t('Invalid Bet'), description: `You must at least call ${highestBet}` });
                    return updatedPlayers;
                }
                toast({ description: t('You check') });
            } else if (action === 'call') {
                const amountToCall = highestBet - user.currentBet;
                if (amountToCall <= 0) {
                    toast({ description: t('You check') });
                } else {
                    const callAmount = Math.min(amountToCall, user.stack);
                    updatedUser.stack -= callAmount;
                    updatedUser.currentBet += callAmount;
                    if (updatedUser.stack === 0) {
                        updatedUser.isAllIn = true;
                    }
                    toast({ description: `You call ${callAmount}` });
                }
            } else if (action === 'bet') {
                const betAmountValue = amount ?? 0;

                if (betAmountValue <= 0) {
                    toast({ variant: "destructive", title: t('Invalid Bet'), description: t('Bet amount must be positive.') });
                    return updatedPlayers;
                }

                if (betAmountValue % 5 !== 0) {
                     toast({ variant: "destructive", title: t('Invalid Bet'), description: 'Bet must be in increments of 5.' });
                     return updatedPlayers;
                }
                
                const totalBet = user.currentBet + betAmountValue;
                if (totalBet < highestBet && betAmountValue < user.stack) {
                    toast({ variant: "destructive", title: t('Invalid Bet'), description: `Minimum bet is ${highestBet}.` });
                    return updatedPlayers;
                }

                if (betAmountValue > user.stack) {
                    toast({ variant: "destructive", title: t('Not enough chips'), description: t('You cannot bet more than you have.') });
                    return updatedPlayers;
                }
                
                updatedUser.stack -= betAmountValue;
                updatedUser.currentBet += betAmountValue;

                if (updatedUser.stack === 0) {
                    updatedUser.isAllIn = true;
                }
                toast({ description: t('You bet {amount}', {amount: betAmountValue}) });
            }
            
            updatedUser.totalBet = user.totalBet + (updatedUser.currentBet - user.currentBet);
            updatedPlayers[userIndex] = updatedUser;

            const newHighestBet = Math.max(...updatedPlayers.map(p => p.currentBet));

            if (newHighestBet > highestBet) {
                 updatedPlayers = updatedPlayers.map(p => {
                    if(!p.isUser && !p.isAllIn && !p.hasFolded) {
                        return {...p, hasActed: false};
                    }
                    return p;
                });
            }
            
            return updatedPlayers;
        });
    };

    const handleShowCards = (show: boolean) => {
        setPlayers(prev => prev.map(p => p.isUser ? { ...p, showHand: show } : p));
    }
    
    const userPlayer = players.find(p => p.isUser);
    const opponents = players.filter(p => !p.isUser);
    const gameOver = useMemo(() => players.length > 1 && players.filter(p => p.stack > 0).length <= 1 && gameState === 'showdown', [players, gameState]);

    const canUserAct = useMemo(() => {
        if (!userPlayer || isDealing || gameState === 'setup' || gameState === 'showdown' || userPlayer.hasFolded || userPlayer.isAllIn) {
            return false;
        }
        return userPlayer.id === currentPlayerId;
    }, [userPlayer, isDealing, gameState, currentPlayerId]);
    
    const totalPot = pot + players.reduce((sum, p) => sum + p.currentBet, 0);

    useImperativeHandle(ref, () => ({
        handlePlayerAction,
        dealNewHand,
        handleShowCards,
    }));

    useEffect(() => {
        onStateChange({
            players,
            gameState,
            canUserAct,
            isDealing,
            gameOver,
        });
    }, [players, gameState, canUserAct, isDealing, gameOver, onStateChange]);


    return (
        <div className="w-full h-full aspect-[9/16] md:aspect-[16/10] bg-primary rounded-3xl p-4 flex flex-col items-center justify-between shadow-inner border-4 border-yellow-900/50" style={{boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)'}}>
            
            <div className="w-full flex-shrink-0 z-20">
              <Select value={String(numPlayers)} onValueChange={(val) => setNumPlayers(parseInt(val))} disabled={gameState !== 'setup'}>
                <SelectTrigger className="w-32 md:w-40 bg-background/80">
                  <SelectValue placeholder={t('Number of players')} />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5, 6].map(n => (
                    <SelectItem key={n} value={String(n)}>{n} {t('Players')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Opponents Area */}
            <div className="w-full flex-grow flex items-center justify-center">
                <div className="flex justify-center items-start gap-x-4 md:gap-x-12 gap-y-8 flex-wrap">
                    {opponents.map(player => (
                        <div key={player.id} className="flex flex-col items-center relative pt-12">
                            <div className="absolute top-0 text-center mb-2 z-10">
                                <div className="text-md md:text-lg font-bold text-white/90 font-headline">{player.name}</div>
                                <div className="text-sm md:text-md font-bold text-accent">{t('Stack')}: ${player.stack}</div>
                            </div>
                            <div className="flex space-x-2 h-24 items-center">
                                {player.hand.length > 0 ? player.hand.map((card, i) => 
                                    <PlayingCard key={i} {...card} hidden={!player.showHand && gameState !== 'showdown'}/>
                                ) : (
                                    <>
                                    <div className="w-12 h-20 rounded-lg bg-muted/20 border-2 border-dashed border-white/20" />
                                    <div className="w-12 h-20 rounded-lg bg-muted/20 border-2 border-dashed border-white/20" />
                                    </>
                                )}
                            </div>
                            {player.totalBet > 0 && <ChipStack amount={player.totalBet} />}
                        </div>
                    ))}
                </div>
            </div>


            {/* Table Area (Pot & Community Cards) */}
            <div className="flex flex-col items-center space-y-2 md:space-y-4 my-2 md:my-4 flex-shrink-0">
                {gameState === 'setup' ? (
                     <div className="flex justify-center items-center h-24 min-h-[6rem]">
                        <Button onClick={dealNewHand} size="lg" className="bg-accent hover:bg-accent/90">{t('Start Game')}</Button>
                    </div>
                ) : (
                    <div className="flex space-x-1 md:space-x-2 h-24 min-h-[6rem] items-center">
                        {communityCards.map((card, i) => (
                             <PlayingCard key={`${card.rank}-${card.suit}-${i}`} {...card} />
                        ))}
                    </div>
                )}
                <div className="bg-black/30 text-accent font-bold text-lg md:text-xl px-4 md:px-6 py-2 rounded-full border-2 border-accent/50">
                    {t('Pot')}: ${totalPot}
                </div>
            </div>

            {/* User Area */}
            <div className="w-full flex flex-col items-center space-y-4 pt-4 flex-shrink-0">
                {userPlayer && (
                    <div className="flex flex-col items-center relative">
                        <div className="text-center mb-2 z-10">
                            <div className="text-md md:text-lg font-bold text-white/90 font-headline">{userPlayer.name}</div>
                            <div className="text-sm md:text-md font-bold text-accent">{t('Stack')}: ${userPlayer.stack}</div>
                        </div>
                        <div className="flex space-x-2 h-24 items-center">
                            {userPlayer.hand.length > 0 ? userPlayer.hand.map((card, i) => 
                                <PlayingCard key={i} {...card} hidden={!userPlayer.showHand && gameState !== 'showdown'} />
                            ) : (
                                <>
                                <div className="w-12 h-20 rounded-lg bg-muted/20 border-2 border-dashed border-white/20" />
                                <div className="w-12 h-20 rounded-lg bg-muted/20 border-2 border-dashed border-white/20" />
                                </>
                            )}
                        </div>
                        {userPlayer.totalBet > 0 && <ChipStack amount={userPlayer.totalBet} />}
                    </div>
                )}
            </div>


            <AlertDialog open={!!winnerInfo} onOpenChange={(open) => !open && setWinnerInfo(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-center text-accent font-headline text-3xl">
                            {winnerInfo?.name === 'Tie' ? "It's a Tie!" : `${winnerInfo?.name} wins!`}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-lg">
                            With a {winnerInfo?.handName}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => { setWinnerInfo(null); dealNewHand(); }} className="w-full bg-accent hover:bg-accent/90">{t('New Hand')}</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
});
PokerTable.displayName = "PokerTable";
