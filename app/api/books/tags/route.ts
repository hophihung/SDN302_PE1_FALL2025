import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all unique tags
export async function GET() {
  try {
    const books = await prisma.book.findMany({
      select: {
        tags: true,
      },
    });

    // Extract and deduplicate all tags
    const allTags = books.flatMap((book: { tags: string[] }) => book.tags);
    const uniqueTags = [...new Set(allTags)].sort();

    return NextResponse.json(uniqueTags);
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}
