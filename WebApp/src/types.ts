export type ExerciseDefinition = {
  id: string;
  name: string;
  muscle: string;
  equipment?: string;
  videoUrl?: string;
};

export type WorkoutSet = {
  id: string;
  reps: string;
  weight: string;
  rpe?: string;
  restTimeSeconds?: number;
  notes?: string;
};

export type RoutineExercise = {
  id: string;
  exerciseId?: string;
  name: string;
  sets: WorkoutSet[];
};

export type WorkoutSession = {
  id: string;
  name: string;
  exercises: RoutineExercise[];
};

export type WorkoutWeek = {
  id: string;
  name: string;
  sessions: WorkoutSession[];
};

export type Routine = {
  id: string;
  name: string;
  weeks?: WorkoutWeek[];
  exercises?: RoutineExercise[];
  itemCount?: number;
  isPublic?: boolean;
  authorId?: string;
  authorName?: string;
  authorPhoto?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

export type Profile = {
  id?: string;
  name?: string;
  username?: string;
  displayName?: string;
  photoURL?: string;
  bio?: string;
  goal?: string;
  trainingGoal?: string;
  experienceLevel?: "beginner" | "intermediate" | "advanced" | "coach";
  privacyStatus?: "public" | "friends_only" | "private";
  following?: string[];
  followers?: string[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

export type WorkoutLog = {
  id: string;
  workoutId?: string;
  routineId?: string;
  routineName?: string;
  programId?: string;
  userId: string;
  userName: string;
  userPhoto?: string | null;
  duration?: number;
  volume?: number;
  exerciseCount?: number;
  notes?: string;
  isPrivate?: boolean;
  dateCompleted?: string | Date;
  perceivedDifficulty?: number;
  likes?: string[];
  createdAt?: string | Date;
};

export type NutritionEntry = {
  id: string;
  meal: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  createdAt?: string | Date;
};

export type Visibility = "private" | "friends_only" | "public";

export type TrainingExercise = {
  id: string;
  name: string;
  category: string;
  muscleGroup: string;
  equipment?: string | null;
  isCustom: boolean;
  createdByUserId?: string | null;
};

export type WorkoutTemplate = {
  id: string;
  userId: string;
  title: string;
  description: string;
  visibility: Visibility;
  sourceWorkoutId?: string | null;
  originalCreatorUserId?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

export type WorkoutTemplateExercise = {
  id: string;
  workoutId: string;
  exerciseId: string;
  exerciseOrder: number;
  sets: number;
  reps: string;
  targetWeight?: number | null;
  targetRpe?: number | null;
  restTimeSeconds?: number | null;
  notes?: string;
};

export type Program = {
  id: string;
  userId: string;
  title: string;
  description: string;
  goal: string;
  durationWeeks: number;
  visibility: Visibility;
  sourceProgramId?: string | null;
  originalCreatorUserId?: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

export type ProgramDay = {
  id: string;
  programId: string;
  weekNumber: number;
  dayNumber: number;
  workoutId?: string | null;
  isRestDay: boolean;
  notes?: string;
};

export type ActiveProgram = {
  userId: string;
  programId: string;
  startedAt: string;
};

export type SetLog = {
  id: string;
  workoutLogId: string;
  exerciseId: string;
  setNumber: number;
  reps: number;
  weight: number;
  rpe?: number | null;
  isWarmup: boolean;
  notes?: string;
};

export type PersonalRecordType = "heaviest_weight" | "estimated_1rm" | "best_volume_set";

export type PersonalRecord = {
  id: string;
  userId: string;
  exerciseId: string;
  prType: PersonalRecordType;
  value: number;
  weight: number;
  reps: number;
  estimated1RM: number;
  workoutLogId?: string | null;
  achievedAt: string | Date;
};

export type Follow = {
  id: string;
  followerUserId: string;
  followingUserId: string;
  status: "pending" | "accepted" | "blocked";
  createdAt?: string | Date;
};

export type SharedContent = {
  id: string;
  senderUserId: string;
  recipientUserId?: string | null;
  contentType: "workout" | "program";
  contentId: string;
  shareToken: string;
  shareStatus: "pending" | "accepted" | "declined" | "revoked";
  createdAt?: string | Date;
  updatedAt?: string | Date;
};
