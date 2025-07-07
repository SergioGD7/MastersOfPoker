'use client'

import React, { useState, useEffect } from 'react';
import { PlayingCard, type Rank, type Suit } from "@/components/playing-card";
import { Button } from "@/components/ui/button";

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
    const [gameState, setGameState] = useState<'pre-deal' | 'pre-flop' | 'flop' | 'turn' | 'river' | 'showdown'>('pre-deal');
    const [pot, setPot] = useState(0);
    const [player1Hand, setPlayer1Hand] = useState<{rank: Rank, suit: Suit}[]>([]);
    const [player2Hand, setPlayer2Hand] = useState<{rank: Rank, suit: Suit}[]>([]);
    const [communityCards, setCommunityCards] = useState<{rank: Rank, suit: Suit}[]>([]);
    const [showPlayer1, setShowPlayer1] = useState(false);
    
    const dealNewHand = () => {
        const newDeck = shuffleDeck(createDeck());
        
        setPlayer1Hand(newDeck.splice(0, 2));
        setPlayer2Hand(newDeck.splice(0, 2));
        setCommunityCards(newDeck.splice(0, 5));
        
        setPot(30); // Small and big blind
        setGameState('pre-flop');
        setShowPlayer1(false);
    };

    useEffect(() => {
        if (gameState === 'pre-deal') {
            dealNewHand();
        }
    }, [gameState]);

    const advanceState = () => {
        switch (gameState) {
            case 'pre-flop':
                setGameState('flop');
                setPot(p => p + 50);
                break;
            case 'flop':
                setGameState('turn');
                setPot(p => p + 100);
                break;
            case 'turn':
                setGameState('river');
                setPot(p => p + 200);
                break;
            case 'river':
                setGameState('showdown');
                break;
        }
    };
    
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

    return (
        <div className="w-full aspect-[16/10] bg-primary rounded-3xl p-4 md:p-8 relative flex flex-col items-center justify-between shadow-inner border-4 border-yellow-900/50" style={{boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)'}}>
            {/* Player 2 (Top) */}
            <div className="flex flex-col items-center">
                 <div className="text-lg font-bold text-white/90 mb-2 font-headline">Player 2</div>
                <div className="flex space-x-2 h-28 md:h-36">
                    {player2Hand.length > 0 && player2Hand.map((card, i) => <PlayingCard key={i} {...card} hidden={gameState !== 'showdown'}/>)}
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
                     {player1Hand.length > 0 && player1Hand.map((card, i) => <PlayingCard key={i} {...card} hidden={!showPlayer1 && gameState !== 'showdown'} />)}
                </div>
                <div className="text-lg font-bold text-white/90 font-headline">Player 1 (You)</div>
            </div>

            <div className="absolute bottom-4 right-4 flex flex-col sm:flex-row gap-2">
                {gameState !== 'showdown' && <Button onClick={advanceState} variant="secondary">Next Stage</Button>}
                {gameState === 'showdown' && <Button onClick={() => setGameState('pre-deal')} className="bg-accent hover:bg-accent/90">New Hand</Button>}
                {gameState !== 'showdown' && <Button onClick={() => setShowPlayer1(s => !s)} variant="outline">{showPlayer1 ? "Hide" : "Show"} My Cards</Button>}
            </div>
        </div>
    );
}
