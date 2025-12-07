-- 1. USERS
-- Stores the account and their reusable assets (Styles/Templates)
CREATE TABLE public.users (
  google_id TEXT PRIMARY KEY, -- The ID from Google Auth
  email TEXT NOT NULL,
  username TEXT,
  
  -- The Registries: Stored as JSON maps (Key -> Definition)
  -- Matches: StyleRegistry and TemplateRegistry
  styles JSONB DEFAULT '{}'::jsonb, 
  templates JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. GROUPS
-- Reusable lists of invited users and settings.
-- Matches: GroupRegistry (via user_id lookup)
CREATE TABLE public.groups (
  creator_id TEXT REFERENCES public.users(google_id) ON DELETE CASCADE,
  id TEXT NOT NULL, -- Human Readable (e.g. "class-a")
  
  name TEXT NOT NULL,

  -- List of objects: [{email: "...", permission: "Player"}]
  emails JSONB DEFAULT '[]'::jsonb, 

  -- Object: { acceptSubmissions: bool, openAt: date, ... }
  settings JSONB DEFAULT '{}'::jsonb, 
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- The Constraint: ID is only unique per Creator
  PRIMARY KEY (creator_id, id)
);

-- 3. QUIZZES
-- The actual quiz definitions.
CREATE TABLE public.quizzes (
  creator_id TEXT REFERENCES public.users(google_id) ON DELETE CASCADE,
  id TEXT NOT NULL, -- Human Readable Extracted from meta
  
  title TEXT NOT NULL, -- Extracted from meta for easy listing

  -- The massive QuizSchema object
  quiz_schema JSONB NOT NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- The Constraint
  PRIMARY KEY (creator_id, id)
);

-- 4. QUIZ_GROUPS (Join Table)
-- Links a Quiz to the Groups that are allowed to take it.
-- Matches: QuizContext.groups
CREATE TABLE public.quiz_groups (
  -- Reference to the Quiz
  quiz_creator_id TEXT,
  quiz_id TEXT,
  
  -- Reference to the Group
  group_creator_id TEXT,
  group_id TEXT,
  
  -- Foreign Key Constraints
  FOREIGN KEY (quiz_creator_id, quiz_id) REFERENCES public.quizzes(creator_id, id) ON DELETE CASCADE,
  FOREIGN KEY (group_creator_id, group_id) REFERENCES public.groups(creator_id, id) ON DELETE CASCADE,
  
  PRIMARY KEY (quiz_creator_id, quiz_id, group_creator_id, group_id)
);

-- 5. QUIZ SESSIONS
-- Stores the active state AND the final result.
CREATE TABLE public.quiz_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- 1. CONTEXT (Who, What, Where)
  -- The Quiz being taken
  quiz_creator_id TEXT,
  quiz_id TEXT,
  
  -- The Group context
  group_creator_id TEXT,
  group_id TEXT,
  
  -- The User (Optional if anonymous, but required for Group restrictions)
  respondent_email TEXT, 
  
  -- 2. ENGINE STATE (Persistence)
  -- We save the minimal data needed to re-hydrate the QuizEngine
  current_step_id TEXT, -- Where are they?
  variables JSONB DEFAULT '{}'::jsonb, -- Global vars (score, timer snapshot)
  answers JSONB DEFAULT '{}'::jsonb, -- Map of NodeID -> Value
  
  -- 3. LIFECYCLE
  status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed', 'abandoned'
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  
  -- 4. FOREIGN KEYS
  FOREIGN KEY (quiz_creator_id, quiz_id) 
    REFERENCES public.quizzes(creator_id, id) ON DELETE CASCADE,
    
  FOREIGN KEY (group_creator_id, group_id) 
    REFERENCES public.groups(creator_id, id) ON DELETE SET NULL
);