"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface FormState {
  title: string;
  author: string;
  tags: string;
  coverImage: string;
}

export default function CreateBook() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormState>({
    title: "",
    author: "",
    tags: "",
    coverImage: "",
  });

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setFormData((previous) => ({
        ...previous,
        coverImage: typeof reader.result === "string" ? reader.result : "",
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const trimmedTitle = formData.title.trim();
    const trimmedAuthor = formData.author.trim();

    if (!trimmedTitle || !trimmedAuthor) {
      setFormError("Title and author are required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const tags = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const response = await fetch("/api/books", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: trimmedTitle,
          author: trimmedAuthor,
          tags,
          coverImage: formData.coverImage || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create book");
      }

      router.push("/?toast=book-created");
    } catch (error) {
      console.error("Error creating book:", error);
      setFormError(
        error instanceof Error ? error.message : "Failed to create book."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 text-sm">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sky-600 transition hover:text-sky-700"
          >
            ← Back to shelf
          </Link>
        </div>

        <div className="mt-6 grid gap-8 rounded-3xl bg-white p-8 shadow-sm lg:grid-cols-[2fr,1fr] lg:p-12">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">
              Add new book
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Capture the essentials below. You can always edit details later.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="title"
                  className="text-sm font-medium text-slate-700"
                >
                  Title <span className="text-rose-500">*</span>
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      title: event.target.value,
                    }))
                  }
                  placeholder="E.g. Clean Code"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 transition focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="author"
                  className="text-sm font-medium text-slate-700"
                >
                  Author <span className="text-rose-500">*</span>
                </label>
                <input
                  id="author"
                  name="author"
                  type="text"
                  required
                  value={formData.author}
                  onChange={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      author: event.target.value,
                    }))
                  }
                  placeholder="E.g. Robert C. Martin"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 transition focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="tags"
                  className="text-sm font-medium text-slate-700"
                >
                  Tags <span className="text-xs text-slate-400">Optional</span>
                </label>
                <input
                  id="tags"
                  name="tags"
                  type="text"
                  value={formData.tags}
                  onChange={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      tags: event.target.value,
                    }))
                  }
                  placeholder="Separate tags with commas (e.g. IT, Programming)"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 transition focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
                />
                <p className="text-xs text-slate-400">
                  We will turn each comma-separated value into a tag badge.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="coverImage"
                    className="text-sm font-medium text-slate-700"
                  >
                    Cover image{" "}
                    <span className="text-xs text-slate-400">Optional</span>
                  </label>
                  <input
                    id="coverImage"
                    name="coverImage"
                    type="url"
                    value={formData.coverImage}
                    onChange={(event) =>
                      setFormData((previous) => ({
                        ...previous,
                        coverImage: event.target.value,
                      }))
                    }
                    placeholder="Paste an image URL"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 transition focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-100"
                  />
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span
                    className="h-px flex-1 bg-slate-200"
                    aria-hidden="true"
                  />
                  or upload a file
                  <span
                    className="h-px flex-1 bg-slate-200"
                    aria-hidden="true"
                  />
                </div>

                <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 transition hover:border-sky-400 hover:bg-slate-100">
                  <span aria-hidden="true">🖼️</span>
                  <span>Drag & drop or click to upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </label>

                {formData.coverImage && (
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-sm font-medium text-slate-600">
                      Preview
                    </p>
                    <div className="mt-3 overflow-hidden rounded-xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={formData.coverImage}
                        alt="Cover preview"
                        className="h-64 w-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((previous) => ({
                          ...previous,
                          coverImage: "",
                        }))
                      }
                      className="mt-3 text-xs font-medium text-rose-500 transition hover:text-rose-600"
                    >
                      Remove image
                    </button>
                  </div>
                )}
              </div>

              {formError && (
                <p className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-2 text-sm text-rose-600">
                  {formError}
                </p>
              )}

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center rounded-full bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-400 sm:w-auto"
                >
                  {isSubmitting ? "Saving..." : "Save book"}
                </button>
                <Link
                  href="/"
                  className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800 sm:w-auto"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>

          <aside className="rounded-2xl bg-slate-900 p-6 text-white">
            <h2 className="text-lg font-semibold">Quick tips</h2>
            <ul className="mt-4 space-y-3 text-sm text-slate-200">
              <li>• Use descriptive titles so you can find books faster.</li>
              <li>• Add 2–3 tags to group books by topic or mood.</li>
              <li>
                • Images can be links or uploads—we keep them alongside your
                book.
              </li>
            </ul>
          </aside>
        </div>
      </div>
    </div>
  );
}
