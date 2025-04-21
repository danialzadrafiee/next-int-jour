-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "emotionalTemp" INTEGER,
    "emotionalReason" TEXT,
    "trcGoal" TEXT,
    "trcPlan" TEXT,
    "aphorisms" TEXT,
    "macroContext" TEXT,
    "tradePlan" TEXT,
    "executionNotes" TEXT,
    "hesitation" BOOLEAN DEFAULT false,
    "hesitationReason" TEXT,
    "managementRating" INTEGER,
    "managementReason" TEXT,
    "stayedWithWinner" BOOLEAN DEFAULT false,
    "sizingOk" BOOLEAN DEFAULT false,
    "convictionTrade" BOOLEAN DEFAULT false,
    "convictionTradeReason" TEXT,
    "convictionSized" BOOLEAN DEFAULT false,
    "loggedInStats" BOOLEAN DEFAULT false,
    "brokeRules" BOOLEAN DEFAULT false,
    "rulesExplanation" TEXT,
    "trcProgress" BOOLEAN DEFAULT false,
    "whyTrcProgress" TEXT,
    "learnings" TEXT,
    "whatIsntWorking" TEXT,
    "eliminationPlan" TEXT,
    "changePlan" TEXT,
    "solutionBrainstorm" TEXT,
    "adjustmentForTomorrow" TEXT,
    "easyTrade" TEXT,
    "actionsToImproveForward" TEXT,
    "top3MistakesToday" TEXT,
    "top3ThingsDoneWell" TEXT,
    "oneTakeawayTeaching" TEXT,
    "bestAndWorstTrades" TEXT,
    "recurringMistake" TEXT,
    "todaysRepetition" TEXT,
    "pnlOfTheDay" TEXT,
    "aiInsight" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "JournalImage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "journalEntryId" INTEGER NOT NULL,
    "imagePath" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "caption" TEXT,
    "section" TEXT,
    "position" INTEGER,
    CONSTRAINT "JournalImage_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "JournalEntry_date_key" ON "JournalEntry"("date");
