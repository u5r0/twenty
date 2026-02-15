# Understanding Nx in the Twenty Project

## What is Nx?

**Nx** is a powerful build system and monorepo management tool. The Twenty project uses Nx version **22.3.3** to manage its 16 different packages in a single repository (monorepo).

## Project Structure Overview

```
twenty/
├── nx.json                    # Workspace-wide Nx configuration
├── package.json               # Root package.json with workspace definitions
└── packages/
    ├── twenty-front/          # Frontend React application
    │   └── project.json       # Project-specific configuration
    ├── twenty-server/         # Backend NestJS application
    │   └── project.json
    ├── twenty-ui/             # Shared UI component library
    │   └── project.json
    ├── twenty-shared/         # Shared utilities
    │   └── project.json
    └── ... (12 more packages)
```

## What Does `project.json` Do?

The `project.json` file is the **project-level configuration** for each package in the monorepo. It defines:

### 1. **Project Metadata**
```json
{
  "name": "twenty-front",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "projectType": "application",
  "tags": ["scope:frontend"]
}
```
- **name**: Unique identifier for the project
- **projectType**: Either "application" or "library"
- **tags**: Used for enforcing architectural boundaries and organizing projects

### 2. **Targets (Tasks)**
Targets are the commands you can run on a project. Each target defines HOW to execute a specific task.

#### Example from `twenty-front/project.json`:

```json
"targets": {
  "start": {
    "executor": "@nx/vite:dev-server",
    "options": {
      "buildTarget": "twenty-front:build",
      "hmr": true
    }
  },
  "build": {
    "outputs": ["{options.outputPath}"],
    "options": {
      "outputPath": "{projectRoot}/build"
    },
    "dependsOn": ["^build"]
  }
}
```

**Key Components:**
- **executor**: The tool/plugin that runs the task (e.g., `@nx/vite:dev-server`, `nx:run-commands`)
- **options**: Configuration passed to the executor
- **dependsOn**: Dependencies that must run first
  - `"^build"` means "build all dependencies first"
- **outputs**: Files/directories created by the task (for caching)
- **configurations**: Different ways to run the same target (e.g., `dev`, `production`)

### 3. **How Targets Work**

When you run:
```bash
npx nx start twenty-front
```

Nx does the following:
1. Reads `packages/twenty-front/project.json`
2. Finds the `start` target
3. Checks `dependsOn: ["^build"]` - builds all dependencies first
4. Executes the `@nx/vite:dev-server` executor with the specified options
5. Starts the Vite dev server with HMR enabled

## Configuration Inheritance

One of Nx's powerful features is **configuration inheritance** from `nx.json`:

### In `nx.json` (Workspace Level):
```json
"targetDefaults": {
  "lint": {
    "executor": "@nx/eslint:lint",
    "cache": true,
    "options": {
      "eslintConfig": "{projectRoot}/eslint.config.mjs",
      "cache": true
    }
  }
}
```

### In `project.json` (Project Level):
```json
"targets": {
  "lint": {
    "options": {
      "maxWarnings": 0
    }
  }
}
```

**Result**: The `lint` target in `twenty-front` inherits the executor and base options from `nx.json`, but adds/overrides with `maxWarnings: 0`.

## Real Examples from Twenty

### Example 1: Building the Frontend

**Command:**
```bash
npx nx build twenty-front
```

**What happens:**
1. Nx reads `packages/twenty-front/project.json`
2. Finds the `build` target (lines 9-18)
3. Sees `dependsOn: ["^build"]` - builds all dependencies first (like `twenty-ui`, `twenty-shared`)
4. Inherits build configuration from `nx.json` (lines 33-36)
5. Outputs to `packages/twenty-front/build`
6. Caches the result for faster subsequent builds

### Example 2: Running Tests

**Command:**
```bash
npx nx test twenty-front
```

**What happens:**
1. Reads `project.json` line 85: `"test": {}`
2. This is empty, so it inherits EVERYTHING from `nx.json` (lines 109-136)
3. Uses `@nx/jest:jest` executor
4. Runs Jest with config from `packages/twenty-front/jest.config.mjs`
5. Generates coverage reports
6. Caches results

### Example 3: GraphQL Code Generation

**Command:**
```bash
npx nx graphql:generate twenty-front
```

