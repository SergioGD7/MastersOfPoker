import { cn } from "@/lib/utils";
import { SpadesIcon, HeartsIcon, DiamondsIcon, ClubsIcon } from "./icons";

export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type Rank = 'A' | 'K' | 'Q' | 'J' | '10' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';

interface PlayingCardProps {
  rank: Rank;
  suit: Suit;
  className?: string;
  hidden?: boolean;
}

const suitIcons = {
  spades: SpadesIcon,
  hearts: HeartsIcon,
  diamonds: DiamondsIcon,
  clubs: ClubsIcon,
};

const suitColors = {
    spades: 'text-black',
    clubs: 'text-black',
    hearts: 'text-red-600',
    diamonds: 'text-red-600',
}

export function PlayingCard({ rank, suit, className, hidden = false }: PlayingCardProps) {
  const SuitIcon = suitIcons[suit];
  const colorClass = suitColors[suit];

  if (hidden) {
    return (
        <div className={cn(
            "w-28 h-40 md:w-32 md:h-44 rounded-lg bg-blue-800 border-2 border-blue-900 flex items-center justify-center",
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
        "relative w-28 h-40 md:w-32 md:h-44 rounded-lg bg-white border border-neutral-300 shadow-lg p-2 flex flex-col justify-between font-headline",
        className
    )}>
      <div className="flex flex-col items-start">
        <div className={cn("text-3xl md:text-4xl font-bold", colorClass)}>{rank}</div>
        <SuitIcon className={cn("h-6 w-6 md:h-7 md:w-7", colorClass)} />
      </div>
      <div className="self-center">
        <SuitIcon className={cn("h-14 w-14", colorClass)} />
      </div>
      <div className="flex flex-col items-end rotate-180">
        <div className={cn("text-3xl md:text-4xl font-bold", colorClass)}>{rank}</div>
        <SuitIcon className={cn("h-6 w-6 md:h-7 md:w-7", colorClass)} />
      </div>
    </div>
  );
}
