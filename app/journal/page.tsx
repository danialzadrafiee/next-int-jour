// app/journal/page.tsx
import { prisma } from '@/lib/prisma';
import { format } from 'date-fns';
import Link from 'next/link';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export const revalidate = 60; // Revalidate data every 60 seconds

async function getJournalEntries() {
    const entries = await prisma.journalEntry.findMany({
        orderBy: {
            date: 'desc', // Order by date descending
        },
        include: {
            images: true, // Include related images
        },
    });
    return entries;
}

export default async function JournalPage() {
    const entries = await getJournalEntries();

    return (
        <main className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">📖 My Trading Journal</h1>
                <Button asChild>
                    <Link href="/journal/new">➕ Add New Entry</Link>
                </Button>
            </div>

            {entries.length === 0 ? (
                <p className="text-center text-muted-foreground">No journal entries found. Add one!</p>
            ) : (
                <Accordion type="single" collapsible className="w-full space-y-4">
                    {entries.map((entry) => (
                        <AccordionItem key={entry.id} value={`entry-${entry.id}`} className="border rounded-lg overflow-hidden">
                            <AccordionTrigger className="px-4 py-3 bg-muted hover:bg-accent transition-colors">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full text-left">
                                    <span className="font-medium">
                                        📅 {format(new Date(entry.date), 'yyyy-MM-dd')} — Goal: {entry.trcGoal?.substring(0, 50) || 'No goal'}{entry.trcGoal && entry.trcGoal.length > 50 ? '...' : ''}
                                    </span>
                                    <div className="flex gap-2 mt-2 sm:mt-0">
                                        {entry.aiInsight && (
                                            <Badge variant="outline" className="bg-blue-50">
                                                AI Analyzed
                                            </Badge>
                                        )}
                                        {entry.managementRating && (
                                            <Badge >
                                                Management: {entry.managementRating}/5
                                            </Badge>
                                        )}
                                        {entry.emotionalTemp && (
                                            <Badge>
                                                Mood: {entry.emotionalTemp}/10
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="p-4 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* TRC Goal Section */}
                                        <Card className="overflow-hidden">
                                            <CardContent className="p-4">
                                                <h3 className="font-medium mb-2">TRC Goal</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {entry.trcGoal || 'No goal set'}
                                                </p>
                                                {entry.trcProgress !== null && (
                                                    <div className="mt-2">
                                                        <Badge>
                                                            {entry.trcProgress ? "Goal Progress Made" : "No Progress"}
                                                        </Badge>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                        
                                        {/* Trade Management Section */}
                                        <Card className="overflow-hidden">
                                            <CardContent className="p-4">
                                                <h3 className="font-medium mb-2">Trade Management</h3>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div>Hesitation:</div>
                                                    <div>
                                                        <Badge>
                                                            {entry.hesitation ? "Yes" : "No"}
                                                        </Badge>
                                                    </div>
                                                    
                                                    <div>Sized Properly:</div>
                                                    <div>
                                                        <Badge >
                                                            {entry.sizingOk ? "Yes" : "No"}
                                                        </Badge>
                                                    </div>
                                                    
                                                    <div>Rule Breaks:</div>
                                                    <div>
                                                        <Badge >
                                                            {entry.brokeRules ? "Yes" : "No"}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                        
                                        {/* Learnings Section */}
                                        <Card className="overflow-hidden">
                                            <CardContent className="p-4">
                                                <h3 className="font-medium mb-2">Key Insights</h3>
                                                {entry.oneTakeawayTeaching ? (
                                                    <p className="text-sm text-muted-foreground line-clamp-3">
                                                        {entry.oneTakeawayTeaching}
                                                    </p>
                                                ) : (
                                                    <p className="text-sm text-muted-foreground">
                                                        No key takeaway recorded
                                                    </p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>
                                    
                                    {/* Preview of execution notes */}
                                    {entry.executionNotes && (
                                        <Card className="overflow-hidden">
                                            <CardContent className="p-4">
                                                <h3 className="font-medium mb-2">Execution Notes Preview</h3>
                                                <p className="text-sm text-muted-foreground line-clamp-3">
                                                    {entry.executionNotes.replace(/!\[\[.*?\]\]/g, '[Chart Image]')}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    )}
                                    
                                    {/* Image thumbnails if any */}
                                    {entry.images.length > 0 && (
                                        <div>
                                            <h3 className="font-medium mb-2">Charts ({entry.images.length})</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {entry.images.slice(0, 3).map((image, index) => (
                                                    <div key={index} className="relative w-20 h-20 bg-muted rounded overflow-hidden">
                                                        <img 
                                                            src={`/uploads/${image.imagePath}`}
                                                            alt={image.caption || 'Chart image'}
                                                            className="object-cover w-full h-full"
                                                        />
                                                    </div>
                                                ))}
                                                {entry.images.length > 3 && (
                                                    <div className="relative w-20 h-20 bg-muted rounded overflow-hidden flex items-center justify-center">
                                                        <span className="text-sm font-medium">+{entry.images.length - 3}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* View Full Entry Button */}
                                    <div className="flex justify-end">
                                        <Button asChild>
                                            <Link href={`/journal/${format(new Date(entry.date), 'yyyy-MM-dd')}`}>
                                                View Full Entry
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            )}
        </main>
    );
}