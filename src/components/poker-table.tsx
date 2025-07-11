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
    hasActed: boolean;
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

    const handleShowdown = useCallback(() => {
        setGameState('showdown');

        let winner: Player | null = null;
        const activePlayers = players.filter(p => !p.hasFolded);

        if (activePlayers.length === 1) {
            winner = activePlayers[0];
        } else if (activePlayers.length > 1) {
            // Simplified winner determination for now
            winner = activePlayers[Math.floor(Math.random() * activePlayers.length)];
        }
        
        const finalPot = pot + players.reduce((sum, p) => sum + p.currentBet, 0);

        if (winner) {
            if (winner.isUser) {
                toast({ title: t('You win!'), description: t('You won the pot of ${pot}.', { pot: finalPot }) });
            } else {
                toast({ title: t('{name} wins.', { name: winner.name }), description: t('{name} won the pot of ${pot}.', { name: winner.name, pot: finalPot }) });
            }
             setPlayers(prevPlayers => prevPlayers.map(p => {
                if (p.id === winner!.id) {
                    return {...p, stack: p.stack + finalPot, showHand: true};
                }
                return {...p, showHand: true};
            }));
        } else {
            // Split pot or other cases
             setPlayers(prevPlayers => prevPlayers.map(p => ({...p, showHand: true})));
        }
        setPot(0);

    }, [players, pot, t, toast]);
    
    const advanceRound = useCallback(() => {
        const roundPot = players.reduce((sum, p) => sum + p.currentBet, 0);
        setPot(p => p + roundPot);

        setPlayers(prevPlayers => prevPlayers.map(p => ({
            ...p,
            currentBet: 0,
            hasActed: p.hasFolded || p.isAllIn,
        })));
        
        switch (gameState) {
            case 'pre-flop': setGameState('flop'); break;
            case 'flop': setGameState('turn'); break;
            case 'turn': setGameState('river'); break;
            case 'river': handleShowdown(); break;
            default: break;
        }
    }, [gameState, players, handleShowdown]);

    useEffect(() => {
        if (['setup', 'dealing', 'showdown'].includes(gameState)) return;
        
        const nonFoldedPlayers = players.filter(p => !p.hasFolded);
        if (nonFoldedPlayers.length <= 1) {
            setTimeout(handleShowdown, 1000);
            return;
        }

        const activePlayers = players.filter(p => !p.hasFolded && !p.isAllIn);
        const highestBet = Math.max(...players.map(p => p.currentBet));
        const allActivePlayersHaveActed = activePlayers.every(p => p.hasActed);

        if (allActivePlayersHaveActed) {
             const allBetsMatched = activePlayers.every(p => p.currentBet === highestBet);
             if (allBetsMatched) {
                setTimeout(advanceRound, 1000);
             }
        }
    }, [players, gameState, advanceRound, handleShowdown]);

    useEffect(() => {
        if (gameState !== 'setup') return;
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
            hasActed: false,
        }));
        setPlayers(initialPlayers);
    }, [numPlayers, t, gameState]);

    const dealNewHand = useCallback(() => {
        setIsDealing(true);
        setGameState('dealing');
        
        const playersInGame = players.filter(p => p.stack > 0);
        if (playersInGame.length <= 1 && players.length > 1) {
            toast({ title: t('Game Over'), description: t('A player has run out of chips.') });
            setGameState('showdown');
            setIsDealing(false);
            return;
        }

        setPot(0);
        setCommunityCards([]);

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
        
        let blindPot = 0;

        const newPlayersState = players.map(p => {
            if (p.stack <= 0) return { ...p, hand: [], hasFolded: true, hasActed: true, isAllIn: true };
            return p;
        }).filter(p => p.stack > 0);

        if(newPlayersState.length > 1) {
            // Small blind
            const sbPlayer = newPlayersState[0];
            const sbAmount = Math.min(p1Blind, sbPlayer.stack);
            sbPlayer.stack -= sbAmount;
            sbPlayer.currentBet = sbAmount;
            sbPlayer.isAllIn = sbPlayer.stack === 0;
            blindPot += sbAmount;

            // Big blind
            const bbPlayer = newPlayersState[1];
            const bbAmount = Math.min(p2Blind, bbPlayer.stack);
            bbPlayer.stack -= bbAmount;
            bbPlayer.currentBet = bbAmount;
            bbPlayer.isAllIn = bbPlayer.stack === 0;
            blindPot += bbAmount;
        }
        
        setPot(blindPot);

        setPlayers(players.map(p => {
            const updatedPlayer = newPlayersState.find(np => np.id === p.id);
            if(updatedPlayer) return {...updatedPlayer, hand: [], showHand: p.isUser ? p.showHand : false, hasFolded: false, hasActed: false};
            
            return {...p, hasFolded: p.stack <= 0, hasActed: p.stack <= 0, isAllIn: p.stack <=0 };
        }));
        
        let dealTimeout = 0;
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < playersInGame.length; j++) {
                dealTimeout += 150;
                setTimeout(() => {
                    setPlayers(prev => {
                        const newPlayers = [...prev];
                        const playerIndex = newPlayers.findIndex(p => p.id === playersInGame[j].id);
                        if (newPlayers[playerIndex] && !newPlayers[playerIndex].hasFolded) {
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
            runOpponentActions(players.map(p => {
                const updatedPlayer = newPlayersState.find(np => np.id === p.id);
                 if(updatedPlayer) return {...updatedPlayer, hand: dealtHands[newPlayersState.findIndex(np => np.id === p.id)] || [], showHand: p.isUser ? p.showHand : false, hasFolded: false, hasActed: false};
                return {...p, hasFolded: p.stack <= 0, hasActed: p.stack <= 0, isAllIn: p.stack <=0 };
            }));
        }, dealTimeout + 200);

    }, [players, toast, t]);
    
    const runOpponentActions = (currentPlayers: Player[]) => {
        let playersState = [...currentPlayers];
        
        const processNextOpponent = () => {
            const nextOpponent = playersState.find(p => !p.isUser && !p.hasFolded && !p.isAllIn && !p.hasActed);
            if (!nextOpponent) {
                setPlayers(playersState); // All opponents have acted
                return;
            }

            setTimeout(() => {
                const highestBet = Math.max(...playersState.map(p => p.currentBet));
                const neededToCall = highestBet - nextOpponent.currentBet;
                
                let updatedPlayer = { ...nextOpponent, hasActed: true };
                let wasRaise = false;

                const handStrength = Math.random(); // Simplified AI

                if (neededToCall > 0) { // Must call, raise, or fold
                    if (handStrength < 0.2) { // Fold
                        updatedPlayer.hasFolded = true;
                        toast({ description: t('{name} folds.', { name: updatedPlayer.name }) });
                    } else if (handStrength > 0.9 && updatedPlayer.stack > neededToCall) { // Raise
                        const raiseAmount = Math.min(updatedPlayer.stack - neededToCall, 50);
                        updatedPlayer.stack -= (neededToCall + raiseAmount);
                        updatedPlayer.currentBet += (neededToCall + raiseAmount);
                        updatedPlayer.isAllIn = updatedPlayer.stack === 0;
                        wasRaise = true;
                        toast({ description: `${updatedPlayer.name} raises by ${raiseAmount}` });
                    } else { // Call
                        const callAmount = Math.min(neededToCall, updatedPlayer.stack);
                        updatedPlayer.stack -= callAmount;
                        updatedPlayer.currentBet += callAmount;
                        updatedPlayer.isAllIn = updatedPlayer.stack === 0;
                        toast({ description: t('{name} calls.', { name: updatedPlayer.name }) });
                    }
                } else { // Can check or bet
                    if (handStrength > 0.7) { // Bet
                        const betValue = Math.min(updatedPlayer.stack, 50);
                        updatedPlayer.stack -= betValue;
                        updatedPlayer.currentBet += betValue;
                        updatedPlayer.isAllIn = updatedPlayer.stack === 0;
                        wasRaise = true;
                        toast({ description: `${updatedPlayer.name} bets ${betValue}` });
                    } else { // Check
                         toast({ description: `${updatedPlayer.name} checks` });
                    }
                }

                playersState = playersState.map(p => p.id === updatedPlayer.id ? updatedPlayer : p);
                
                if (wasRaise) {
                    playersState = playersState.map(p => ({
                        ...p,
                        hasActed: p.id === updatedPlayer.id || p.hasFolded || p.isAllIn
                    }));
                }

                setPlayers(playersState);
                processNextOpponent(); // process next opponent
            }, 800);
        };
        processNextOpponent();
    };

    const handleFold = () => {
        const afterFoldPlayers = players.map(p => p.isUser ? { ...p, hasFolded: true, hasActed: true } : p);
        setPlayers(afterFoldPlayers);
        runOpponentActions(afterFoldPlayers);
    };

    const handleCheck = () => {
        const highestBet = Math.max(...players.map(p => p.currentBet));
        const user = players.find(p => p.isUser);
        if(!user || user.currentBet < highestBet) {
             toast({ variant: "destructive", title: t('Invalid Bet'), description: `You must at least call ${highestBet}` });
            return;
        }
        const afterCheckPlayers = players.map(p => p.isUser ? { ...p, hasActed: true } : p);
        setPlayers(afterCheckPlayers);
        runOpponentActions(afterCheckPlayers);
    };

    const handleBet = (betValue?: number) => {
        const user = players.find(p => p.isUser);
        if (!user) return;
        const amount = betValue !== undefined ? betValue : (typeof betAmount === 'number' ? betAmount : 0);

        if (amount <= 0 && amount !== user.stack) {
            toast({ variant: "destructive", title: t('Invalid Bet'), description: t('Bet amount must be positive.') });
            return;
        }
        if (amount % 5 !== 0 && amount !== user.stack) {
            toast({ variant: "destructive", title: t('Invalid Bet'), description: `Bet must be a multiple of 5.` });
            return;
        }

        if (amount > user.stack) {
            toast({ variant: "destructive", title: t('Not enough chips'), description: t('You cannot bet more than you have.') });
            return;
        }

        const isAllIn = amount >= user.stack;
        const finalBet = isAllIn ? user.stack : amount;
        
        const highestBetBefore = Math.max(...players.map(p => p.currentBet));
        const isRaise = (user.currentBet + finalBet) > highestBetBefore;
        
        const playersAfterUserAction = players.map(p => {
            if (p.isUser) {
                return { ...p, stack: p.stack - finalBet, currentBet: p.currentBet + finalBet, isAllIn, hasActed: true };
            }
            if(isRaise && !p.hasFolded && !p.isAllIn) {
                return { ...p, hasActed: false };
            }
            return p;
        });
        
        setPlayers(playersAfterUserAction);
        toast({ title: t('You bet {amount}', { amount: finalBet }) });
        runOpponentActions(playersAfterUserAction);
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
            handleBet(user.stack);
        }
    }

    const userPlayer = players.find(p => p.isUser);
    const opponents = players.filter(p => !p.isUser);
    const gameOver = useMemo(() => players.length > 1 && players.filter(p => p.stack > 0).length <= 1 && gameState === 'showdown', [players, gameState]);

    const canUserAct = useMemo(() => {
        if (!userPlayer || userPlayer.hasFolded || userPlayer.isAllIn || userPlayer.hasActed) return false;
        const opponentsActing = players.some(p => !p.isUser && !p.hasFolded && !p.isAllIn && !p.hasActed);
        return !opponentsActing;
    }, [players, userPlayer]);
    
    const actionButtonsDisabled = isDealing || gameState === 'setup' || gameState === 'showdown' || !canUserAct;

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

            <div className="flex justify-center gap-x-8 gap-y-4 flex-wrap">
                {opponents.map(player => (
                    <div key={player.id} className="flex flex-col items-center relative h-36">
                        <div className="text-lg font-bold text-white/90 mb-1 font-headline">{player.name}</div>
                        <div className="text-md font-bold text-accent mb-2">{t('Stack')}: ${player.stack}</div>
                        <div className="flex space-x-2 h-20 items-center">
                             {player.hand.length > 0 ? player.hand.map((card, i) => 
                                <div key={i} className="animate-in fade-in duration-300">
                                   <PlayingCard {...card} hidden={!player.showHand && gameState !== 'showdown'}/>
                                </div>
                            ) : (
                                <>
                                   <div className="w-12 h-16 rounded-lg bg-muted/20 border-2 border-dashed border-white/20" />
                                   <div className="w-12 h-16 rounded-lg bg-muted/20 border-2 border-dashed border-white/20" />
                                </>
                            )}
                        </div>
                        {player.currentBet > 0 && <ChipStack amount={player.currentBet} />}
                    </div>
                ))}
            </div>

            <div className="flex flex-col items-center space-y-4">
                 {gameState === 'setup' ? (
                     <div className="flex justify-center items-center h-24 min-h-[6rem]">
                        <Button onClick={dealNewHand} size="lg" className="bg-accent hover:bg-accent/90">{t('Start Game')}</Button>
                    </div>
                ) : (
                    <div className="flex space-x-2 h-24 min-h-[6rem] items-center">
                        {displayedCommunityCards().map((card, i) => (
                             <div key={`${card.rank}-${card.suit}-${i}`} className="animate-in fade-in-0 zoom-in-95 duration-500" style={{animationDelay: `${i * 100}ms`}}>
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
                <div className="flex flex-col items-center relative h-36">
                    <div className="flex space-x-2 mb-2 h-20 items-center">
                         {userPlayer.hand.length > 0 ? userPlayer.hand.map((card, i) => 
                            <div key={i} className="animate-in fade-in duration-300">
                               <PlayingCard {...card} hidden={!userPlayer.showHand && gameState !== 'showdown'} />
                            </div>
                         ) : (
                            <>
                               <div className="w-12 h-16 rounded-lg bg-muted/20 border-2 border-dashed border-white/20" />
                               <div className="w-12 h-16 rounded-lg bg-muted/20 border-2 border-dashed border-white/20" />
                            </>
                         )}
                    </div>
                    <div className="text-lg font-bold text-white/90 font-headline">{userPlayer.name}</div>
                    <div className="text-md font-bold text-accent mt-2">{t('Stack')}: ${userPlayer.stack}</div>
                    {userPlayer.currentBet > 0 && <ChipStack amount={userPlayer.currentBet} />}
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
