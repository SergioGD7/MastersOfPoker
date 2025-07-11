
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

type GameStage = 'setup' | 'dealing' | 'pre-flop' | 'flop' | 'turn' | 'river' | 'showdown';

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
    const [gameState, setGameState] = useState<GameStage>('setup');
    const [pot, setPot] = useState(0);
    const [players, setPlayers] = useState<Player[]>([]);
    const [numPlayers, setNumPlayers] = useState(2);
    const [communityCards, setCommunityCards] = useState<{rank: Rank, suit: Suit}[]>([]);
    const [deck, setDeck] = useState<{rank: Rank, suit: Suit}[]>([]);
    const [isDealing, setIsDealing] = useState(false);
    const [betAmount, setBetAmount] = useState<number | ''>(20);
    const { toast } = useToast();
    const [currentPlayerId, setCurrentPlayerId] = useState<number | null>(null);

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
            isAllIn: false,
            hasActed: false,
        }));
        setPlayers(initialPlayers);
    }, [t]);
    
    const handleShowdown = useCallback(() => {
        setGameState('showdown');
        setCurrentPlayerId(null);
        
        setPlayers(currentPlayers => {
            const activePlayers = currentPlayers.filter(p => !p.hasFolded);
            if (activePlayers.length === 0) return currentPlayers;
            
            const finalPot = pot + currentPlayers.reduce((sum, p) => sum + p.currentBet, 0);
            
            let winner: Player | null = null;
            if (activePlayers.length === 1) {
                winner = activePlayers[0];
                 if (winner.isUser) {
                    toast({ description: t('{name} wins the pot.', { name: winner.name }) });
                } else {
                    toast({ description: t('{name} wins the pot.', { name: winner.name }) });
                }
            } else {
                // Simplified winner determination for multiple players
                winner = activePlayers[Math.floor(Math.random() * activePlayers.length)];
            }
    
            if (winner) {
                if (winner.isUser) {
                    toast({ title: t('You win!'), description: t('You won the pot of ${pot}.', { pot: finalPot }) });
                } else {
                    toast({ title: t('{name} wins.', { name: winner.name }), description: t('{name} won the pot of ${pot}.', { name: winner.name, pot: finalPot }) });
                }
                const updatedPlayers = currentPlayers.map(p => {
                    const isWinner = p.id === winner!.id;
                    return {
                        ...p, 
                        stack: isWinner ? p.stack + finalPot : p.stack, // Winner gets the whole pot
                        showHand: true,
                        currentBet: 0,
                    };
                });
                setPot(0);
                return updatedPlayers.map(p => ({...p, currentBet: 0})); // Reset all current bets after assigning pot
            }

             // If no winner, return bets and reset
             const playersWithReturnedBets = currentPlayers.map(p => ({
                ...p,
                stack: p.stack + p.currentBet,
                currentBet: 0,
                showHand: true
            }));
            setPot(0);
            return playersWithReturnedBets;
        });

    }, [pot, t, toast]);
    
    const advanceRound = useCallback(() => {
        let newCommunityCards = [...communityCards];
        let newGameState: GameStage = gameState;
    
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
                currentBet: 0,
                hasActed: p.hasFolded || p.isAllIn,
            }));
    
            const firstPlayerToAct = playersForNextRound.find(p => !p.hasFolded && !p.isAllIn);
            setCurrentPlayerId(firstPlayerToAct ? firstPlayerToAct.id : null);
            
            return playersForNextRound;
        });
    
    }, [gameState, communityCards, deck, handleShowdown, pot]);

    const runOpponentActions = useCallback((actingPlayer: Player) => {
        setPlayers(currentPlayers => {
            let updatedPlayer = currentPlayers.find(p => p.id === actingPlayer.id);
            if (!updatedPlayer) return currentPlayers;

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
    }, [t, toast]);


    useEffect(() => {
        if (gameState === 'setup') {
            initializePlayers(numPlayers);
        }
    }, [numPlayers, gameState, initializePlayers]);

    const dealNewHand = useCallback(() => {
        const playersWithChips = players.filter(p => p.stack > 0);
        if (players.length > 1 && playersWithChips.length <= 1 && gameState !== 'setup') {
            toast({ title: t('Game Over'), description: t('A player has run out of chips.') });
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
                isAllIn: false, 
                hasActed: false 
            }));

        let tempDeck = [...newDeck];

        const smallBlind = 10;
        const bigBlind = 20;
        
        let tempPlayers = [...playersForNewHand];
        let blindPot = 0;

        if (tempPlayers.length > 1) {
            const sbPlayerIndex = 0 % tempPlayers.length;
            const bbPlayerIndex = 1 % tempPlayers.length;

            const sbPlayer = tempPlayers[sbPlayerIndex];
            const sbAmount = Math.min(smallBlind, sbPlayer.stack);
            sbPlayer.stack -= sbAmount;
            sbPlayer.currentBet = sbAmount;
            if (sbPlayer.stack === 0) sbPlayer.isAllIn = true;

            const bbPlayer = tempPlayers[bbPlayerIndex];
            const bbAmount = Math.min(bigBlind, bbPlayer.stack);
            bbPlayer.stack -= bbAmount;
            bbPlayer.currentBet += bbAmount;
            if (bbPlayer.stack === 0) bbPlayer.isAllIn = true;
            
            blindPot = sbPlayer.currentBet + bbPlayer.currentBet;
        }
        
        const playerHands = tempPlayers.map(() => [tempDeck.pop()!, tempDeck.pop()!]);

        // This part of the deck is for community cards
        const finalDeck = tempDeck;
        setDeck(finalDeck);

        const finalPlayerState = tempPlayers.map((p, idx) => ({...p, hand: playerHands[idx]}));
        setPlayers(finalPlayerState);
        setPot(blindPot);
        setGameState('pre-flop');
        const firstToActIndex = tempPlayers.length > 2 ? 2 % tempPlayers.length : 0;
        setCurrentPlayerId(finalPlayerState[firstToActIndex]?.id ?? null);
        setIsDealing(false);
    }, [players, gameState, t, toast]);
    
    // Main Game Loop Effect
    useEffect(() => {
        if (['setup', 'dealing', 'showdown'].includes(gameState) || currentPlayerId === null) return;
    
        const activePlayers = players.filter(p => !p.hasFolded && !p.isAllIn);
        const nonFoldedPlayers = players.filter(p => !p.hasFolded);

        if (nonFoldedPlayers.length <= 1) {
            handleShowdown();
            return;
        }

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
    
        if (actingPlayer && !actingPlayer.hasActed && !actingPlayer.hasFolded && !actingPlayer.isAllIn) {
            if (!actingPlayer.isUser) {
                setTimeout(() => runOpponentActions(actingPlayer), 800);
            }
        } else {
            const currentIndex = players.findIndex(p => p.id === currentPlayerId);
            if (currentIndex === -1) return;

            let nextIndex = (currentIndex + 1) % players.length;
            let loopCount = 0; // Failsafe to prevent infinite loops
            while(
                (players[nextIndex].hasFolded || players[nextIndex].isAllIn || players[nextIndex].hasActed) && 
                loopCount < players.length
            ) {
                nextIndex = (nextIndex + 1) % players.length;
                loopCount++;
            }

            if (players[nextIndex].id !== currentPlayerId) {
                setCurrentPlayerId(players[nextIndex].id);
            }
        }
    
    }, [players, gameState, currentPlayerId, advanceRound, handleShowdown, runOpponentActions]);


    const handlePlayerAction = (action: 'fold' | 'check' | 'bet' | 'call', amount?: number) => {
        let updatedPlayers = [...players];
        const userIndex = updatedPlayers.findIndex(p => p.isUser);
        if (userIndex === -1) return;

        const user = updatedPlayers[userIndex];
        let updatedUser = { ...user, hasActed: true };
        const highestBet = Math.max(...updatedPlayers.map(p => p.currentBet));

        if (action === 'fold') {
            updatedUser.hasFolded = true;
            toast({ description: t('You folded') });
        } else if (action === 'check') {
            if(user.currentBet < highestBet) {
                toast({ variant: "destructive", title: t('Invalid Bet'), description: `You must at least call ${highestBet}` });
                return;
            }
            toast({ description: t('You check') });
        } else if (action === 'call') {
            const amountToCall = highestBet - user.currentBet;
            if (amountToCall <= 0) {
                // This is equivalent to a check
                toast({ description: t('You check') });
            } else {
                const callAmount = Math.min(amountToCall, user.stack);
                updatedUser.stack -= callAmount;
                updatedUser.currentBet += callAmount;
                toast({ description: `You call ${callAmount}` });
                if (updatedUser.stack === 0) {
                    updatedUser.isAllIn = true;
                }
            }
        } else if (action === 'bet') {
            const betAmountValue = amount ?? (typeof betAmount === 'number' ? betAmount : 0);

            if (betAmountValue <= 0) {
                toast({ variant: "destructive", title: t('Invalid Bet'), description: t('Bet amount must be positive.') });
                return;
            }

            if (betAmountValue % 5 !== 0) {
                 toast({ variant: "destructive", title: t('Invalid Bet'), description: 'Bet must be in increments of 5.' });
                 return;
            }
            
            const totalBet = user.currentBet + betAmountValue;
            if (totalBet < highestBet && betAmountValue < user.stack) {
                toast({ variant: "destructive", title: t('Invalid Bet'), description: `Minimum bet is ${highestBet}.` });
                return;
            }

            if (betAmountValue > user.stack) {
                toast({ variant: "destructive", title: t('Not enough chips'), description: t('You cannot bet more than you have.') });
                return;
            }
            
            updatedUser.stack -= betAmountValue;
            updatedUser.currentBet += betAmountValue;
            toast({ description: t('You bet {amount}', {amount: betAmountValue}) });

            if (updatedUser.stack === 0) {
                updatedUser.isAllIn = true;
            }
        }

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
        
        setPlayers(updatedPlayers);
        
        const nextPlayerIndex = (userIndex + 1) % updatedPlayers.length;
        setCurrentPlayerId(updatedPlayers[nextPlayerIndex].id);
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

    const highestBet = useMemo(() => Math.max(...players.map(p => p.currentBet)), [players]);
    
    const canUserCheckOrCall = useMemo(() => {
        if (!userPlayer) return { canCheck: false, canCall: false, callAmount: 0 };
        const amountToCall = highestBet - userPlayer.currentBet;
        return {
            canCheck: amountToCall <= 0,
            canCall: amountToCall > 0,
            callAmount: amountToCall,
        };
    }, [userPlayer, highestBet]);

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

            <div className="flex justify-center gap-x-16 gap-y-8 flex-wrap">
                {opponents.map(player => (
                    <div key={player.id} className="flex flex-col items-center relative pt-12">
                         <div className="absolute top-0 text-center mb-2 z-10">
                            <div className="text-lg font-bold text-white/90 font-headline">{player.name}</div>
                            <div className="text-md font-bold text-accent">{t('Stack')}: ${player.stack}</div>
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
                        {communityCards.map((card, i) => (
                             <PlayingCard key={`${card.rank}-${card.suit}-${i}`} {...card} />
                        ))}
                    </div>
                )}
                <div className="bg-black/30 text-accent font-bold text-xl px-6 py-2 rounded-full border-2 border-accent/50">
                    {t('Pot')}: ${pot + players.reduce((sum, p) => sum + p.currentBet, 0)}
                </div>
            </div>

            {userPlayer && (
                 <div className="flex flex-col items-center relative pt-12">
                    <div className="absolute top-0 text-center mb-2 z-10">
                        <div className="text-lg font-bold text-white/90 font-headline">{userPlayer.name}</div>
                        <div className="text-md font-bold text-accent">{t('Stack')}: ${userPlayer.stack}</div>
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
                    {userPlayer.currentBet > 0 && <ChipStack amount={userPlayer.currentBet} />}
                </div>
            )}

            <div className="absolute bottom-4 left-4 flex flex-col sm:flex-row gap-2">
                <Button onClick={() => handlePlayerAction('fold')} variant="destructive" disabled={!canUserAct}>{t('Fold')}</Button>
                {canUserCheckOrCall.canCheck ? (
                    <Button onClick={() => handlePlayerAction('check')} disabled={!canUserAct}>{t('Check')}</Button>
                ) : (
                    <Button onClick={() => handlePlayerAction('call')} disabled={!canUserAct}>
                        Call ${canUserCheckOrCall.callAmount}
                    </Button>
                )}
                <div className="flex items-center gap-2">
                    <Button onClick={() => handlePlayerAction('bet')} disabled={!canUserAct}>{t('Bet')}</Button>
                    <Input type="number" value={betAmount} onChange={e => setBetAmount(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-24 bg-background/80" disabled={!canUserAct} step="5" />
                    <Button onClick={() => handlePlayerAction('bet', userPlayer?.stack)} variant="destructive" className="bg-red-800 hover:bg-red-700" disabled={!canUserAct || !userPlayer?.stack}>All-in</Button>
                </div>
            </div>

            <div className="absolute bottom-4 right-4 flex flex-col sm:flex-row gap-2">
                {gameState === 'showdown' && <Button onClick={dealNewHand} className="bg-accent hover:bg-accent/90" disabled={gameOver}>{t('New Hand')}</Button>}
                <Button onClick={() => handleShowCards(userPlayer ? !userPlayer.showHand : false)} variant="outline" disabled={isDealing || gameState === 'setup' || gameState === 'showdown'}>{userPlayer?.showHand ? t('Hide My Cards') : t('Show My Cards')}</Button>
            </div>
        </div>
    );
}

    

    