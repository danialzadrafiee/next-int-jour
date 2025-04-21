// components/AIAnalyzeButton.tsx
"use client";

import { useState } from 'react';
import { triggerAIAnalysis } from '@/app/journal/actions';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react'; // Import loading icon

interface AIAnalyzeButtonProps {
  entryId: number;
}

export default function AIAnalyzeButton({ entryId }: AIAnalyzeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    setIsLoading(true);
    try {
      const result = await triggerAIAnalysis(entryId);
      if (result.success) {
        toast({
          title: "Analysis Status",
          description: result.message || "AI analysis triggered/completed.",
        });
        // Revalidation happens server-side, page should update automatically
      } else {
        toast({
          title: "Analysis Failed",
          description: result.message || "Could not run AI analysis.",
          variant: "destructive",
        });
      }
    } catch (error) {
       console.error("Failed to trigger AI analysis:", error);
       toast({
         title: "Error",
         description: "An unexpected error occurred.",
         variant: "destructive",
       });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleAnalyze} disabled={isLoading}>
      {isLoading ? (
         <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing...
         </>
      ) : (
        '🤖 Analyze with AI'
      )}
    </Button>
  );
}