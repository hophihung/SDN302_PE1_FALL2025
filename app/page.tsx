"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Book } from "@/types/book";

type ToastVariant = "success" | "error";

interface ToastState {
  message: string;
  variant: ToastVariant;
}

const toastCopy: Record<string, { message: string; variant: ToastVariant }> = {
  "book-created": {
    message: "Book added successfully!",
    variant: "success",
  },
  "book-updated": {
    message: "Book updated successfully!",
    variant: "success",
  },
  "book-deleted": {
    message: "Book removed from your shelf.",
    variant: "success",
  },
  "book-error": {
    message: "Something went wrong. Please try again.",
    variant: "error",
  },
};

function Toast({
  toast,
  visible,
}: {
  toast: ToastState | null;
  visible: boolean;
}) {
  if (!toast) {
    return null;
  }

  const baseStyles =
    "fixed right-6 top-6 z-50 flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg transition-all duration-300";
  const variantStyles =
    toast.variant === "success"
      ? "bg-emerald-500 text-white"
      : "bg-rose-500 text-white";
  return (
    <div
      className={`${baseStyles} ${variantStyles} ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"
      }`}
      role="status"
      aria-live="polite"
    >
      <span className="text-lg" aria-hidden="true">
        {toast.variant === "success" ? "✅" : "⚠️"}
      </span>
      <span className="text-sm font-medium">{toast.message}</span>
    </div>
  );
}
function DeleteModal({
  open,
  bookTitle,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  bookTitle: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center gap-3 text-rose-600">
          <span className="text-2xl" aria-hidden="true">
            🗑️
          </span>
          <h2 className="text-lg font-semibold">Delete book</h2>
        </div>
        <p className="mt-4 text-sm text-slate-600">
          Are you sure you want to delete &ldquo;{bookTitle}&rdquo;? This action
          cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-400"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toastParam = searchParams.get("toast");

  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [sort, setSort] = useState<"asc" | "desc">("asc");
  const [tags, setTags] = useState<string[]>([]);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [showToast, setShowToast] = useState(false);

  const showToastMessage = useCallback(
    (message: string, variant: ToastVariant) => {
      setToast({ message, variant });
    },
    []
  );

  useEffect(() => {
    if (!toast) {
      return;
    }

    setShowToast(true);
    const timeout = window.setTimeout(() => {
      setShowToast(false);
      setToast(null);
    }, 2800);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!toastParam) {
      return;
    }

    const preset = toastCopy[toastParam];
    if (preset) {
      showToastMessage(preset.message, preset.variant);
    }

    router.replace("/", { scroll: false });
  }, [toastParam, router, showToastMessage]);

  const fetchTags = useCallback(async () => {
    try {
      const response = await fetch("/api/books/tags");
      if (!response.ok) {
        throw new Error("Failed to fetch tags");
      }
      const data: string[] = await response.json();
      setTags(data);
    } catch (error) {
      console.error("Error fetching tags:", error);
      showToastMessage("Unable to load tags.", "error");
    }
  }, [showToastMessage]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) {
        params.append("search", search);
      }
      if (selectedTag) {
        params.append("tag", selectedTag);
      }
      params.append("sort", sort);

      const response = await fetch(`/api/books?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch books");
      }
      const data: Book[] = await response.json();
      setBooks(data);
    } catch (error) {
      console.error("Error fetching books:", error);
      showToastMessage("Unable to load books.", "error");
    } finally {
      setLoading(false);
    }
  }, [search, selectedTag, sort, showToastMessage]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const filteredToolbarCopy = useMemo(() => {
    if (!books.length && (search || selectedTag)) {
      return "No books match your filters";
    }
    return `${books.length} ${books.length === 1 ? "book" : "books"} found`;
  }, [books.length, search, selectedTag]);

  const confirmDelete = useCallback(async () => {
    if (!bookToDelete) {
      return;
    }

    try {
      setDeleteLoading(true);
      const response = await fetch(`/api/books/${bookToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete");
      }

      showToastMessage(toastCopy["book-deleted"].message, "success");
      setBookToDelete(null);
      await fetchBooks();
      await fetchTags();
    } catch (error) {
      console.error("Error deleting book:", error);
      showToastMessage("Failed to delete book.", "error");
    } finally {
      setDeleteLoading(false);
    }
  }, [bookToDelete, fetchBooks, fetchTags, showToastMessage]);

  return (
    <div className="min-h-screen bg-slate-50">
      <Toast toast={toast} visible={showToast} />

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="text-3xl" aria-hidden="true">
              📚
            </span>
            <div>
              <p className="text-lg font-semibold text-slate-900">
                My Book Shelf
              </p>
              <p className="text-sm text-slate-500">
                Curate your personal library
              </p>
            </div>
          </div>
          <Link
            href="/books/create"
            className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-sky-700"
          >
            <span aria-hidden="true">＋</span>
            Add New Book
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <section className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-slate-900">
                Your collection
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {filteredToolbarCopy}
              </p>
            </div>

            <div className="grid w-full grid-cols-1 gap-4 lg:w-auto lg:grid-cols-3">
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 focus-within:border-sky-400 focus-within:bg-white focus-within:shadow-sm">
                <span className="text-lg text-slate-400" aria-hidden="true">
                  🔍
                </span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by title..."
                  className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                />
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 focus-within:border-sky-400 focus-within:bg-white focus-within:shadow-sm">
                <span className="text-lg text-slate-400" aria-hidden="true">
                  🏷️
                </span>
                <select
                  value={selectedTag}
                  onChange={(event) => setSelectedTag(event.target.value)}
                  className="w-full bg-transparent text-sm text-slate-700 focus:outline-none"
                >
                  <option value="">All tags</option>
                  {tags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 focus-within:border-sky-400 focus-within:bg-white focus-within:shadow-sm">
                <span className="text-lg text-slate-400" aria-hidden="true">
                  ↕️
                </span>
                <select
                  value={sort}
                  onChange={(event) =>
                    setSort(event.target.value as "asc" | "desc")
                  }
                  className="w-full bg-transparent text-sm text-slate-700 focus:outline-none"
                >
                  <option value="asc">Title: A–Z</option>
                  <option value="desc">Title: Z–A</option>
                </select>
              </label>
            </div>
          </div>
        </section>

        <section>
          {loading ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 shadow-sm">
              <div className="h-12 w-12 animate-spin rounded-full border-2 border-slate-200 border-t-sky-500" />
              <p className="mt-4 text-sm text-slate-500">Loading books...</p>
            </div>
          ) : books.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center shadow-sm">
              <span className="text-5xl" aria-hidden="true">
                📭
              </span>
              <h2 className="mt-4 text-xl font-semibold text-slate-900">
                No books yet
              </h2>
              <p className="mt-2 max-w-md text-sm text-slate-500">
                Your shelf is waiting! Click “Add New Book” to start building
                your collection.
              </p>
              <Link
                href="/books/create"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-sky-700"
              >
                Start adding books
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {books.map((book) => (
                <article
                  key={book.id}
                  className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="relative h-56 w-full overflow-hidden">
                    {book.coverImage ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={book.coverImage}
                          alt={book.title}
                          className="h-full w-full object-cover"
                        />
                      </>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-sky-400 via-sky-500 to-emerald-500 text-white">
                        <span className="text-5xl font-bold">
                          {book.title.charAt(0).toUpperCase() || "📘"}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center gap-3 bg-slate-900/0 transition group-hover:bg-slate-900/70">
                      <Link
                        href={`/books/${book.id}/edit`}
                        className="pointer-events-none inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-slate-800 opacity-0 shadow-sm transition group-hover:pointer-events-auto group-hover:opacity-100"
                      >
                        ✏️ Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => setBookToDelete(book)}
                        className="pointer-events-none inline-flex items-center gap-2 rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white opacity-0 shadow-sm transition group-hover:pointer-events-auto group-hover:opacity-100"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 p-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 truncate">
                        {book.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500 truncate">
                        by {book.author}
                      </p>
                    </div>

                    {book.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {book.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-600"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>
                        Created {new Date(book.createdAt).toLocaleDateString()}
                      </span>
                      <span>
                        Updated {new Date(book.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <DeleteModal
        open={Boolean(bookToDelete)}
        bookTitle={bookToDelete?.title ?? ""}
        loading={deleteLoading}
        onCancel={() => setBookToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          Loading...
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
