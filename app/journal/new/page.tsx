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
// Add these interfaces at the top of your file

interface BaseFieldConfig {
    id: string;
    label: string;
    type: string;
    placeholder?: string;
    colSpan?: number;
}

interface InputFieldConfig extends BaseFieldConfig {
    type: 'input';
}

interface WysiwygFieldConfig extends BaseFieldConfig {
    type: 'wysiwyg';
}

interface CheckboxFieldConfig extends BaseFieldConfig {
    type: 'checkbox';
}

interface SliderFieldConfig extends BaseFieldConfig {
    type: 'slider';
    min: number;
    max: number;
    step: number;
    initialValue: number;
    suffix: string;
}

type FieldConfig = InputFieldConfig | WysiwygFieldConfig | CheckboxFieldConfig | SliderFieldConfig;
interface SectionConfig {
    section: string;
    icon: string;
    fields: FieldConfig[];
}

type FormState = {
    message: string | null;
    errors: Record<string, string[]> | null;
    success?: boolean;
};

// Define the configuration for each form field
const formConfig: SectionConfig[] = [
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
        section: "Post-Market Review",
        icon: "📊",
        fields: [
            {
                id: "loggedInStats",
                label: "Logged Stats?",
                type: "checkbox",
            },
            {
                id: "brokeRules",
                label: "Broke Any Rules?",
                type: "checkbox",
            },
            {
                id: "rulesExplanation",
                label: "What rule did you break and why?",
                type: "wysiwyg",
                placeholder: "Explanation of rule breaking (if applicable)",
                colSpan: 2,
            },
            {
                id: "trcProgress",
                label: "Made progress toward TRC?",
                type: "checkbox",
            },
            {
                id: "whyTrcProgress",
                label: "Why / Why Not  made progress toward trc?",
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
                label: "What did i learn/improve today(market+self)",
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
                label: "What will i eliminate starting now?",
                type: "wysiwyg",
                placeholder: "What should be eliminated from your process?",
            },
            {
                id: "changePlan",
                label: "What changes can be made in order to achieve my goal?",
                type: "wysiwyg",
                placeholder: "What changes can help achieve your goals?",
            },
            {
                id: "solutionBrainstorm",
                label: "For the changes i need to make starting today, what are the solutions i can find?",
                type: "wysiwyg",
                placeholder: "Brainstorm solutions for problems identified",
            },
            {
                id: "adjustmentForTomorrow",
                label: "What adjustments will i make for tomorrow?",
                type: "wysiwyg",
                placeholder: "What adjustments will you make tomorrow?",
            },
            {
                id: "easyTrade",
                label: "What was the Easy Trade of the Day?",
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
                label: "Top 3 things done well today",
                type: "wysiwyg",
                placeholder: "What were the top 3 things you did well today?",
            },
            {
                id: "top3MistakesToday",
                label: "Top 3 mistakes of today",
                type: "wysiwyg",
                placeholder: "What were your Top 3 mistakes of today?",
            },
            {
                id: "bestAndWorstTrades",
                label: "What was the best and worst trade today?",
                type: "wysiwyg",
                placeholder: "What were your What was the best and worst trade today? today?",
            },
            {
                id: "recurringMistake",
                label: "What recurring mistake am i still making, and what's the real root cause?",
                type: "wysiwyg",
                placeholder: "Is there a What recurring mistake am i still making, and what's the real root cause? you're seeing?",
            },
            {
                id: "oneTakeawayTeaching",
                label: "If i had to teach one takeaway from todays trades to a junior trader what would it be?",
                type: "wysiwyg",
                placeholder: "If you had to teach one takeaway from today, what would it be?",
            },
            {
                id: "todaysRepetition",
                label: "If today repeated 10 more times, what would i change to maximize edge?",
                type: "wysiwyg",
                placeholder: "If today repeated 10 times, what would you change for edge?",
            },
            {
                id: "actionsToImproveForward",
                label: "List of actions to improve forward.",
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
                acc[field.id] = (field as SliderFieldConfig).initialValue;
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
                                                {field.label} ({sliderStates[field.id]}{(field as SliderFieldConfig).suffix})
                                            </Label>
                                            <Slider
                                                id={field.id}
                                                name={field.id}
                                                defaultValue={[(field as SliderFieldConfig).initialValue]}
                                                min={(field as SliderFieldConfig).min}
                                                max={(field as SliderFieldConfig).max}
                                                step={(field as SliderFieldConfig).step}
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