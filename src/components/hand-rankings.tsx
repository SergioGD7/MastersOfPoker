'use client'

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "./i18n-provider";

export function HandRankings() {
    const { t } = useI18n();

    const handRankings = [
        { name: t('Royal Flush'), description: t('A, K, Q, J, 10, all in the same suit.'), example: 'A♠ K♠ Q♠ J♠ 10♠' },
        { name: t('Straight Flush'), description: t('Five cards in a sequence, all in the same suit.'), example: '9♣ 8♣ 7♣ 6♣ 5♣' },
        { name: t('Four of a Kind'), description: t('All four cards of the same rank.'), example: 'Q♠ Q♥ Q♦ Q♣ 4♦' },
        { name: t('Full House'), description: t('Three of a kind with a pair.'), example: 'J♠ J♥ J♣ 8♦ 8♣' },
        { name: t('Flush'), description: t('Any five cards of the same suit, but not in a sequence.'), example: 'K♥ Q♥ 8♥ 4♥ 2♥' },
        { name: t('Straight'), description: t('Five cards in a sequence, but not of the same suit.'), example: '7♠ 6♥ 5♦ 4♣ 3♠' },
        { name: t('Three of a Kind'), description: t('Three cards of the same rank.'), example: 'A♠ A♥ A♦ 10♣ 5♠' },
        { name: t('Two Pair'), description: t('Two different pairs.'), example: 'K♠ K♣ 7♦ 7♥ 2♣' },
        { name: t('One Pair'), description: t('Two cards of the same rank.'), example: '10♠ 10♥ 9♦ 6♣ 4♥' },
        { name: t('High Card'), description: t('When you haven\'t made any of the hands above, the highest card plays.'), example: 'A♦ K♣ 9♠ 7♥ 4♣' }
    ];

    return (
        <Card className="border-accent/20">
            <CardHeader>
                <CardTitle className="font-headline text-accent">{t('Poker Hand Rankings')}</CardTitle>
                <CardDescription>{t('The ranking of poker hands, from best to worst.')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[150px]">{t('Hand')}</TableHead>
                            <TableHead>{t('Description')}</TableHead>
                            <TableHead className="text-right">{t('Example')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {handRankings.map((hand, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{hand.name}</TableCell>
                                <TableCell>{hand.description}</TableCell>
                                <TableCell className="font-mono text-right">{hand.example}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
