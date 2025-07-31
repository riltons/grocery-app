# Project Structure

## Directory Organization

### `/app` - Application Screens (Expo Router)
File-based routing structure following Expo Router conventions:
- `index.tsx` - Landing/splash screen
- `home.tsx` - Main dashboard after authentication
- `_layout.tsx` - Root layout with providers and navigation setup
- `(auth)/` - Authentication screens (login, register, password reset)
- `list/` - Shopping list management screens
- `product/` - Product catalog and management screens  
- `stores/` - Store management screens

### `/components` - Reusable UI Components
Shared components following consistent naming patterns:
- Modal components: `*Modal.tsx` (e.g., `CreateListModal.tsx`)
- Selector components: `*Selector.tsx` (e.g., `ProductSelector.tsx`)
- Container components: `Safe*.tsx` (e.g., `SafeContainer.tsx`)
- Interface components: `*Interface.tsx` (e.g., `AddProductInterface.tsx`)

### `/lib` - Business Logic & Services
Service layer organized by domain:
- `supabase.ts` - Database client configuration and type definitions
- `auth.ts` - Authentication service functions
- `lists.ts` - Shopping list operations
- `products.ts` - Product management operations
- `stores.ts` - Store management operations

### `/context` - React Context Providers
- `AuthContext.tsx` - Authentication state management

### `/docs` - Project Documentation
- Implementation plans, database schemas, configuration guides
- Portuguese documentation for project-specific details

## Naming Conventions

### Files & Components
- React components: PascalCase (e.g., `ProductSelector.tsx`)
- Service files: camelCase (e.g., `supabase.ts`)
- Screen files: camelCase (e.g., `home.tsx`)

### Database Types
- Exported from `lib/supabase.ts`
- PascalCase type names matching table structure
- Clear hierarchy: `GenericProduct` → `SpecificProduct`

## Architecture Patterns

### Component Structure
- Use `SafeContainer` for consistent safe area handling
- Implement proper TypeScript interfaces for props
- Follow React Native StyleSheet patterns when not using NativeWind

### Data Flow
- Supabase client for all backend operations
- Context providers for global state (authentication)
- Service functions in `/lib` for business logic
- Row Level Security (RLS) enforced on all database operations

### Routing
- File-based routing with Expo Router
- Grouped routes using parentheses: `(auth)`
- Dynamic routes with brackets: `[id].tsx`
- Layout files for shared navigation structure