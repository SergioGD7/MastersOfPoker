import { cn } from "@/lib/utils";

export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = 'A' | 'K' | 'Q' | 'J' | '10' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';

interface PlayingCardProps {
  rank: Rank;
  suit: Suit;
  className?: string;
  hidden?: boolean;
}

const suitEmojis = {
  spades: '♠️',
  hearts: '♥️',
  diamonds: '♦️',
  clubs: '♣️',
};

const suitColors = {
    spades: 'text-black',
    clubs: 'text-black',
    hearts: 'text-red-600',
    diamonds: 'text-red-600',
}

export function PlayingCard({ rank, suit, className, hidden = false }: PlayingCardProps) {
  const suitEmoji = suitEmojis[suit];
  const colorClass = suitColors[suit];

  if (hidden) {
    return (
        <div className={cn(
            "w-12 h-20 md:w-16 md:h-24 rounded-lg bg-blue-800 border-2 border-blue-900 flex items-center justify-center",
            "bg-gradient-to-br from-blue-700 to-blue-900 shadow-lg",
            className
        )}>
            <div className="w-11/12 h-[95%] rounded-md border-2 border-blue-600">
                <div className="w-full h-full rounded-sm bg-blue-800/50" />
            </div>
        </div>
    );
  }

  return (
    <div className={cn(
        "relative w-12 h-20 md:w-16 md:h-24 rounded-lg bg-white border border-neutral-300 shadow-lg p-1 font-headline",
        className
    )}>
      <div className="absolute top-1 left-1 flex flex-col items-center leading-none">
        <span className={cn("text-xl font-bold", colorClass)}>{rank}</span>
        <span className={cn("text-sm")}>{suitEmoji}</span>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn("text-3xl md:text-4xl")}>{suitEmoji}</span>
      </div>
      <div className="absolute bottom-1 right-1 flex flex-col items-center leading-none rotate-180">
        <span className={cn("text-xl font-bold", colorClass)}>{rank}</span>
        <span className={cn("text-sm")}>{suitEmoji}</span>
      </div>
    </div>
  );
}
