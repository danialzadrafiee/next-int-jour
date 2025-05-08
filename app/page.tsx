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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

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
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/journal/new">➕ Add New Entry</Link>
          </Button>
          <Button asChild>
            <Link href="/ai">🤖 AI</Link>
          </Button>
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="text-center text-muted-foreground">No journal entries found. Add one!</p>
      ) : (
        <Accordion type="single" collapsible className="w-full space-y-4">
          {entries.map((entry) => (
            <AccordionItem key={entry.id} value={`entry-${entry.id}`} className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-4 py-3 bg-muted hover:bg-accent transition-colors">
                <div className="flex justify-between items-center w-full pr-4">
                  <span className="font-medium flex items-center">
                    📅 {format(new Date(entry.date), 'MMM dd, yyyy')}
                    {entry.aiInsight && <Badge variant="outline" className="ml-2 bg-blue-50">AI Analyzed</Badge>}
                  </span>
                  <span className="text-muted-foreground text-sm truncate max-w-md text-right">
                    {entry.trcGoal?.substring(0, 50) || 'No goal'}{entry.trcGoal && entry.trcGoal.length > 50 ? '...' : ''}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Left Column - Emotional & Management Data */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Emotional State:</span>
                      <Badge >
                        {entry.emotionalTemp || 'N/A'}/10
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Management:</span>
                      <Badge >
                        {entry.managementRating || 'N/A'}/5
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">TRC Progress:</span>
                      <Badge >
                        {entry.trcProgress ? "Yes" : "No"}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Rules Followed:</span>
                      <Badge>
                        {!entry.brokeRules ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>

                  {/* Middle Column - Key Takeaways */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Key Trade Info</h3>
                    {entry.executionNotes ? (
                      <p className="text-sm line-clamp-4">
                        {entry.executionNotes.replace(/!\[\[.*?\]\]/g, '(Chart)')}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No execution notes recorded</p>
                    )}
                    {entry.images.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {entry.images.length} chart image{entry.images.length !== 1 ? 's' : ''} attached
                      </p>
                    )}
                  </div>

                  {/* Right Column - Images & Actions */}
                  <div className="flex flex-col justify-between h-full">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">What did i learn/improve today(market+self)</h3>
                      <p className="text-sm line-clamp-3">
                        {entry.learnings || entry.oneTakeawayTeaching || 'No learnings recorded'}
                      </p>
                    </div>

                    <div className="flex justify-end space-x-2 mt-4">
                      <Button variant="secondary" size="sm" asChild>
                        <Link href={`/journal/${format(new Date(entry.date), 'yyyy-MM-dd')}`}>
                          View Details
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/journal/edit/${format(new Date(entry.date), 'yyyy-MM-dd')}`}>
                          Edit
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* P&L Information - If Available */}
                {entry.pnlOfTheDay && (
                  <Card className="mt-4">
                    <CardContent className="p-4">
                      <h3 className="text-sm font-medium mb-2">P&L Summary</h3>
                      <pre className="bg-muted p-2 rounded-md text-xs overflow-x-auto whitespace-pre-wrap max-h-24 overflow-y-auto">
                        {entry.pnlOfTheDay}
                      </pre>
                    </CardContent>
                  </Card>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Add a simple chart or stats at the bottom */}
      {entries.length > 0 && (
        <div className="mt-8 p-4 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Journal Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted rounded-md">
              <p className="text-2xl font-bold">{entries.length}</p>
              <p className="text-sm text-muted-foreground">Total Entries</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-md">
              <p className="text-2xl font-bold">
                {entries.filter(e => e.trcProgress).length}
              </p>
              <p className="text-sm text-muted-foreground">TRC Goals Met</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-md">
              <p className="text-2xl font-bold">
                {entries.filter(e => !e.brokeRules).length}
              </p>
              <p className="text-sm text-muted-foreground">Rule-Following Days</p>
            </div>
            <div className="text-center p-3 bg-muted rounded-md">
              <p className="text-2xl font-bold">
                {entries.filter(e => e.aiInsight).length}
              </p>
              <p className="text-sm text-muted-foreground">AI Analyzed</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}