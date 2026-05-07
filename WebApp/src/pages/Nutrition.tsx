import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button, Card, EmptyState, Input, Notice, PageHeader } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabase";
import type { NutritionEntry } from "../types";
import { friendlyError } from "../utils/errors";
import { toNutritionEntry } from "../utils/supabaseRows";

export default function Nutrition() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<NutritionEntry[]>([]);
  const [form, setForm] = useState({ meal: "", calories: "450", protein: "35", carbs: "40", fat: "12" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return undefined;

    const load = async () => {
      const { data, error: loadError } = await supabase
        .from("nutrition_entries")
        .select("*")
        .eq("user_id", user.uid)
        .order("created_at", { ascending: false });
      if (loadError) throw loadError;
      setError("");
      setEntries((data || []).map(toNutritionEntry));
    };

    void load().catch((listenerError) => setError(friendlyError(listenerError, "Unable to load nutrition entries.")));
    const channel = supabase
      .channel(`nutrition-${user.uid}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "nutrition_entries", filter: `user_id=eq.${user.uid}` }, () => {
        void load().catch((listenerError) => setError(friendlyError(listenerError, "Unable to load nutrition entries.")));
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user]);

  const totals = useMemo(() => entries.reduce((sum, entry) => ({ calories: sum.calories + Number(entry.calories || 0), protein: sum.protein + Number(entry.protein || 0), carbs: sum.carbs + Number(entry.carbs || 0), fat: sum.fat + Number(entry.fat || 0) }), { calories: 0, protein: 0, carbs: 0, fat: 0 }), [entries]);

  const addEntry = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || !form.meal.trim()) return;
    const calories = Math.max(0, Number(form.calories) || 0);
    const protein = Math.max(0, Number(form.protein) || 0);
    const carbs = Math.max(0, Number(form.carbs) || 0);
    const fat = Math.max(0, Number(form.fat) || 0);
    try {
      const { error: addError } = await supabase.from("nutrition_entries").insert({
        user_id: user.uid,
        meal: form.meal.trim(),
        calories,
        protein,
        carbs,
        fat,
      });
      if (addError) throw addError;
      setForm((current) => ({ ...current, meal: "" }));
    } catch (addError) {
      setError(friendlyError(addError, "Unable to add meal."));
    }
  };

  const removeEntry = async (id: string) => {
    if (!user) return;
    try {
      const { error: deleteError } = await supabase.from("nutrition_entries").delete().eq("id", id).eq("user_id", user.uid);
      if (deleteError) throw deleteError;
    } catch (deleteError) {
      setError(friendlyError(deleteError, "Unable to delete meal."));
    }
  };

  return (
    <>
      <PageHeader title="Nutrition" description="Log meals and daily macros." />
      {error ? <Notice tone="error" title="Nutrition issue" body={error} /> : null}
      <div className="stat-grid four">
        <Card><strong>{totals.calories}</strong><span>Calories</span></Card>
        <Card><strong>{totals.protein}g</strong><span>Protein</span></Card>
        <Card><strong>{totals.carbs}g</strong><span>Carbs</span></Card>
        <Card><strong>{totals.fat}g</strong><span>Fat</span></Card>
      </div>
      <Card>
        <form onSubmit={addEntry} className="nutrition-form">
          <Input aria-label="Meal" placeholder="Meal" value={form.meal} onChange={(event) => setForm({ ...form, meal: event.target.value })} required />
          <Input aria-label="Calories" type="number" min={0} inputMode="numeric" placeholder="Calories" value={form.calories} onChange={(event) => setForm({ ...form, calories: event.target.value })} />
          <Input aria-label="Protein grams" type="number" min={0} inputMode="numeric" placeholder="Protein" value={form.protein} onChange={(event) => setForm({ ...form, protein: event.target.value })} />
          <Input aria-label="Carbohydrate grams" type="number" min={0} inputMode="numeric" placeholder="Carbs" value={form.carbs} onChange={(event) => setForm({ ...form, carbs: event.target.value })} />
          <Input aria-label="Fat grams" type="number" min={0} inputMode="numeric" placeholder="Fat" value={form.fat} onChange={(event) => setForm({ ...form, fat: event.target.value })} />
          <Button type="submit"><Plus size={17} /> Add</Button>
        </form>
      </Card>
      <div className="list-stack">
        {entries.map((entry) => (
          <Card key={entry.id} className="list-row">
            <div><strong>{entry.meal}</strong><small>{entry.calories} cal • P {entry.protein}g • C {entry.carbs}g • F {entry.fat}g</small></div>
            <Button variant="danger" aria-label={`Delete ${entry.meal}`} onClick={() => removeEntry(entry.id)}><Trash2 size={17} /></Button>
          </Card>
        ))}
        {entries.length === 0 ? <EmptyState title="No meals yet" body="Meals you log today will appear here with calorie and macro totals." /> : null}
      </div>
    </>
  );
}
