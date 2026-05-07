import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Play, Save } from "lucide-react";
import { Button, Card, Input, Notice, PageHeader, Textarea } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabase";
import type { Routine, RoutineExercise, WorkoutWeek } from "../types";
import { friendlyError } from "../utils/errors";
import { toRoutine } from "../utils/supabaseRows";

export default function ActiveWorkout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [notes, setNotes] = useState("");
  const [duration, setDuration] = useState(45);
  const [shareToFeed, setShareToFeed] = useState(false);
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !id || id === "active") return;
    void (async () => {
      try {
        const { data, error: loadError } = await supabase
          .from("routines")
          .select("*")
          .eq("id", id)
          .eq("user_id", user.uid)
          .maybeSingle();
        if (loadError) throw loadError;
        if (data) setRoutine(toRoutine(data));
        else setError("This routine was not found.");
      } catch (loadError) {
        setError(friendlyError(loadError, "Unable to load workout."));
      }
    })();
  }, [user, id]);

  const exercises = useMemo(() => {
    if (!routine) return [] as RoutineExercise[];
    const weeks: WorkoutWeek[] = routine.weeks || [{ id: "legacy", name: "Week 1", sessions: [{ id: "legacy-session", name: "Day 1", exercises: routine.exercises || [] }] }];
    return weeks[0]?.sessions[0]?.exercises || [];
  }, [routine]);

  const volume = exercises.reduce((sum, exercise) => sum + exercise.sets.reduce((setSum, set) => setSum + (Number(set.weight) || 0) * (Number(set.reps) || 0), 0), 0);

  const finish = async () => {
    if (!user) return;
    if (exercises.length === 0) {
      setError("Add exercises to a routine before logging a workout.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const { error: saveError } = await supabase.from("workout_logs").insert({
        routine_id: routine?.id || null,
        routine_name: routine?.name || "Quick Workout",
        user_id: user.uid,
        user_name: profile?.username || user.displayName || "Peak Lifter",
        user_photo: profile?.photoURL || user.photoURL || null,
        duration: Math.max(1, Number(duration) || 1),
        volume,
        exercise_count: exercises.length,
        notes: notes.trim(),
        is_private: !shareToFeed,
      });
      if (saveError) throw saveError;
      navigate(shareToFeed ? "/feed" : "/dashboard");
    } catch (saveError) {
      setError(friendlyError(saveError, "Unable to finish workout."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title={routine?.name || "Active Workout"} description="Check off working sets and save the session when complete." action={<Button onClick={finish} disabled={saving || exercises.length === 0}><Save size={18} /> {saving ? "Saving..." : "Finish"}</Button>} />
      {error ? <Notice tone="error" title="Workout issue" body={error} /> : null}
      <Card className="active-summary">
        <Play />
        <div><strong>{exercises.length}</strong><span>Exercises</span></div>
        <div><strong>{Math.round(volume).toLocaleString()}</strong><span>Planned volume</span></div>
        <label><span>Minutes</span><Input aria-label="Workout duration in minutes" type="number" min={1} inputMode="numeric" value={duration} onChange={(event) => setDuration(Number(event.target.value))} /></label>
        <label className="toggle-label">
          <input type="checkbox" checked={shareToFeed} onChange={(event) => setShareToFeed(event.target.checked)} />
          Share to Feed
        </label>
      </Card>
      <div className="list-stack">
        {exercises.map((exercise) => (
          <Card key={exercise.id}>
            <h2>{exercise.name}</h2>
            {exercise.sets.map((set, index) => {
              const key = `${exercise.id}-${set.id}`;
              return (
                <label key={set.id} className={`set-check ${completed[key] ? "done" : ""}`}>
                  <input type="checkbox" checked={Boolean(completed[key])} onChange={(event) => setCompleted((current) => ({ ...current, [key]: event.target.checked }))} />
                  <CheckCircle2 size={18} />
                  <span>Set {index + 1}</span>
                  <strong>{set.weight || "-"} lbs x {set.reps || "-"} reps</strong>
                  {set.rpe ? <small>RPE {set.rpe}</small> : null}
                </label>
              );
            })}
          </Card>
        ))}
        {exercises.length === 0 ? <Card><p className="muted">Open a saved routine from Workouts to start logging.</p></Card> : null}
      </div>
      <Card>
        <h2>Session Notes</h2>
        <Textarea aria-label="Session notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="How did the workout feel?" />
      </Card>
    </>
  );
}
