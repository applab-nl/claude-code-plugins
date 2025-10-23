# Flutter-Dev Plugin

**Flutter and Dart Development Specialist** - A comprehensive Claude Code plugin that provides expert Flutter/Dart development capabilities with integrated MCP server for code analysis, package management, testing, runtime introspection, and cross-platform mobile development.

## Overview

The Flutter-Dev plugin enhances your Flutter and Dart development workflow by:
- Providing a specialized **flutter-specialist** agent with deep Flutter & Dart expertise
- Integrating the **Dart MCP server** for powerful development tools
- Enabling automatic code analysis and error fixing
- Offering intelligent package discovery from pub.dev
- Supporting runtime application debugging and introspection
- Automating testing and code formatting

## Features

### 📱 Specialized Flutter & Dart Agent

The **flutter-specialist** agent automatically activates when working in Flutter projects and provides:
- **Widget Composition**: Best practices for building reusable Flutter widgets
- **State Management**: Riverpod, BLoC, Provider patterns
- **Platform-Specific Code**: Android and iOS integration
- **Performance Optimization**: Rendering, memory, app size
- **Supabase Integration**: Auth, database, storage, real-time subscriptions
- **Testing**: Widget tests, integration tests, unit tests
- **Code Quality**: Automatic analysis and formatting

### 🔧 Integrated Dart MCP Tools

#### 1. Code Analysis
Analyze and fix errors automatically:
- Detect compilation and syntax errors
- Apply automatic fixes
- Self-correction during code generation
- Comprehensive code quality checks

#### 2. Symbol Resolution
Access documentation and signatures:
- Look up class and method documentation
- Get function signatures
- Retrieve type information
- API reference access

#### 3. Application Introspection
Debug running Flutter apps:
- Real-time app debugging
- Layout issue detection
- Runtime error analysis
- Widget tree inspection

#### 4. Package Management
Intelligent pub.dev integration:
- Search for packages by use case
- Automated dependency management
- Add packages to pubspec.yaml
- Generate integration boilerplate

#### 5. Testing
Automated test execution:
- Run widget and unit tests
- Analyze test failures
- Coverage reporting
- Test diagnostics

#### 6. Code Formatting
Enforce Dart style guide:
- Automatic code formatting
- Style consistency
- Format before delivery

## Installation

### From Marketplace

```bash
/plugin marketplace add applab-nl/claude-code-plugins
/plugin install flutter-dev@applab-plugins
```

### Manual Installation

1. Clone this repository
2. Copy the `flutter-dev` directory to your Claude Code plugins location
3. Ensure Dart SDK 3.9+ is installed

## Requirements

- **Claude Code CLI**
- **Dart SDK 3.9+** (for MCP server)
- **Flutter SDK** (for Flutter projects)

## Usage

### Automatic Agent Activation

The **flutter-specialist** agent automatically activates when:
- `pubspec.yaml` exists in project root
- `.dart` files are present
- Flutter project structure detected (`lib/`, `test/`, `android/`, `ios/`)

### Example Workflows

#### 1. Building a Flutter Widget with Code Analysis

```
User: Create a user profile card widget

flutter-specialist:
I'll create a Flutter widget with proper structure and analyze it for quality.

```dart
import 'package:flutter/material.dart';

class UserProfileCard extends StatelessWidget {
  const UserProfileCard({
    super.key,
    required this.name,
    required this.email,
    required this.avatarUrl,
    this.onTap,
  });

  final String name;
  final String email;
  final String avatarUrl;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            children: [
              CircleAvatar(
                radius: 30,
                backgroundImage: NetworkImage(avatarUrl),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      email,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right),
            ],
          ),
        ),
      ),
    );
  }
}
```

[Runs MCP code analysis]
✓ No errors found! Code is production-ready.
```

#### 2. Finding and Adding Packages

```
User: I need state management for my Flutter app

flutter-specialist:
I'll search pub.dev for state management packages.

[Uses MCP package search]

Found popular state management packages:
1. **riverpod** - Type-safe, compile-time safe state management (Most recommended)
2. **bloc** - Business logic component pattern
3. **provider** - Simple dependency injection

I recommend Riverpod for most Flutter apps. Let me add it to your project.

[Uses MCP to add package]

Added to pubspec.yaml:
```yaml
dependencies:
  flutter_riverpod: ^2.4.0
  riverpod_annotation: ^2.3.0

dev_dependencies:
  riverpod_generator: ^2.3.0
  build_runner: ^2.4.0
```

Here's a basic setup example:

```dart
import 'package:flutter_riverpod/flutter_riverpod.dart';

// Provider
final counterProvider = StateProvider<int>((ref) => 0);

// Usage
class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return ProviderScope(
      child: MaterialApp(
        home: CounterScreen(),
      ),
    );
  }
}

class CounterScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final count = ref.watch(counterProvider);

    return Scaffold(
      body: Center(child: Text('Count: $count')),
      floatingActionButton: FloatingActionButton(
        onPressed: () => ref.read(counterProvider.notifier).state++,
        child: Icon(Icons.add),
      ),
    );
  }
}
```
```

#### 3. Debugging Runtime Errors

