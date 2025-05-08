// Create a new file: app/ai/analysis/[id]/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ViewAnalysisPage() {
    const params = useParams();
    const router = useRouter();
    const [analysis, setAnalysis] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    
    useEffect(() => {
        const fetchAnalysis = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`/api/ai/analysis/${params.id}`);
                
                if (!response.ok) {
                    if (response.status === 404) {
                        toast.error("Analysis not found");
                        router.push("/ai");
                        return;
                    }
                    throw new Error("Failed to fetch analysis");
                }
                
                const data = await response.json();
                setAnalysis(data.analysis);
            } catch (error) {
                console.error("Error fetching analysis:", error);
                toast.error("Error", {
                    description: "Failed to fetch analysis details",
                });
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchAnalysis();
    }, [params.id, router]);
    
    const handleDelete = async () => {
        try {
            setIsDeleting(true);
            const response = await fetch(`/api/ai/analysis/${params.id}`, {
                method: "DELETE",
            });
            
            if (!response.ok) {
                throw new Error("Failed to delete analysis");
            }
            
            toast.success("Analysis Deleted", {
                description: "The analysis has been successfully deleted",
            });
            
            router.push("/ai");
        } catch (error) {
            console.error("Error deleting analysis:", error);
            toast.error("Error", {
                description: "Failed to delete analysis",
            });
        } finally {
            setIsDeleting(false);
        }
    };
    
    if (isLoading) {
        return (
            <div className="container max-w-3xl mx-auto py-8">
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }
    
    if (!analysis) {
        return (
            <div className="container max-w-3xl mx-auto py-8">
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center">
                            <h2 className="text-2xl font-bold mb-2">Analysis Not Found</h2>
                            <p className="text-muted-foreground mb-6">
                                The analysis you're looking for doesn't exist or has been deleted.
                            </p>
                            <Button onClick={() => router.push("/ai")}>
                                Return to AI Analysis
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }
    
    return (
        <div className="container max-w-3xl mx-auto py-8">
            <div className="flex items-center mb-6">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => router.push("/ai")}
                    className="mr-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to AI Analysis
                </Button>
            </div>
            
            <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                    <div>
                        <CardTitle className="text-2xl">{analysis.title}</CardTitle>
                        <CardDescription>
                            {analysis.dateRangeFrom && (
                                <>
                                    Analysis period: {format(new Date(analysis.dateRangeFrom), "PPP")}
                                    {analysis.dateRangeTo && ` - ${format(new Date(analysis.dateRangeTo), "PPP")}`}
                                </>
                            )}
                            <span className="block mt-1">
                                Created on {format(new Date(analysis.createdAt), "PPP")}
                            </span>
                        </CardDescription>
                    </div>
                    
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Analysis</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to delete this analysis? This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    {isDeleting ? "Deleting..." : "Delete"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardHeader>
                
                <CardContent>
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-medium mb-2">Prompt Used</h3>
                            <div className="bg-muted rounded-md p-3 text-sm">
                                {analysis.prompt}
                            </div>
                        </div>
                        
                        <div>
                            <h3 className="text-lg font-medium mb-2">Analysis Results</h3>
                            <div className="prose prose-sm max-w-none">
                                <div className="whitespace-pre-wrap">{analysis.result}</div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}