// app/journal/edit/[date]/page.tsx
"use client";

import { useState, useEffect, FormEvent } from "react";
import { format, parseISO } from "date-fns";
import { useRouter } from "next/navigation";
import { use } from "react";
import { saveJournalEntry } from "@/app/journal/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WysiwygEditor } from "@/components/ui/wysiwyg-editor";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import Link from "next/link";
import React from "react"; // Import React for key prop
import { formConfig } from "../../formConfig";

// Type declaration for entry data (can be imported or defined here)
type JournalEntryData = {
    id: number;
    date: string;
    emotionalTemp: number | null;
    emotionalReason: string | null;
    trcGoal: string | null;
    trcPlan: string | null;
    aphorisms: string | null;
    macroContext: string | null;
    tradePlan: string | null;
    executionNotes: string | null;
    hesitation: boolean;
    hesitationReason: string | null;
    managementRating: number | null;
    managementReason: string | null;
    stayedWithWinner: boolean;
    sizingOk: boolean;
    convictionTrade: boolean;
    convictionTradeReason: string | null;
    convictionSized: boolean;
    loggedInStats: boolean;
    brokeRules: boolean;
    rulesExplanation: string | null;
    trcProgress: boolean;
    whyTrcProgress: string | null;
    learnings: string | null;
    whatIsntWorking: string | null;
    eliminationPlan: string | null;
    changePlan: string | null;
    solutionBrainstorm: string | null;
    adjustmentForTomorrow: string | null;
    actionsToImproveForward: string | null;
    top3MistakesToday: string | null;
    top3ThingsDoneWell: string | null;
    oneTakeawayTeaching: string | null;
    bestAndWorstTrades: string | null;
    recurringMistake: string | null;
    todaysRepetition: string | null;
    pnlOfTheDay: string | null;
    images?: { id: number; imagePath: string; caption: string | null }[];
};

type FormState = {
    message: string | null;
    errors: Record<string, string[]> | null;
    success?: boolean;
};

// Define the configuration for each form field (can be shared or imported)


// Helper function to get initial WYSIWYG content state based on fetched data
const getInitialWysiwygContents = (data: JournalEntryData | null) => {
    const initialContents: Record<string, string> = {};
    formConfig.forEach(section => {
        section.fields.forEach(field => {
            if (field.type === 'wysiwyg') {
                // Use fetched data if available, otherwise an empty string
                initialContents[field.id] = data?.[field.id as keyof JournalEntryData]?.toString() || "";
            }
        });
    });
    return initialContents;
};

// Helper function to get initial slider states based on fetched data
const getInitialSliderStates = (data: JournalEntryData | null) => {
    const initialStates: Record<string, number> = {};
    formConfig.forEach(section => {
        section.fields.forEach(field => {
            if (field.type === 'slider') {
                const defaultValue = 'initialValue' in field ? field.initialValue : 5;
                initialStates[field.id] = (data?.[field.id as keyof JournalEntryData] as number) ?? defaultValue;
            }
        });
    });
    return initialStates;
};

