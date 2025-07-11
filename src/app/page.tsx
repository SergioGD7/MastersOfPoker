'use client'

import { useState, useMemo, useRef, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HandRankings } from "@/components/hand-rankings";
import { StatTracker } from "@/components/stat-tracker";
import { PokerTable, type PokerTableHandles } from "@/components/poker-table";
import { LogoIcon } from "@/components/icons";
import { useI18n } from "@/components/i18n-provider";
import type { Player, GameState } from "@/components/poker-table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function Home() {
  const { t } = useI18n();
  const pokerTableRef = useRef<PokerTableHandles | null>(null);
  const [betAmount, setBetAmount] = useState<number | ''>(20);
  
  // State to hold a snapshot of the poker table state for UI updates
  const [tableState, setTableState] = useState<{
    players: Player[];
    gameState: GameState;
    canUserAct: boolean;
    isDealing: boolean;
    gameOver: boolean;
  } | null>(null);

  const canUserAct = tableState?.canUserAct ?? false;
  const userPlayer = tableState?.players.find(p => p.isUser);
  const highestBet = useMemo(() => Math.max(...(tableState?.players.map(p => p.currentBet) ?? [0])), [tableState?.players]);

  const canUserCheckOrCall = useMemo(() => {
    if (!userPlayer || !tableState) return { canCheck: false, canCall: false, callAmount: 0 };
    const amountToCall = highestBet - userPlayer.currentBet;
    return {
      canCheck: amountToCall <= 0,
      canCall: amountToCall > 0,
      callAmount: amountToCall,
    };
  }, [userPlayer, highestBet]);

  const handleAction = (action: 'fold' | 'check' | 'bet' | 'call', amount?: number) => {
    pokerTableRef.current?.handlePlayerAction(action, amount);
  };
  
  const handleDealNewHand = () => {
    pokerTableRef.current?.dealNewHand();
  }

  const handleShowCards = () => {
    if (userPlayer) {
      pokerTableRef.current?.handleShowCards(!userPlayer.showHand);
    }
  }

  const onTableStateChange = useCallback((newState: any) => {
    setTableState(newState);
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-2 md:p-8">
      <header className="w-full max-w-7xl mx-auto flex items-center justify-center mb-4 md:mb-8">
        <LogoIcon className="h-8 w-8 md:h-10 md:w-10 text-accent" />
        <h1 className="text-3xl md:text-5xl font-headline ml-2 md:ml-4 text-center text-gray-100">
          {t('Masters of Poker')}
        </h1>
      </header>

      <div className="w-full max-w-7xl mx-auto bg-card p-2 sm:p-4 md:p-6 rounded-2xl shadow-2xl border border-border">
        <Tabs defaultValue="visualizer" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-background/50">
            <TabsTrigger value="visualizer">{t('Visualizer')}</TabsTrigger>
            <TabsTrigger value="rankings">{t('Hand Rankings')}</TabsTrigger>
            <TabsTrigger value="tracker">{t('Stat Tracker')}</TabsTrigger>
          </TabsList>
          <TabsContent value="visualizer" className="mt-4 md:mt-6">
            <div className="flex flex-col items-center">
              <PokerTable ref={pokerTableRef} onStateChange={onTableStateChange} />
              {tableState && tableState.gameState !== 'setup' && userPlayer && (
                <div className="w-full flex flex-col items-center gap-2 mt-4">
                  <div className="flex flex-wrap justify-center items-center gap-2">
                    <Button onClick={() => handleAction('fold')} variant="destructive" disabled={!canUserAct}>{t('Fold')}</Button>
                    {canUserCheckOrCall.canCheck ? (
                      <Button onClick={() => handleAction('check')} disabled={!canUserAct}>{t('Check')}</Button>
                    ) : (
                      <Button onClick={() => handleAction('call')} disabled={!canUserAct}>
                        Call ${canUserCheckOrCall.callAmount}
                      </Button>
                    )}
                    <div className="flex items-center gap-2">
                      <Button onClick={() => handleAction('bet', betAmount || 0)} disabled={!canUserAct}>{t('Bet')}</Button>
                      <Input type="number" value={betAmount} onChange={e => setBetAmount(e.target.value === '' ? '' : parseInt(e.target.value))} className="w-20 bg-background/80" disabled={!canUserAct} step="5" />
                    </div>
                    <Button onClick={() => handleAction('bet', userPlayer?.stack)} variant="destructive" className="bg-red-800 hover:bg-red-700" disabled={!canUserAct || !userPlayer?.stack}>All-in</Button>
                  </div>
                  <div className="flex flex-wrap justify-center items-center gap-2">
                    {tableState.gameState === 'showdown' && <Button onClick={handleDealNewHand} className="bg-accent hover:bg-accent/90" disabled={tableState.gameOver}>{t('New Hand')}</Button>}
                    <Button onClick={handleShowCards} variant="outline" disabled={tableState.isDealing || tableState.gameState === 'setup' || tableState.gameState === 'showdown'}>{userPlayer?.showHand ? t('Hide My Cards') : t('Show My Cards')}</Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="rankings" className="mt-4 md:mt-6">
            <HandRankings />
          </TabsContent>
          <TabsContent value="tracker" className="mt-4 md:mt-6">
            <StatTracker />
          </TabsContent>
        </Tabs>
      </div>
      <footer className="mt-4 md:mt-8 text-center text-muted-foreground text-xs md:text-sm">
        <p>{t('Cards dealt. Fortunes made. Are you a master?')}</p>
      </footer>
    </main>
  );
}
