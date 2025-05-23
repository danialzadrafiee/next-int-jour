// app/journal/[date]/page.tsx
import { prisma } from '@/lib/prisma';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { triggerAIAnalysis } from '../actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from '@/components/ui/badge';
import { notFound } from 'next/navigation';

export const revalidate = 60; // Revalidate data every 60 seconds

// Generate a list of date paths for static generation
export async function generateStaticParams() {
    const entries = await prisma.journalEntry.findMany({
        select: { date: true },
    });
    return entries.map((entry) => ({
        date: format(entry.date, 'yyyy-MM-dd'),
    }));
}
async function getJournalEntry(dateString: string) {
    try {
        const date = parseISO(dateString);

        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const entry = await prisma.journalEntry.findUnique({
            where: {
                date: startOfDay,
            },
            include: {
                images: {
                    orderBy: {
                        position: 'asc',
                    },
                },
            },
        });

        return entry;
    } catch (error) {
        console.error("Error fetching journal entry:", error);
        return null;
    }
}

export default async function JournalEntryPage({ params }: { params: { date: string } }) {
    const entry = await getJournalEntry(params.date);

    if (!entry) {
        notFound();
    }

    // Process execution notes to replace image references with actual images
    let processedNotes = entry.executionNotes || '';
    entry.images.forEach(img => {
        const imagePattern = new RegExp(`!\\[\\[${img.filename}\\]\\]`, 'g');
        processedNotes = processedNotes.replace(
            imagePattern,
            `\n<div class="my-4 p-2 border rounded-md">
        <img src="/uploads/${img.imagePath}" alt="${img.caption || 'Trading chart'}" class="mx-auto rounded-md" />
        ${img.caption ? `<p class="text-center text-sm text-muted-foreground mt-2">${img.caption}</p>` : ''}
      </div>\n`
        );
    });

    // Helper function to safely render HTML content
    const renderHtmlContent = (content: string | null) => {
        if (!content) return null;

        // Check if content contains HTML tags
        if (content.includes('<')) {
            return <div className="prose max-w-none text-wrap break-all dark:prose-invert" dangerouslySetInnerHTML={{ __html: content }} />;
        } else {
            // Just render as pre-formatted text if no HTML
            return <div className="whitespace-pre-line break-all">{content}</div>;
        }
    };

    return (
        <main className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold">📆 {format(new Date(entry.date), 'EEEE, MMMM d, yyyy')}</h1>

                    </div>
                    {entry.trcGoal && (
                        <p className="text-lg text-muted-foreground mt-1">
                            Goal: {entry.trcGoal}
                        </p>
                    )}
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" asChild>
                        <Link href="/journal">
                            Back to Journal
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href={`/journal/edit/${format(new Date(entry.date), 'yyyy-MM-dd')}`}>
                            Edit Entry
                        </Link>
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="summary" className="w-full">
                <TabsList className="mb-6">
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="premarket">Pre-Market</TabsTrigger>
                    <TabsTrigger value="postmarket">Post-Market Review</TabsTrigger>
                    <TabsTrigger value="strategic">Strategic</TabsTrigger>
                </TabsList>

                <TabsContent value="summary" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Emotional State</CardTitle>
                                <CardDescription>How you felt going into the day</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <span className="text-2xl font-bold">{entry.emotionalTemp || 'N/A'}/10</span>
                                    <Badge >
                                        {entry.emotionalTemp && entry.emotionalTemp > 7 ? "Positive" :
                                            entry.emotionalTemp && entry.emotionalTemp < 4 ? "Negative" : "Neutral"}
                                    </Badge>
                                </div>
                                <div className="mt-2">
                                    {renderHtmlContent(entry.emotionalReason || 'No reason provided')}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Trade Management</CardTitle>
                                <CardDescription>How you managed your trades</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <span className="text-2xl font-bold">{entry.managementRating || 'N/A'}/5</span>
                                    <Badge>
                                        {entry.managementRating && entry.managementRating > 3 ? "Good" :
                                            entry.managementRating && entry.managementRating < 3 ? "Poor" : "Average"}
                                    </Badge>
                                </div>
                                <div className="mt-4 space-y-2">
                                    <div className="flex justify-between">
                                        <span>Hesitated:</span>
                                        <Badge >
                                            {entry.hesitation ? "Yes" : "No"}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Stayed with Winner:</span>
                                        <Badge >
                                            {entry.stayedWithWinner ? "Yes" : "No"}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Sized Properly:</span>
                                        <Badge>
                                            {entry.sizingOk ? "Yes" : "No"}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Conviction Trade:</span>
                                        <Badge >
                                            {entry.convictionTrade ? "Yes" : "No"}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>TRC Progress</CardTitle>
                                <CardDescription>Progress toward your goal</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between mb-4">
                                    <Badge className="px-3 py-1">
                                        {entry.trcProgress ? "Made Progress" : "No Progress"}
                                    </Badge>
                                </div>
                                <div className="space-y-2">
                                    <p className="font-medium">Goal: {entry.trcGoal || 'No goal set'}</p>
                                    <div>
                                        {renderHtmlContent(entry.whyTrcProgress || 'No progress explanation')}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Execution Notes Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Execution Notes</CardTitle>
                            <CardDescription>Notes on trades taken</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="prose max-w-none dark:prose-invert"
                                dangerouslySetInnerHTML={{ __html: processedNotes }} />
                        </CardContent>
                    </Card>

                    {/* P&L Section */}
                    {entry.pnlOfTheDay && (
                        <Card>
                            <CardHeader>
                                <CardTitle>P&L Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {renderHtmlContent(entry.pnlOfTheDay)}
                            </CardContent>
                        </Card>
                    )}

                    {/* What did i learn/improve today(market+self) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Things Done Well</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {renderHtmlContent(entry.top3ThingsDoneWell || 'No items recorded')}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Mistakes Made</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {renderHtmlContent(entry.top3MistakesToday || 'No items recorded')}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Pre-Market Tab */}
                <TabsContent value="premarket" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Emotional State</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-muted-foreground mb-2">Emotional Temperature:</p>
                                <p className="text-xl font-medium">{entry.emotionalTemp || 'N/A'}/10</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground mb-2">Reason:</p>
                                {renderHtmlContent(entry.emotionalReason || 'No reason provided')}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Goals & Plan</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-6">
                            <div>
                                <p className="text-muted-foreground mb-2">TRC Goal:</p>
                                <p className="text-lg font-medium">{entry.trcGoal || 'No goal set'}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground mb-2">Plan to Achieve TRC Goal:</p>
                                {renderHtmlContent(entry.trcPlan || 'No plan provided')}
                            </div>
                            <div>
                                <p className="text-muted-foreground mb-2">Reminders / Aphorisms:</p>
                                <div className="whitespace-pre-line">
                                    {entry.aphorisms || 'None recorded'}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

               
                </TabsContent>


                {/* Post-Market Review Tab */}
                <TabsContent value="postmarket" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>TRC Progress</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-muted-foreground mb-1">Made Progress:</p>
                                        <Badge className="px-3 py-1">
                                            {entry.trcProgress ? "Yes" : "No"}
                                        </Badge>
                                    </div>

                                    {entry.whyTrcProgress && (
                                        <div>
                                            <p className="text-muted-foreground mb-1">Why/Why Not:</p>
                                            {renderHtmlContent(entry.whyTrcProgress)}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Rules Compliance</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <p className="text-muted-foreground mb-1">Logged Stats:</p>
                                            <Badge>
                                                {entry.loggedInStats ? "Yes" : "No"}
                                            </Badge>
                                        </div>

                                        <div>
                                            <p className="text-muted-foreground mb-1">Broke Rules:</p>
                                            <Badge>
                                                {entry.brokeRules ? "Yes" : "No"}
                                            </Badge>
                                        </div>
                                    </div>

                                    {entry.brokeRules && entry.rulesExplanation && (
                                        <div>
                                            <p className="text-muted-foreground mb-1">Rule Explanation:</p>
                                            {renderHtmlContent(entry.rulesExplanation)}
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Learnings & Improvements</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 gap-6">
                            {entry.learnings && (
                                <div>
                                    <p className="text-muted-foreground mb-1">Learnings:</p>
                                    {renderHtmlContent(entry.learnings)}
                                </div>
                            )}

                            {entry.whatIsntWorking && (
                                <div>
                                    <p className="text-muted-foreground mb-1">What Isn't Working:</p>
                                    {renderHtmlContent(entry.whatIsntWorking)}
                                </div>
                            )}

                            {entry.eliminationPlan && (
                                <div>
                                    <p className="text-muted-foreground mb-1">What will i eliminate starting now?:</p>
                                    {renderHtmlContent(entry.eliminationPlan)}
                                </div>
                            )}

                            {entry.changePlan && (
                                <div>
                                    <p className="text-muted-foreground mb-1">What changes can be made in order to achieve my goal?:</p>
                                    {renderHtmlContent(entry.changePlan)}
                                </div>
                            )}

                            {entry.solutionBrainstorm && (
                                <div>
                                    <p className="text-muted-foreground mb-1">For the changes i need to make starting today, what are the solutions i can find?:</p>
                                    {renderHtmlContent(entry.solutionBrainstorm)}
                                </div>
                            )}

                            {entry.adjustmentForTomorrow && (
                                <div>
                                    <p className="text-muted-foreground mb-1">What adjustments will i make for tomorrow?:</p>
                                    {renderHtmlContent(entry.adjustmentForTomorrow)}
                                </div>
                            )}

                   
                        </CardContent>
                    </Card>

                    {/* P&L Section */}
                    {entry.pnlOfTheDay && (
                        <Card>
                            <CardHeader>
                                <CardTitle>P&L Summary</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {renderHtmlContent(entry.pnlOfTheDay)}
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Strategic Tab */}
                <TabsContent value="strategic" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Strengths & Weaknesses</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {entry.top3ThingsDoneWell && (
                                    <div>
                                        <p className="text-muted-foreground mb-1">Top 3 things done well today:</p>
                                        {renderHtmlContent(entry.top3ThingsDoneWell)}
                                    </div>
                                )}

                                {entry.top3MistakesToday && (
                                    <div>
                                        <p className="text-muted-foreground mb-1">Top 3 mistakes of today:</p>
                                        {renderHtmlContent(entry.top3MistakesToday)}
                                    </div>
                                )}

                                {entry.bestAndWorstTrades && (
                                    <div>
                                        <p className="text-muted-foreground mb-1">What was the best and worst trade today?:</p>
                                        {renderHtmlContent(entry.bestAndWorstTrades)}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Pattern Recognition</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {entry.recurringMistake && (
                                    <div>
                                        <p className="text-muted-foreground mb-1">What recurring mistake am i still making, and what's the real root cause?:</p>
                                        {renderHtmlContent(entry.recurringMistake)}
                                    </div>
                                )}

                                {entry.oneTakeawayTeaching && (
                                    <div>
                                        <p className="text-muted-foreground mb-1">If i had to teach one takeaway from todays trades to a junior trader what would it be?:</p>
                                        {renderHtmlContent(entry.oneTakeawayTeaching)}
                                    </div>
                                )}

                                {entry.todaysRepetition && (
                                    <div>
                                        <p className="text-muted-foreground mb-1">If today repeated 10 more times, what would i change to maximize edge?:</p>
                                        {renderHtmlContent(entry.todaysRepetition)}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Forward Actions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {entry.actionsToImproveForward && (
                                <div>
                                    <p className="text-muted-foreground mb-1">List of actions to improve forward.:</p>
                                    {renderHtmlContent(entry.actionsToImproveForward)}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>


            </Tabs>
        </main>
    );
}