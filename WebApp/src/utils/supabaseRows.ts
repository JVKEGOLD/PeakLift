import type {
  ActiveProgram,
  Follow,
  NutritionEntry,
  PersonalRecord,
  Profile,
  Program,
  ProgramDay,
  Routine,
  SetLog,
  SharedContent,
  TrainingExercise,
  WorkoutLog,
  WorkoutTemplate,
  WorkoutTemplateExercise,
} from "../types";

type Row = Record<string, any>;

export type AppComment = { id: string; userId: string; userName: string; text: string };

export const toProfile = (row: Row | null): Profile | null => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    displayName: row.display_name,
    photoURL: row.photo_url,
    bio: row.bio,
    goal: row.goal || row.training_goal,
    trainingGoal: row.training_goal || row.goal,
    experienceLevel: row.experience_level,
    privacyStatus: row.privacy_status,
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
  workoutId: row.workout_id,
  routineId: row.routine_id,
  routineName: row.routine_name,
  programId: row.program_id,
  userId: row.user_id,
  userName: row.user_name,
  userPhoto: row.user_photo,
  duration: row.duration,
  volume: Number(row.volume || 0),
  exerciseCount: row.exercise_count,
  notes: row.notes,
  isPrivate: row.is_private,
  dateCompleted: row.date_completed,
  perceivedDifficulty: row.perceived_difficulty,
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

export const toTrainingExercise = (row: Row): TrainingExercise => ({
  id: row.id,
  name: row.name,
  category: row.category,
  muscleGroup: row.muscle_group,
  equipment: row.equipment,
  isCustom: row.is_custom,
  createdByUserId: row.created_by_user_id,
});

export const toWorkoutTemplate = (row: Row): WorkoutTemplate => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  description: row.description,
  visibility: row.visibility,
  sourceWorkoutId: row.source_workout_id,
  originalCreatorUserId: row.original_creator_user_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const toWorkoutTemplateExercise = (row: Row): WorkoutTemplateExercise => ({
  id: row.id,
  workoutId: row.workout_id,
  exerciseId: row.exercise_id,
  exerciseOrder: row.exercise_order,
  sets: row.sets,
  reps: row.reps,
  targetWeight: row.target_weight === null || row.target_weight === undefined ? null : Number(row.target_weight),
  targetRpe: row.target_rpe === null || row.target_rpe === undefined ? null : Number(row.target_rpe),
  restTimeSeconds: row.rest_time_seconds,
  notes: row.notes,
});

export const toProgram = (row: Row): Program => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  description: row.description,
  goal: row.goal,
  durationWeeks: row.duration_weeks,
  visibility: row.visibility,
  sourceProgramId: row.source_program_id,
  originalCreatorUserId: row.original_creator_user_id,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const toProgramDay = (row: Row): ProgramDay => ({
  id: row.id,
  programId: row.program_id,
  weekNumber: row.week_number,
  dayNumber: row.day_number,
  workoutId: row.workout_id,
  isRestDay: row.is_rest_day,
  notes: row.notes,
});

export const toActiveProgram = (row: Row): ActiveProgram => ({
  userId: row.user_id,
  programId: row.program_id,
  startedAt: row.started_at,
});

export const toSetLog = (row: Row): SetLog => ({
  id: row.id,
  workoutLogId: row.workout_log_id,
  exerciseId: row.exercise_id,
  setNumber: row.set_number,
  reps: row.reps,
  weight: Number(row.weight || 0),
  rpe: row.rpe === null || row.rpe === undefined ? null : Number(row.rpe),
  isWarmup: row.is_warmup,
  notes: row.notes,
});

export const toPersonalRecord = (row: Row): PersonalRecord => ({
  id: row.id,
  userId: row.user_id,
  exerciseId: row.exercise_id,
  prType: row.pr_type,
  value: Number(row.value || 0),
  weight: Number(row.weight || 0),
  reps: row.reps,
  estimated1RM: Number(row.estimated_1rm || 0),
  workoutLogId: row.workout_log_id,
  achievedAt: row.achieved_at,
});

export const toFollow = (row: Row): Follow => ({
  id: row.id,
  followerUserId: row.follower_user_id,
  followingUserId: row.following_user_id,
  status: row.status,
  createdAt: row.created_at,
});

export const toSharedContent = (row: Row): SharedContent => ({
  id: row.id,
  senderUserId: row.sender_user_id,
  recipientUserId: row.recipient_user_id,
  contentType: row.content_type,
  contentId: row.content_id,
  shareToken: row.share_token,
  shareStatus: row.share_status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});