export default function EditJournalEntryPage({ params }: { params: any }) {
    // Use React.use() to unwrap the params promise
    const unwrappedParams = React.use(params) as { date: string };
    const dateParam = unwrappedParams.date;

    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [entryData, setEntryData] = useState<JournalEntryData | null>(null);
    const [formState, setFormState] = useState<FormState>({
        message: null,
        errors: null,
        success: false,
    });
    const [date, setDate] = useState<Date | undefined>(
        dateParam ? parseISO(dateParam) : new Date()
    );

    // State for storing WYSIWYG content, initialized based on fetched data
    const [editorContents, setEditorContents] = useState(getInitialWysiwygContents(null));

    // State for storing slider values, initialized based on fetched data
    const [sliderStates, setSliderStates] = useState(getInitialSliderStates(null));


    // Fetch entry data and populate state
    useEffect(() => {
        async function fetchJournalEntry() {
            try {
                setIsLoading(true);
                const response = await fetch(`/api/journal/${dateParam}`);

                if (!response.ok) {
                    throw new Error(`Failed to fetch entry: ${response.status}`);
                }

                const data: JournalEntryData = await response.json();
                setEntryData(data);

                // Update form state with entry data
                if (data) {
                    setDate(parseISO(data.date)); // Update the date state
                    setSliderStates(getInitialSliderStates(data));
                    setEditorContents(getInitialWysiwygContents(data));
                }
            } catch (error) {
                console.error("Error fetching journal entry:", error);
                toast.error("Failed to load journal entry");
            } finally {
                setIsLoading(false);
            }
        }

        if (dateParam) {
            fetchJournalEntry();
        }
    }, [dateParam]);

    // Handle form submission (reusing the same server action as new entries)
    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const formData = new FormData(e.currentTarget);

            // Add the entry ID to the form data for updates
            if (entryData?.id) {
                formData.set('id', entryData.id.toString());
            }

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
            const result = await saveJournalEntry(formState, formData); // Assuming saveJournalEntry handles updates based on 'id'

            setFormState(result);

            if (result.success) {
                toast.success("Journal entry updated successfully!");
                // Navigate back to the view page
                router.push(`/journal/${format(date!, 'yyyy-MM-dd')}`);
            } else {
                toast.error(result.message || "Failed to update journal entry");
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


    if (isLoading) {
        return (
            <main className="container mx-auto px-4 py-8 max-w-4xl">
                <h1 className="text-3xl font-bold mb-6">Loading journal entry...</h1>
            </main>
        );
    }

    if (!entryData && !isLoading) {
        return (
            <main className="container mx-auto px-4 py-8 max-w-4xl">
                <h1 className="text-3xl font-bold mb-6">Journal entry not found</h1>
                <p>No entry exists for this date or there was an error loading it.</p>
                <Button className="mt-4" asChild>
                    <Link href="/journal">Return to Journal</Link>
                </Button>
            </main>
        );
    }

    // Render the form once data is loaded
    return (
        <main className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">🖋️ Edit Journal Entry</h1>
                <Button variant="outline" asChild>
                    <Link href={`/journal/${dateParam}`}>Cancel</Link>
                </Button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Hidden input for entry ID */}
                {entryData?.id && <input type="hidden" name="id" value={entryData.id} />}

                {/* Date Selection */}
                <div className="space-y-2">
                    <Label htmlFor="date">Journal Date</Label>
                    <DatePicker date={date} setDate={setDate} />
                    {/* Keep the hidden input for date even though DatePicker manages state */}
                    <input type="hidden" name="date" value={date ? format(date, 'yyyy-MM-dd') : ''} />
                    {formState?.errors?.date && <p className="text-sm text-red-500">{formState.errors.date[0]}</p>}
                </div>

                {formConfig.map(section => (
                    <section key={section.section} className="space-y-4 p-4 border rounded-lg">
                        <h2 className="text-xl font-semibold mb-3 text-primary">{section.icon} {section.section}</h2>
                        <div className="grid grid-cols-1 gap-4 items-start">
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
                                                defaultValue={entryData?.[field.id as keyof JournalEntryData]?.toString() || ''} // Populate with fetched data
                                            />
                                        </>
                                    )}

                                    {field.type === 'wysiwyg' && (
                                        <>
                                            <Label htmlFor={field.id}>{field.label}</Label>
                                            <WysiwygEditor
                                                id={field.id}
                                                name={field.id}
                                                value={editorContents[field.id]} // Controlled component using state
                                                onChange={(html) => setEditorContents({ ...editorContents, [field.id]: html })}
                                                placeholder={field.placeholder}
                                            />
                                        </>
                                    )}

                                    {field.type === 'checkbox' && (
                                        <>
                                            {/* defaultChecked for initial load, name for FormData */}
                                            <Checkbox
                                                id={field.id}
                                                name={field.id}
                                                defaultChecked={entryData?.[field.id as keyof JournalEntryData] as boolean || false}
                                            />
                                            <Label htmlFor={field.id}>{field.label}</Label>
                                        </>
                                    )}

                                    {field.type === 'slider' && (
                                        <>
                                            <Label htmlFor={field.id}>
                                                {field.label} ({sliderStates[field.id]}{('suffix' in field) ? field.suffix : ''})
                                            </Label>
                                            <Slider
                                                id={field.id}
                                                name={field.id}
                                                value={[sliderStates[field.id]]}
                                                min={('min' in field) ? field.min : 1}
                                                max={('max' in field) ? field.max : 10}
                                                step={('step' in field) ? field.step : 1}
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
                        <Link href={`/journal/${dateParam}`}>Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : "✅ Save Changes"}
                    </Button>
                </div>
            </form>
        </main>
    );
}