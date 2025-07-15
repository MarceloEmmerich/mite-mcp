# Versioning

This document outlines the git workflow, branching strategy, and commit message conventions for this project.

## Branching Strategy: Trunk-Based Development

We follow a **trunk-based development** approach to maintain code quality and enable continuous integration.

### Core Principles

- **Single main branch**: All development flows through the `main` branch
- **Short-lived feature branches**: Feature branches should live for no more than 2-3 days
- **Frequent integration**: Commit to main at least once per day
- **Small, incremental changes**: Keep commits small and focused
- **Always deployable main**: The main branch should always be in a deployable state

### Branch Structure

```
main (trunk)
├── feature/user-authentication    # Short-lived (1-3 days)
├── feature/payment-integration    # Short-lived (1-3 days)
└── hotfix/security-patch         # Immediate fixes
```

### Feature Development Workflow

1. **Create feature branch** from latest main:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/descriptive-name
   ```

2. **Work in small increments**:
   - Make frequent, small commits
   - Push to remote regularly
   - Sync with main daily

3. **Stay current** with main:
   ```bash
   git checkout main
   git pull origin main
   git checkout feature/your-branch
   git rebase main  # or merge main into feature branch
   ```

4. **Merge back to main**:
   - Create pull request
   - Ensure all tests pass
   - Get code review approval
   - Use "Squash and merge" for clean history

### Branch Naming Conventions

- **Feature branches**: `feature/short-description`
- **Bug fixes**: `fix/issue-description`
- **Hotfixes**: `hotfix/critical-issue`
- **Refactoring**: `refactor/component-name`
- **Documentation**: `docs/section-name`

Examples:
- `feature/user-profile-page`
- `fix/login-validation-error`
- `hotfix/memory-leak-api`
- `refactor/payment-service`
- `docs/api-documentation`

## Commit Message Standards

We follow the **Conventional Commits** specification for clear, readable commit messages.

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: A new feature for the user
- **fix**: A bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code refactoring without changing functionality
- **perf**: Performance improvements
- **test**: Adding or modifying tests
- **chore**: Maintenance tasks, dependency updates
- **ci**: Changes to CI/CD configuration
- **build**: Changes to build system or external dependencies

### Examples

#### Good Commit Messages

```
feat(auth): add OAuth2 login integration

Implements Google and GitHub OAuth2 providers for user authentication.
Includes redirect handling and token validation.

Closes #123
```

```
fix: resolve memory leak in image processing

The image cache was not properly clearing processed images,
causing memory usage to grow over time.

Fixes #456
```

```
docs(api): update authentication endpoint examples

Added curl examples and response format documentation
for all authentication-related endpoints.
```

```
refactor(payment): extract validation logic to separate service

Moved payment validation logic from controller to dedicated
service class for better testability and reusability.
```

#### Bad Commit Messages

```
❌ fix stuff
❌ WIP
❌ update code
❌ fixed the thing that was broken
❌ asdf
```

### Commit Message Rules

1. **Use imperative mood** in the subject line ("add" not "added" or "adds")
2. **Capitalize first letter** of subject line
3. **No period** at the end of subject line
4. **Limit subject line** to 50 characters
5. **Wrap body** at 72 characters
6. **Separate subject and body** with blank line
7. **Use body to explain** what and why, not how
8. **Reference issues** in footer with "Fixes #123" or "Closes #123"

## Git Configuration

### Required Settings

```bash
# Set your identity
git config --global user.name "Your Name"
git config --global user.email "your.email@company.com"

# Enable auto-rebase for pulls
git config --global pull.rebase true

# Set default branch name
git config --global init.defaultBranch main

# Enable helpful colorization
git config --global color.ui auto
```

### Recommended Aliases

```bash
# Add useful git aliases
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'
git config --global alias.visual '!gitk'
git config --global alias.log-pretty 'log --oneline --graph --decorate'
```

## Code Review Process

### Before Creating a Pull Request

1. **Self-review** your changes
2. **Run all tests** locally
3. **Check code formatting** and linting
4. **Update documentation** if needed
5. **Rebase and squash** commits if necessary

### Pull Request Guidelines

1. **Clear title** following commit message conventions
2. **Detailed description** explaining the changes
3. **Link related issues** with keywords (Fixes #123)
4. **Add reviewers** based on code ownership
5. **Ensure CI passes** before requesting review
6. **Respond to feedback** promptly

### Review Criteria

- **Functionality**: Does the code work as intended?
- **Code quality**: Is it readable, maintainable, and well-structured?
- **Performance**: Are there any performance implications?
- **Security**: Are there any security concerns?
- **Tests**: Are appropriate tests included?
- **Documentation**: Is documentation updated if needed?

## Merge Strategies

### Preferred: Squash and Merge

- Creates clean, linear history
- Combines all feature branch commits into single commit
- Use for feature branches with multiple commits

### Alternative: Rebase and Merge

- Maintains individual commits from feature branch
- Use when commits tell a meaningful story
- Requires clean, well-structured commits

### Avoid: Merge Commits

- Creates complex, non-linear history
- Only use for merging long-lived branches (rare in trunk-based development)

## Git Hooks

We use pre-commit hooks to maintain code quality:

```bash
# Install pre-commit hooks
npm install --save-dev husky lint-staged

# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run lint
npm run test
```

## Emergency Procedures

### Hotfix Process

1. **Create hotfix branch** from main:
   ```bash
   git checkout main
   git checkout -b hotfix/critical-issue
   ```

2. **Make minimal changes** to fix the issue
3. **Test thoroughly** on the hotfix branch
4. **Fast-track review** and merge immediately
5. **Deploy to production** as soon as possible
6. **Communicate** the fix to the team

### Reverting Changes

```bash
# Revert a specific commit
git revert <commit-hash>

# Revert a merge commit
git revert -m 1 <merge-commit-hash>

# Create new branch to work on revert
git checkout -b revert/issue-description
```

## Best Practices Summary

1. **Keep main branch stable** and always deployable
2. **Create small, focused commits** with clear messages
3. **Merge feature branches quickly** (within 2-3 days)
4. **Rebase regularly** to stay current with main
5. **Write descriptive commit messages** following conventions
6. **Review code thoroughly** before merging
7. **Use meaningful branch names** that describe the work
8. **Test everything** before pushing to main
9. **Communicate changes** that affect other team members
10. **Clean up merged branches** to keep repository tidy

## Troubleshooting

### Common Issues

**Merge conflicts during rebase:**
```bash
# Resolve conflicts in editor, then:
git add .
git rebase --continue
```

**Accidentally committed to main:**
```bash
# Move commits to new branch
git branch feature/accidental-work
git reset --hard HEAD~n  # where n is number of commits to move
git checkout feature/accidental-work
```

**Need to update commit message:**
```bash
# For last commit
git commit --amend -m "New commit message"

# For older commits
git rebase -i HEAD~n  # where n includes the commit to change
```