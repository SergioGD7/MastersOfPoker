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
  spades: 'text-neutral-900',
  clubs: 'text-neutral-900',
  hearts: 'text-destructive',
  diamonds: 'text-destructive',
}

export function PlayingCard({ rank, suit, className, hidden = false }: PlayingCardProps) {
  const SuitIcon = suitIcons[suit];
  const colorClass = suitColors[suit];

  if (hidden) {
    return (
        <div className={cn(
            "w-20 h-28 md:w-24 md:h-36 rounded-lg bg-blue-800 border-2 border-blue-900 flex items-center justify-center",
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
        "relative w-20 h-28 md:w-24 md:h-36 rounded-lg bg-white dark:bg-neutral-100 border border-neutral-300 dark:border-neutral-200 shadow-lg p-2 flex flex-col justify-between font-headline",
        className
    )}>
      <div className="flex flex-col items-start">
        <div className={cn("text-2xl font-bold", colorClass)}>{rank}</div>
        <SuitIcon className={cn("h-5 w-5", colorClass)} />
      </div>
      <div className="self-center">
        <SuitIcon className={cn("h-10 w-10", colorClass)} />
      </div>
      <div className="flex flex-col items-end rotate-180">
        <div className={cn("text-2xl font-bold", colorClass)}>{rank}</div>
        <SuitIcon className={cn("h-5 w-5", colorClass)} />
      </div>
    </div>
  );
}
