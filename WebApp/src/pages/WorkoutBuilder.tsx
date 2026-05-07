import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, GripVertical, Plus, Save, Search, Trash2 } from "lucide-react";
import { Button, Card, Input, Notice, PageHeader } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { createId, defaultExercises, emptyRoutineWeeks } from "../data/exercises";
import { supabase } from "../supabase";
import type { ExerciseDefinition, Routine, RoutineExercise, WorkoutSet, WorkoutWeek } from "../types";
import { friendlyError } from "../utils/errors";
import { toRoutine } from "../utils/supabaseRows";

export default function WorkoutBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [name, setName] = useState("My Routine");
  const [isPublic, setIsPublic] = useState(false);
  const [weeks, setWeeks] = useState<WorkoutWeek[]>(emptyRoutineWeeks());
  const [activeWeekId, setActiveWeekId] = useState("");
  const [activeSessionId, setActiveSessionId] = useState("");
  const [customExercises, setCustomExercises] = useState<ExerciseDefinition[]>([]);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !id) return;
    void (async () => {
      try {
        const [routineResult, customResult] = await Promise.all([
          supabase.from("routines").select("*").eq("id", id).eq("user_id", user.uid).maybeSingle(),
          supabase.from("custom_exercises").select("*").eq("user_id", user.uid).order("name", { ascending: true }),
        ]);
        if (routineResult.error) throw routineResult.error;
        if (customResult.error) throw customResult.error;

        if (routineResult.data) {
          const routine = toRoutine(routineResult.data) as Routine;
          const nextWeeks = routine.weeks || (routine.exercises ? [{ id: createId(), name: "Week 1", sessions: [{ id: createId(), name: "Day 1", exercises: routine.exercises }] }] : emptyRoutineWeeks());
          setName(routine.name || "My Routine");
          setIsPublic(Boolean(routine.isPublic));
          setWeeks(nextWeeks);
          setActiveWeekId(nextWeeks[0]?.id || "");
          setActiveSessionId(nextWeeks[0]?.sessions[0]?.id || "");
        }

        setCustomExercises((customResult.data || []).map((entry) => ({
          id: entry.id,
          name: entry.name,
          muscle: entry.muscle,
          equipment: entry.equipment,
          videoUrl: entry.video_url,
        })));
      } catch (loadError) {
        setError(friendlyError(loadError, "Unable to load this routine."));
      }
    })();
  }, [user, id]);

  const activeWeek = weeks.find((week) => week.id === activeWeekId) || weeks[0];
  const activeSession = activeWeek?.sessions.find((session) => session.id === activeSessionId) || activeWeek?.sessions[0];
  const exercises = useMemo(() => [...defaultExercises, ...customExercises].filter((exercise) => `${exercise.name} ${exercise.muscle} ${exercise.equipment || ""}`.toLowerCase().includes(query.toLowerCase())), [customExercises, query]);

  const updateExercise = (exerciseId: string, updater: (exercise: RoutineExercise) => RoutineExercise) => {
    setWeeks((current) => current.map((week) => week.id === activeWeek?.id ? { ...week, sessions: week.sessions.map((session) => session.id === activeSession?.id ? { ...session, exercises: session.exercises.map((exercise) => exercise.id === exerciseId ? updater(exercise) : exercise) } : session) } : week));
  };

  const addExercise = (exercise: ExerciseDefinition) => {
    const entry: RoutineExercise = {
      id: createId(),
      exerciseId: exercise.id,
      name: exercise.name,
      sets: [1, 2, 3].map(() => ({ id: createId(), reps: "10", weight: "", rpe: "" })),
    };
    setWeeks((current) => current.map((week) => week.id === activeWeek?.id ? { ...week, sessions: week.sessions.map((session) => session.id === activeSession?.id ? { ...session, exercises: [...session.exercises, entry] } : session) } : week));
  };

  const addWeek = () => {
    const weekId = createId();
    const sessionId = createId();
    setWeeks((current) => [...current, { id: weekId, name: `Week ${current.length + 1}`, sessions: [{ id: sessionId, name: "Day 1", exercises: [] }] }]);
    setActiveWeekId(weekId);
    setActiveSessionId(sessionId);
  };

  const addSession = () => {
    if (!activeWeek) return;
    const sessionId = createId();
    setWeeks((current) => current.map((week) => week.id === activeWeek.id ? { ...week, sessions: [...week.sessions, { id: sessionId, name: `Day ${week.sessions.length + 1}`, exercises: [] }] } : week));
    setActiveSessionId(sessionId);
  };

  const updateSet = (exerciseId: string, setId: string, field: keyof WorkoutSet, value: string) => {
    updateExercise(exerciseId, (exercise) => ({ ...exercise, sets: exercise.sets.map((set) => set.id === setId ? { ...set, [field]: value } : set) }));
  };

  const save = async () => {
    if (!user || !id) return;
    if (!name.trim()) {
      setError("Routine name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const itemCount = weeks.reduce((sum, week) => sum + week.sessions.reduce((sessionSum, session) => sessionSum + session.exercises.length, 0), 0);
      const payload = {
        id,
        user_id: user.uid,
        name: name.trim(),
        weeks,
        item_count: itemCount,
        is_public: isPublic,
        author_name: profile?.username || user.displayName || "Unknown Lifter",
        author_photo: profile?.photoURL || user.photoURL || null,
      };
      const { error: saveError } = await supabase.from("routines").upsert(payload);
      if (saveError) throw saveError;
      navigate("/workouts");
    } catch (saveError) {
      setError(friendlyError(saveError, "Unable to save routine."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="Workout Builder" description="Build weeks, sessions, exercises, target reps, weight, and RPE." action={<Button onClick={save} disabled={saving}><Save size={18} /> {saving ? "Saving..." : "Save"}</Button>} />
      {error ? <Notice tone="error" title="Routine builder issue" body={error} /> : null}
      <Card className="builder-topbar">
        <Button variant="ghost" aria-label="Back to workouts" onClick={() => navigate("/workouts")}><ArrowLeft size={18} /></Button>
        <Input aria-label="Routine name" value={name} onChange={(event) => setName(event.target.value)} />
        <label className="toggle-label"><input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} /> Publish to Community</label>
      </Card>
      <div className="builder-layout">
        <Card>
          <div className="pill-row">
            {weeks.map((week) => <Button key={week.id} variant={activeWeek?.id === week.id ? "primary" : "secondary"} onClick={() => { setActiveWeekId(week.id); setActiveSessionId(week.sessions[0]?.id || ""); }}>{week.name}</Button>)}
            <Button variant="ghost" onClick={addWeek}><Plus size={16} /> Week</Button>
          </div>
          <div className="pill-row">
            {activeWeek?.sessions.map((session) => <Button key={session.id} variant={activeSession?.id === session.id ? "primary" : "ghost"} onClick={() => setActiveSessionId(session.id)}>{session.name}</Button>)}
            <Button variant="ghost" onClick={addSession}><Plus size={16} /> Session</Button>
          </div>
          <div className="builder-exercises">
            {activeSession?.exercises.map((exercise, index) => (
              <Card key={exercise.id} className="exercise-builder-card">
                <div className="exercise-card-header">
                  <GripVertical size={18} />
                  <strong>{index + 1}. {exercise.name}</strong>
                  <Button variant="danger" aria-label={`Remove ${exercise.name}`} onClick={() => setWeeks((current) => current.map((week) => week.id === activeWeek?.id ? { ...week, sessions: week.sessions.map((session) => session.id === activeSession?.id ? { ...session, exercises: session.exercises.filter((item) => item.id !== exercise.id) } : session) } : week))}><Trash2 size={16} /></Button>
                </div>
                <div className="set-grid set-grid-head"><span>Set</span><span>lbs</span><span>Reps</span><span>RPE</span><span /></div>
                {exercise.sets.map((set, setIndex) => (
                  <div className="set-grid" key={set.id}>
                    <span>{setIndex + 1}</span>
                    <Input aria-label={`${exercise.name} set ${setIndex + 1} weight`} type="number" min={0} inputMode="decimal" value={set.weight} onChange={(event) => updateSet(exercise.id, set.id, "weight", event.target.value)} />
                    <Input aria-label={`${exercise.name} set ${setIndex + 1} reps`} type="number" min={0} inputMode="numeric" value={set.reps} onChange={(event) => updateSet(exercise.id, set.id, "reps", event.target.value)} />
                    <Input aria-label={`${exercise.name} set ${setIndex + 1} RPE`} type="number" min={0} max={10} step={0.5} inputMode="decimal" value={set.rpe || ""} onChange={(event) => updateSet(exercise.id, set.id, "rpe", event.target.value)} />
                    <Button variant="ghost" aria-label={`Remove set ${setIndex + 1}`} onClick={() => updateExercise(exercise.id, (item) => ({ ...item, sets: item.sets.filter((row) => row.id !== set.id) }))}><Trash2 size={14} /></Button>
                  </div>
                ))}
                <Button variant="ghost" onClick={() => updateExercise(exercise.id, (item) => {
                  const previous = item.sets[item.sets.length - 1];
                  return { ...item, sets: [...item.sets, { id: createId(), reps: previous?.reps || "", weight: previous?.weight || "", rpe: "" }] };
                })}><Plus size={16} /> Add Set</Button>
              </Card>
            ))}
            {activeSession?.exercises.length === 0 ? <p className="muted">No exercises yet. Add from the library.</p> : null}
          </div>
        </Card>
        <Card className="exercise-library">
          <h2>Add Exercise</h2>
          <div className="search-wrap"><Search size={17} /><Input aria-label="Search exercises" placeholder="Search exercises..." value={query} onChange={(event) => setQuery(event.target.value)} /></div>
          <div className="list-stack">
            {exercises.map((exercise) => (
              <div key={exercise.id} className="list-row">
                <div><strong>{exercise.name}</strong><small>{exercise.muscle} {exercise.equipment ? `• ${exercise.equipment}` : ""}</small></div>
                <Button onClick={() => addExercise(exercise)}>Add</Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}
