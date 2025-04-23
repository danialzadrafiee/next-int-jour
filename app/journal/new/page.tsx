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
import React from "react";

type FormState = {
    message: string | null;
    errors: Record<string, string[]> | null;
    success?: boolean;
};

// Define the configuration for each form field
const formConfig = [
    {
        section: "Pre-Market Prep",
        icon: "🧠",
        fields: [
            {
                id: "emotionalTemp",
                label: "Emotional Temperature",
                type: "slider",
                min: 1,
                max: 10,
                step: 1,
                initialValue: 5,
                suffix: "/10",
            },
            {
                id: "emotionalReason",
                label: "Reason for Emotional State",
                type: "wysiwyg",
                placeholder: "Feeling calm and focused because...",
            },
            {
                id: "trcGoal",
                label: "TRC Goal",
                type: "input",
                placeholder: "e.g., Execute plan flawlessly, manage risk",
                colSpan: 2,
            },
            {
                id: "trcPlan",
                label: "Plan to Achieve TRC Goal",
                type: "wysiwyg",
                placeholder: "How will you achieve the goal?",
                colSpan: 2,
            },
            {
                id: "aphorisms",
                label: "Reminders / aphorisms to self",
                type: "input",
                placeholder: "e.g., Stick to the plan, don't chase",
                colSpan: 2,
            },
            {
                id: "macroContext",
                label: "Macro Context",
                type: "wysiwyg",
                placeholder: "Overall market sentiment, key news, levels...",
                colSpan: 2,
            },
            {
                id: "tradePlan",
                label: "Trading plan for the day (Setup, Triggers, Invalidation,Size plan)",
                type: "wysiwyg",
                placeholder: "Setup, Triggers, Invalidation, Size plan...",
                colSpan: 2,
            },
        ],
    },
    {
        section: "During Market",
        icon: "⚔",
        fields: [
            {
                id: "executionNotes",
                label: "Execution Notes",
                type: "wysiwyg",
                placeholder: "Detailed notes on trades taken. You can paste images directly here.",
                colSpan: 2,
            },
            {
                id: "hesitation",
                label: "Did You Hesitate?",
                type: "checkbox",
            },
            {
                id: "hesitationReason",
                label: "Where and why?",
                type: "wysiwyg",
                placeholder: "Reason for hesitation (if applicable)",
            },
            {
                id: "managementRating",
                label: "Trade Management Rating",
                type: "slider",
                min: 1,
                max: 5,
                step: 1,
                initialValue: 3,
                suffix: "/5",
            },
            {
                id: "managementReason",
                label: "Reasons for bad management",
                type: "wysiwyg",
                placeholder: "Details about trade management",
            },
            {
                id: "stayedWithWinner",
                label: "Stayed with Winners?",
                type: "checkbox",
            },
            {
                id: "sizingOk",
                label: "Sized Properly?",
                type: "checkbox",
            },
            {
                id: "convictionTrade",
                label: "Was it a conviction trade?",
                type: "checkbox",
            },
            {
                id: "convictionTradeReason",
                label: "Conviction Trade Details",
                type: "wysiwyg",
                placeholder: "Details about conviction trade (if applicable)",
            },
            {
                id: "convictionSized",
                label: "Sized by Conviction?",
                type: "checkbox",
            },
        ],
    },
    {
        section: "Post-Market",
        icon: "📊",
        fields: [
            {
                id: "loggedInStats",
                label: "Logged Stats?",
                type: "checkbox",
            },
            {
                id: "brokeRules",
                label: "Broke Rules?",
                type: "checkbox",
            },
            {
                id: "rulesExplanation",
                label: "Rule Breaking Explanation",
                type: "wysiwyg",
                placeholder: "Explanation of rule breaking (if applicable)",
                colSpan: 2,
            },
            {
                id: "trcProgress",
                label: "Made TRC Progress?",
                type: "checkbox",
            },
            {
                id: "whyTrcProgress",
                label: "Why/Why Not TRC Progress",
                type: "wysiwyg",
                placeholder: "Explanation of TRC progress",
                colSpan: 2,
            },
            {
                id: "pnlOfTheDay",
                label: "P&L Summary",
                type: "wysiwyg",
                placeholder: "Summary of profit/loss for the day",
                colSpan: 2,
            },
        ],
    },
    {
        section: "Learnings & Improvements",
        icon: "📚",
        fields: [
            {
                id: "learnings",
                label: "Key Learnings",
                type: "wysiwyg",
                placeholder: "What did you learn today?",
            },
            {
                id: "whatIsntWorking",
                label: "What Isn't Working",
                type: "wysiwyg",
                placeholder: "Aspects of your trading that aren't working",
            },
            {
                id: "eliminationPlan",
                label: "What to Eliminate",
                type: "wysiwyg",
                placeholder: "What should be eliminated from your process?",
            },
            {
                id: "changePlan",
                label: "Changes to Achieve Goal",
                type: "wysiwyg",
                placeholder: "What changes can help achieve your goals?",
            },
            {
                id: "solutionBrainstorm",
                label: "Solution Brainstorm",
                type: "wysiwyg",
                placeholder: "Brainstorm solutions for problems identified",
            },
            {
                id: "adjustmentForTomorrow",
                label: "Adjustments for Tomorrow",
                type: "wysiwyg",
                placeholder: "What adjustments will you make tomorrow?",
            },
            {
                id: "easyTrade",
                label: "Easy Trade of the Day",
                type: "wysiwyg",
                placeholder: "Describe the easiest trade you saw today",
            },
        ],
    },
    {
        section: "Strategic",
        icon: "🎯",
        fields: [
            {
                id: "top3ThingsDoneWell",
                label: "Top 3 Things Done Well",
                type: "wysiwyg",
                placeholder: "What were the top 3 things you did well today?",
            },
            {
                id: "top3MistakesToday",
                label: "Top 3 Mistakes Today",
                type: "wysiwyg",
                placeholder: "What were your top 3 mistakes today?",
            },
            {
                id: "bestAndWorstTrades",
                label: "Best and Worst Trades",
                type: "wysiwyg",
                placeholder: "What were your best and worst trades today?",
            },
            {
                id: "recurringMistake",
                label: "Recurring Mistake",
                type: "wysiwyg",
                placeholder: "Is there a recurring mistake you're seeing?",
            },
            {
                id: "oneTakeawayTeaching",
                label: "One Takeaway to Teach",
                type: "wysiwyg",
                placeholder: "If you had to teach one takeaway from today, what would it be?",
            },
            {
                id: "todaysRepetition",
                label: "If Today Repeated 10x",
                type: "wysiwyg",
                placeholder: "If today repeated 10 times, what would you change for edge?",
            },
            {
                id: "actionsToImproveForward",
                label: "Actions to Improve Forward",
                type: "wysiwyg",
                placeholder: "What specific actions will improve your trading going forward?",
            },
        ],
    },
];

