// app/journal/new/page.tsx
"use client";

import { useState, useEffect, FormEvent } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { saveJournalEntry } from "@/app/journal/actions"; // Import the server action
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WysiwygEditor } from "@/components/ui/wysiwyg-editor";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import Link from "next/link";

type FormState = {
    message: string | null;
    errors: Record<string, string[]> | null;
    success?: boolean;
};

export default function NewJournalEntryPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formState, setFormState] = useState<FormState>({
        message: null,
        errors: null,
        success: false,
    });
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [emotionalTemp, setEmotionalTemp] = useState<number>(5);
    const [managementRating, setManagementRating] = useState<number>(3);
    
    // State for storing WYSIWYG content
    const [editorContents, setEditorContents] = useState({
        emotionalReason: "",
        trcPlan: "",
        macroContext: "",
        tradePlan: "",
        executionNotes: "",
        hesitationReason: "",
        managementReason: "",
        convictionTradeReason: "",
        rulesExplanation: "",
        whyTrcProgress: "",
        learnings: "",
        whatIsntWorking: "",
        eliminationPlan: "",
        changePlan: "",
        solutionBrainstorm: "",
        adjustmentForTomorrow: "",
        easyTrade: "",
        actionsToImproveForward: "",
        top3MistakesToday: "",
        top3ThingsDoneWell: "",
        oneTakeawayTeaching: "",
        bestAndWorstTrades: "",
        recurringMistake: "",
        todaysRepetition: "",
        pnlOfTheDay: "",
    });

    // Handle form submission
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const formData = new FormData(e.currentTarget);
            
            // Handle date field
            if (date) {
                formData.set('date', format(date, 'yyyy-MM-dd'));
            }
            
            // Add all WYSIWYG contents to FormData
            Object.entries(editorContents).forEach(([key, value]) => {
                formData.set(key, value);
            });
            
            // Call the server action with the current formState
            const result = await saveJournalEntry(formState, formData);

            setFormState(result);

            if (result.success) {
                toast.success("Journal entry saved successfully!");
                // Navigate to view the new entry
                router.push(`/journal/${format(date!, 'yyyy-MM-dd')}`);
            } else {
                toast.error(result.message || "Failed to save journal entry");
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            toast.error("An unexpected error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Effect to log validation errors to console for debugging
    useEffect(() => {
        if (formState?.errors) {
            console.error("Server-side validation errors:", formState.errors);
        }
    }, [formState]);

    return (
        <main className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">📝 Add New Trading Journal Entry</h1>
                <Button variant="outline" asChild>
                    <Link href="/journal">Cancel</Link>
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Date Selection */}
                <div className="space-y-2">
                    <Label htmlFor="date">Journal Date</Label>
                    <DatePicker date={date} setDate={setDate} />
                    <input type="hidden" name="date" value={date ? format(date, 'yyyy-MM-dd') : ''} />
                    {formState?.errors?.date && <p className="text-sm text-red-500">{formState.errors.date[0]}</p>}
                </div>

                {/* Pre-Market Prep */}
                <section className="space-y-4 p-4 border rounded-lg">
                    <h2 className="text-xl font-semibold mb-3 text-primary">🧠 Pre-Market Prep</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="emotionalTemp">Emotional Temperature ({emotionalTemp}/10)</Label>
                            <Slider
                                id="emotionalTemp"
                                name="emotionalTemp"
                                defaultValue={[emotionalTemp]}
                                min={1}
                                max={10}
                                step={1}
                                onValueChange={(value) => setEmotionalTemp(value[0])}
                            />
                            {formState?.errors?.emotionalTemp && <p className="text-sm text-red-500">{formState.errors.emotionalTemp[0]}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="emotionalReason">Reason for Emotional State</Label>
                            <WysiwygEditor
                                id="emotionalReason"
                                name="emotionalReason"
                                value={editorContents.emotionalReason}
                                onChange={(html) => setEditorContents({ ...editorContents, emotionalReason: html })}
                                placeholder="Feeling calm and focused because..."
                            />
                            {formState?.errors?.emotionalReason && <p className="text-sm text-red-500">{formState.errors.emotionalReason[0]}</p>}
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="trcGoal">TRC Goal</Label>
                            <Input id="trcGoal" name="trcGoal" placeholder="e.g., Execute plan flawlessly, manage risk" />
                            {formState?.errors?.trcGoal && <p className="text-sm text-red-500">{formState.errors.trcGoal[0]}</p>}
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="trcPlan">Plan to Achieve TRC Goal</Label>
                            <WysiwygEditor
                                id="trcPlan"
                                name="trcPlan"
                                value={editorContents.trcPlan}
                                onChange={(html) => setEditorContents({ ...editorContents, trcPlan: html })}
                                placeholder="How will you achieve the goal?"
                            />
                            {formState?.errors?.trcPlan && <p className="text-sm text-red-500">{formState.errors.trcPlan[0]}</p>}
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="aphorisms">Reminders / Aphorisms</Label>
                            <Input id="aphorisms" name="aphorisms" placeholder="e.g., Stick to the plan, don't chase" />
                            {formState?.errors?.aphorisms && <p className="text-sm text-red-500">{formState.errors.aphorisms[0]}</p>}
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="macroContext">Macro Context</Label>
                            <WysiwygEditor
                                id="macroContext"
                                name="macroContext"
                                value={editorContents.macroContext}
                                onChange={(html) => setEditorContents({ ...editorContents, macroContext: html })}
                                placeholder="Overall market sentiment, key news, levels..."
                            />
                            {formState?.errors?.macroContext && <p className="text-sm text-red-500">{formState.errors.macroContext[0]}</p>}
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="tradePlan">Trading plan for the day</Label>
                            <WysiwygEditor
                                id="tradePlan"
                                name="tradePlan"
                                value={editorContents.tradePlan}
                                onChange={(html) => setEditorContents({ ...editorContents, tradePlan: html })}
                                placeholder="Setup, Triggers, Invalidation, Size plan..."
                            />
                            {formState?.errors?.tradePlan && <p className="text-sm text-red-500">{formState.errors.tradePlan[0]}</p>}
                        </div>
                    </div>
                </section>

                {/* During Market */}
                <section className="space-y-4 p-4 border rounded-lg">
                    <h2 className="text-xl font-semibold mb-3 text-primary">⚔ During Market</h2>
                    <div className="space-y-2">
                        <Label htmlFor="executionNotes">Execution Notes</Label>
                        <WysiwygEditor
                            id="executionNotes"
                            name="executionNotes"
                            value={editorContents.executionNotes}
                            onChange={(html) => setEditorContents({ ...editorContents, executionNotes: html })}
                            placeholder="Detailed notes on trades taken. You can paste images directly here."
                        />
                        {formState?.errors?.executionNotes && <p className="text-sm text-red-500">{formState.errors.executionNotes[0]}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox id="hesitation" name="hesitation" />
                            <Label htmlFor="hesitation">Did You Hesitate?</Label>
                            {formState?.errors?.hesitation && <p className="text-sm text-red-500">{formState.errors.hesitation[0]}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="hesitationReason">Where and why?</Label>
                            <WysiwygEditor
                                id="hesitationReason"
                                name="hesitationReason"
                                value={editorContents.hesitationReason}
                                onChange={(html) => setEditorContents({ ...editorContents, hesitationReason: html })}
                                placeholder="Reason for hesitation (if applicable)"
                            />
                            {formState?.errors?.hesitationReason && <p className="text-sm text-red-500">{formState.errors.hesitationReason[0]}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="managementRating">Trade Management Rating ({managementRating}/5)</Label>
                            <Slider
                                id="managementRating"
                                name="managementRating"
                                defaultValue={[managementRating]}
                                min={1}
                                max={5}
                                step={1}
                                onValueChange={(value) => setManagementRating(value[0])}
                            />
                            {formState?.errors?.managementRating && <p className="text-sm text-red-500">{formState.errors.managementRating[0]}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="managementReason">Management Details</Label>
                            <WysiwygEditor
                                id="managementReason"
                                name="managementReason"
                                value={editorContents.managementReason}
                                onChange={(html) => setEditorContents({ ...editorContents, managementReason: html })}
                                placeholder="Details about trade management"
                            />
                            {formState?.errors?.managementReason && <p className="text-sm text-red-500">{formState.errors.managementReason[0]}</p>}
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox id="stayedWithWinner" name="stayedWithWinner" />
                            <Label htmlFor="stayedWithWinner">Stayed with Winners?</Label>
                            {formState?.errors?.stayedWithWinner && <p className="text-sm text-red-500">{formState.errors.stayedWithWinner[0]}</p>}
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox id="sizingOk" name="sizingOk" />
                            <Label htmlFor="sizingOk">Sizing OK?</Label>
                            {formState?.errors?.sizingOk && <p className="text-sm text-red-500">{formState.errors.sizingOk[0]}</p>}
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox id="convictionTrade" name="convictionTrade" />
                            <Label htmlFor="convictionTrade">Conviction Trade?</Label>
                            {formState?.errors?.convictionTrade && <p className="text-sm text-red-500">{formState.errors.convictionTrade[0]}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="convictionTradeReason">Conviction Trade Details</Label>
                            <WysiwygEditor
                                id="convictionTradeReason"
                                name="convictionTradeReason"
                                value={editorContents.convictionTradeReason}
                                onChange={(html) => setEditorContents({ ...editorContents, convictionTradeReason: html })}
                                placeholder="Details about conviction trade (if applicable)"
                            />
                            {formState?.errors?.convictionTradeReason && <p className="text-sm text-red-500">{formState.errors.convictionTradeReason[0]}</p>}
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox id="convictionSized" name="convictionSized" />
                            <Label htmlFor="convictionSized">Sized by Conviction?</Label>
                            {formState?.errors?.convictionSized && <p className="text-sm text-red-500">{formState.errors.convictionSized[0]}</p>}
                        </div>
                    </div>
                </section>

                {/* Post-Market */}
                <section className="space-y-4 p-4 border rounded-lg">
                    <h2 className="text-xl font-semibold mb-3 text-primary">📊 Post-Market</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox id="loggedInStats" name="loggedInStats" />
                            <Label htmlFor="loggedInStats">Logged Stats?</Label>
                            {formState?.errors?.loggedInStats && <p className="text-sm text-red-500">{formState.errors.loggedInStats[0]}</p>}
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox id="brokeRules" name="brokeRules" />
                            <Label htmlFor="brokeRules">Broke Rules?</Label>
                            {formState?.errors?.brokeRules && <p className="text-sm text-red-500">{formState.errors.brokeRules[0]}</p>}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="rulesExplanation">Rule Breaking Explanation</Label>
                            <WysiwygEditor
                                id="rulesExplanation"
                                name="rulesExplanation"
                                value={editorContents.rulesExplanation}
                                onChange={(html) => setEditorContents({ ...editorContents, rulesExplanation: html })}
                                placeholder="Explanation of rule breaking (if applicable)"
                            />
                            {formState?.errors?.rulesExplanation && <p className="text-sm text-red-500">{formState.errors.rulesExplanation[0]}</p>}
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox id="trcProgress" name="trcProgress" />
                            <Label htmlFor="trcProgress">Made TRC Progress?</Label>
                            {formState?.errors?.trcProgress && <p className="text-sm text-red-500">{formState.errors.trcProgress[0]}</p>}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="whyTrcProgress">Why/Why Not TRC Progress</Label>
                            <WysiwygEditor
                                id="whyTrcProgress"
                                name="whyTrcProgress"
                                value={editorContents.whyTrcProgress}
                                onChange={(html) => setEditorContents({ ...editorContents, whyTrcProgress: html })}
                                placeholder="Explanation of TRC progress"
                            />
                            {formState?.errors?.whyTrcProgress && <p className="text-sm text-red-500">{formState.errors.whyTrcProgress[0]}</p>}
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="pnlOfTheDay">P&L Summary</Label>
                            <WysiwygEditor
                                id="pnlOfTheDay"
                                name="pnlOfTheDay"
                                value={editorContents.pnlOfTheDay}
                                onChange={(html) => setEditorContents({ ...editorContents, pnlOfTheDay: html })}
                                placeholder="Summary of profit/loss for the day"
                            />
                            {formState?.errors?.pnlOfTheDay && <p className="text-sm text-red-500">{formState.errors.pnlOfTheDay[0]}</p>}
                        </div>
                    </div>
                </section>

                {/* Learnings & Improvements */}
                <section className="space-y-4 p-4 border rounded-lg">
                    <h2 className="text-xl font-semibold mb-3 text-primary">📚 Learnings & Improvements</h2>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="learnings">Key Learnings</Label>
                            <WysiwygEditor
                                id="learnings"
                                name="learnings"
                                value={editorContents.learnings}
                                onChange={(html) => setEditorContents({ ...editorContents, learnings: html })}
                                placeholder="What did you learn today?"
                            />
                            {formState?.errors?.learnings && <p className="text-sm text-red-500">{formState.errors.learnings[0]}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="whatIsntWorking">What Isn't Working</Label>
                            <WysiwygEditor
                                id="whatIsntWorking"
                                name="whatIsntWorking"
                                value={editorContents.whatIsntWorking}
                                onChange={(html) => setEditorContents({ ...editorContents, whatIsntWorking: html })}
                                placeholder="Aspects of your trading that aren't working"
                            />
                            {formState?.errors?.whatIsntWorking && <p className="text-sm text-red-500">{formState.errors.whatIsntWorking[0]}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="eliminationPlan">What to Eliminate</Label>
                            <WysiwygEditor
                                id="eliminationPlan"
                                name="eliminationPlan"
                                value={editorContents.eliminationPlan}
                                onChange={(html) => setEditorContents({ ...editorContents, eliminationPlan: html })}
                                placeholder="What should be eliminated from your process?"
                            />
                            {formState?.errors?.eliminationPlan && <p className="text-sm text-red-500">{formState.errors.eliminationPlan[0]}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="changePlan">Changes to Achieve Goal</Label>
                            <WysiwygEditor
                                id="changePlan"
                                name="changePlan"
                                value={editorContents.changePlan}
                                onChange={(html) => setEditorContents({ ...editorContents, changePlan: html })}
                                placeholder="What changes can help achieve your goals?"
                            />
                            {formState?.errors?.changePlan && <p className="text-sm text-red-500">{formState.errors.changePlan[0]}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="solutionBrainstorm">Solution Brainstorm</Label>
                            <WysiwygEditor
                                id="solutionBrainstorm"
                                name="solutionBrainstorm"
                                value={editorContents.solutionBrainstorm}
                                onChange={(html) => setEditorContents({ ...editorContents, solutionBrainstorm: html })}
                                placeholder="Brainstorm solutions for problems identified"
                            />
                            {formState?.errors?.solutionBrainstorm && <p className="text-sm text-red-500">{formState.errors.solutionBrainstorm[0]}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="adjustmentForTomorrow">Adjustments for Tomorrow</Label>
                            <WysiwygEditor
                                id="adjustmentForTomorrow"
                                name="adjustmentForTomorrow"
                                value={editorContents.adjustmentForTomorrow}
                                onChange={(html) => setEditorContents({ ...editorContents, adjustmentForTomorrow: html })}
                                placeholder="What adjustments will you make tomorrow?"
                            />
                            {formState?.errors?.adjustmentForTomorrow && <p className="text-sm text-red-500">{formState.errors.adjustmentForTomorrow[0]}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="easyTrade">Easy Trade of the Day</Label>
                            <WysiwygEditor
                                id="easyTrade"
                                name="easyTrade"
                                value={editorContents.easyTrade}
                                onChange={(html) => setEditorContents({ ...editorContents, easyTrade: html })}
                                placeholder="Describe the easiest trade you saw today"
                            />
                            {formState?.errors?.easyTrade && <p className="text-sm text-red-500">{formState.errors.easyTrade[0]}</p>}
                        </div>
                    </div>
                </section>

                {/* Strategic */}
                <section className="space-y-4 p-4 border rounded-lg">
                    <h2 className="text-xl font-semibold mb-3 text-primary">🎯 Strategic</h2>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="top3ThingsDoneWell">Top 3 Things Done Well</Label>
                            <WysiwygEditor
                                id="top3ThingsDoneWell"
                                name="top3ThingsDoneWell"
                                value={editorContents.top3ThingsDoneWell}
                                onChange={(html) => setEditorContents({ ...editorContents, top3ThingsDoneWell: html })}
                                placeholder="What were the top 3 things you did well today?"
                            />
                            {formState?.errors?.top3ThingsDoneWell && <p className="text-sm text-red-500">{formState.errors.top3ThingsDoneWell[0]}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="top3MistakesToday">Top 3 Mistakes Today</Label>
                            <WysiwygEditor
                                id="top3MistakesToday"
                                name="top3MistakesToday"
                                value={editorContents.top3MistakesToday}
                                onChange={(html) => setEditorContents({ ...editorContents, top3MistakesToday: html })}
                                placeholder="What were your top 3 mistakes today?"
                            />
                            {formState?.errors?.top3MistakesToday && <p className="text-sm text-red-500">{formState.errors.top3MistakesToday[0]}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bestAndWorstTrades">Best and Worst Trades</Label>
                            <WysiwygEditor
                                id="bestAndWorstTrades"
                                name="bestAndWorstTrades"
                                value={editorContents.bestAndWorstTrades}
                                onChange={(html) => setEditorContents({ ...editorContents, bestAndWorstTrades: html })}
                                placeholder="What were your best and worst trades today?"
                            />
                            {formState?.errors?.bestAndWorstTrades && <p className="text-sm text-red-500">{formState.errors.bestAndWorstTrades[0]}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="recurringMistake">Recurring Mistake</Label>
                            <WysiwygEditor
                                id="recurringMistake"
                                name="recurringMistake"
                                value={editorContents.recurringMistake}
                                onChange={(html) => setEditorContents({ ...editorContents, recurringMistake: html })}
                                placeholder="Is there a recurring mistake you're seeing?"
                            />
                            {formState?.errors?.recurringMistake && <p className="text-sm text-red-500">{formState.errors.recurringMistake[0]}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="oneTakeawayTeaching">One Takeaway to Teach</Label>
                            <WysiwygEditor
                                id="oneTakeawayTeaching"
                                name="oneTakeawayTeaching"
                                value={editorContents.oneTakeawayTeaching}
                                onChange={(html) => setEditorContents({ ...editorContents, oneTakeawayTeaching: html })}
                                placeholder="If you had to teach one takeaway from today, what would it be?"
                            />
                            {formState?.errors?.oneTakeawayTeaching && <p className="text-sm text-red-500">{formState.errors.oneTakeawayTeaching[0]}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="todaysRepetition">If Today Repeated 10x</Label>
                            <WysiwygEditor
                                id="todaysRepetition"
                                name="todaysRepetition"
                                value={editorContents.todaysRepetition}
                                onChange={(html) => setEditorContents({ ...editorContents, todaysRepetition: html })}
                                placeholder="If today repeated 10 times, what would you change for edge?"
                            />
                            {formState?.errors?.todaysRepetition && <p className="text-sm text-red-500">{formState.errors.todaysRepetition[0]}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="actionsToImproveForward">Actions to Improve Forward</Label>
                            <WysiwygEditor
                                id="actionsToImproveForward"
                                name="actionsToImproveForward"
                                value={editorContents.actionsToImproveForward}
                                onChange={(html) => setEditorContents({ ...editorContents, actionsToImproveForward: html })}
                                placeholder="What specific actions will improve your trading going forward?"
                            />
                            {formState?.errors?.actionsToImproveForward && <p className="text-sm text-red-500">{formState.errors.actionsToImproveForward[0]}</p>}
                        </div>
                    </div>
                </section>

                {/* Submission */}
                <div className="flex justify-between">
                    <Button type="button" variant="outline" asChild>
                        <Link href="/journal">Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : "✅ Save Entry"}
                    </Button>
                </div>
            </form>
        </main>
    );
}