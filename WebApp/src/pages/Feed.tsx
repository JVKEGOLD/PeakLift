import { FormEvent, useEffect, useState } from "react";
import { Heart, MessageSquare } from "lucide-react";
import { Button, Card, EmptyState, Input, Notice, PageHeader } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabase";
import type { WorkoutLog } from "../types";
import { friendlyError } from "../utils/errors";
import { AppComment, toComment, toWorkoutLog } from "../utils/supabaseRows";

export default function Feed() {
  const { user, profile } = useAuth();
  const [filter, setFilter] = useState<"global" | "me">("global");
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  const [comments, setComments] = useState<AppComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      let request = supabase
        .from("workout_logs")
        .select("*, workout_likes(user_id)")
        .order("created_at", { ascending: false });

      request = filter === "me" && user ? request.eq("user_id", user.uid) : request.eq("is_private", false);

      const { data, error: loadError } = await request;
      if (loadError) throw loadError;
      setError("");
      setLogs((data || []).map(toWorkoutLog));
    };

    void load().catch((listenerError) => setError(friendlyError(listenerError, "Unable to load feed.")));
    const channel = supabase
      .channel(`feed-${filter}-${user?.uid || "public"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "workout_logs" }, () => {
        void load().catch((listenerError) => setError(friendlyError(listenerError, "Unable to load feed.")));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "workout_likes" }, () => {
        void load().catch((listenerError) => setError(friendlyError(listenerError, "Unable to load likes.")));
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [filter, user]);

  useEffect(() => {
    if (!commentsFor) {
      setComments([]);
      return undefined;
    }

    const load = async () => {
      const { data, error: loadError } = await supabase
        .from("workout_comments")
        .select("*")
        .eq("workout_log_id", commentsFor)
        .order("created_at", { ascending: true });
      if (loadError) throw loadError;
      setComments((data || []).map(toComment));
    };

    void load().catch((listenerError) => setError(friendlyError(listenerError, "Unable to load comments.")));
    const channel = supabase
      .channel(`comments-${commentsFor}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "workout_comments", filter: `workout_log_id=eq.${commentsFor}` }, () => {
        void load().catch((listenerError) => setError(friendlyError(listenerError, "Unable to load comments.")));
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [commentsFor]);

  const like = async (log: WorkoutLog) => {
    if (!user) return;
    const likes = log.likes || [];
    try {
      const request = likes.includes(user.uid)
        ? supabase.from("workout_likes").delete().eq("workout_log_id", log.id).eq("user_id", user.uid)
        : supabase.from("workout_likes").insert({ workout_log_id: log.id, user_id: user.uid });
      const { error: likeError } = await request;
      if (likeError) throw likeError;
    } catch (likeError) {
      setError(friendlyError(likeError, "Unable to update like."));
    }
  };

  const submitComment = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || !commentsFor || !commentText.trim()) return;
    try {
      const { error: commentError } = await supabase.from("workout_comments").insert({
        workout_log_id: commentsFor,
        user_id: user.uid,
        user_name: profile?.username || user.displayName || "Peak Lifter",
        text: commentText.trim(),
      });
      if (commentError) throw commentError;
      setCommentText("");
    } catch (commentError) {
      setError(friendlyError(commentError, "Unable to add comment."));
    }
  };

  const reportLog = async (log: WorkoutLog) => {
    if (!user || !window.confirm("Report this post for review?")) return;
    try {
      const { error: reportError } = await supabase.from("reports").insert({
        type: "workout_log",
        target_id: log.id,
        target_owner_id: log.userId,
        reporter_id: user.uid,
      });
      if (reportError) throw reportError;
      setError("Report submitted for review.");
    } catch (reportError) {
      setError(friendlyError(reportError, "Unable to report this post."));
    }
  };

  return (
    <>
      <PageHeader title="Feed" description="Community workout logs and recent sessions." action={<div className="segmented"><button className={filter === "global" ? "active" : ""} onClick={() => setFilter("global")}>Global</button><button className={filter === "me" ? "active" : ""} onClick={() => setFilter("me")}>Me</button></div>} />
      {error ? <Notice tone={error.includes("submitted") ? "success" : "error"} title={error.includes("submitted") ? "Report sent" : "Feed issue"} body={error} /> : null}
      <div className="feed-list">
        {logs.map((log) => (
          <Card key={log.id}>
            <div className="feed-head">
              <div className="avatar">{log.userPhoto ? <img src={log.userPhoto} alt="" /> : log.userName.slice(0, 1)}</div>
              <div><strong>{log.userName}</strong><small>{log.routineName || "Workout"}</small></div>
            </div>
            <p>{log.notes || "Logged a workout."}</p>
            <div className="metric-row">
              <span>{log.exerciseCount || 0} exercises</span>
              <span>{log.duration || 0} min</span>
              <span>{Math.round(log.volume || 0).toLocaleString()} lbs</span>
            </div>
            <div className="button-row">
              <Button variant="ghost" onClick={() => like(log)}><Heart size={17} /> {(log.likes || []).length}</Button>
              <Button variant="ghost" onClick={() => setCommentsFor(commentsFor === log.id ? null : log.id)}><MessageSquare size={17} /> Comments</Button>
              <Button variant="ghost" onClick={() => reportLog(log)}>Report</Button>
            </div>
            {commentsFor === log.id ? (
              <div className="comments">
                {comments.map((comment) => <p key={comment.id}><strong>{comment.userName}:</strong> {comment.text}</p>)}
                <form onSubmit={submitComment} className="inline-form"><Input aria-label="Write a comment" value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Write a comment..." /><Button type="submit">Send</Button></form>
              </div>
            ) : null}
          </Card>
        ))}
        {logs.length === 0 ? <EmptyState title="No posts yet" body={filter === "me" ? "Your saved private and public workouts will appear here." : "Shared workouts from the community will appear here."} /> : null}
      </div>
    </>
  );
}
