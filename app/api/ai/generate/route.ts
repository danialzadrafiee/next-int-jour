// app/api/ai/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Function to sanitize fields containing base64 images
function sanitizeImageContent(data: any): any {
    if (!data) return data;
    // If it's an array, process each item
    if (Array.isArray(data)) {
        return data.map(item => sanitizeImageContent(item));
    }
    // If it's an object, process each property
    if (typeof data === 'object') {
        const sanitizedObject = { ...data };
        for (const key in sanitizedObject) {
            if (typeof sanitizedObject[key] === 'string') {
                // Replace image tags containing base64 data
                sanitizedObject[key] = sanitizedObject[key].replace(/<img[^>]*src=["']data:image\/[^>]*>/g, '[IMAGE]');
            } else if (typeof sanitizedObject[key] === 'object') {
                sanitizedObject[key] = sanitizeImageContent(sanitizedObject[key]);
            }
        }
        return sanitizedObject;
    }
    return data;
}

// Analyze entries with OpenRouter API (using Google's Gemini model)
async function analyzeEntriesWithAI(entries: any[], prompt: string) {
    try {

        const entriesText = entries.map(entry =>
            JSON.stringify(entry, null, 2)
        ).join('\n\n');

        const fullPrompt = `${prompt}\n\nJournal entries to analyze:\n${entriesText}`;



        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            },
            body: JSON.stringify({
                model: process.env.OPENROUTER_MODEL,
                messages: [
                    { role: 'user', content: fullPrompt }
                ]
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`OpenRouter API error: ${JSON.stringify(error)}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error('Error analyzing entries with AI:', error);
        throw error;
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const fetchSaved = searchParams.get('fetchSaved');

        if (fetchSaved === 'true') {
            try {
                const savedAnalyses = await prisma.aIAnalysis.findMany({
                    orderBy: {
                        createdAt: 'desc'
                    }
                });

                return NextResponse.json({ analyses: savedAnalyses });
            } catch (error) {
                console.error('Error fetching saved analyses:', error);
                return NextResponse.json({ error: 'Failed to fetch saved analyses' }, { status: 500 });
            }
        }

        const from = searchParams.get('from');
        const to = searchParams.get('to');
        let whereClause: any = {};

        // If both dates are provided, filter by date range
        if (from && to) {
            const fromDate = new Date(from);
            const toDate = new Date(to);
            // Ensure dates are valid
            if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
                return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
            }
            whereClause = {
                date: {
                    gte: fromDate,
                    lte: toDate,
                }
            };
        }
        // If only to date is provided, set default from to beginning of time
        else if (to) {
            const toDate = new Date(to);
            if (isNaN(toDate.getTime())) {
                return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
            }
            whereClause = {
                date: {
                    lte: toDate,
                }
            };
        }
        // If only from date is provided, set default to to today
        else if (from) {
            const fromDate = new Date(from);
            const today = new Date();
            if (isNaN(fromDate.getTime())) {
                return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
            }
            whereClause = {
                date: {
                    gte: fromDate,
                    lte: today,
                }
            };
        }

        const entries = await prisma.journalEntry.findMany({
            where: whereClause,
            include: {
                images: true, // Include related images
            },
            orderBy: {
                date: 'asc',
            },
        });

        // Sanitize the entries to remove base64 image data
        const sanitizedEntries = sanitizeImageContent(entries);

        return NextResponse.json({ entries: sanitizedEntries });
    } catch (error) {
        console.error('Error fetching journal entries:', error);
        return NextResponse.json({ error: 'Failed to fetch journal entries' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { prompt, dateRange } = body;

        if (!prompt) {
            return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
        }

        // Fix for TypeScript error - properly type the whereClause
        let whereClause: any = {};

        // Handle date filtering if provided
        if (dateRange?.from || dateRange?.to) {
            whereClause.date = {};

            if (dateRange.from) {
                whereClause.date.gte = new Date(dateRange.from);
            }

            if (dateRange.to) {
                whereClause.date.lte = new Date(dateRange.to);
            }
        }

        const entries = await prisma.journalEntry.findMany({
            where: whereClause,
            orderBy: {
                date: 'asc',
            },
        });

        if (entries.length === 0) {
            return NextResponse.json({
                analysis: "No journal entries found for the specified period."
            });
        }

        // Sanitize the entries to remove base64 image data
        const sanitizedEntries = sanitizeImageContent(entries);
        // Get AI analysis
        const analysis = await analyzeEntriesWithAI(sanitizedEntries, prompt);

        return NextResponse.json({ analysis });
    } catch (error) {
        console.error('Error analyzing journal entries:', error);
        return NextResponse.json({ error: 'Failed to analyze journal entries' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { title, prompt, result, dateRange } = body;

        if (!title || !prompt || !result) {
            return NextResponse.json({ error: 'Title, prompt, and result are required' }, { status: 400 });
        }

        const savedAnalysis = await prisma.aIAnalysis.create({
            data: {
                title,
                prompt,
                result,
                dateRangeFrom: dateRange?.from ? new Date(dateRange.from) : null,
                dateRangeTo: dateRange?.to ? new Date(dateRange.to) : null,
            }
        });

        return NextResponse.json({ success: true, analysisId: savedAnalysis.id });
    } catch (error) {
        console.error('Error saving analysis:', error);
        return NextResponse.json({ error: 'Failed to save analysis' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}