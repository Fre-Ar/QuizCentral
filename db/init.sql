-- Enable the UUID generation function
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Define the custom ENUM type for permissions, used in the new groups table
CREATE TYPE role_permission AS ENUM ('PLAYER', 'ADMIN', 'CREATOR');

-- Drop old tables to prepare for the new structure (assuming migration or fresh setup)
DROP TABLE IF EXISTS custom_blocks, groups, quizzes, styles, submissions, user_data, user_emails, user_groups, user_quizzes, users, variables, permissions CASCADE;
DROP TYPE IF EXISTS role_permission;


-- 1) quizzes ------------------------------------------------------------
CREATE TABLE quizzes (
  -- Merged 'id' and 'hash' into a single, external-facing UUID
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_data JSONB NOT NULL, -- Changed from JSON to JSONB for performance/indexing
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2) user_data --------------------------------------------------------------
CREATE TABLE user_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP
);

-- 3) groups --------------------------------------------------------------
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_data_id UUID NOT NULL,
  name TEXT NOT NULL,
  -- Emails are now stored as a JSONB array of player emails, collapsing the old user_emails table concept
  player_emails JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_data_id) REFERENCES user_data(id) ON DELETE CASCADE
);

-- The old 'user_emails' and 'user_groups' tables are now obsolete.

-- 4) users ---------------------------------------------------------------
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  access_id TEXT NOT NULL UNIQUE, -- For joining a quiz session
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5) user_templates -----------------------------------------------------------
CREATE TABLE user_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_data_id UUID NOT NULL,
  -- Renamed from 'custom_blocks' to 'user_templates' as requested
  template_json JSONB NOT NULL, -- Stores user-defined quiz objects (json)
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_data_id) REFERENCES user_data(id) ON DELETE CASCADE
);

-- The old 'custom_blocks' table is now obsolete.
-- The old 'variables' table has been scrapped.

-- 6) styles ------------------------------------------------------------
CREATE TABLE styles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_data_id UUID NOT NULL,
  style_data JSONB NOT NULL, -- Changed from JSON to JSONB
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_data_id) REFERENCES user_data(id) ON DELETE CASCADE
);

-- 7) submissions --------------------------------------------------------
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  -- Updated FK to reference the new unified UUID in the quizzes table
  quiz_id UUID NOT NULL,
  submitted_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

-- 8) user_quizzes ----------------------------------------------------------
CREATE TABLE user_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_data_id UUID NOT NULL,
  -- Updated FK to reference the new unified UUID in the quizzes table
  quiz_id UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_data_id) REFERENCES user_data(id) ON DELETE CASCADE,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);

-- 9) group_quiz_roles  -----------------------------------------------------------
-- This table handles the group permissions requested
CREATE TABLE group_quiz_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL,
    quiz_id UUID NOT NULL,
    -- The role that ALL members of this group will have on this specific quiz
    role role_permission DEFAULT 'PLAYER' NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),

    -- Ensures a group can only be linked to a quiz once
    UNIQUE (group_id, quiz_id),

    FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
);