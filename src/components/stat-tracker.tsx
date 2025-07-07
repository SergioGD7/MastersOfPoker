'use client'

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartConfig, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, Rectangle, XAxis, YAxis, CartesianGrid } from "recharts"
import { useI18n } from "./i18n-provider";

const MOCK_HAND_HISTORY = [
    { hand: "AA", handsPlayed: 15, netWon: 350.50, winRate: 85.2 },
    { hand: "KK", handsPlayed: 22, netWon: 410.00, winRate: 82.1 },
    { hand: "AKs", handsPlayed: 45, netWon: 250.75, winRate: 65.4 },
    { hand: "72o", handsPlayed: 5, netWon: -100.00, winRate: 15.8 },
    { hand: "JTs", handsPlayed: 60, netWon: 120.20, winRate: 55.9 },
]

const MOCK_WINRATE_DATA = [
  { level: "1/2", winrate: 15.5 },
  { level: "2/5", winrate: 9.8 },
  { level: "5/10", winrate: 4.2 },
  { level: "10/20", winrate: -2.1 },
  { level: "25/50", winrate: 1.5 },
]

const chartConfig = {
  winrate: {
    label: "Win Rate (bb/100)",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig

export function StatTracker() {
    const { t } = useI18n();
    return (
        <Card className="border-accent/20">
            <CardHeader>
                <CardTitle className="font-headline text-accent">{t('Performance Stats')}</CardTitle>
                <CardDescription>{t('Analyze your hand history and track your win rates.')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="flex justify-start">
                    <Button className="bg-accent hover:bg-accent/90">
                        {t('Import Hand History (Coming Soon)')}
                    </Button>
                </div>
                
                <div>
                    <h3 className="text-2xl font-headline mb-4">{t('Hand Performance')}</h3>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('Hand')}</TableHead>
                                <TableHead>{t('Times Played')}</TableHead>
                                <TableHead>{t('Net Won ($)')}</TableHead>
                                <TableHead>{t('Win Rate (%)')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {MOCK_HAND_HISTORY.map((row) => (
                                <TableRow key={row.hand}>
                                    <TableCell className="font-medium">{row.hand}</TableCell>
                                    <TableCell>{row.handsPlayed}</TableCell>
                                    <TableCell className={row.netWon >= 0 ? 'text-green-400' : 'text-red-400'}>
                                        {row.netWon >= 0 ? `+$${row.netWon.toFixed(2)}` : `-$${Math.abs(row.netWon).toFixed(2)}`}
                                    </TableCell>
                                    <TableCell>{row.winRate}%</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                
                <div>
                     <h3 className="text-2xl font-headline mb-4">{t('Win Rate by Blind Level')}</h3>
                     <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                        <BarChart accessibilityLayer data={MOCK_WINRATE_DATA}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="level"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                tickFormatter={(value) => value}
                            />
                            <YAxis
                                dataKey="winrate"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={10}
                                tickFormatter={(value) => `${value} bb`}
                             />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent indicator="dot" />}
                            />
                            <Bar
                                dataKey="winrate"
                                fill="var(--color-winrate)"
                                radius={4}
                                activeBar={<Rectangle fill="hsl(var(--primary))" />}
                            />
                        </BarChart>
                    </ChartContainer>
                </div>
            </CardContent>
        </Card>
    )
}
