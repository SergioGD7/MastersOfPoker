
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

type GameStage = 'setup' | 'pre-deal' | 'dealing' | 'pre-flop' | 'flop' | 'turn' | 'river' | 'showdown';

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

    const handleShowdown = useCallback(() => {
        setGameState('showdown');
        setCurrentPlayerId(null);
        let currentPlayers = [...players];
        
        const activePlayers = currentPlayers.filter(p => !p.hasFolded);

        if (activePlayers.length === 0) return;
        
        const finalPot = pot + currentPlayers.reduce((sum, p) => sum + p.currentBet, 0);
        
        let winner: Player | null = null;
        if (activePlayers.length === 1) {
            winner = activePlayers[0];
        } else {
            // Simplified winner determination
            winner = activePlayers[Math.floor(Math.random() * activePlayers.length)];
        }

        if (winner) {
            if (winner.isUser) {
                toast({ title: t('You win!'), description: t('You won the pot of ${pot}.', { pot: finalPot }) });
            } else {
                toast({ title: t('{name} wins.', { name: winner.name }), description: t('{name} won the pot of ${pot}.', { name: winner.name, pot: finalPot }) });
            }
             currentPlayers = currentPlayers.map(p => {
                const isWinner = p.id === winner!.id;
                return {
                    ...p, 
                    stack: isWinner ? p.stack + finalPot : p.stack,
                    currentBet: 0,
                    showHand: true
                };
            });
        }
        setPot(0);
        setPlayers(currentPlayers);
    }, [players, pot, t, toast]);
    
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
            const currentPot = prevPlayers.reduce((sum, p) => sum + p.currentBet, 0);
            setPot(p => p + currentPot);

            const playersForNextRound = prevPlayers.map(p => ({
                ...p,
                currentBet: 0,
                hasActed: p.hasFolded || p.isAllIn,
            }));

            const firstPlayerToAct = playersForNextRound.find(p => !p.hasFolded && !p.isAllIn);
            setCurrentPlayerId(firstPlayerToAct ? firstPlayerToAct.id : null);
            
            return playersForNextRound;
        });

    }, [gameState, communityCards, deck, handleShowdown]);

    const runOpponentActions = useCallback((currentPlayers: Player[]) => {
        let actingPlayerIndex = currentPlayers.findIndex(p => p.id === currentPlayerId);
        if (actingPlayerIndex === -1) return;

        let tempPlayers = [...currentPlayers];
        
        const processNextOpponent = () => {
            const actingPlayer = tempPlayers[actingPlayerIndex];

            if (!actingPlayer || actingPlayer.isUser || actingPlayer.hasFolded || actingPlayer.isAllIn) {
                const nextPlayerIndex = (actingPlayerIndex + 1) % tempPlayers.length;
                setCurrentPlayerId(tempPlayers[nextPlayerIndex].id);
                return;
            }
            
            // It's an opponent's turn
            setTimeout(() => {
                const highestBet = Math.max(...tempPlayers.map(p => p.currentBet));
                const neededToCall = highestBet - actingPlayer.currentBet;
                
                let updatedPlayer = { ...actingPlayer, hasActed: true };

                const handStrength = Math.random(); 

                if (neededToCall > 0) { 
                    if (handStrength < 0.2 && updatedPlayer.stack > neededToCall) { 
                        updatedPlayer.hasFolded = true;
                    } else { 
                        const callAmount = Math.min(neededToCall, updatedPlayer.stack);
                        updatedPlayer.stack -= callAmount;
                        updatedPlayer.currentBet += callAmount;
                        if (updatedPlayer.stack === 0) updatedPlayer.isAllIn = true;
                    }
                } else { 
                    if (handStrength > 0.8 && updatedPlayer.stack > 0) { 
                        const betValue = Math.min(updatedPlayer.stack, 20); 
                        updatedPlayer.stack -= betValue;
                        updatedPlayer.currentBet += betValue;
                         if (updatedPlayer.stack === 0) updatedPlayer.isAllIn = true;
                    }
                }

                tempPlayers = tempPlayers.map(p => p.id === updatedPlayer.id ? updatedPlayer : p);

                const newHighestBet = Math.max(...tempPlayers.map(p => p.currentBet));
                if (newHighestBet > highestBet) { 
                    tempPlayers = tempPlayers.map(p => {
                        if(!p.isAllIn && !p.hasFolded) {
                            return {...p, hasActed: p.id === updatedPlayer.id};
                        }
                        return p;
                    });
                }
                
                setPlayers(tempPlayers);
                
                const nextPlayerIndex = (actingPlayerIndex + 1) % tempPlayers.length;
                setCurrentPlayerId(tempPlayers[nextPlayerIndex].id);

            }, 800);
        };
        processNextOpponent();

    }, [currentPlayerId, advanceRound]);

    useEffect(() => {
        if (currentPlayerId !== null && gameState !== 'setup' && gameState !== 'showdown') {
            const actingPlayer = players.find(p => p.id === currentPlayerId);
            if (actingPlayer && !actingPlayer.isUser && !actingPlayer.hasFolded) {
                runOpponentActions([...players]);
            }
        }
    }, [currentPlayerId, players, gameState, runOpponentActions]);

    useEffect(() => {
        if (['setup', 'dealing', 'showdown'].includes(gameState) || currentPlayerId === null || players.length === 0) return;

        const activePlayers = players.filter(p => !p.hasFolded && !p.isAllIn);
        const nonFoldedPlayers = players.filter(p => !p.hasFolded);

        if (nonFoldedPlayers.length <= 1) {
            setTimeout(handleShowdown, 1000);
            return;
        }
        
        const allHaveActed = activePlayers.length > 0 && activePlayers.every(p => p.hasActed);
        if (allHaveActed) {
            const highestBet = Math.max(...activePlayers.map(p => p.currentBet));
            const allBetsMatched = activePlayers.every(p => p.currentBet === highestBet);
            if (allBetsMatched) {
                setTimeout(advanceRound, 1200);
            }
        }
    }, [players, gameState, advanceRound, handleShowdown, currentPlayerId]);

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
        setCurrentPlayerId(null);
    }, [t]);

    useEffect(() => {
        if (gameState === 'setup') {
            initializePlayers(numPlayers);
        }
    }, [numPlayers, gameState, initializePlayers]);

    const dealNewHand = useCallback(() => {
        setIsDealing(true);
        setGameState('dealing');
        
        const playersInGame = players.filter(p => p.stack > 0);
        if (players.length > 1 && playersInGame.length <= 1 && gameState !== 'setup') {
            toast({ title: t('Game Over'), description: t('A player has run out of chips.') });
            setGameState('showdown');
            setIsDealing(false);
            return;
        }

        setCommunityCards([]);
        
        const newDeck = shuffleDeck(createDeck());
        
        const playersWithResetState = players.map(p => {
             if (p.stack <= 0) return { ...p, hand: [], hasFolded: true, currentBet: 0, isAllIn: true, hasActed: true };
             return { ...p, hand: [], showHand: p.isUser ? p.showHand : false, hasFolded: false, currentBet: 0, isAllIn: false, hasActed: false };
        }).filter(p => p.stack > 0);

        let tempDeck = [...newDeck];
        const playerHands = playersWithResetState.map(() => [tempDeck.pop()!, tempDeck.pop()!]);

        setDeck(tempDeck); // community deck

        const smallBlind = 10;
        const bigBlind = 20;
        let blindPot = 0;
        
        let tempPlayers = [...playersWithResetState];

        if (tempPlayers.length > 1) {
            // Player 1 is SB, Player 2 is BB
            const sbPlayerIndex = 0;
            const bbPlayerIndex = 1;

            const sbPlayer = tempPlayers[sbPlayerIndex];
            const sbAmount = Math.min(smallBlind, sbPlayer.stack);
            sbPlayer.stack -= sbAmount;
            sbPlayer.currentBet = sbAmount;
            blindPot += sbAmount;
            if (sbPlayer.stack === 0) sbPlayer.isAllIn = true;

            const bbPlayer = tempPlayers[bbPlayerIndex];
            const bbAmount = Math.min(bigBlind, bbPlayer.stack);
            bbPlayer.stack -= bbAmount;
            bbPlayer.currentBet += bbAmount;
            blindPot += bbAmount;
            if (bbPlayer.stack === 0) bbPlayer.isAllIn = true;
        }
        
        setPot(blindPot);
        setPlayers(tempPlayers);

        let dealTimeout = 0;
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < tempPlayers.length; j++) {
                dealTimeout += 150;
                setTimeout(() => {
                    setPlayers(prev => prev.map((p, index) => {
                        if (index === j) {
                           return { ...p, hand: playerHands[j].slice(0, i + 1) };
                        }
                        return p;
                    }));
                }, dealTimeout);
            }
        }

        setTimeout(() => {
            const finalPlayerState = tempPlayers.map((p, idx) => ({...p, hand: playerHands[idx]}));
            setPlayers(finalPlayerState);
            setGameState('pre-flop');
            setIsDealing(false);
            const firstToActIndex = tempPlayers.length > 2 ? 2 % tempPlayers.length : 0;
            setCurrentPlayerId(tempPlayers[firstToActIndex]?.id ?? null);
        }, dealTimeout + 200);

    }, [players, toast, t, gameState]);
    
    const handlePlayerAction = (action: 'fold' | 'check' | 'bet', amount?: number) => {
        let updatedPlayers = [...players];
        const userIndex = updatedPlayers.findIndex(p => p.isUser);
        if (userIndex === -1) return;

        const user = updatedPlayers[userIndex];
        let updatedUser = { ...user, hasActed: true };

        if (action === 'fold') {
            updatedUser.hasFolded = true;
        } else if (action === 'check') {
            const highestBet = Math.max(...updatedPlayers.map(p => p.currentBet));
            if(user.currentBet < highestBet) {
                toast({ variant: "destructive", title: t('Invalid Bet'), description: `You must at least call ${highestBet}` });
                return;
            }
        } else if (action === 'bet') {
            const betAmountValue = amount ?? (typeof betAmount === 'number' ? betAmount : 0);

            if (betAmountValue <= 0) {
                toast({ variant: "destructive", title: t('Invalid Bet'), description: t('Bet amount must be positive.') });
                return;
            }

            if (betAmountValue > user.stack) {
                toast({ variant: "destructive", title: t('Not enough chips'), description: t('You cannot bet more than you have.') });
                return;
            }

            const isAllIn = betAmountValue >= user.stack;
            const finalBetAmount = isAllIn ? user.stack : betAmountValue;
            
            updatedUser.stack -= finalBetAmount;
            updatedUser.currentBet += finalBetAmount;
            updatedUser.isAllIn = isAllIn;
        }

        const highestBetBefore = Math.max(...updatedPlayers.map(p => p.currentBet));
        updatedPlayers[userIndex] = updatedUser;
        const newHighestBet = Math.max(...updatedPlayers.map(p => p.currentBet));

        // If user raised, reset `hasActed` for other players
        if (newHighestBet > highestBetBefore) {
             updatedPlayers = updatedPlayers.map(p => {
                if(!p.isUser && !p.isAllIn && !p.hasFolded) {
                    return {...p, hasActed: false};
                }
                return p;
            });
        }

        setPlayers(updatedPlayers);

        // Move to the next player
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

    const canUserCheck = useMemo(() => {
        if (!userPlayer) return false;
        const highestBet = Math.max(...players.map(p => p.currentBet));
        return userPlayer.currentBet === highestBet;
    }, [players, userPlayer]);

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
                                   <div className="w-12 h-20 md:w-16 md:h-24 rounded-lg bg-muted/20 border-2 border-dashed border-white/20" />
                                   <div className="w-12 h-20 md:w-16 md:h-24 rounded-lg bg-muted/20 border-2 border-dashed border-white/20" />
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
                             <div key={`${card.rank}-${card.suit}-${i}`} className="animate-in fade-in-0 zoom-in-95 duration-500" style={{animationDelay: `${i * 100}ms`}}>
                                <PlayingCard {...card} />
                             </div>
                        ))}
                    </div>
                )}
                <div className="bg-black/30 text-accent font-bold text-xl px-6 py-2 rounded-full border-2 border-accent/50">
                    {t('Pot')}: ${pot + players.reduce((sum, p) => sum + p.currentBet, 0)}
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
                               <div className="w-12 h-20 md:w-16 md:h-24 rounded-lg bg-muted/20 border-2 border-dashed border-white/20" />
                               <div className="w-12 h-20 md:w-16 md:h-24 rounded-lg bg-muted/20 border-2 border-dashed border-white/20" />
                            </>
                         )}
                    </div>
                    <div className="text-lg font-bold text-white/90 font-headline">{userPlayer.name}</div>
                    <div className="text-md font-bold text-accent mt-2">{t('Stack')}: ${userPlayer.stack}</div>
                    {userPlayer.currentBet > 0 && <ChipStack amount={userPlayer.currentBet} />}
                </div>
            )}

            <div className="absolute bottom-4 left-4 flex flex-col sm:flex-row gap-2">
                <Button onClick={() => handlePlayerAction('fold')} variant="destructive" disabled={!canUserAct}>{t('Fold')}</Button>
                <Button onClick={() => handlePlayerAction('check')} disabled={!canUserAct || !canUserCheck}>{t('Check')}</Button>
                <div className="flex items-center gap-2">
                    <Button onClick={() => handlePlayerAction('bet')} disabled={!canUserAct}>{t('Bet')}</Button>
                    <Input type="number" value={betAmount} onChange={e => setBetAmount(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-24 bg-background/80" disabled={!canUserAct} />
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
