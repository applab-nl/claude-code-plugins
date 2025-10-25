Run `flutter analyze` on the current project and automatically fix all reported issues.

## Workflow

1. **Run flutter analyze**: Execute `flutter analyze` to detect all code issues, errors, warnings, and lints
2. **Parse the output**: Extract all reported issues with file paths, line numbers, and error descriptions
3. **Categorize issues**: Group issues by type (errors, warnings, infos, lints)
4. **Fix issues automatically**:
   - **Import errors**: Add missing imports
   - **Unused imports**: Remove unused imports
   - **Type errors**: Add explicit type annotations
   - **Const suggestions**: Add const keywords where applicable
   - **Null safety issues**: Add null checks, use null-aware operators, or make variables nullable
   - **Deprecated API usage**: Replace with recommended alternatives
   - **Formatting issues**: Run `dart format` on affected files
   - **Lint violations**: Apply recommended fixes (prefer_const_constructors, prefer_final_fields, etc.)
5. **Verify fixes**: Run `flutter analyze` again to confirm all issues are resolved
6. **Report results**: Show a summary of what was fixed

## Instructions

You MUST use the flutter-specialist agent for this task. The agent has access to:
- Dart MCP server for code analysis
- Flutter SDK for running analysis and formatting
- File editing capabilities for applying fixes

## Step-by-Step Process

### Step 1: Initial Analysis
Run `flutter analyze` and capture the complete output:
```bash
flutter analyze --no-fatal-infos --no-fatal-warnings
```

### Step 2: Parse Issues
Extract all issues from the output. Each issue has:
- File path (e.g., `lib/main.dart`)
- Line and column numbers (e.g., `line 42, col 5`)
- Issue type (error, warning, info)
- Error code (e.g., `unused_import`, `missing_required_param`)
- Description

### Step 3: Fix Issues Systematically

**Priority 1: Errors** (must fix)
- Missing return statements
- Undefined variables or methods
- Type mismatches
- Missing required parameters
- Invalid syntax

**Priority 2: Warnings** (should fix)
- Unused imports
- Unused variables
- Deprecated API usage
- Null safety violations
- Missing override annotations

**Priority 3: Lints** (recommended)
- Const constructor suggestions
- Prefer final for private fields
- Avoid print statements
- Prefer single quotes
- Sort constructor declarations first

### Step 4: Apply Fixes

For each file with issues:
1. Read the file content
2. Apply fixes in order (from bottom to top to preserve line numbers)
3. Use the Edit tool to make precise changes
4. For formatting issues, run `dart format <file>`

### Step 5: Verify

After all fixes:
1. Run `flutter analyze` again
2. Confirm zero errors, warnings, and infos
3. If new issues appear, fix them iteratively
4. Run `dart format .` for final formatting pass

### Step 6: Summary

Create a detailed report showing:
- Total issues found initially
- Issues fixed by category (errors, warnings, lints)
- Files modified
- Remaining issues (if any)
- Recommendations for manual fixes (if applicable)

## Common Fix Patterns

### Unused Imports
```dart
// Before
import 'package:flutter/material.dart';  // unused
import 'dart:async';  // unused

// After
// (removed)
```

### Missing Imports
```dart
// Before (error: Undefined class 'Timer')
Timer.periodic(Duration(seconds: 1), (timer) {});

// After
import 'dart:async';
Timer.periodic(Duration(seconds: 1), (timer) {});
```

### Const Constructors
```dart
// Before
Widget build(BuildContext context) {
  return Text('Hello');
}

// After
Widget build(BuildContext context) {
  return const Text('Hello');
}
```

### Null Safety
```dart
// Before
String? name;
print(name.length);  // error

// After
String? name;
print(name?.length ?? 0);  // fixed
```

### Type Annotations
```dart
// Before
var items = [];  // warning: prefer explicit type

// After
final List<String> items = [];
```

## Edge Cases to Handle

1. **Cannot auto-fix**: Some issues require human judgment (logic errors, architectural decisions)
2. **Breaking changes**: Deprecated API replacements may require testing
3. **Generated files**: Skip files in `.dart_tool/`, `build/`, `*.g.dart`, `*.freezed.dart`
4. **Conflicting fixes**: Prioritize errors over lints
5. **Large refactors**: For issues affecting 10+ files, ask user for confirmation first

## Expected Outcome

After running this command:
- ✅ `flutter analyze` shows 0 errors
- ✅ All warnings resolved (or documented if manual fix needed)
- ✅ Code follows Flutter/Dart linting rules
- ✅ Project is ready for commit/deployment
- ✅ Detailed report of changes made

## Example Usage

```bash
# User runs the command
/analyze-and-fix

# Agent executes:
# 1. flutter analyze
# 2. Fixes 15 errors, 23 warnings, 42 lints
# 3. flutter analyze (verify)
# 4. Shows summary report
```

## Important Notes

- **Always use the flutter-specialist agent** - it has the necessary tools
- **Make incremental changes** - fix and verify in batches
- **Preserve code intent** - don't change logic, only fix issues
- **Test after fixing** - suggest running `flutter test` if tests exist
- **Use Dart MCP analysis tools** when available for smarter fixes
- **Back up important changes** - suggest creating a git commit before major fixes
