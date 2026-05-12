import { supabase } from "../supabase";
import type {
  PersonalRecord,
  Program,
  ProgramDay,
  SetLog,
  SharedContent,
  TrainingExercise,
  Visibility,
  WorkoutTemplate,
  WorkoutTemplateExercise,
} from "../types";
import {
  toPersonalRecord,
  toProgram,
  toProgramDay,
  toSetLog,
  toSharedContent,
  toTrainingExercise,
  toWorkoutTemplate,
  toWorkoutTemplateExercise,
} from "../utils/supabaseRows";

type WorkoutExerciseInput = {
  exerciseId: string;
  exerciseOrder: number;
  sets: number;
  reps: string;
  targetWeight?: number | null;
  targetRpe?: number | null;
  restTimeSeconds?: number | null;
  notes?: string;
};

type ProgramDayInput = {
  weekNumber: number;
  dayNumber: number;
  workoutId?: string | null;
  isRestDay?: boolean;
  notes?: string;
};

export async function listExerciseLibrary(): Promise<TrainingExercise[]> {
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .order("is_custom", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return (data || []).map(toTrainingExercise);
}

export async function createCustomExercise(input: {
  userId: string;
  name: string;
  category?: string;
  muscleGroup: string;
  equipment?: string;
}): Promise<TrainingExercise> {
  const id = `custom-${input.userId}-${input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
  const { data, error } = await supabase
    .from("exercises")
    .insert({
      id,
      name: input.name,
      category: input.category || "strength",
      muscle_group: input.muscleGroup,
      equipment: input.equipment || null,
      is_custom: true,
      created_by_user_id: input.userId,
    })
    .select("*")
    .single();
  if (error) throw error;
  return toTrainingExercise(data);
}

export async function createWorkoutTemplate(input: {
  userId: string;
  title: string;
  description?: string;
  visibility?: Visibility;
  exercises?: WorkoutExerciseInput[];
}): Promise<{ workout: WorkoutTemplate; exercises: WorkoutTemplateExercise[] }> {
  const { data: workoutRow, error: workoutError } = await supabase
    .from("workouts")
    .insert({
      user_id: input.userId,
      title: input.title,
      description: input.description || "",
      visibility: input.visibility || "private",
    })
    .select("*")
    .single();
  if (workoutError) throw workoutError;

  const exercises = input.exercises || [];
  if (exercises.length === 0) {
    return { workout: toWorkoutTemplate(workoutRow), exercises: [] };
  }

  const { data: exerciseRows, error: exerciseError } = await supabase
    .from("workout_exercises")
    .insert(exercises.map((exercise) => ({
      workout_id: workoutRow.id,
      exercise_id: exercise.exerciseId,
      exercise_order: exercise.exerciseOrder,
      sets: exercise.sets,
      reps: exercise.reps,
      target_weight: exercise.targetWeight ?? null,
      target_rpe: exercise.targetRpe ?? null,
      rest_time_seconds: exercise.restTimeSeconds ?? null,
      notes: exercise.notes || "",
    })))
    .select("*");
  if (exerciseError) throw exerciseError;

  return {
    workout: toWorkoutTemplate(workoutRow),
    exercises: (exerciseRows || []).map(toWorkoutTemplateExercise),
  };
}

export async function listUserWorkoutTemplates(userId: string): Promise<WorkoutTemplate[]> {
  const { data, error } = await supabase
    .from("workouts")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(toWorkoutTemplate);
}

export async function createProgram(input: {
  userId: string;
  title: string;
  description?: string;
  goal?: string;
  durationWeeks: number;
  visibility?: Visibility;
  days?: ProgramDayInput[];
}): Promise<{ program: Program; days: ProgramDay[] }> {
  const { data: programRow, error: programError } = await supabase
    .from("programs")
    .insert({
      user_id: input.userId,
      title: input.title,
      description: input.description || "",
      goal: input.goal || "",
      duration_weeks: input.durationWeeks,
      visibility: input.visibility || "private",
    })
    .select("*")
    .single();
  if (programError) throw programError;

  const days = input.days || [];
  if (days.length === 0) {
    return { program: toProgram(programRow), days: [] };
  }

  const { data: dayRows, error: dayError } = await supabase
    .from("program_days")
    .insert(days.map((day) => ({
      program_id: programRow.id,
      week_number: day.weekNumber,
      day_number: day.dayNumber,
      workout_id: day.workoutId || null,
      is_rest_day: Boolean(day.isRestDay),
      notes: day.notes || "",
    })))
    .select("*")
    .order("week_number", { ascending: true })
    .order("day_number", { ascending: true });
  if (dayError) throw dayError;

  return {
    program: toProgram(programRow),
    days: (dayRows || []).map(toProgramDay),
  };
}

export async function activateProgram(userId: string, programId: string, startedAt = new Date().toISOString().slice(0, 10)) {
  const { error } = await supabase.from("active_programs").upsert({
    user_id: userId,
    program_id: programId,
    started_at: startedAt,
  });
  if (error) throw error;
}

export async function listPersonalRecords(userId: string): Promise<PersonalRecord[]> {
  const { data, error } = await supabase
    .from("personal_records")
    .select("*")
    .eq("user_id", userId)
    .order("achieved_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(toPersonalRecord);
}

export async function listWorkoutSetLogs(workoutLogId: string): Promise<SetLog[]> {
  const { data, error } = await supabase
    .from("set_logs")
    .select("*")
    .eq("workout_log_id", workoutLogId)
    .order("set_number", { ascending: true });
  if (error) throw error;
  return (data || []).map(toSetLog);
}

export async function followUser(followerUserId: string, followingUserId: string) {
  const { error } = await supabase.from("follows").upsert({
    follower_user_id: followerUserId,
    following_user_id: followingUserId,
    status: "accepted",
  });
  if (error) throw error;
}

export async function shareContent(input: {
  senderUserId: string;
  recipientUserId?: string | null;
  contentType: "workout" | "program";
  contentId: string;
}): Promise<SharedContent> {
  const { data, error } = await supabase
    .from("shared_content")
    .insert({
      sender_user_id: input.senderUserId,
      recipient_user_id: input.recipientUserId || null,
      content_type: input.contentType,
      content_id: input.contentId,
    })
    .select("*")
    .single();
  if (error) throw error;
  return toSharedContent(data);
}
