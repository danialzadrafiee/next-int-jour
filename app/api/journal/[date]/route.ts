// app/api/journal/[date]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseISO } from 'date-fns';

export async function GET(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  try {
    const dateString = params.date;
    const date = parseISO(dateString);

    // Normalize to start of day for consistent querying
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const entry = await prisma.journalEntry.findUnique({
      where: {
        date: startOfDay,
      },
      include: {
        images: {
          orderBy: {
            position: 'asc',
          },
        },
      },
    });

    if (!entry) {
      return NextResponse.json(
        { error: 'Journal entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error('Error fetching journal entry:', error);
    return NextResponse.json(
      { error: 'Failed to fetch journal entry' },
      { status: 500 }
    );
  }
}