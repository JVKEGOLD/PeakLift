import type { ExerciseDefinition } from "../types";

export const defaultExercises: ExerciseDefinition[] = [
  { id: "bench-press", name: "Bench Press", muscle: "Chest", equipment: "Barbell", videoUrl: "https://www.youtube.com/embed/SCVCLChPQFY" },
  { id: "incline-dumbbell-press", name: "Incline Dumbbell Press", muscle: "Chest", equipment: "Dumbbells", videoUrl: "https://www.youtube.com/embed/op9kVnSso6Q" },
  { id: "squat", name: "Back Squat", muscle: "Legs", equipment: "Barbell", videoUrl: "https://www.youtube.com/embed/QmZAiBqPvZw" },
  { id: "deadlift", name: "Deadlift", muscle: "Posterior Chain", equipment: "Barbell", videoUrl: "https://www.youtube.com/embed/xe19t2_6yis" },
  { id: "romanian-deadlift", name: "Romanian Deadlift", muscle: "Hamstrings", equipment: "Barbell", videoUrl: "https://www.youtube.com/embed/lzRo-4pq_AY" },
  { id: "lat-pulldown", name: "Lat Pulldown", muscle: "Back", equipment: "Cable", videoUrl: "https://www.youtube.com/embed/YArZi7mOKTs" },
  { id: "seated-row", name: "Seated Cable Row", muscle: "Back", equipment: "Cable", videoUrl: "https://www.youtube.com/embed/_Y0ExjMcT6Q" },
  { id: "shoulder-press", name: "Shoulder Press", muscle: "Shoulders", equipment: "Dumbbells", videoUrl: "https://www.youtube.com/embed/GZbfZ033f74" },
  { id: "lateral-raise", name: "Lateral Raise", muscle: "Shoulders", equipment: "Dumbbells", videoUrl: "https://www.youtube.com/embed/4p_m96HXMLk" },
  { id: "barbell-curl", name: "Barbell Curl", muscle: "Biceps", equipment: "Barbell", videoUrl: "https://www.youtube.com/embed/Zp26q4BY5CE" },
  { id: "triceps-pushdown", name: "Triceps Pushdown", muscle: "Triceps", equipment: "Cable", videoUrl: "https://www.youtube.com/embed/IODxDxX7oi4" },
  { id: "leg-press", name: "Leg Press", muscle: "Legs", equipment: "Machine", videoUrl: "https://www.youtube.com/embed/2-LAMcpzODU" },
  { id: "leg-curl", name: "Leg Curl", muscle: "Hamstrings", equipment: "Machine", videoUrl: "https://www.youtube.com/embed/kwG2ipFRgfo" },
  { id: "calf-raise", name: "Standing Calf Raise", muscle: "Calves", equipment: "Machine", videoUrl: "https://www.youtube.com/embed/ASdvN_XEl_c" },
  { id: "plank", name: "Plank", muscle: "Core", equipment: "Bodyweight", videoUrl: "https://www.youtube.com/embed/t7VDDNKBNx8" },
];

export const createId = () => {
  if ("crypto" in window && "randomUUID" in window.crypto) {
    return window.crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const emptyRoutineWeeks = () => {
  const weekId = createId();
  const sessionId = createId();
  return [
    {
      id: weekId,
      name: "Week 1",
      sessions: [{ id: sessionId, name: "Day 1", exercises: [] }],
    },
  ];
};
