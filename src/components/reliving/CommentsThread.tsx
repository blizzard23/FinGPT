"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { addComment } from "@/app/app/c/[id]/p/[photoId]/actions";

export type ThreadComment = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  authorName: string;
  authorAvatar: string | null;
};

export function CommentsThread({
  photoId,
  capsuleId,
  initial,
  currentUser,
}: {
  photoId: string;
  capsuleId: string;
  initial: ThreadComment[];
  currentUser: { id: string; name: string; avatar: string | null };
}) {
  const [comments, setComments] = useState<ThreadComment[]>(initial);
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const namesRef = useRef(
    new Map(initial.map((c) => [c.user_id, { name: c.authorName, avatar: c.authorAvatar }]))
  );

  useEffect(() => {
    namesRef.current.set(currentUser.id, {
      name: currentUser.name,
      avatar: currentUser.avatar,
    });
  }, [currentUser]);

  // Live updates: append comments inserted by anyone in the group.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`comments:${photoId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `photo_id=eq.${photoId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            body: string;
            created_at: string;
            user_id: string;
          };
          setComments((prev) => {
            if (prev.some((c) => c.id === row.id)) return prev;
            const who = namesRef.current.get(row.user_id);
            return [
              ...prev,
              {
                id: row.id,
                body: row.body,
                created_at: row.created_at,
                user_id: row.user_id,
                authorName: who?.name ?? "Freund:in",
                authorAvatar: who?.avatar ?? null,
              },
            ];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [photoId]);

  function submit() {
    const text = body.trim();
    if (!text) return;

    const optimistic: ThreadComment = {
      id: `temp-${Date.now()}`,
      body: text,
      created_at: new Date().toISOString(),
      user_id: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
    };
    setComments((prev) => [...prev, optimistic]);
    setBody("");

    startTransition(async () => {
      const result = await addComment(photoId, capsuleId, text);
      if (result?.error) {
        // Roll back the optimistic entry.
        setComments((prev) => prev.filter((c) => c.id !== optimistic.id));
        setBody(text);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {comments.map((comment) => (
          <li key={comment.id} className="flex gap-3">
            <Avatar name={comment.authorName} src={comment.authorAvatar} size={32} />
            <div className="flex-1">
              <p className="font-mono text-xs text-ink-faint">{comment.authorName}</p>
              <p className="text-sm text-ink">{comment.body}</p>
            </div>
          </li>
        ))}
        {comments.length === 0 && (
          <li className="text-sm text-ink-dim">
            Noch keine Worte. Was kommt dir bei diesem Moment in den Sinn?
          </li>
        )}
      </ul>

      <div className="flex items-end gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="Schreib etwas…"
          className="min-h-12 flex-1 rounded-full border border-line bg-night px-4 text-ink placeholder:text-ink-faint focus:border-glow focus:outline-none"
        />
        <Button onClick={submit} disabled={pending || !body.trim()} className="px-4">
          Senden
        </Button>
      </div>
    </div>
  );
}
