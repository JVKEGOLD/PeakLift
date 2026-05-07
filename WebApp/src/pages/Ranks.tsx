import { useEffect, useMemo, useState } from "react";
import { Trophy } from "lucide-react";
import { Card, Notice, PageHeader } from "../components/ui";
import { supabase } from "../supabase";
import type { WorkoutLog } from "../types";
import { friendlyError } from "../utils/errors";
import { toWorkoutLog } from "../utils/supabaseRows";

export default function Ranks() {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data, error: loadError } = await supabase
        .from("workout_logs")
        .select("*, workout_likes(user_id)")
        .eq("is_private", false)
        .order("created_at", { ascending: false });
      if (loadError) throw loadError;
      setError("");
      setLogs((data || []).map(toWorkoutLog));
    };

    void load().catch((listenerError) => setError(friendlyError(listenerError, "Unable to load rankings.")));
    const channel = supabase
      .channel("ranks")
      .on("postgres_changes", { event: "*", schema: "public", table: "workout_logs" }, () => {
        void load().catch((listenerError) => setError(friendlyError(listenerError, "Unable to load rankings.")));
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const ranks = useMemo(() => {
    const byUser = new Map<string, { userId: string; name: string; photo?: string | null; workouts: number; volume: number; minutes: number }>();
    logs.forEach((log) => {
      const current = byUser.get(log.userId) || { userId: log.userId, name: log.userName, photo: log.userPhoto, workouts: 0, volume: 0, minutes: 0 };
      current.workouts += 1;
      current.volume += Number(log.volume || 0);
      current.minutes += Number(log.duration || 0);
      byUser.set(log.userId, current);
    });
    return [...byUser.values()].sort((a, b) => b.volume - a.volume).slice(0, 50);
  }, [logs]);

  return (
    <>
      <PageHeader title="Ranks" description="Community leaderboard ranked by logged training volume." />
      {error ? <Notice tone="error" title="Ranks issue" body={error} /> : null}
      <Card>
        <div className="leaderboard">
          {ranks.map((rank, index) => (
            <div className="rank-row" key={rank.userId}>
              <span className="rank-place">{index + 1}</span>
              <div className="avatar">{rank.photo ? <img src={rank.photo} alt="" /> : rank.name.slice(0, 1)}</div>
              <div><strong>{rank.name}</strong><small>{rank.workouts} workouts • {rank.minutes} minutes</small></div>
              <strong>{Math.round(rank.volume).toLocaleString()} lbs</strong>
            </div>
          ))}
          {ranks.length === 0 ? <p className="muted"><Trophy size={18} /> No public workout logs yet.</p> : null}
        </div>
      </Card>
    </>
  );
}
