import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all books with optional search, filter, and sort
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const tag = searchParams.get("tag") || "";
    const sort = searchParams.get("sort") || "asc"; // asc or desc

    const where: any = {};

    // Search by title
    if (search) {
      where.title = {
        contains: search,
        mode: "insensitive",
      };
    }

    // Filter by tag
    if (tag) {
      where.tags = {
        has: tag,
      };
    }

    const books = await prisma.book.findMany({
      where,
      orderBy: {
        title: sort === "desc" ? "desc" : "asc",
      },
    });

    return NextResponse.json(books);
  } catch (error) {
    console.error("Error fetching books:", error);
    return NextResponse.json(
      { error: "Failed to fetch books" },
      { status: 500 }
    );
  }
}

// POST create a new book
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, author, tags, coverImage } = body;

    if (!title || !author) {
      return NextResponse.json(
        { error: "Title and author are required" },
        { status: 400 }
      );
    }

    const book = await prisma.book.create({
      data: {
        title,
        author,
        tags: tags || [],
        coverImage: coverImage || null,
      },
    });

    return NextResponse.json(book, { status: 201 });
  } catch (error) {
    console.error("Error creating book:", error);
    return NextResponse.json(
      { error: "Failed to create book" },
      { status: 500 }
    );
  }
}
