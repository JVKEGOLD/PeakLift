import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, Dumbbell, Flame, Plus, Trophy } from "lucide-react";
import { Button, Card, Notice, PageHeader } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabase";
import type { Routine, WorkoutLog } from "../types";
import { friendlyError } from "../utils/errors";
import { toRoutine, toWorkoutLog } from "../utils/supabaseRows";

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return undefined;

    const load = async () => {
      const [logResult, routineResult] = await Promise.all([
        supabase
          .from("workout_logs")
          .select("*, workout_likes(user_id)")
          .eq("user_id", user.uid)
          .order("created_at", { ascending: false }),
        supabase
          .from("routines")
          .select("*")
          .eq("user_id", user.uid)
          .order("updated_at", { ascending: false }),
      ]);
      if (logResult.error) throw logResult.error;
      if (routineResult.error) throw routineResult.error;
      setError("");
      setLogs((logResult.data || []).map(toWorkoutLog));
      setRoutines((routineResult.data || []).map(toRoutine));
    };

    void load().catch((listenerError) => setError(friendlyError(listenerError, "Unable to load dashboard.")));
    const channel = supabase
      .channel(`dashboard-${user.uid}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "workout_logs", filter: `user_id=eq.${user.uid}` }, () => {
        void load().catch((listenerError) => setError(friendlyError(listenerError, "Unable to load workout history.")));
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "routines", filter: `user_id=eq.${user.uid}` }, () => {
        void load().catch((listenerError) => setError(friendlyError(listenerError, "Unable to load routines.")));
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user]);

  const stats = useMemo(() => {
    const volume = logs.reduce((sum, log) => sum + (Number(log.volume) || 0), 0);
    const minutes = logs.reduce((sum, log) => sum + (Number(log.duration) || 0), 0);
    return { volume, minutes, workouts: logs.length, routines: routines.length };
  }, [logs, routines]);

  return (
    <>
      <PageHeader title={`Welcome back, ${profile?.username || "Peak Lifter"}`} description="Your training command center." action={<Link to="/workouts"><Button><Plus size={18} /> New Routine</Button></Link>} />
      {error ? <Notice tone="error" title="Dashboard could not refresh" body={error} /> : null}
      <div className="stat-grid">
        <Card><Trophy /><strong>{stats.workouts}</strong><span>Logged workouts</span></Card>
        <Card><Dumbbell /><strong>{stats.routines}</strong><span>Saved routines</span></Card>
        <Card><Flame /><strong>{Math.round(stats.volume).toLocaleString()}</strong><span>Total volume</span></Card>
        <Card><Activity /><strong>{stats.minutes}</strong><span>Training minutes</span></Card>
      </div>
      <section className="grid-two">
        <Card>
          <h2>Recent Sessions</h2>
          <div className="list-stack">
            {logs.slice(0, 5).map((log) => (
              <div key={log.id} className="list-row">
                <div><strong>{log.routineName || "Workout"}</strong><small>{log.exerciseCount || 0} exercises</small></div>
                <span>{log.duration || 0} min</span>
              </div>
            ))}
            {logs.length === 0 ? <p className="muted">No workouts logged yet.</p> : null}
          </div>
        </Card>
        <Card>
          <h2>Current Routines</h2>
          <div className="list-stack">
            {routines.slice(0, 5).map((routine) => (
              <Link key={routine.id} to={`/workout/build/${routine.id}`} className="list-row">
                <div><strong>{routine.name}</strong><small>{routine.itemCount || 0} exercises</small></div>
                <span>{routine.isPublic ? "Public" : "Private"}</span>
              </Link>
            ))}
            {routines.length === 0 ? <p className="muted">Create a routine to start tracking.</p> : null}
          </div>
        </Card>
      </section>
    </>
  );
}
