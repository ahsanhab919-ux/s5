"use client";
import { useParams } from "next/navigation";
import BookDetailPanel from "@/components/tools/book/BookDetailPanel";

export default function BookDetailPage() {
  const params = useParams<{ id: string }>();
  const bookId = Array.isArray(params.id) ? params.id[0] : params.id;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {bookId ? <BookDetailPanel bookId={bookId} /> : null}
    </div>
  );
}
