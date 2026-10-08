"use client";

import type { useChat } from "@livekit/components-react";
import { Send, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { cn } from "@/lib/cn";

export type ChatMessages = ReturnType<typeof useChat>["chatMessages"];

const MAX_MESSAGE_LENGTH = 1000;
const timeFormatter = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });

/**
 * In-meeting chat (sent over LiveKit's data channel, so it is not stored).
 * Messages come from the parent so they survive the panel being closed.
 */
export function ChatPanel({
  messages,
  onSend,
  isSending,
  onClose,
}: {
  messages: ChatMessages;
  onSend: (message: string) => Promise<unknown>;
  isSending: boolean;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages.length]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || isSending) return;
    await onSend(text);
    setDraft("");
  };

  return (
    <section aria-labelledby="chat-heading" className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b border-room-hover px-4 py-3">
        <h2 id="chat-heading" className="text-sm font-semibold">
          Meeting Chat
        </h2>
        <button type="button" aria-label="Close chat" onClick={onClose} className="rounded p-1 hover:bg-room-hover">
          <X className="size-4" aria-hidden />
        </button>
      </header>

      <ol ref={listRef} aria-live="polite" className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {messages.length === 0 && (
          <li className="pt-8 text-center text-sm text-room-muted">Messages you send will appear here.</li>
        )}
        {messages.map((message) => {
          const mine = message.from?.isLocal ?? false;
          return (
            <li key={message.id} className={cn("flex flex-col", mine && "items-end")}>
              <span className="text-[11px] text-room-muted">
                {mine ? "You" : (message.from?.name ?? "Someone")} · {timeFormatter.format(message.timestamp)}
              </span>
              <p
                className={cn(
                  "mt-0.5 max-w-[85%] rounded-lg px-3 py-1.5 text-sm break-words whitespace-pre-wrap",
                  mine ? "bg-zoom-blue text-white" : "bg-room-tile",
                )}
              >
                {message.message}
              </p>
            </li>
          );
        })}
      </ol>

      <form onSubmit={submit} className="flex items-end gap-2 border-t border-room-hover p-3">
        <label htmlFor="chat-input" className="sr-only">
          Message everyone
        </label>
        <textarea
          id="chat-input"
          rows={1}
          value={draft}
          maxLength={MAX_MESSAGE_LENGTH}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void submit(event);
            }
          }}
          placeholder="Type message here…"
          className="max-h-28 min-h-10 flex-1 resize-none rounded-lg border border-room-hover bg-room-tile px-3 py-2 text-sm text-room-text placeholder:text-room-muted focus:border-zoom-blue focus:outline-none"
        />
        <button
          type="submit"
          aria-label="Send message"
          disabled={!draft.trim() || isSending}
          className="flex size-10 items-center justify-center rounded-lg bg-zoom-blue text-white disabled:opacity-40"
        >
          <Send className="size-4" aria-hidden />
        </button>
      </form>
    </section>
  );
}