// Helper function to get initial WYSIWYG content state
const getInitialWysiwygContents = () => {
    const initialContents: Record<string, string> = {};
    formConfig.forEach(section => {
        section.fields.forEach(field => {
            if (field.type === 'wysiwyg') {
                initialContents[field.id] = "";
            }
        });
    });
    return initialContents;
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

    // Initialize state for slider values based on config
    const initialSliderStates = formConfig.reduce((acc, section) => {
        section.fields.forEach(field => {
            if (field.type === 'slider') {
                acc[field.id] = field.initialValue as number;
            }
        });
        return acc;
    }, {} as Record<string, number>);
    const [sliderStates, setSliderStates] = useState<Record<string, number>>(initialSliderStates);

    // State for storing WYSIWYG content, initialized from config
    const [editorContents, setEditorContents] = useState(getInitialWysiwygContents());

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

            // Add slider values to FormData
            Object.entries(sliderStates).forEach(([key, value]) => {
                formData.set(key, value.toString());
            });

            // Handle checkbox values (server action expects 'on' or null)
            formConfig.forEach(section => {
                section.fields.forEach(field => {
                    if (field.type === 'checkbox') {
                        const checkbox = e.currentTarget.elements.namedItem(field.id) as HTMLInputElement;
                        if (checkbox && !checkbox.checked) {
                            formData.set(field.id, ''); // Set to empty string if not checked
                        }
                    }
                });
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

                {formConfig.map(section => (
                    <section key={section.section} className="space-y-4 p-4 border rounded-lg">
                        <h2 className="text-xl font-semibold mb-3 text-primary">{section.icon} {section.section}</h2>
                        <div className="grid grid-cols-1  gap-4 items-start">
                            {section.fields.map(field => (
                                <div
                                    key={field.id}
                                    className={`space-y-2 ${field.colSpan === 2 ? 'md:col-span-1' : ''} ${field.type === 'checkbox' ? 'flex items-center space-x-2 pt-2' : ''}`}
                                >
                                    {/* Render different components based on field type */}
                                    {field.type === 'input' && (
                                        <>
                                            <Label htmlFor={field.id}>{field.label}</Label>
                                            <Input
                                                id={field.id}
                                                name={field.id}
                                                placeholder={field.placeholder}
                                            />
                                        </>
                                    )}

                                    {field.type === 'wysiwyg' && (
                                        <>
                                            <Label htmlFor={field.id}>{field.label}</Label>
                                            <WysiwygEditor
                                                id={field.id}
                                                name={field.id}
                                                value={editorContents[field.id]}
                                                onChange={(html) => setEditorContents({ ...editorContents, [field.id]: html })}
                                                placeholder={field.placeholder}
                                            />
                                        </>
                                    )}

                                    {field.type === 'checkbox' && (
                                        <>
                                            <Checkbox id={field.id} name={field.id} />
                                            <Label htmlFor={field.id}>{field.label}</Label>
                                        </>
                                    )}

                                    {field.type === 'slider' && (
                                        <>
                                            <Label htmlFor={field.id}>
                                                {field.label} ({sliderStates[field.id]}{field.suffix})
                                            </Label>
                                            <Slider
                                                id={field.id}
                                                name={field.id}
                                                defaultValue={[field.initialValue as number]}
                                                min={field.min}
                                                max={field.max}
                                                step={field.step}
                                                onValueChange={(value) => setSliderStates({ ...sliderStates, [field.id]: value[0] })}
                                            />
                                        </>
                                    )}

                                    {/* Display validation errors */}
                                    {formState?.errors?.[field.id] && <p className="text-sm text-red-500">{formState.errors[field.id][0]}</p>}
                                </div>
                            ))}
                        </div>
                    </section>
                ))}


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