```
User: My Flutter app has a layout overflow error

flutter-specialist:
Let me use app introspection to analyze the running app.

[Uses MCP app introspection]

Found layout issue:
- Widget: Row in MessageBubble
- Error: A RenderFlex overflowed by 45 pixels on the right
- Cause: Text widget not wrapped in Flexible/Expanded

Here's the fix:

```dart
// Before (causes overflow)
Row(
  children: [
    Icon(Icons.person),
    Text(message.text), // Can overflow
  ],
)

// After (fixed)
Row(
  children: [
    Icon(Icons.person),
    Expanded(
      child: Text(
        message.text,
        overflow: TextOverflow.ellipsis,
        maxLines: 3,
      ),
    ),
  ],
)
```

[Applies fix and hot-reloads]

✓ Layout overflow resolved! Widget now renders correctly.
```

#### 4. Integrating Supabase

```
User: Set up Supabase authentication in my Flutter app

flutter-specialist:
I'll help you integrate Supabase authentication.

[Searches for supabase_flutter package]
[Adds package to pubspec.yaml]

Setup code:

```dart
import 'package:supabase_flutter/supabase_flutter.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_SUPABASE_ANON_KEY',
  );

  runApp(MyApp());
}

final supabase = Supabase.instance.client;

// Authentication service
class AuthService {
  Future<void> signUp(String email, String password) async {
    await supabase.auth.signUp(
      email: email,
      password: password,
    );
  }

  Future<void> signIn(String email, String password) async {
    await supabase.auth.signInWithPassword(
      email: email,
      password: password,
    );
  }

  Future<void> signOut() async {
    await supabase.auth.signOut();
  }

  Stream<AuthState> get authStateChanges =>
    supabase.auth.onAuthStateChange;
}
```

[Runs code analysis]
✓ Code validated successfully!
```

## MCP Tools Reference

### Code Analysis

**Always run before delivering code:**
```dart
// 1. Write Flutter code
// 2. MCP analyzes for errors
// 3. Apply automatic fixes
// 4. Verify no issues remain
```

### Package Search

**Find packages by use case:**
```dart
// Example: "http client flutter"
// Returns: dio, http, chopper
```

### App Introspection

**Debug running apps:**
```dart
// 1. Start app in debug mode
// 2. MCP inspects widget tree
// 3. Detect layout/runtime errors
// 4. Get fix suggestions
```

### Testing

**Run tests automatically:**
```dart
flutter test
// MCP analyzes results
// Provides failure diagnostics
```

### Formatting

**Apply Dart style guide:**
```dart
dart format .
// Ensures consistent code style
```

## Flutter Best Practices

### Widget Composition

```dart
// Good: Composable widgets with const constructors
class UserCard extends StatelessWidget {
  const UserCard({super.key, required this.user});

  final User user;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        title: Text(user.name),
        subtitle: Text(user.email),
      ),
    );
  }
}
```

### State Management with Riverpod

```dart
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'todos.g.dart';

@riverpod
class Todos extends _$Todos {
  @override
  Future<List<Todo>> build() async {
    return fetchTodos();
  }

  Future<void> addTodo(Todo todo) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() async {
      await createTodo(todo);
      return fetchTodos();
    });
  }
}
```

### Performance Optimization

```dart
// Use const constructors
const Text('Hello');

// Use ListView.builder for long lists
ListView.builder(
  itemCount: items.length,
  itemBuilder: (context, index) => ItemWidget(items[index]),
)

// Implement RepaintBoundary
RepaintBoundary(
  child: ComplexChart(data: data),
)
```

## Agent Capabilities

The **flutter-specialist** agent knows:

### Flutter Development
- Widget composition and architecture
- Material Design 3
- Responsive layouts
- Accessibility
- Platform-specific code (Android/iOS)

### State Management
- setState for simple state
- Riverpod for medium/complex apps
- BLoC pattern for enterprise apps
- Provider for dependency injection

### Backend Integration
- Supabase (auth, database, storage, real-time)
- RESTful APIs
- GraphQL
- WebSockets

### Testing
- Widget tests
- Integration tests
- Unit tests
- Test coverage

### Performance
- Rendering optimization
- Memory management
- App size reduction
- Profiling with DevTools

## Troubleshooting

### MCP Server Not Starting

If the Dart MCP server doesn't start:

```bash
# Check Dart SDK version (needs 3.9+)
dart --version

# Manually test MCP server
dart mcp-server
```

### Agent Not Activating

Ensure your project has:
- `pubspec.yaml` in root directory
- `.dart` files in project
- Flutter project structure

### Code Analysis Fails

The code analysis requires:
- Valid Dart/Flutter code
- No syntax errors
- Proper project structure

## Contributing

Contributions are welcome! Please submit issues and pull requests to the main repository.

## License

MIT License - See LICENSE file for details

## Version

Current version: 1.0.0

## Support

For issues, feature requests, or questions:
- GitHub Issues: https://github.com/applab-nl/claude-code-plugins/issues
- Dart MCP Server: https://dart.dev/tools/mcp-server
- Flutter Documentation: https://flutter.dev/docs

## Acknowledgments

This plugin integrates with the official Dart MCP server created by the Dart team.
