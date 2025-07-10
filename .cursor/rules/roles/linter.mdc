---
alwaysApply: false
---

# Code Formatting and Linting Rules

## General Principles

- **Consistency**: Maintain consistent code style across all files in the project
- **Readability**: Prioritize code readability and maintainability
- **Best Practices**: Follow language-specific best practices and conventions
- **Automation**: Use automated tools to enforce formatting and catch common issues

## Line Length and Formatting

- **Maximum line length**: 120 characters for all languages
- **No multiple consecutive blank lines**: Maximum of 1 blank line between code blocks
- **Trailing whitespace**: Remove all trailing whitespace
- **Indentation**: Use consistent indentation (2 spaces for JS/TS, 4 spaces for Python, 2 spaces for Java/Kotlin)

## Python Specific Rules

### Tools
- Use `ruff` for both linting and formatting
- Configuration is in `pyproject.toml` under `[tool.ruff]`

### Linting Rules
- **A**: flake8-builtins - Avoid shadowing Python built-ins
- **B**: flake8-bugbear - Catch common bugs and design problems
- **C4**: flake8-comprehensions - Improve list/dict/set comprehensions
- **E**: pycodestyle errors - Style guide enforcement
- **F**: Pyflakes - Catch undefined names and imports
- **I**: isort - Sort imports consistently
- **UP**: pyupgrade - Upgrade syntax for newer Python versions

### Type Hints
- Use modern union syntax `T | None` instead of `Optional[T]` when possible
- Always include type hints for function parameters and return values
- Use `from __future__ import annotations` for forward references

### Naming Conventions
- Functions and variables: `snake_case`
- Classes: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- Avoid single-letter variable names except for short loops

### Commands
- Format: `ruff format .` or `make format`
- Lint: `ruff check .` or `make lint`
- Auto-fix: `ruff check --fix .`

## JavaScript/TypeScript Rules

### Tools
- Use ESLint for linting
- Use Prettier for formatting (if configured)
- Follow the project's ESLint configuration

### General Rules
- Use `const` by default, `let` when reassignment is needed
- Prefer arrow functions for callbacks
- Use template literals for string interpolation
- Don't use semicolons when possible
- Prefer `===` over `==`

### Import Organization
- External imports first
- Internal imports second
- Relative imports last
- Group imports by source and separate with blank lines

## Java/Kotlin Rules

### Java
- Follow Oracle's Java Code Conventions
- Use 2-space indentation (as configured in the project)
- Package names in lowercase
- Class names in PascalCase
- Method and variable names in camelCase

### Kotlin
- Follow Kotlin coding conventions
- Use 2-space indentation
- Prefer `val` over `var` when possible
- Use trailing commas in multi-line constructs

## Common Anti-Patterns to Avoid

1. **Long parameter lists**: Use data classes or configuration objects
2. **Deep nesting**: Extract methods to reduce complexity
3. **Magic numbers**: Use named constants
4. **Commented-out code**: Remove instead of commenting
5. **Inconsistent naming**: Follow established conventions
6. **Missing error handling**: Handle exceptions appropriately
7. **Unused imports**: Remove unused imports
8. **Hardcoded values**: Use configuration or constants

## Pre-commit Checks

Before committing code, ensure:
1. All linting rules pass
2. Code is properly formatted
3. No trailing whitespace
4. Import statements are organized
5. Type hints are present (Python)
6. Tests pass (if applicable)

## IDE Integration

Configure your IDE to:
- Run formatters on save
- Show linting errors inline
- Highlight style violations
- Auto-import missing dependencies
- Remove unused imports on save

## Project-Specific Commands

### Python (`clients/python/`)
```bash
make format    # Format code with ruff
make lint      # Check code with ruff
ruff check --fix .  # Auto-fix issues
```

### JavaScript (`clients/javascript/`)
```bash
npm run lint   # Run ESLint
```

### Java (`clients/java/`)
```bash
./gradlew check  # Run all checks
./gradlew spotlessApply  # Format code (if configured)
```

## Configuration Files

- Python: `pyproject.toml` - Contains ruff configuration
- JavaScript: `eslint.config.mjs` - ESLint configuration
- Java: `build.gradle.kts` - Gradle build configuration
- Root: `package.json` - Workspace configuration

## Enforcement

These rules should be:
1. Enforced by CI/CD pipelines
2. Checked before code review
3. Integrated into development workflow
4. Consistently applied across all contributors
