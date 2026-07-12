# Joplin Thesaurus Plugin

A Joplin plugin that provides context-aware synonym suggestions using a TypeScript frontend and a Python NLP backend.

---

# Architecture

The project consists of two major components:

## TypeScript Plugin

Located in:

```text
src/
```

Responsible for:

- Joplin integration
- Editor commands
- Context menu entries
- Communication with the Python backend

## Python NLP Backend

Located in:

```text
python/
```

Responsible for:

- WordNet synonym retrieval
- Semantic similarity ranking
- NLP processing
- Context-aware synonym recommendations

---

# Prerequisites

## Node.js

Recommended:

```text
Node.js 18+
npm 9+
```

Verify installation:

```bash
node --version
npm --version
```

## Python

Required:

```text
Python 3.12+
```

Verify installation:

```bash
python3 --version
```

or

```bash
python --version
```

---

# Initial Setup

## 1. Install Node Dependencies

From the plugin root directory:

```bash
npm install
```

---

## 2. Create the Python Virtual Environment

Navigate to the Python directory:

```bash
cd python
```

Create the virtual environment:

```bash
python3.12 -m venv .venv
```

Activate the environment.

### macOS / Linux

```bash
source .venv/bin/activate
```

### Windows

```powershell
.venv\Scripts\activate
```

---

## 3. Install Python Dependencies

While the virtual environment is activated:

```bash
pip install -e .
```

Alternatively:

```bash
pip install .
```

Dependencies are managed through:

```text
python/pyproject.toml
```

The NLP backend currently depends on:

- nltk
- pandas
- pydantic
- pydantic-settings
- sentence-transformers

---

## 4. Download NLP Assets

Some NLTK resources are automatically downloaded the first time the backend runs.

Examples include:

```text
wordnet
averaged_perceptron_tagger_eng
punkt_tab
```

---

# Building the Plugin

Generate distributable plugin artifacts:

```bash
npm run dist
```

Build output is generated under:

```text
dist/
```

---

# Running Tests

## Run All Tests

```bash
npm test
```

## Run Unit Tests

```bash
npm run test:unit
```

## Run Integration Tests

```bash
npm run test:integration
```

## Run NLP Backend Integration Tests

```bash
npm run test:integration:nlpBackend
```

## Run Python Path Validation Tests

```bash
npm run test:unit:python:paths
```

---

# Project Structure

```text
src/
    TypeScript plugin source

python/
    NLP backend source

tests/
    Unit and integration tests

docs/
    Project documentation
```

---

# Development Notes

## Python Backend Path Resolution

The plugin launches the Python backend using:

```text
python/.venv/bin/python
```

and

```text
python/src
```

### Important

Joplin executes plugins from:

```text
packages/app-desktop/services/plugins
```

which means:

```ts
__dirname;
```

does **not** point to the plugin directory.

For this reason, the plugin explicitly resolves paths relative to:

```text
packages/plugins/thesaurus
```

using:

```ts
const PLUGIN_ROOT = path.resolve(__dirname, "../../../plugins/thesaurus");
```

If the backend fails to start, verify that:

```text
python/.venv/bin/python
```

exists and:

```text
python/src
```

exists.

A common symptom of incorrect path resolution is:

```text
ProcessNotRunningError: Python process is not running
```

---

# Useful Documentation

## Architecture

```text
docs/architecture.md
```

## Pre-Commit Checklist

```text
docs/pre-commit-checklist.md
```

## Python Architecture

```text
python/docs/architecture/
```

---

# Troubleshooting

## Python Process Is Not Running

Verify the virtual environment exists:

```bash
ls python/.venv/bin/python
```

Verify the backend source directory exists:

```bash
ls python/src
```

Reinstall Python dependencies:

```bash
cd python

source .venv/bin/activate

pip install -e .
```

---

## Integration Tests Failing

Ensure the Python virtual environment is activated:

```bash
source python/.venv/bin/activate
```

Then run:

```bash
npm run test:integration:nlpBackend
```

---

# Current Tooling Versions

## npm Scripts

```text
npm test
npm run test:unit
npm run test:integration
npm run test:integration:nlpBackend
npm run test:unit:python:paths
npm run dist
```

## Python Requirements

```text
Python >= 3.12
```

## Node Dependencies

Key development dependencies include:

```text
TypeScript 5.x
Jest 29.x
Webpack 4.x
ts-jest 29.x
```

Refer to `package.json` and `python/pyproject.toml` for the complete list of project dependencies.

# Running the Plugin in Joplin Dev Mode

Before launching Joplin with the plugin, make sure the plugin has been built.

From the `thesaurus` project root, run one of the following:

```bash
npm run dist
```

or

```bash
npm run prepare
```

This generates the required files under:

```text
dist/
```

---

## Launching Joplin with the Plugin

Navigate to:

```text
packages/app-desktop
```

and start Joplin in development mode with the Thesaurus plugin loaded:

```bash
npm run start-dev-with:thesaurus
```

This command executes:

```bash
yarn start --dev-plugins ../plugins/thesaurus/dist
```

The plugin will be loaded directly from the generated `dist/` directory.

### Important

Any time you make changes to the plugin source code, rebuild the plugin before restarting Joplin:

```bash
npm run dist
```

or

```bash
npm run prepare
```

Failing to rebuild may cause Joplin to load stale plugin code and can make debugging difficult.
