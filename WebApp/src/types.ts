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
  username?: string;
  displayName?: string;
  photoURL?: string;
  bio?: string;
  goal?: string;
  following?: string[];
  followers?: string[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

export type WorkoutLog = {
  id: string;
  routineId?: string;
  routineName?: string;
  userId: string;
  userName: string;
  userPhoto?: string | null;
  duration?: number;
  volume?: number;
  exerciseCount?: number;
  notes?: string;
  isPrivate?: boolean;
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
