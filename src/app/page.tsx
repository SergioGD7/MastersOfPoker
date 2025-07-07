import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HandSimulator } from "@/components/hand-simulator";
import { StatTracker } from "@/components/stat-tracker";
import { PokerTable } from "@/components/poker-table";
import { LogoIcon } from "@/components/icons";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-4 md:p-8">
      <header className="w-full max-w-7xl mx-auto flex items-center justify-center mb-8">
        <LogoIcon className="h-10 w-10 text-accent" />
        <h1 className="text-4xl md:text-5xl font-headline ml-4 text-center text-gray-100">
          Masters of Poker
        </h1>
      </header>

      <div className="w-full max-w-7xl mx-auto bg-card p-4 sm:p-6 rounded-2xl shadow-2xl border border-border">
        <Tabs defaultValue="visualizer" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-background/50">
            <TabsTrigger value="visualizer">Visualizer</TabsTrigger>
            <TabsTrigger value="simulator">Hand Simulator</TabsTrigger>
            <TabsTrigger value="tracker">Stat Tracker</TabsTrigger>
          </TabsList>
          <TabsContent value="visualizer" className="mt-6">
            <PokerTable />
          </TabsContent>
          <TabsContent value="simulator" className="mt-6">
            <HandSimulator />
          </TabsContent>
          <TabsContent value="tracker" className="mt-6">
            <StatTracker />
          </TabsContent>
        </Tabs>
      </div>
      <footer className="mt-8 text-center text-muted-foreground text-sm">
        <p>Cards dealt. Fortunes made. Are you a master?</p>
      </footer>
    </main>
  );
}
