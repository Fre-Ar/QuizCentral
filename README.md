Here is a comprehensive `README.md` for the QuizCentral project. It documents the architecture, setup instructions, and the unique "Headless Engine" design we have built.

-----

# QuizCentral

**QuizCentral** is a next-generation, modular quiz platform built on a **Headless Block Engine**. Unlike traditional form builders, QuizCentral treats quizzes as state machines, allowing for complex logic, non-linear navigation, real-time behavior (timers), and reusable template macros.

## 🚀 Key Features

  * **Block-Based Architecture:** Quizzes are composed of atomic blocks (Text, Inputs, Toggles) nested inside structural Containers.
  * **Headless Runtime Engine:** The logic layer (`QuizEngine`) is strictly decoupled from the view layer (React). It runs in isolation, managing validation, state, and visibility.
  * **Reactive Logic System:** Built on `json-logic-js`. Supports complex dependency graphs (e.g., "Show Question B only if Question A is \> 5 and Time \< 60s").
  * **Template Compiler:** A Turing-complete macro system (`$$map`, `$$switch`) that compiles high-level, parametric templates into raw executable JSON schema.
  * **Performance:** Uses `useSyncExternalStore` for fine-grained React subscriptions. Typing in one input does not re-render the entire page.
  * **User Ownership:** Users own their "Registries" (Custom Styles, Templates, and Logic), allowing for a personalized design system.

## 🛠 Tech Stack

  * **Framework:** Next.js 14 (App Router)
  * **Language:** TypeScript
  * **State & Logic:** Custom Singleton Engine + `json-logic-js`
  * **Styling:** Tailwind CSS
  * **Auth & Database:** Supabase (PostgreSQL + Google OAuth)
  * **Markdown:** `react-markdown`

## 📂 Project Structure

The core innovation lies in the `src/engine` folder:

```text
src/
├── app/                 # Next.js App Router (Dashboard, API, Quiz Pages)
├── components/          # Shared UI Components
├── lib/                 # Utilities (DB Fetching, Supabase Clients)
└── engine/              # The "Brain" of the application
    ├── blocks/          # React Components mapped to Schema Types (Atoms/Containers)
    ├── core/            # Pure Typescript Logic
    │   ├── QuizEngine.ts      # The lifecycle controller & state machine
    │   ├── LogicEvaluator.ts  # JSON-Logic wrapper with custom operators (+=, ref)
    │   ├── StateStore.ts      # Pub/Sub Store implementation
    │   └── Renderer.tsx       # The Recursive React entry point
    ├── domains/         # Data Validation Logic
    ├── hooks/           # React Glue (useBlockState, useQuizContext)
    ├── styles/          # StyleResolver (Schema Tokens -> Tailwind)
    ├── types/           # Strict Types (Schema, Runtime, User)
    └── utils/           # TemplateCompiler (Macros expansion)
```

## ⚡ Getting Started

### 1\. Prerequisites

  * Node.js 18+
  * A Supabase Project

### 2\. Environment Variables

Create a `.env.local` file:

```env
# Supabase - Public Client
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Supabase - Admin (Server Side Ops)
# CRITICAL: Do not expose this to the client
SUPABASE_SERVICE_ROLE_KEY=your_service_role_secret

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id

SMTP_HOST=smtp.example.com
SMTP_PORT=YOUR_PORT
SMTP_SECURE=false | true DEFAULT false
SMTP_USER=your.email@example.com
SMTP_PASS="YOUR_PASSKEY"
```

### 3\. Installation

```bash
npm install
npm run dev
```

### 4\. Database Setup (Supabase)

Run the following SQL in your Supabase SQL Editor to set up the schema:

```sql
-- Enable Extensions
create extension if not exists "uuid-ossp";

-- 1. Users
create table public.users (
  google_id text primary key,
  email text not null,
  username text,
  styles jsonb default '{}'::jsonb,
  templates jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- 2. Quizzes (Composite Key)
create table public.quizzes (
  creator_id text references public.users(google_id) on delete cascade,
  id text not null,
  title text not null,
  quiz_schema jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (creator_id, id)
);

-- 3. Groups & Sessions (Simplified)
create table public.groups (
  creator_id text references public.users(google_id) on delete cascade,
  id text not null,
  name text not null,
  emails jsonb default '[]'::jsonb,
  settings jsonb default '{}'::jsonb,
  primary key (creator_id, id)
);

create table public.quiz_sessions (
  id uuid default gen_random_uuid() primary key,
  quiz_creator_id text,
  quiz_id text,
  respondent_email text,
  current_step_id text,
  variables jsonb default '{}'::jsonb,
  answers jsonb default '{}'::jsonb,
  status text default 'in_progress',
  last_updated_at timestamptz default now(),
  foreign key (quiz_creator_id, quiz_id) references public.quizzes(creator_id, id)
);
```

## 🧠 The Engine Architecture

### The Data Flow

1.  **Fetch:** The App fetches the `QuizContext` (Schema + User Registries) from Supabase.
2.  **Compile:** The `TemplateCompiler` runs first. It expands any `template_instance` blocks using macros (`$$map`, `$$switch`) into raw blocks.
3.  **Hydrate:** The `QuizEngine` initializes. It generates a normalized, flat state tree (`nodes`) and an index of listeners.
4.  **Render:** React renders `BlockFactory`. Components subscribe to specific nodes via `useBlockState`.
5.  **Interact:**
      * User clicks a Trigger/Toggle.
      * Component calls `engine.executeLogicAction({ "set": ... })`.
      * Engine updates Store -\> Notifies Subscribers -\> Triggers Side Effects (Listeners).

### Logic Operators

The engine supports custom JSON-Logic operators for state mutation:

  * **`ref`**: Creates a pointer to a variable (`{ "ref": "quiz.score" }`).
  * **`set`**: Sets a value (`{ "set": [{ "ref": "q1.value" }, true] }`).
  * **`+=` / `-=`**: Mathematical compounding.
  * **`cat=`**: Array push or string concatenation.

## 📝 Schema Example

A simple Interaction Unit (Question) in the schema:

```json
{
  "id": "q1",
  "type": "interaction_unit",
  "domain_id": "$$BOOL",
  "state": { "value": false },
  "view": {
    "type": "container",
    "props": {
      "children": [
        { "type": "text", "props": { "content": "Do you accept?" } },
        { 
          "type": "toggle", 
          "props": { 
            "label": "Yes", 
            "events": { 
              "on_click": { "set": [{ "ref": "value" }, true] } 
            } 
          } 
        }
      ]
    }
  },
  "behavior": {
    "listeners": {
      "self.value": {
        "if": [
          { "==": [{ "var": "value" }, true] },
          { "+=": [{ "ref": "quiz.score" }, 10] },
          null
        ]
      }
    }
  }
}
```