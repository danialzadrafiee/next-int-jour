// app/journal/actions.ts
"use server"; // Mark this file as containing Server Actions

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { writeFile } from "fs/promises";
import path from "path";
import { format } from 'date-fns';
import { JournalEntry } from "@prisma/client";
import DOMPurify from 'isomorphic-dompurify'; // You'll need to install this

// --- Helper Functions ---

// Basic function to generate a somewhat unique filename
function generateFilename(date: Date, originalName: string): string {
    const timestamp = Date.now();
    const formattedDate = format(date, 'yyyyMMdd');
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = path.extname(originalName);
    const safeOriginalName = path.basename(originalName, extension).replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${formattedDate}_${timestamp}_${randomString}_${safeOriginalName}${extension}`;
}

// Extract base64 images from HTML content and save them as files
async function processBase64ImagesInHtml(html: string, date: Date): Promise<{ processedHtml: string, savedImages: Array<{ filename: string, relativePath: string }> }> {
    if (!html) return { processedHtml: html, savedImages: [] };
    
    const base64Regex = /<img[^>]+src="(data:image\/[^;]+;base64[^"]+)"[^>]*>/g;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "images");
    const savedImages: Array<{ filename: string, relativePath: string }> = [];
    
    // Replace all base64 images with file references
    let match;
    let processedHtml = html;
    
    while ((match = base64Regex.exec(html)) !== null) {
        const fullImgTag = match[0];
        const base64Data = match[1];
        
        // Skip if not a valid base64 image
        if (!base64Data.startsWith('data:image/')) continue;
        
        try {
            // Extract image data and type
            const [metaData, data] = base64Data.split(',');
            const imageType = metaData.split(':')[1].split(';')[0];
            const fileExtension = imageType.split('/')[1];
            const buffer = Buffer.from(data, 'base64');
            
            // Generate filename and save
            const filename = `wysiwyg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExtension}`;
            const filePath = path.join(uploadDir, filename);
            const relativePath = `/uploads/images/${filename}`;
            
            await writeFile(filePath, buffer);
            
            // Replace base64 in HTML with the file path
            processedHtml = processedHtml.replace(
                base64Data, 
                `${process.env.NEXT_PUBLIC_BASE_URL || ''}${relativePath}`
            );
            
            savedImages.push({ 
                filename,
                relativePath: `images/${filename}` // Path relative to /public/uploads
            });
            
        } catch (error) {
            console.error("Error processing base64 image:", error);
        }
    }
    
    return { processedHtml, savedImages };
}

// --- Zod Schema for Validation ---
// Define a schema that matches your form fields
const JournalEntrySchema = z.object({
    date: z.preprocess((arg) => {
        if (typeof arg == "string" || arg instanceof Date) return new Date(arg);
    }, z.date()),

    // Pre-Market
    emotionalTemp: z.coerce.number().min(1).max(10).optional().nullable(),
    emotionalReason: z.string().optional().nullable(),
    trcGoal: z.string().optional().nullable(),
    trcPlan: z.string().optional().nullable(),
    aphorisms: z.string().optional().nullable(),
    macroContext: z.string().optional().nullable(),
    tradePlan: z.string().optional().nullable(),


    // Post-Market Review
    loggedInStats: z.preprocess((val) => val === 'on' || val === true, z.boolean().optional().default(false)),
    brokeRules: z.preprocess((val) => val === 'on' || val === true, z.boolean().optional().default(false)),
    rulesExplanation: z.string().optional().nullable(),
    trcProgress: z.preprocess((val) => val === 'on' || val === true, z.boolean().optional().default(false)),
    whyTrcProgress: z.string().optional().nullable(),
    learnings: z.string().optional().nullable(),
    whatIsntWorking: z.string().optional().nullable(),
    eliminationPlan: z.string().optional().nullable(),
    changePlan: z.string().optional().nullable(),
    solutionBrainstorm: z.string().optional().nullable(),
    adjustmentForTomorrow: z.string().optional().nullable(),
    easyTrade: z.string().optional().nullable(),

    // Strategic
    actionsToImproveForward: z.string().optional().nullable(),
    top3MistakesToday: z.string().optional().nullable(),
    top3ThingsDoneWell: z.string().optional().nullable(),
    oneTakeawayTeaching: z.string().optional().nullable(),
    bestAndWorstTrades: z.string().optional().nullable(),
    recurringMistake: z.string().optional().nullable(),
    todaysRepetition: z.string().optional().nullable(),

    // P&L
    pnlOfTheDay: z.string().optional().nullable(),

    // We don't include images directly in the main schema for form data processing
    // imageCaptions: z.string().optional().nullable(), // Handle separately
});

// --- Server Action: Save Journal Entry ---
export async function saveJournalEntry(prevState: any, formData: FormData) {
    console.log("Received form data");

    // Sanitize HTML content from WYSIWYG editors
    const formDataEntries = Object.fromEntries(formData.entries());
    
    // Sanitize all potential HTML content
    Object.keys(formDataEntries).forEach(key => {
        if (typeof formDataEntries[key] === 'string' && 
            formDataEntries[key].toString().includes('<')) {
            // This looks like HTML content, sanitize it
            formDataEntries[key] = DOMPurify.sanitize(formDataEntries[key].toString());
        }
    });

    // 1. Validate basic form data (excluding files)
    const validatedFields = JournalEntrySchema.safeParse(formDataEntries);

    if (!validatedFields.success) {
        console.error("Validation errors:", validatedFields.error.flatten().fieldErrors);
        return {
            message: "Validation failed.",
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const data = validatedFields.data;
    const entryDate = data.date; // The validated date object

    // Normalize date to start of day for consistent querying
    const startOfDay = new Date(entryDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // 2. Process HTML fields to extract embedded base64 images
    const fieldsToProcess = [
        'emotionalReason', 'trcPlan', 'macroContext', 'tradePlan', 
        'executionNotes', 'hesitationReason', 'managementReason', 
        'convictionTradeReason', 'rulesExplanation', 'whyTrcProgress',
        'learnings', 'whatIsntWorking', 'eliminationPlan', 'changePlan',
        'solutionBrainstorm', 'adjustmentForTomorrow', 'easyTrade',
        'actionsToImproveForward', 'top3MistakesToday', 'top3ThingsDoneWell',
        'oneTakeawayTeaching', 'bestAndWorstTrades', 'recurringMistake',
        'todaysRepetition', 'pnlOfTheDay'
    ];
    
    const processedData = { ...data };
    const allSavedImages: Array<{ imagePath: string; filename: string; caption?: string, section: string, position: number }> = [];
    
    // Process each HTML field to extract and save embedded images
    for (const field of fieldsToProcess) {
        // Use as keyof to properly type the field access
        const fieldValue = data[field as keyof typeof data];
        
        if (fieldValue && typeof fieldValue === 'string') {
            const { processedHtml, savedImages } = await processBase64ImagesInHtml(
                fieldValue, 
                entryDate
            );
            
            // Here's the fix for line 198 - explicitly type cast the result
            // to the same type as the original field value
            (processedData as any)[field] = processedHtml;
            
            // Store information about saved images
            allSavedImages.push(...savedImages.map((img, index) => ({
                imagePath: img.relativePath,
                filename: img.filename,
                caption: '',
                section: field, // Use the field name as section identifier
                position: index
            })));
        }
    }

    // 3. Handle regular uploaded files too
    const uploadedImages = formData.getAll("images") as File[];
    const imageCaptionsRaw = formData.get("imageCaptions") as string | null;
    const captions = imageCaptionsRaw ? imageCaptionsRaw.split('\n').map(c => c.trim()) : [];
    
    try {
        const uploadDir = path.join(process.cwd(), "public", "uploads", "images");
        
        for (let i = 0; i < uploadedImages.length; i++) {
            const imageFile = uploadedImages[i];
            if (!imageFile || imageFile.size === 0) continue; // Skip empty file inputs

            // Basic validation (add more robust checks if needed)
            if (!['image/png', 'image/jpeg', 'image/jpg'].includes(imageFile.type)) {
                console.warn(`Skipping non-image file: ${imageFile.name}`);
                continue; // Or return an error
            }

            const bytes = await imageFile.arrayBuffer();
            const buffer = Buffer.from(bytes);
            const filename = generateFilename(entryDate, imageFile.name);
            const filePath = path.join(uploadDir, filename);
            const relativePath = `images/${filename}`; // Path relative to /public/uploads

            await writeFile(filePath, buffer);
            console.log(`Saved image: ${filePath}`);

            const caption = captions[i] || "";
            
            allSavedImages.push({
                imagePath: relativePath, // Store the path relative to /uploads
                filename: filename, // Store the generated filename
                caption: caption,
                section: "chart_upload", // Default section for manual uploads
                position: i
            });
        }
    } catch (error) {
        console.error("Error saving image:", error);
        return { message: "Failed to save images.", errors: null };
    }

    // 4. Find Existing Entry or Prepare New One
    try {
        let entry: JournalEntry | null = await prisma.journalEntry.findUnique({
            where: {
                date: startOfDay,
            },
        });

        if (entry) {
            // Update existing entry
            console.log(`Updating entry for date: ${format(startOfDay, 'yyyy-MM-dd')}`);
            entry = await prisma.journalEntry.update({
                where: { id: entry.id },
                data: {
                    ...processedData, // Use the processed data with image paths
                    date: startOfDay, // Ensure date is normalized
                },
            });
            
            // Handle images for existing entry: Delete old chart_upload images, add new ones
            await prisma.journalImage.deleteMany({
                where: {
                    journalEntryId: entry.id,
                    section: "chart_upload" // Only delete manually uploaded images
                }
            });

        } else {
            // Create new entry
            console.log(`Creating new entry for date: ${format(startOfDay, 'yyyy-MM-dd')}`);
            entry = await prisma.journalEntry.create({
                data: {
                    ...processedData, // Use the processed data with image paths
                    date: startOfDay, // Ensure date is normalized
                },
            });
        }

        // 5. Create JournalImage records for the saved images
        if (allSavedImages.length > 0 && entry) {
            await prisma.journalImage.createMany({
                data: allSavedImages.map(imgData => ({
                    journalEntryId: entry!.id, // We know entry exists here
                    imagePath: imgData.imagePath,
                    filename: imgData.filename,
                    caption: imgData.caption,
                    section: imgData.section,
                    position: imgData.position
                })),
            });
            console.log(`Associated ${allSavedImages.length} images with entry ID ${entry.id}`);
        }

    } catch (error: any) {
        console.error("Database error:", error);
        // Handle potential unique constraint violation if date wasn't unique before
        if (error.code === 'P2002' && error.meta?.target?.includes('date')) {
             return { message: "An entry for this date already exists.", errors: { date: ["Date already has an entry."] } };
        }
        return { message: "Database error saving entry.", errors: null };
    }

    // 6. Revalidate and Return Success
    revalidatePath("/journal"); // Update the cache for the journal list page
    revalidatePath(`/journal/${format(startOfDay, 'yyyy-MM-dd')}`); // If you have a specific view page per date
    
    // Return success but stay on page
    return { message: "Journal entry saved successfully!", errors: null, success: true };
}

// --- Server Action: Trigger AI Analysis ---
// This function remains the same as in your original code
export async function triggerAIAnalysis(entryId: number) {
    console.log(`Triggering AI analysis for entry ID: ${entryId}`);

    const entry = await prisma.journalEntry.findUnique({
        where: { id: entryId },
    });

    if (!entry) {
        console.error(`Entry not found for AI analysis: ID ${entryId}`);
        return { success: false, message: "Entry not found." };
    }
     if (entry.aiInsight) {
        console.log(`Entry ID ${entryId} already has AI insight. Skipping.`);
        // Optionally allow re-analysis by removing the check or adding a force flag
        return { success: true, message: "AI insight already exists." };
    }

    // Format data for the prompt (similar to analyze_with_pgt.py)
     const text = `
        Date: ${format(entry.date, 'yyyy-MM-dd')}
        Emotional score of the day: ${entry.emotionalTemp ?? 'N/A'}
        Reason for emotional state: ${entry.emotionalReason ?? 'N/A'}
        TRC Goal: ${entry.trcGoal ?? 'N/A'}
        Plan to achieve TRC Goal: ${entry.trcPlan ?? 'N/A'}
        Aphorisms/Reminders: ${entry.aphorisms ?? 'N/A'}
        Macro Context: ${entry.macroContext ?? 'N/A'}
        Trade Plan: ${entry.tradePlan ?? 'N/A'}
        Execution Notes: ${entry.executionNotes?.replace(/<[^>]*>|!\[\[.*?\]\]/g, '') ?? 'N/A'}
        Hesitated: ${entry.hesitation ? 'Yes' : 'No'}
        Hesitation Reason: ${entry.hesitationReason?.replace(/<[^>]*>/g, '') ?? 'N/A'}
        Management Rating (1-5): ${entry.managementRating ?? 'N/A'}
        Management Reason: ${entry.managementReason?.replace(/<[^>]*>/g, '') ?? 'N/A'}
        Stayed with Winners: ${entry.stayedWithWinner ? 'Yes' : 'No'}
        Sizing OK: ${entry.sizingOk ? 'Yes' : 'No'}
        Conviction Trade: ${entry.convictionTrade ? 'Yes' : 'No'}
        Conviction Reason: ${entry.convictionTradeReason?.replace(/<[^>]*>/g, '') ?? 'N/A'}
        Sized by Conviction: ${entry.convictionSized ? 'Yes' : 'No'}
        Logged Stats: ${entry.loggedInStats ? 'Yes' : 'No'}
        Broke Rules: ${entry.brokeRules ? 'Yes' : 'No'}
        Rule Explanation: ${entry.rulesExplanation?.replace(/<[^>]*>/g, '') ?? 'N/A'}
        Progress Toward TRC: ${entry.trcProgress ? 'Yes' : 'No'}
        Why / Why Not  made progress toward trc?: ${entry.whyTrcProgress?.replace(/<[^>]*>/g, '') ?? 'N/A'}
        Learnings: ${entry.learnings?.replace(/<[^>]*>/g, '') ?? 'N/A'}
        What Isn't Working: ${entry.whatIsntWorking?.replace(/<[^>]*>/g, '') ?? 'N/A'}
        Elimination Plan: ${entry.eliminationPlan?.replace(/<[^>]*>/g, '') ?? 'N/A'}
        Change Plan: ${entry.changePlan?.replace(/<[^>]*>/g, '') ?? 'N/A'}
        For the changes i need to make starting today, what are the solutions i can find?: ${entry.solutionBrainstorm?.replace(/<[^>]*>/g, '') ?? 'N/A'}
        Adjustment for Tomorrow: ${entry.adjustmentForTomorrow?.replace(/<[^>]*>/g, '') ?? 'N/A'}
        What was the Easy Trade of the Day?: ${entry.easyTrade?.replace(/<[^>]*>/g, '') ?? 'N/A'}
        List of actions to improve forward.: ${entry.actionsToImproveForward?.replace(/<[^>]*>/g, '') ?? 'N/A'}
        Top 3 mistakes of today: ${entry.top3MistakesToday?.replace(/<[^>]*>/g, '') ?? 'N/A'}
        Top 3 things done well today: ${entry.top3ThingsDoneWell?.replace(/<[^>]*>/g, '') ?? 'N/A'}
        If i had to teach one takeaway from todays trades to a junior trader what would it be?: ${entry.oneTakeawayTeaching?.replace(/<[^>]*>/g, '') ?? 'N/A'}
        What was the best and worst trade today?: ${entry.bestAndWorstTrades?.replace(/<[^>]*>/g, '') ?? 'N/A'}
        What recurring mistake am i still making, and what's the real root cause?: ${entry.recurringMistake?.replace(/<[^>]*>/g, '') ?? 'N/A'}
        If today repeated 10 more times, what would i change to maximize edge?, change for edge: ${entry.todaysRepetition?.replace(/<[^>]*>/g, '') ?? 'N/A'}
        P&L Summary: ${entry.pnlOfTheDay?.replace(/<[^>]*>/g, '') ?? 'N/A'}
    `;

    const prompt = `
        You are a trading performance coach. Analyze the following detailed trading journal entry.
        Provide clear, concise, and actionable feedback focusing on:
        1.  **Key Strengths:** What did the trader do well based on their plan, execution, and review?
        2.  **Critical Weaknesses:** Identify the most significant areas needing improvement (e.g., rule-breaking, emotional control, flawed analysis, poor execution/management). Prioritize the biggest issues.
        3.  **Actionable Suggestions:** Offer specific, concrete steps the trader can take *tomorrow* and *long-term* to address the weaknesses and reinforce strengths. Link suggestions directly to observations.
        4.  **Potential Emotional/Psychological Patterns:** Based on the entry (emotions, hesitation, rule-breaking, What recurring mistake am i still making, and what's the real root cause?s), are there any underlying patterns? (e.g., fear of missing out, impatience, overconfidence after wins, revenge trading after losses). Be objective.
        5.  **Overall Summary:** A brief concluding thought on the day's performance and focus areas.

        Keep the tone constructive and supportive, like a coach aiming for improvement. Format the output using markdown with clear headings for each section.

        --- Journal Entry ---
        ${text}
        --- End of Entry ---
    `;


    // Call OpenRouter API
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        console.error("OpenRouter API key not configured.");
        return { success: false, message: "AI service not configured." };
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "HTTP-Referer": process.env.OPENROUTER_REFERRER || "http://localhost:3000",
                "X-Title": process.env.OPENROUTER_PROJECT_TITLE || "NextJS Trading Journal",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "openai/gpt-3.5-turbo", // Or your preferred model
                messages: [
                    { role: "system", content: "You are a helpful trading performance coach providing analysis on journal entries." },
                    { role: "user", content: prompt },
                ],
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`OpenRouter API Error: ${response.status} ${errorText}`);
            return { success: false, message: `AI API request failed: ${response.statusText}` };
        }

        const result = await response.json();
        const insight = result.choices?.[0]?.message?.content;

        if (!insight) {
             console.error("No insight content received from OpenRouter.");
             return { success: false, message: "AI analysis returned empty content." };
        }

        // Save insight to database
        await prisma.journalEntry.update({
            where: { id: entryId },
            data: { aiInsight: insight },
        });

        console.log(`AI insight saved successfully for entry ID: ${entryId}`);
        revalidatePath("/journal"); // Revalidate list view
        revalidatePath(`/journal/${format(entry.date, 'yyyy-MM-dd')}`); // Revalidate specific view if exists

        return { success: true, message: "AI analysis completed and saved." };

    } catch (error) {
        console.error("Error during AI analysis request:", error);
        return { success: false, message: "An error occurred during AI analysis." };
    }
}