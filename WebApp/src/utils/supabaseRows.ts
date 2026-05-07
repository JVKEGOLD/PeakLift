import type { NutritionEntry, Profile, Routine, WorkoutLog } from "../types";

type Row = Record<string, any>;

export type AppComment = { id: string; userId: string; userName: string; text: string };

export const toProfile = (row: Row | null): Profile | null => {
  if (!row) return null;
  return {
    username: row.username,
    displayName: row.display_name,
    photoURL: row.photo_url,
    bio: row.bio,
    goal: row.goal,
    following: row.following || [],
    followers: row.followers || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const toRoutine = (row: Row): Routine => ({
  id: row.id,
  name: row.name,
  weeks: row.weeks || [],
  itemCount: row.item_count || 0,
  isPublic: row.is_public,
  authorId: row.user_id,
  authorName: row.author_name,
  authorPhoto: row.author_photo,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const toWorkoutLog = (row: Row): WorkoutLog => ({
  id: row.id,
  routineId: row.routine_id,
  routineName: row.routine_name,
  userId: row.user_id,
  userName: row.user_name,
  userPhoto: row.user_photo,
  duration: row.duration,
  volume: Number(row.volume || 0),
  exerciseCount: row.exercise_count,
  notes: row.notes,
  isPrivate: row.is_private,
  likes: (row.workout_likes || []).map((like: Row) => like.user_id),
  createdAt: row.created_at,
});

export const toNutritionEntry = (row: Row): NutritionEntry => ({
  id: row.id,
  meal: row.meal,
  calories: row.calories,
  protein: row.protein,
  carbs: row.carbs,
  fat: row.fat,
  createdAt: row.created_at,
});

export const toComment = (row: Row): AppComment => ({
  id: row.id,
  userId: row.user_id,
  userName: row.user_name,
  text: row.text,
});
