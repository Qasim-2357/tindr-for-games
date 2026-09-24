import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Heart, MessageCircle, Pencil, RefreshCw, Trash2, X } from "lucide-react";
import { api, ApiError } from "../api";
import { useAuth } from "../context/AuthContext";
import { genreByKey } from "../lib/genres";
import type { Comment } from "../types";
import GlassButton from "./GlassButton";
import GlassCard from "./GlassCard";

const DELETED = "This comment was deleted.";
const relativeTime = (value: string) => {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

function replaceComment(items: Comment[], id: number, update: (comment: Comment) => Comment): Comment[] {
  return items.map((item) => item.id === id
    ? update(item)
    : { ...item, replies: replaceComment(item.replies, id, update) });
}

export default function GameComments({ gameId }: { gameId: number }) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [editing, setEditing] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.comments(gameId, 1, 20);
      setComments(response.items);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't load comments.");
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => { void load(); }, [load]);

  const submit = async (event: FormEvent, replyTo?: number) => {
    event.preventDefault();
    const value = (replyTo ? replyContent : content).trim();
    if (!value || value.length > 2000 || saving) return;
    setSaving(replyTo ? `reply-${replyTo}` : "comment");
    setActionError(null);
    try {
      if (replyTo) {
        const reply = await api.createReply(replyTo, value);
        setComments((items) => replaceComment(items, replyTo, (comment) => ({ ...comment, replies: [...comment.replies, reply] })));
        setReplyContent("");
        setReplyingTo(null);
      } else {
        const comment = await api.createComment(gameId, value);
        setComments((items) => [...items, comment]);
        setContent("");
      }
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : "Couldn't save your comment.");
    } finally {
      setSaving(null);
    }
  };

  const toggleLike = async (comment: Comment) => {
    if (!user || saving) return;
    setSaving(`like-${comment.id}`);
    setActionError(null);
    try {
      const result = comment.liked_by_me ? await api.unlikeComment(comment.id) : await api.likeComment(comment.id);
      setComments((items) => replaceComment(items, comment.id, (current) => ({ ...current, liked_by_me: result.liked, like_count: result.like_count })));
    } catch (e) {
      if (e instanceof ApiError && (e.status === 404 || e.status === 409)) {
        await load();
      } else {
        setActionError(e instanceof ApiError ? e.message : "Couldn't update the like.");
      }
    } finally {
      setSaving(null);
    }
  };

  const saveEdit = async (event: FormEvent, comment: Comment) => {
    event.preventDefault();
    const value = editContent.trim();
    if (!value || value.length > 2000 || saving) return;
    setSaving(`edit-${comment.id}`);
    setActionError(null);
    try {
      const updated = await api.updateComment(comment.id, value);
      setComments((items) => replaceComment(items, comment.id, () => updated));
      setEditing(null);
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : "Couldn't update your comment.");
    } finally {
      setSaving(null);
    }
  };

  const remove = async (comment: Comment) => {
    if (!window.confirm("Delete this comment?") || saving) return;
    setSaving(`delete-${comment.id}`);
    setActionError(null);
    try {
      await api.deleteComment(comment.id);
      setComments((items) => replaceComment(items, comment.id, (current) => ({ ...current, content: DELETED })));
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : "Couldn't delete your comment.");
    } finally {
      setSaving(null);
    }
  };

  const form = (value: string, setValue: (value: string) => void, onSubmit: (event: FormEvent) => void, label: string, busy: boolean, onCancel?: () => void) => (
    <form onSubmit={onSubmit} className="mt-3 space-y-2">
      <textarea value={value} onChange={(event) => setValue(event.target.value.slice(0, 2000))} maxLength={2000} rows={3} placeholder={label} className="input-glass min-h-20 w-full resize-y" />
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-white/40">{value.length}/2000</span>
        <div className="flex gap-2">
          {onCancel && <GlassButton type="button" onClick={onCancel} className="!min-h-8 !px-3 !py-1.5 text-xs"><X className="h-3.5 w-3.5" /> Cancel</GlassButton>}
          <GlassButton type="submit" variant="primary" loading={busy} disabled={!value.trim()} className="!min-h-8 !px-3 !py-1.5 text-xs">Post</GlassButton>
        </div>
      </div>
    </form>
  );

  const renderComment = (comment: Comment, isReply = false) => {
    const own = user?.id === comment.user.id;
    const deleted = comment.content === DELETED;
    const genre = genreByKey(comment.user.identity_genre);
    return (
      <div key={comment.id} className={isReply ? "ml-5 border-l border-white/10 pl-4 sm:ml-8" : ""}>
        <div className="py-4 first:pt-0">
          <div className="flex items-center gap-2 text-xs text-white/45">
            <span className="font-medium text-white/80">{comment.user.username}</span>
            {genre && <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: genre.hex }} title={comment.user.identity_genre ?? undefined} />}
            {comment.user.identity_color && <span className="sr-only">{comment.user.identity_color}</span>}
            <span>·</span><span>{relativeTime(comment.created_at)}</span>
          </div>
          {editing === comment.id ? form(editContent, setEditContent, (event) => void saveEdit(event, comment), "Edit your comment", saving === `edit-${comment.id}`, () => setEditing(null)) : (
            <p className={`mt-2 whitespace-pre-wrap text-sm leading-relaxed ${deleted ? "italic text-white/40" : "text-white/75"}`}>{comment.content}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/45">
            <button type="button" onClick={() => void toggleLike(comment)} disabled={!user || saving === `like-${comment.id}`} className={`inline-flex items-center gap-1 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70 ${comment.liked_by_me ? "text-white" : ""}`} aria-label={comment.liked_by_me ? "Unlike comment" : "Like comment"}>
              <Heart className={`h-3.5 w-3.5 ${comment.liked_by_me ? "fill-current" : ""}`} /> {comment.like_count}
            </button>
            {!isReply && user && !deleted && <button type="button" onClick={() => { setReplyingTo(comment.id); setReplyContent(""); }} className="inline-flex items-center gap-1 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70"><MessageCircle className="h-3.5 w-3.5" /> Reply</button>}
            {own && !deleted && editing !== comment.id && <button type="button" onClick={() => { setEditing(comment.id); setEditContent(comment.content); }} className="inline-flex items-center gap-1 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70"><Pencil className="h-3.5 w-3.5" /> Edit</button>}
            {own && !deleted && <button type="button" onClick={() => void remove(comment)} disabled={saving === `delete-${comment.id}`} className="inline-flex items-center gap-1 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70"><Trash2 className="h-3.5 w-3.5" /> Delete</button>}
          </div>
          {replyingTo === comment.id && form(replyContent, setReplyContent, (event) => void submit(event, comment.id), "Write a reply", saving === `reply-${comment.id}`, () => setReplyingTo(null))}
          {comment.replies.length > 0 && <div className="mt-2">{comment.replies.map((reply) => renderComment(reply, true))}</div>}
        </div>
      </div>
    );
  };

  return (
    <GlassCard className="mt-5 p-5 sm:p-7">
      <div className="flex items-baseline justify-between gap-3">
        <div><h2 className="font-display text-xl font-medium">Comments</h2><p className="mt-1 text-sm text-white/45">Share your take on this game.</p></div>
        {!user && <span className="text-right text-xs text-white/45">Sign in to join the conversation.</span>}
      </div>
      {user && form(content, setContent, (event) => void submit(event), "Share your thoughts", saving === "comment")}
      {actionError && <p role="alert" className="mt-3 text-sm text-white/60">{actionError}</p>}
      {loading && <p className="mt-6 text-sm text-white/45">Loading comments...</p>}
      {!loading && error && <div className="mt-6 flex items-center gap-3 text-sm text-white/60"><span>{error}</span><button type="button" onClick={() => void load()} className="inline-flex items-center gap-1 text-white underline underline-offset-4"><RefreshCw className="h-3.5 w-3.5" /> Try again</button></div>}
      {!loading && !error && comments.length === 0 && <p className="mt-6 text-sm text-white/45">No comments yet. Be the first to share what you think.</p>}
      {!loading && !error && comments.length > 0 && <div className="mt-5 divide-y divide-white/10">{comments.map((comment) => renderComment(comment))}</div>}
    </GlassCard>
  );
}
