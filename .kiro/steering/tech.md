# Technology Stack

## Core Technologies
- **React Native 0.79.5** - Cross-platform mobile development
- **Expo SDK 53** - Development platform and build tools
- **TypeScript** - Static typing and enhanced developer experience
- **Supabase** - Backend as a Service (authentication, database, real-time)
- **PostgreSQL** - Relational database via Supabase

## UI & Styling
- **NativeWind 4.1** - Tailwind CSS for React Native
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Expo Vector Icons** - Icon library
- **React Native Safe Area Context** - Safe area handling
- **React Native Gesture Handler** - Touch and gesture system

## Navigation & State
- **Expo Router 5.1** - File-based routing system
- **React Context** - State management for authentication
- **AsyncStorage** - Local storage for session persistence

## Development Tools
- **ESLint** - Code linting with TypeScript and React Native rules
- **Prettier** - Code formatting
- **Metro** - JavaScript bundler with NativeWind integration
- **Babel** - JavaScript compilation with Expo preset

## Common Commands

### Development
```bash
npm start          # Start Expo development server
npm run android    # Run on Android device/emulator
npm run ios        # Run on iOS device/simulator
npm run web        # Run in web browser
```

### Code Quality
```bash
npx eslint .       # Run linting
npx prettier --write .  # Format code
```

## Configuration Notes
- Uses Hermes JavaScript engine for better performance
- Configured for new React Native architecture
- Custom color palette defined in Tailwind config
- Supabase credentials configured via Expo Constants
- File-based routing with Expo Router
- Safe area handling for cross-platform compatibility