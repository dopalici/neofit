# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Neofit is a React-based fitness application with iOS integration via Capacitor that provides personalized health and fitness tracking, analysis, and recommendations. The application includes:

1. Health and fitness data integration with Apple HealthKit
2. Interactive 3D body models and exercise visualization
3. Nutrition tracking and analysis
4. Habit formation and tracking system
5. AI-powered fitness advisor chatbot
6. Knowledge base integration from Obsidian markdown files

## Development Commands

### Core Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test
```

### iOS Development

```bash
# Sync web build with iOS project
npx cap sync ios

# Open iOS project in Xcode
npx cap open ios

# Live reload for iOS development
npx cap run ios --livereload --external
```

## Application Structure

### Main Pages and Components

1. **Landing Page**: `src/components/landing/LandingPage.jsx`
   - Entry point for the application
   - Routes to dashboard

2. **Dashboard**: `src/components/dashboard/Dashboard.jsx`
   - Main interface with multiple tabs:
     - Main Dashboard
     - Habit System
     - Nutrition
     - Health Data

3. **Header**: `src/components/dashboard/Header.jsx` 
   - Contains navigation and settings buttons
   - Opens AI Chatbot and Integration Modal

4. **Panels**:
   - `BiometricPanel.jsx`: Shows user metrics and biometric data
   - `EnhancementMetricsPanel.jsx`: Shows fitness enhancement metrics
   - `GoalsPanel.jsx`: Displays user goals and progress
   - `NutritionPanel.jsx`: Shows nutrition data and macros
   - `EnhancedNutritionPanel.jsx`: Enhanced version with more detailed info
   - `SleepAnalysis.jsx`: Sleep data analysis and recommendations

5. **3D Visualization**: `src/components/3d/`
   - `AnimatedBiometricModel.jsx`: 3D human model with biometric data
   - `HumanBodyModelViewer.jsx`: Generic 3D body model viewer
   - `ExerciseForm.jsx`: Exercise form visualization

6. **Habit System**: `src/components/habit/`
   - `HabitStreakTracker.jsx`: Tracks consistency streaks
   - `DailyCheckIn.jsx`: Daily check-in functionality
   - `ProgressiveChallenge.jsx`: Progressive difficulty challenges
   - `SmartReminders.jsx`: Contextual reminders
   - `VariableRewardsSystem.jsx`: Reward system for habit formation

7. **AI Chatbot**: `src/components/dashboard/AIChatbot.jsx`
   - Provides personalized health and fitness advice
   - Integrates with knowledge base

8. **Knowledge Base**:
   - `src/components/settings/KnowledgeBaseImporter.jsx`: Imports knowledge files
   - Knowledge base content from Obsidian markdown files (`fitlib/`)

## Architecture Overview

### Core Technologies

- **React**: Frontend framework
- **Three.js/React Three Fiber**: 3D visualization 
- **Capacitor**: Native mobile integration
- **HealthKit**: iOS health data access

### Key Modules

1. **Health Data Integration**
   - `src/services/appleHealthService.js`: Bridge to HealthKit
   - `src/hooks/useAppleHealth.js`: React hook for health data access
   - `plugins/capacitor-healthkit/`: Custom Capacitor plugin

2. **3D Visualization**
   - `src/components/3d/`: 3D models and visualization components
   - `src/hooks/useBodyModel.js`: Model state management

3. **Dashboard and Analytics**
   - `src/components/dashboard/`: Dashboard components
   - `src/services/healthDataProcessor.js`: Health data analysis

4. **Knowledge Base**
   - `src/services/knowledgeBaseService.js`: Knowledge base management
   - `src/services/obsidianParser.js`: Parses Obsidian markdown files

5. **AI Chatbot**
   - `src/components/dashboard/AIChatbot.jsx`: Chatbot UI
   - `src/services/chatbotService.js`: Chat functionality

6. **Habit System**
   - `src/components/habit/`: Habit tracking components
   - `src/services/habitService.js`: Habit tracking functionality

### Data Flow

1. Health data is accessed via Capacitor plugins and Apple HealthKit
2. Data is processed in service layer and made available through hooks
3. UI components consume the processed data and render visualizations
4. Knowledge base content is parsed from markdown files and used for recommendations

## Custom Capacitor Plugin

The project includes a custom Capacitor plugin for HealthKit integration:

- Plugin located at `plugins/capacitor-healthkit/`
- Swift implementation in `plugins/capacitor-healthkit/ios/Plugin/`
- JavaScript bridge in `plugins/capacitor-healthkit/src/index.ts`

## Known Issues and Development Status

1. Some components currently use mock data instead of real data:
   - Dashboard metrics (symmetry, potential, etc.)
   - Activity log
   - Some fitness goals

2. Integration status:
   - Apple HealthKit integration is partially implemented
   - Nutrition data integration is in progress
   - Knowledge base import functionality is implemented but needs testing

3. The application uses a custom webpack configuration through `config-overrides.js` to handle Node.js module fallbacks

4. iOS HealthKit permissions are defined in `capacitor.config.ts`