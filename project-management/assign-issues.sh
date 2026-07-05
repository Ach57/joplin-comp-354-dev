#!/usr/bin/env zsh
# =============================================================================
# assign-issues.sh
# Data-driven GitHub issue assginor. All content lives in issues-assignment.yml —
# this script is a reusable engine with zero hardcoded strings.
#
# Prerequisites:
#   - gh CLI:   brew install gh  →  gh auth login
#   - yq CLI:   brew install yq          (YAML processor)
#
# Usage:
#   chmod +x project-management/assign-issues.sh
#   ./project-management/assign-issues.sh [path/to/issue-assignment.yml]
#
# The optional argument lets you point at a different data file.
# Defaults to issues.yml in the same directory as this script.
#
# Idempotency: issues whose assign already assigned are skipped.
# =============================================================================

set -euo pipefail

