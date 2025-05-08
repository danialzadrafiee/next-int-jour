// app/ai/page.tsx
"use client";

import { useState, useEffect } from "react";
import { format, subDays } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

const promptTemplates = [
    {
        id: "mood-analysis",
        name: "Mood Analysis",
        prompt: "Analyze my journal entries for mood patterns. Identify recurring emotional states, triggers, and potential strategies for improvement.",
    },
    {
        id: "goal-tracking",
        name: "Goal Tracking",
        prompt: "Review my journal entries and identify my goals, progress towards them, and obstacles I'm facing.",
    },
    {
        id: "insight-extraction",
        name: "Extract Insights",
        prompt: "Extract key insights, realizations, and lessons from my journal entries. What am I learning about myself?",
    },
    {
        id: "custom",
        name: "Custom Analysis",
        prompt: "",
    },
];

interface DateRange {
    from?: string;
    to?: string;
}

export default function AIAnalysisPage() {
    const [fromDate, setFromDate] = useState<Date | undefined>(subDays(new Date(), 3));
    const [toDate, setToDate] = useState<Date | undefined>(new Date());
    const [analysisType, setAnalysisType] = useState("mood-analysis");
    const [customPrompt, setCustomPrompt] = useState("");
    const [analysisResult, setAnalysisResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [analysisTitle, setAnalysisTitle] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [savedAnalyses, setSavedAnalyses] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState("generate");
    const router = useRouter();

    useEffect(() => {
        fetchSavedAnalyses();
    }, []);

    const fetchSavedAnalyses = async () => {
        try {
            const response = await fetch("/api/ai/generate?fetchSaved=true");
            if (!response.ok) {
                throw new Error("Failed to fetch saved analyses");
            }

            const data = await response.json();
            setSavedAnalyses(data.analyses || []);
        } catch (error) {
            console.error("Error fetching saved analyses:", error);
            toast.error("Error", {
                description: "Failed to fetch saved analyses",
            });
        }
    };

    const getSelectedPrompt = () => {
        const template = promptTemplates.find((pt) => pt.id === analysisType);
        return analysisType === "custom" ? customPrompt : template?.prompt || "";
    };

    const handleAnalyze = async () => {
        try {
            setIsLoading(true);
            setAnalysisResult(null);

            const prompt = getSelectedPrompt();

            const dateRange: DateRange = {};
            if (fromDate) {
                dateRange.from = format(fromDate, "yyyy-MM-dd");
            }
            if (toDate) {
                dateRange.to = format(toDate, "yyyy-MM-dd");
            }

            const response = await fetch("/api/ai/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    prompt,
                    dateRange,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to analyze journal entries");
            }

            const data = await response.json();
            setAnalysisResult(data.analysis);

            toast.success("Analysis Complete", {
                description: "Your journal entries have been analyzed",
            });
        } catch (error) {
            console.error("Error analyzing journal entries:", error);
            toast.error("Error", {
                description: "Failed to analyze journal entries",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveAnalysis = async () => {
        if (!analysisResult) return;

        try {
            setIsSaving(true);

            const prompt = getSelectedPrompt();
            const dateRange: DateRange = {};
            if (fromDate) {
                dateRange.from = format(fromDate, "yyyy-MM-dd");
            }
            if (toDate) {
                dateRange.to = format(toDate, "yyyy-MM-dd");
            }

            const response = await fetch("/api/ai/generate", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: analysisTitle || `Analysis from ${dateRange.from || "past"} to ${dateRange.to || "present"}`,
                    prompt,
                    result: analysisResult,
                    dateRange,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to save analysis");
            }

            toast.success("Analysis Saved", {
                description: "Your analysis has been saved successfully",
            });

            // Refresh saved analyses list
            fetchSavedAnalyses();

        } catch (error) {
            console.error("Error saving analysis:", error);
            toast.error("Error", {
                description: "Failed to save analysis",
            });
        } finally {
            setIsSaving(false);
            setAnalysisTitle("");
        }
    };

    return (
        <div className="container max-w-5xl mx-auto py-8">
            <div className="w-full flex items-center justify-between">


                <h1 className="text-3xl font-bold mb-6">Journal AI Analysis</h1>
                <Button  variant="outline" asChild>
                    <Link href="/journal">Back to Journal</Link>
                </Button>
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="generate">Generate Analysis</TabsTrigger>
                    <TabsTrigger value="saved">Saved Analyses</TabsTrigger>
                </TabsList>

                <TabsContent value="generate" className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Analysis Parameters</CardTitle>
                                <CardDescription>
                                    Configure what you'd like to learn from your journal entries
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="analysis-type">Analysis Type</Label>
                                    <Select
                                        value={analysisType}
                                        onValueChange={(value) => setAnalysisType(value)}
                                    >
                                        <SelectTrigger id="analysis-type">
                                            <SelectValue placeholder="Select analysis type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {promptTemplates.map((template) => (
                                                <SelectItem key={template.id} value={template.id}>
                                                    {template.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {analysisType === "custom" && (
                                    <div className="space-y-2">
                                        <Label htmlFor="custom-prompt">Custom Prompt</Label>
                                        <Textarea
                                            id="custom-prompt"
                                            placeholder="Enter your analysis instructions..."
                                            value={customPrompt}
                                            onChange={(e) => setCustomPrompt(e.target.value)}
                                            className="min-h-[120px]"
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label>Date Range</Label>
                                    <div className="flex space-x-2">
                                        <div className="flex-1">
                                            <Label htmlFor="from-date" className="text-xs text-muted-foreground">
                                                From
                                            </Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        id="from-date"
                                                        variant="outline"
                                                        className="w-full justify-start text-left font-normal"
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {fromDate ? format(fromDate, "PPP") : "Select date"}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                    <Calendar
                                                        mode="single"
                                                        selected={fromDate}
                                                        onSelect={setFromDate}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <div className="flex-1">
                                            <Label htmlFor="to-date" className="text-xs text-muted-foreground">
                                                To
                                            </Label>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        id="to-date"
                                                        variant="outline"
                                                        className="w-full justify-start text-left font-normal"
                                                    >
                                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                                        {toDate ? format(toDate, "PPP") : "Select date"}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0">
                                                    <Calendar
                                                        mode="single"
                                                        selected={toDate}
                                                        onSelect={setToDate}
                                                        initialFocus
                                                        disabled={(date) => fromDate ? date < fromDate : false}
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    onClick={handleAnalyze}
                                    disabled={isLoading}
                                    className="w-full"
                                >
                                    {isLoading ? "Analyzing..." : "Analyze Journal"}
                                </Button>
                            </CardFooter>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Analysis Results</CardTitle>
                                    <CardDescription>
                                        Insights from your journal entries
                                    </CardDescription>
                                </div>
                                {analysisResult && (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm">
                                                Save Analysis
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Save Analysis</DialogTitle>
                                            </DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="analysis-title">Title</Label>
                                                    <Input
                                                        id="analysis-title"
                                                        placeholder="Enter a title for this analysis"
                                                        value={analysisTitle}
                                                        onChange={(e) => setAnalysisTitle(e.target.value)}
                                                    />
                                                </div>
                                                <Button
                                                    onClick={handleSaveAnalysis}
                                                    disabled={isSaving}
                                                    className="w-full"
                                                >
                                                    {isSaving ? "Saving..." : "Save Analysis"}
                                                </Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </CardHeader>
                            <CardContent>
                                {isLoading ? (
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-[90%]" />
                                        <Skeleton className="h-4 w-[80%]" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-[75%]" />
                                        <Skeleton className="h-4 w-full" />
                                    </div>
                                ) : analysisResult ? (
                                    <div className="prose prose-sm max-w-none">
                                        <div className="whitespace-pre-wrap">{analysisResult}</div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-[300px] text-center text-muted-foreground">
                                        <p>Analysis results will appear here</p>
                                        <p className="text-sm">Select your parameters and click "Analyze Journal"</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="saved" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Saved Analyses</CardTitle>
                            <CardDescription>
                                Review your previously saved AI analyses
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {savedAnalyses.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>No saved analyses yet.</p>
                                    <p className="text-sm mt-2">Generate and save an analysis to see it here.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {savedAnalyses.map((analysis) => (
                                        <Card key={analysis.id} className="hover:bg-accent/10 cursor-pointer transition-colors">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-lg">{analysis.title}</CardTitle>
                                                <CardDescription>
                                                    {analysis.dateRangeFrom && (
                                                        <>
                                                            {format(new Date(analysis.dateRangeFrom), "PPP")}
                                                            {analysis.dateRangeTo && ` - ${format(new Date(analysis.dateRangeTo), "PPP")}`}
                                                        </>
                                                    )}
                                                    <span className="block text-xs mt-1">
                                                        Created {format(new Date(analysis.createdAt), "PPP")}
                                                    </span>
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="pt-0">
                                                <p className="text-sm line-clamp-2">{analysis.result}</p>
                                            </CardContent>
                                            <CardFooter>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="ml-auto"
                                                    onClick={() => {
                                                        router.push(`/ai/analysis/${analysis.id}`);
                                                    }}
                                                >
                                                    View Full Analysis
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}