**From `project.json` lines 242-256:**
```json
"graphql:generate": {
  "executor": "nx:run-commands",
  "defaultConfiguration": "data",
  "options": {
    "cwd": "{projectRoot}",
    "command": "dotenv graphql-codegen -- --config={args.config}"
  },
  "configurations": {
    "data": {
      "config": "codegen.cjs"
    },
    "metadata": {
      "config": "codegen-metadata.cjs"
    }
  }
}
```

**What happens:**
1. Uses the `nx:run-commands` executor (runs shell commands)
2. Defaults to `data` configuration
3. Runs: `dotenv graphql-codegen -- --config=codegen.cjs`
4. You can override: `npx nx graphql:generate twenty-front --configuration=metadata`

### Example 4: Storybook with Configurations

**Command:**
```bash
npx nx storybook:serve:dev twenty-front --configuration=modules
```

**From `project.json` lines 115-140:**
```json
"storybook:serve:dev": {
  "options": {
    "port": 6006
  },
  "configurations": {
    "modules": {
      "env": {
        "STORYBOOK_SCOPE": "modules"
      }
    }
  }
}
```

**What happens:**
1. Inherits executor and base command from `nx.json` (lines 155-163)
2. Runs on port 6006
3. Sets environment variable `STORYBOOK_SCOPE=modules`
4. Starts Storybook dev server showing only module stories

## Key Nx Features in Twenty

### 1. **Dependency Graph**
Nx understands the relationships between packages:
```
twenty-front → depends on → twenty-ui
                         → twenty-shared
                         → twenty-utils
```

When you build `twenty-front`, Nx automatically builds its dependencies first.

### 2. **Caching**
Nx caches task outputs. If you run:
```bash
npx nx build twenty-front
```
And nothing changed, Nx retrieves the result from cache instantly (`.nx/cache/`).

### 3. **Affected Commands**
Only run tasks on projects affected by your changes:
```bash
npx nx affected:test  # Only test projects with changes
npx nx affected:build # Only build affected projects
```

### 4. **Parallel Execution**
Nx can run tasks in parallel across multiple projects:
```bash
npx nx run-many -t test -p twenty-front twenty-server
```

### 5. **Task Pipelines**
The `dependsOn` creates execution pipelines:
```
start twenty-front
  ↓
build twenty-ui (dependency)
  ↓
build twenty-shared (dependency of twenty-ui)
  ↓
start twenty-front (actual start)
```

## Common Commands in Twenty

```bash
# Start the entire application (frontend + backend + worker)
npm start
# Internally runs: npx nx run-many -t start -p twenty-server twenty-front

# Build a specific project
npx nx build twenty-front

# Run tests
npx nx test twenty-front

# Lint code
npx nx lint twenty-front

# Format code
npx nx fmt twenty-front

# Generate GraphQL types
npx nx graphql:generate twenty-front

# Start Storybook
npx nx storybook:serve:dev twenty-front

# Run multiple targets
npx nx run-many -t build test -p twenty-front twenty-server

# Show project details (opens browser)
npx nx show project twenty-front --web

# View dependency graph
npx nx graph
```

## How to Modify `project.json`

### Adding a New Target

```json
{
  "targets": {
    "my-custom-task": {
      "executor": "nx:run-commands",
      "options": {
        "cwd": "{projectRoot}",
        "command": "echo 'Hello from twenty-front!'"
      }
    }
  }
}
```

Run with: `npx nx my-custom-task twenty-front`

### Adding a Configuration

```json
{
  "targets": {
    "build": {
      "configurations": {
        "staging": {
          "outputPath": "dist/staging"
        }
      }
    }
  }
}
```

Run with: `npx nx build twenty-front --configuration=staging`

## Summary

**`project.json` is the blueprint for each package** that tells Nx:
- ✅ What tasks can be run (`build`, `test`, `lint`, `start`, etc.)
- ✅ How to run those tasks (which executor, what options)
- ✅ What dependencies must run first
- ✅ What outputs to cache
- ✅ Different ways to run the same task (configurations)

**Nx orchestrates the entire monorepo** by:
- 📦 Managing dependencies between packages
- ⚡ Caching task results for speed
- 🔄 Running tasks in the correct order
- 🎯 Only running tasks on affected projects
- ⚙️ Providing a consistent interface across all packages

The combination of `nx.json` (workspace defaults) and individual `project.json` files (project-specific overrides) creates a powerful, flexible build system for the Twenty monorepo.
