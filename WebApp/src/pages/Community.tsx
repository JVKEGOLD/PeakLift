import { useEffect, useState } from "react";
import { Copy, Users } from "lucide-react";
import { Button, Card, EmptyState, Notice, PageHeader } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabase";
import type { Routine } from "../types";
import { friendlyError } from "../utils/errors";
import { toRoutine } from "../utils/supabaseRows";

export default function Community() {
  const { user } = useAuth();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("routines")
        .select("*")
        .eq("is_public", true)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      setMessage("");
      setRoutines((data || []).map(toRoutine));
    };

    void load().catch((listenerError) => setMessage(friendlyError(listenerError, "Unable to load community routines.")));
    const channel = supabase
      .channel("community-routines")
      .on("postgres_changes", { event: "*", schema: "public", table: "routines" }, () => {
        void load().catch((listenerError) => setMessage(friendlyError(listenerError, "Unable to load community routines.")));
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const cloneRoutine = async (routine: Routine) => {
    if (!user) return;
    try {
      const { error } = await supabase.from("routines").insert({
        user_id: user.uid,
        name: `${routine.name} Copy`,
        weeks: routine.weeks || [],
        item_count: routine.itemCount || 0,
        is_public: false,
        source_routine_id: routine.id,
      });
      if (error) throw error;
      setMessage("Routine saved to your workouts.");
    } catch (cloneError) {
      setMessage(friendlyError(cloneError, "Unable to save routine."));
    }
  };

  const reportRoutine = async (routine: Routine) => {
    if (!user || !window.confirm("Report this routine for review?")) return;
    try {
      const { error } = await supabase.from("reports").insert({
        type: "routine",
        target_id: routine.id,
        target_owner_id: routine.authorId || null,
        reporter_id: user.uid,
      });
      if (error) throw error;
      setMessage("Report submitted for review.");
    } catch (reportError) {
      setMessage(friendlyError(reportError, "Unable to report routine."));
    }
  };

  return (
    <>
      <PageHeader title="Community" description="Discover public routines published by other lifters." />
      {message ? <Notice tone={message.includes("Unable") ? "error" : "success"} title={message.includes("Unable") ? "Community issue" : "Done"} body={message} /> : null}
      {routines.length === 0 ? (
        <EmptyState title="No public routines yet" body="Publish one of your routines to make it appear here." />
      ) : (
        <div className="card-grid">
          {routines.map((routine) => (
            <Card key={routine.id}>
              <Users />
              <h2>{routine.name}</h2>
              <p>By {routine.authorName || "Unknown Lifter"} • {routine.itemCount || 0} exercises</p>
              <div className="button-row">
                <Button onClick={() => cloneRoutine(routine)}><Copy size={17} /> Save Copy</Button>
                <Button variant="ghost" onClick={() => reportRoutine(routine)}>Report</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
