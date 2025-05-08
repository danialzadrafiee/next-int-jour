// Create a new file: app/api/ai/analysis/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);
        
        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid analysis ID' }, { status: 400 });
        }
        
        const analysis = await prisma.aIAnalysis.findUnique({
            where: { id },
        });
        
        if (!analysis) {
            return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
        }
        
        return NextResponse.json({ analysis });
    } catch (error) {
        console.error('Error fetching analysis:', error);
        return NextResponse.json({ error: 'Failed to fetch analysis' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const id = parseInt(params.id);
        
        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid analysis ID' }, { status: 400 });
        }
        
        await prisma.aIAnalysis.delete({
            where: { id },
        });
        
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting analysis:', error);
        return NextResponse.json({ error: 'Failed to delete analysis' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}