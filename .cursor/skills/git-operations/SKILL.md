---
name: git-operations
description: Perform Git operations including branching, merging, rebasing, tagging, and resolving conflicts. Use when working with Git, managing branches, or handling Git-related tasks.
---

# Git Operations

Perform Git operations following project standards and best practices.

## Quick Checklist

When working with Git:

- [ ] **Branch** created from main
- [ ] **Commits** follow Conventional Commits
- [ ] **Branch** is up to date with main
- [ ] **Conflicts** resolved (if any)
- [ ] **Commits** are logical and atomic
- [ ] **Branch** pushed to remote
- [ ] **PR** created (if needed)

## Branch Management

### 1. Creating Branches

```bash
# Create feature branch from main
git checkout main
git pull origin main
git checkout -b feature/your-feature-name

# Create bugfix branch
git checkout -b fix/bug-description

# Create hotfix branch
git checkout -b hotfix/critical-issue
```

### 2. Branch Naming Convention

```
feature/<description>    # New features
fix/<description>        # Bug fixes
hotfix/<description>     # Critical fixes
refactor/<description>   # Code refactoring
docs/<description>       # Documentation
test/<description>       # Test-related
chore/<description>      # Maintenance tasks
```

### 3. Switching Branches

```bash
# Switch to branch
git checkout branch-name

# Or using switch (Git 2.23+)
git switch branch-name

# Create and switch in one command
git checkout -b new-branch
git switch -c new-branch
```

### 4. Listing Branches

```bash
# List local branches
git branch

# List remote branches
git branch -r

# List all branches
git branch -a

# List branches with last commit
git branch -v
```

## Committing Changes

### 1. Staging Changes

```bash
# Stage all changes
git add .

# Stage specific file
git add path/to/file

# Stage multiple files
git add file1 file2 file3

# Stage by pattern
git add *.ts

# Interactive staging
git add -i
```

### 2. Committing

```bash
# Commit with message
git commit -m "feat: add user authentication"

# Commit with detailed message
git commit -m "feat: add user authentication

- Implement login functionality
- Add JWT token handling
- Create auth context"

# Amend last commit
git commit --amend -m "feat: updated message"

# Skip hooks (use with caution)
git commit --no-verify -m "message"
```

### 3. Commit Message Format

Follow Conventional Commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Examples**:
```bash
git commit -m "feat: add user registration"
git commit -m "fix(api): handle null response"
git commit -m "docs: update README"
```

## Updating Branches

### 1. Pulling Changes

```bash
# Pull from remote
git pull origin main

# Pull with rebase
git pull --rebase origin main

# Fetch and merge separately
git fetch origin
git merge origin/main
```

### 2. Rebasing

```bash
# Rebase current branch onto main
git checkout feature-branch
git rebase main

# Interactive rebase (last 3 commits)
git rebase -i HEAD~3

# Continue rebase after resolving conflicts
git rebase --continue

# Abort rebase
git rebase --abort
```

### 3. Merging

```bash
# Merge main into current branch
git checkout feature-branch
git merge main

# Merge with no-fast-forward (creates merge commit)
git merge --no-ff main

# Squash merge
git merge --squash feature-branch
git commit -m "feat: merged feature branch"
```

## Resolving Conflicts

### 1. Identify Conflicts

```bash
# Check merge status
git status

# See conflicted files
git diff --name-only --diff-filter=U
```

### 2. Resolve Conflicts

```bash
# Open conflicted file
# Look for conflict markers:
# <<<<<<< HEAD
# current branch code
# =======
# incoming branch code
# >>>>>>> branch-name

# Edit file to resolve conflict
# Remove conflict markers
# Keep desired code

# Stage resolved file
git add conflicted-file

# Complete merge/rebase
git commit  # For merge
# or
git rebase --continue  # For rebase
```

### 3. Conflict Resolution Tools

```bash
# Use merge tool
git mergetool

# Accept current version
git checkout --ours file

# Accept incoming version
git checkout --theirs file
```

## Tagging

### 1. Creating Tags

