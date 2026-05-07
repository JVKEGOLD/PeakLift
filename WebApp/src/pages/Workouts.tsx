import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Pencil, Play, Plus, Trash2 } from "lucide-react";
import { Button, Card, EmptyState, Notice, PageHeader } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { emptyRoutineWeeks } from "../data/exercises";
import { supabase } from "../supabase";
import type { Routine } from "../types";
import { friendlyError } from "../utils/errors";
import { toRoutine } from "../utils/supabaseRows";

export default function Workouts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return undefined;

    const load = async () => {
      const { data, error: loadError } = await supabase
        .from("routines")
        .select("*")
        .eq("user_id", user.uid)
        .order("updated_at", { ascending: false });
      if (loadError) throw loadError;
      setError("");
      setRoutines((data || []).map(toRoutine));
    };

    void load().catch((listenerError) => setError(friendlyError(listenerError, "Unable to load routines.")));
    const channel = supabase
      .channel(`routines-${user.uid}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "routines", filter: `user_id=eq.${user.uid}` }, () => {
        void load().catch((listenerError) => setError(friendlyError(listenerError, "Unable to load routines.")));
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user]);

  const createRoutine = async () => {
    if (!user) return;
    setBusy(true);
    setError("");
    try {
      const { data, error: createError } = await supabase
        .from("routines")
        .insert({
          user_id: user.uid,
          name: "My Routine",
          weeks: emptyRoutineWeeks(),
          item_count: 0,
          is_public: false,
        })
        .select("id")
        .single();
      if (createError) throw createError;
      navigate(`/workout/build/${data.id}`);
    } catch (createError) {
      setError(friendlyError(createError, "Unable to create routine."));
    } finally {
      setBusy(false);
    }
  };

  const removeRoutine = async (id: string) => {
    if (!user || !window.confirm("Delete this routine?")) return;
    setError("");
    try {
      const { error: deleteError } = await supabase.from("routines").delete().eq("id", id).eq("user_id", user.uid);
      if (deleteError) throw deleteError;
    } catch (deleteError) {
      setError(friendlyError(deleteError, "Unable to delete routine."));
    }
  };

  return (
    <>
      <PageHeader title="Workouts" description="Create routines, edit weeks and sessions, or start a workout." action={<Button onClick={createRoutine} disabled={busy}><Plus size={18} /> {busy ? "Creating..." : "Create"}</Button>} />
      {error ? <Notice tone="error" title="Workout library issue" body={error} /> : null}
      {routines.length === 0 ? (
        <EmptyState title="No routines yet" body="Build your first workout routine and add exercises, sets, reps, weight, and RPE." action={<Button onClick={createRoutine}>Create Routine</Button>} />
      ) : (
        <div className="card-grid">
          {routines.map((routine) => (
            <Card key={routine.id} className="routine-card">
              <div>
                <h2>{routine.name}</h2>
                <p>{routine.itemCount || 0} exercises • {routine.isPublic ? "Published" : "Private"}</p>
              </div>
              <div className="button-row">
                <Link to={`/workout/${routine.id}`}><Button variant="secondary"><Play size={17} /> Start</Button></Link>
                <Link to={`/workout/build/${routine.id}`}><Button variant="ghost" aria-label={`Edit ${routine.name}`}><Pencil size={17} /></Button></Link>
                <Button variant="danger" aria-label={`Delete ${routine.name}`} onClick={() => removeRoutine(routine.id)}><Trash2 size={17} /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
