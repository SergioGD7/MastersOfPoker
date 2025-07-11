'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HandRankings } from "@/components/hand-rankings";
import { StatTracker } from "@/components/stat-tracker";
import { PokerTable } from "@/components/poker-table";
import { LogoIcon } from "@/components/icons";
import { useI18n } from "@/components/i18n-provider";

export default function Home() {
  const { t } = useI18n();

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-2 md:p-8 pb-32 md:pb-8">
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
            <PokerTable />
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