```bash
# Create lightweight tag
git tag v1.0.0

# Create annotated tag
git tag -a v1.0.0 -m "Release version 1.0.0"

# Tag specific commit
git tag -a v1.0.0 abc1234 -m "Release version 1.0.0"
```

### 2. Pushing Tags

```bash
# Push specific tag
git push origin v1.0.0

# Push all tags
git push origin --tags

# Delete local tag
git tag -d v1.0.0

# Delete remote tag
git push origin --delete v1.0.0
```

### 3. Listing Tags

```bash
# List all tags
git tag

# List tags matching pattern
git tag -l "v1.*"

# Show tag details
git show v1.0.0
```

## Stashing

### 1. Stash Changes

```bash
# Stash current changes
git stash

# Stash with message
git stash save "WIP: working on feature"

# Stash including untracked files
git stash -u

# Stash including ignored files
git stash -a
```

### 2. Applying Stash

```bash
# Apply most recent stash
git stash apply

# Apply specific stash
git stash apply stash@{1}

# Apply and remove from stash
git stash pop

# List stashes
git stash list

# Show stash contents
git stash show stash@{0}
```

### 3. Managing Stashes

```bash
# Drop stash
git stash drop stash@{0}

# Clear all stashes
git stash clear
```

## Undoing Changes

### 1. Undo Unstaged Changes

```bash
# Discard changes to file
git checkout -- file

# Discard all changes
git checkout -- .

# Using restore (Git 2.23+)
git restore file
git restore .
```

### 2. Undo Staged Changes

```bash
# Unstage file
git reset HEAD file

# Unstage all files
git reset HEAD

# Using restore (Git 2.23+)
git restore --staged file
```

### 3. Undo Commits

```bash
# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo last commit (discard changes)
git reset --hard HEAD~1

# Undo multiple commits
git reset --soft HEAD~3

# Revert commit (creates new commit)
git revert HEAD
```

## Remote Operations

### 1. Managing Remotes

```bash
# List remotes
git remote -v

# Add remote
git remote add origin <url>

# Remove remote
git remote remove origin

# Update remote URL
git remote set-url origin <new-url>
```

### 2. Pushing Changes

```bash
# Push to remote
git push origin branch-name

# Push and set upstream
git push -u origin branch-name

# Push all branches
git push --all origin

# Force push (use with caution)
git push --force origin branch-name
```

### 3. Fetching Changes

```bash
# Fetch from remote
git fetch origin

# Fetch specific branch
git fetch origin branch-name

# Fetch all remotes
git fetch --all
```

## Best Practices

### ✅ Good Practices

- Create branches from main
- Use descriptive branch names
- Commit frequently with clear messages
- Keep branches up to date
- Resolve conflicts promptly
- Use tags for releases
- Review changes before committing
- Follow Conventional Commits

### ❌ Anti-Patterns

- Don't commit directly to main
- Don't use vague commit messages
- Don't force push to shared branches
- Don't ignore merge conflicts
- Don't commit large files
- Don't commit secrets or credentials
- Don't skip code review

## Common Git Workflows

### 1. Feature Development

```bash
# Start feature
git checkout main
git pull origin main
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "feat: implement new feature"

# Push and create PR
git push -u origin feature/new-feature
```

### 2. Bug Fix

```bash
# Create fix branch
git checkout main
git pull origin main
git checkout -b fix/bug-description

# Fix and commit
git add .
git commit -m "fix: resolve bug description"

# Push and create PR
git push -u origin fix/bug-description
```

### 3. Updating Feature Branch

```bash
# Update from main
git checkout feature-branch
git fetch origin
git rebase origin/main

# Or merge
git merge origin/main

# Resolve conflicts if any
# Push updated branch
git push origin feature-branch
```

## Related Rules

- Git Commit: `.cursor/rules/08-Git提交规范.mdc`
- PR Workflow: `.cursor/rules/17-PR工作流程规范.mdc`
- Generate Commit Message: `.cursor/skills/generate-commit-message/SKILL.md`
