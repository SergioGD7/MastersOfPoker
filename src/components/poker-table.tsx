'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { PlayingCard, type Rank, type Suit } from "@/components/playing-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const ranks: Rank[] = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];
const suits: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];

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
    const [gameState, setGameState] = useState<'pre-deal' | 'dealing' | 'pre-flop' | 'flop' | 'turn' | 'river' | 'showdown'>('pre-deal');
    const [pot, setPot] = useState(0);
    const [player1Hand, setPlayer1Hand] = useState<{rank: Rank, suit: Suit}[]>([]);
    const [player2Hand, setPlayer2Hand] = useState<{rank: Rank, suit: Suit}[]>([]);
    const [communityCards, setCommunityCards] = useState<{rank: Rank, suit: Suit}[]>([]);
    const [showPlayer1, setShowPlayer1] = useState(false);
    const [isDealing, setIsDealing] = useState(false);

    const [player1Stack, setPlayer1Stack] = useState(1000);
    const [player2Stack, setPlayer2Stack] = useState(1000);
    const [betAmount, setBetAmount] = useState(50);
    const { toast } = useToast();

    const dealNewHand = useCallback(() => {
        if (player1Stack <= 0 || player2Stack <= 0) {
            toast({ title: "Game Over", description: "A player has run out of chips." });
            setGameState('showdown');
            return;
        }

        setIsDealing(true);
        setGameState('dealing');
        const newDeck = shuffleDeck(createDeck());
        
        setPlayer1Hand([]);
        setPlayer2Hand([]);
        setCommunityCards(newDeck.slice(4, 9));
        
        const p1Blind = 10;
        const p2Blind = 20;
        setPlayer1Stack(s => s - p1Blind);
        setPlayer2Stack(s => s - p2Blind);
        setPot(p1Blind + p2Blind);
        setShowPlayer1(false);
        
        // Animated dealing
        setTimeout(() => setPlayer1Hand([newDeck[0]]), 200);
        setTimeout(() => setPlayer2Hand([newDeck[2]]), 400);
        setTimeout(() => setPlayer1Hand(h => [...h, newDeck[1]]), 600);
        setTimeout(() => setPlayer2Hand(h => [...h, newDeck[3]]), 800);

        setTimeout(() => {
            setGameState('pre-flop');
            setIsDealing(false);
        }, 1000);
    }, [player1Stack, player2Stack, toast]);

    useEffect(() => {
        if (gameState === 'pre-deal') {
            dealNewHand();
        }
    }, [gameState, dealNewHand]);

    const advanceState = useCallback(() => {
        switch (gameState) {
            case 'pre-flop':
                setGameState('flop');
                break;
            case 'flop':
                setGameState('turn');
                break;
            case 'turn':
                setGameState('river');
                break;
            case 'river':
                setGameState('showdown');
                break;
        }
    }, [gameState]);

    const handleFold = () => {
        toast({ title: "You folded", description: "Player 2 wins the pot." });
        setPlayer2Stack(s => s + pot);
        setGameState('pre-deal');
    };

    const handleCheck = () => {
        toast({ title: "You check", description: "Player 2 also checks." });
        advanceState();
    };

    const handleBet = () => {
        if (betAmount <= 0) {
            toast({ variant: "destructive", title: "Invalid Bet", description: "Bet amount must be positive." });
            return;
        }
        if (betAmount > player1Stack) {
            toast({ variant: "destructive", title: "Not enough chips", description: "You cannot bet more than you have." });
            return;
        }

        const opponentCallAmount = Math.min(betAmount, player2Stack);
        
        setPlayer1Stack(s => s - betAmount);
        setPlayer2Stack(s => s - opponentCallAmount);
        setPot(p => p + betAmount + opponentCallAmount);

        if (opponentCallAmount < betAmount) {
             toast({ title: `You bet ${betAmount}`, description: `Player 2 is all-in to call for ${opponentCallAmount}.` });
        } else {
             toast({ title: `You bet ${betAmount}`, description: `Player 2 calls.` });
        }
        
        advanceState();
    };

    const handleShowdown = useCallback(() => {
        // This is a simplified showdown logic, does not evaluate hands.
        // A real implementation would compare hands to find the winner.
        const winner = Math.random() > 0.5 ? 'player1' : 'player2';
        if (winner === 'player1') {
            toast({ title: "You win!", description: `You won the pot of $${pot}.` });
            setPlayer1Stack(s => s + pot);
        } else {
            toast({ title: "Player 2 wins.", description: `Player 2 won the pot of $${pot}.` });
            setPlayer2Stack(s => s + pot);
        }
    }, [pot, toast]);

    useEffect(() => {
        if (gameState === 'showdown' && !isDealing) {
            handleShowdown();
        }
    }, [gameState, isDealing, handleShowdown]);
    
    const displayedCommunityCards = () => {
        switch(gameState) {
            case 'flop': return communityCards.slice(0, 3);
            case 'turn': return communityCards.slice(0, 4);
            case 'river':
            case 'showdown':
                return communityCards.slice(0, 5);
            default: return [];
        }
    };

    const actionButtonsDisabled = isDealing || gameState === 'showdown' || gameState === 'dealing' || gameState === 'pre-deal';

    return (
        <div className="w-full aspect-[16/10] bg-primary rounded-3xl p-4 md:p-8 relative flex flex-col items-center justify-between shadow-inner border-4 border-yellow-900/50" style={{boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)'}}>
            {/* Player 2 (Top) */}
            <div className="flex flex-col items-center">
                 <div className="text-lg font-bold text-white/90 mb-2 font-headline">Player 2</div>
                 <div className="text-md font-bold text-accent mb-2">Stack: ${player2Stack}</div>
                <div className="flex space-x-2 h-28 md:h-36">
                    {player2Hand.length > 0 ? player2Hand.map((card, i) => 
                        <div key={i} className="animate-in fade-in duration-300">
                           <PlayingCard {...card} hidden={gameState !== 'showdown'}/>
                        </div>
                    ) : (
                        <>
                           <div className="w-20 h-28 md:w-24 md:h-36 rounded-lg bg-muted/20 border-2 border-dashed border-white/20" />
                           <div className="w-20 h-28 md:w-24 md:h-36 rounded-lg bg-muted/20 border-2 border-dashed border-white/20" />
                        </>
                    )}
                </div>
            </div>

            {/* Community Cards and Pot */}
            <div className="flex flex-col items-center space-y-4">
                <div className="flex space-x-2 h-28 md:h-36 min-h-[7rem] md:min-h-[9rem] items-center">
                    {displayedCommunityCards().map((card, i) => (
                         <div key={`${card.rank}-${card.suit}`} className="animate-in fade-in-0 zoom-in-95 duration-500" style={{animationDelay: `${i * 100}ms`}}>
                            <PlayingCard {...card} />
                         </div>
                    ))}
                </div>
                <div className="bg-black/30 text-accent font-bold text-xl px-6 py-2 rounded-full border-2 border-accent/50">
                    Pot: ${pot}
                </div>
            </div>

            {/* Player 1 (Bottom) */}
            <div className="flex flex-col items-center">
                <div className="flex space-x-2 mb-2 h-28 md:h-36">
                     {player1Hand.length > 0 ? player1Hand.map((card, i) => 
                        <div key={i} className="animate-in fade-in duration-300">
                           <PlayingCard key={i} {...card} hidden={!showPlayer1 && gameState !== 'showdown'} />
                        </div>
                     ) : (
                        <>
                           <div className="w-20 h-28 md:w-24 md:h-36 rounded-lg bg-muted/20 border-2 border-dashed border-white/20" />
                           <div className="w-20 h-28 md:w-24 md:h-36 rounded-lg bg-muted/20 border-2 border-dashed border-white/20" />
                        </>
                     )}
                </div>
                <div className="text-lg font-bold text-white/90 font-headline">Player 1 (You)</div>
                <div className="text-md font-bold text-accent mt-2">Stack: ${player1Stack}</div>
            </div>

             {/* Player 1 Actions */}
            <div className="absolute bottom-4 left-4 flex flex-col sm:flex-row gap-2">
                <Button onClick={handleFold} variant="destructive" disabled={actionButtonsDisabled}>Fold</Button>
                <Button onClick={handleCheck} disabled={actionButtonsDisabled}>Check</Button>
                <div className="flex items-center gap-2">
                    <Button onClick={handleBet} disabled={actionButtonsDisabled}>Bet</Button>
                    <Input type="number" value={betAmount} onChange={e => setBetAmount(parseInt(e.target.value) || 0)} className="w-24 bg-background/80" disabled={actionButtonsDisabled} />
                </div>
            </div>

            <div className="absolute bottom-4 right-4 flex flex-col sm:flex-row gap-2">
                {gameState === 'showdown' && <Button onClick={() => setGameState('pre-deal')} className="bg-accent hover:bg-accent/90" disabled={player1Stack <=0 || player2Stack <=0}>New Hand</Button>}
                <Button onClick={() => setShowPlayer1(s => !s)} variant="outline" disabled={actionButtonsDisabled || gameState === 'showdown'}>{showPlayer1 ? "Hide" : "Show"} My Cards</Button>
            </div>
        </div>
    );
}
