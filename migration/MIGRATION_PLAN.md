# Chakra UI to ShadCN + Tailwind CSS Migration Plan

## Overview
This document outlines the comprehensive migration strategy for transitioning the Sqeeze LMS project from Chakra UI v3 + Emotion to ShadCN + Tailwind CSS.

## Prerequisites Checklist

### Phase 0: Preparation & Setup
- [ ] **Backup current codebase** - Create migration branch from `dev`
- [ ] **Audit current component usage** - Document all Chakra components used
- [ ] **Review ShadCN component availability** - Map Chakra components to ShadCN equivalents
- [ ] **Install Tailwind CSS dependencies**
  - [ ] `npm install tailwindcss postcss autoprefixer`
  - [ ] `npx tailwindcss init -p`
- [ ] **Install ShadCN CLI and dependencies**
  - [ ] `npx shadcn-ui@latest init`
  - [ ] Configure `components.json`
- [ ] **Setup Tailwind configuration**
  - [ ] Configure `tailwind.config.js` with design tokens
  - [ ] Add Tailwind directives to globals.css
- [ ] **Create component mapping documentation**

## Phase 1: Infrastructure Setup

### 1.1 Package Management
- [ ] **Remove Chakra UI dependencies**
  - [ ] `npm uninstall @chakra-ui/react @chakra-ui/next-js`
  - [ ] `npm uninstall @emotion/react @emotion/styled`
  - [ ] `npm uninstall framer-motion` (if only used by Chakra)
- [ ] **Install ShadCN base dependencies**
  - [ ] `npm install class-variance-authority clsx tailwind-merge`
  - [ ] `npm install lucide-react` (for icons)
  - [ ] `npm install @radix-ui/react-*` (core primitives)

### 1.2 Configuration Files
- [ ] **Update `tailwind.config.js`**
  - [ ] Configure design system colors
  - [ ] Set up typography scale
  - [ ] Configure spacing, shadows, and border radius
  - [ ] Add animation configurations
- [ ] **Create `lib/utils.ts`** - cn() utility function
- [ ] **Update `globals.css`**
  - [ ] Remove Chakra imports
  - [ ] Add Tailwind base styles
  - [ ] Define CSS custom properties for theming
- [ ] **Configure PostCSS** - Ensure Tailwind processing

### 1.3 Provider Updates
- [ ] **Update `src/app/providers.tsx`**
  - [ ] Remove ChakraProvider
  - [ ] Remove ColorModeProvider
  - [ ] Add ThemeProvider (if using dark mode)
  - [ ] Update emotion cache removal

## Phase 2: Core Component Migration

### 2.1 Install Base ShadCN Components
- [ ] `npx shadcn-ui add button`
- [ ] `npx shadcn-ui add input`
- [ ] `npx shadcn-ui add card`
- [ ] `npx shadcn-ui add dialog`
- [ ] `npx shadcn-ui add dropdown-menu`
- [ ] `npx shadcn-ui add form`
- [ ] `npx shadcn-ui add alert`
- [ ] `npx shadcn-ui add badge`
- [ ] `npx shadcn-ui add tabs`
- [ ] `npx shadcn-ui add table`
- [ ] `npx shadcn-ui add toast`
- [ ] `npx shadcn-ui add avatar`
- [ ] `npx shadcn-ui add skeleton`

### 2.2 Custom Component Creation
- [ ] **Create layout components**
  - [ ] `Container` (replace Chakra Container)
  - [ ] `Stack/VStack/HStack` equivalents
  - [ ] `Grid` and `GridItem` equivalents
  - [ ] `Flex` component wrapper
- [ ] **Create typography components**
  - [ ] `Heading` component
  - [ ] `Text` component
  - [ ] `Link` component
- [ ] **Create feedback components**
  - [ ] `Loading` spinner component
  - [ ] `ErrorBoundary` component
  - [ ] Custom `Toast` configurations

### 2.3 Icon System Migration
- [ ] **Replace Chakra icons**
  - [ ] Audit all icon usage
  - [ ] Map to Lucide React equivalents
  - [ ] Create icon component wrapper
  - [ ] Update all icon imports

## Phase 3: Component-by-Component Migration

### 3.1 Authentication Components (`src/components/auth/`)
- [ ] **LoginForm.tsx**
  - [ ] Replace Chakra form components
  - [ ] Update to ShadCN Form + Input
  - [ ] Migrate styling to Tailwind
- [ ] **SignupForm.tsx**
  - [ ] Replace form components
  - [ ] Update validation styling
- [ ] **SocialLoginButton.tsx**
  - [ ] Replace Button component
  - [ ] Update icon system
- [ ] **RoleGuard.tsx**
  - [ ] Update conditional rendering styling

### 3.2 Common Components (`src/components/common/`)
- [ ] **ProfileImage.tsx**
  - [ ] Replace Avatar component
  - [ ] Update image handling
- [ ] **FileUpload.tsx**
  - [ ] Replace upload UI components
  - [ ] Update drag-and-drop styling
  - [ ] Migrate progress indicators
- [ ] **Navigation components**
  - [ ] Header/Navbar
  - [ ] Sidebar navigation
  - [ ] Breadcrumbs
- [ ] **Modal components**
  - [ ] Replace Modal with Dialog
  - [ ] Update overlay styling

### 3.3 UI Components (`src/components/ui/`)
- [ ] **Form components**
  - [ ] Input variants
  - [ ] Textarea
  - [ ] Select/Dropdown
  - [ ] Checkbox and Radio
  - [ ] Form validation display
- [ ] **Data display**
  - [ ] Table components
  - [ ] Card variants
  - [ ] Badge components
  - [ ] Avatar components
- [ ] **Navigation**
  - [ ] Tab components
  - [ ] Pagination
  - [ ] Breadcrumb
- [ ] **Feedback**
  - [ ] Alert components
  - [ ] Toast notifications
  - [ ] Loading states
  - [ ] Empty states

### 3.4 Feature-Specific Components
- [ ] **Journey components**
  - [ ] JourneyCard
  - [ ] JourneyHeader
  - [ ] JourneyNavigation
  - [ ] JourneySettings
- [ ] **Mission components**
  - [ ] MissionCard
  - [ ] MissionEditor
  - [ ] QuestionBuilder
  - [ ] Question type inputs
- [ ] **Post components**
  - [ ] PostCard
  - [ ] PostEditor
  - [ ] PostDisplay
  - [ ] Comment components

## Phase 4: Page-Level Migration

### 4.1 Authentication Pages (`src/app/(auth)/`)
- [ ] **login/page.tsx**
- [ ] **signup/page.tsx**
- [ ] **login/info/page.tsx**
- [ ] **layout.tsx** updates

### 4.2 Dashboard Pages (`src/app/(home)/`)
- [ ] **Main dashboard layout**
- [ ] **Tab navigation system**
- [ ] **Class tab components**
- [ ] **Notifications tab**
- [ ] **Profile tab**

### 4.3 Journey Pages (`src/app/journey/`)
- [ ] **[slug]/[id]/page.tsx**
- [ ] **Feed tab**
- [ ] **Mission tab**
- [ ] **Plan tab**
- [ ] **Dashboard tab**
- [ ] **Settings tab**
- [ ] **Teacher pages**

### 4.4 Admin Pages (`src/app/(admin)/`)
- [ ] **Admin dashboard**
- [ ] **User management**
- [ ] **Organization management**
- [ ] **Analytics pages**

## Phase 5: Styling & Theme Migration

### 5.1 Design System Migration
- [ ] **Color system**
  - [ ] Map Chakra color tokens to Tailwind
  - [ ] Update CSS custom properties
  - [ ] Configure dark mode variants
- [ ] **Typography system**
  - [ ] Configure font families
  - [ ] Set up responsive typography
  - [ ] Update heading hierarchy
- [ ] **Spacing system**
  - [ ] Verify Tailwind spacing matches design
  - [ ] Update component spacing
- [ ] **Border radius and shadows**
  - [ ] Configure design tokens
  - [ ] Update component styling

### 5.2 Responsive Design
- [ ] **Review all responsive breakpoints**
- [ ] **Update responsive utility usage**
- [ ] **Test mobile layouts**
- [ ] **Update container queries if needed**

### 5.3 Animation & Transitions
- [ ] **Replace Framer Motion animations**
- [ ] **Configure Tailwind animations**
- [ ] **Update transition timing**
- [ ] **Test interaction states**

## Phase 6: Advanced Features

### 6.1 Form System Migration
- [ ] **React Hook Form integration**
  - [ ] Update form components
  - [ ] Migrate validation display
  - [ ] Update error handling
- [ ] **Form builder for missions**
  - [ ] Question type components
  - [ ] Dynamic form generation
  - [ ] Validation schemas

### 6.2 Rich Text Editor
- [ ] **Tiptap editor styling**
  - [ ] Update editor UI components
  - [ ] Migrate toolbar styling
  - [ ] Update content styling

### 6.3 Data Visualization
- [ ] **Chart components** (if any)
- [ ] **Progress indicators**
- [ ] **Statistics displays**

## Phase 7: Testing & Quality Assurance

### 7.1 Component Testing
- [ ] **Test all migrated components**
- [ ] **Verify accessibility compliance**
- [ ] **Test keyboard navigation**
- [ ] **Validate screen reader compatibility**

### 7.2 Cross-Browser Testing
- [ ] **Chrome/Chromium**
- [ ] **Firefox**
- [ ] **Safari**
- [ ] **Mobile browsers**

### 7.3 Performance Testing
- [ ] **Bundle size analysis**
- [ ] **Core Web Vitals**
- [ ] **Lighthouse audit**
- [ ] **Load testing**

### 7.4 Visual Regression Testing
- [ ] **Compare before/after screenshots**
- [ ] **Test responsive layouts**
- [ ] **Verify design consistency**

## Phase 8: Cleanup & Optimization

### 8.1 Code Cleanup
- [ ] **Remove unused imports**
- [ ] **Remove Chakra-related files**
- [ ] **Update TypeScript types**
- [ ] **Clean up CSS files**

### 8.2 Documentation Updates
- [ ] **Update component documentation**
- [ ] **Update CLAUDE.md**
- [ ] **Create component usage guide**
- [ ] **Update development guidelines**

### 8.3 Performance Optimization
- [ ] **Tree-shake unused components**
- [ ] **Optimize bundle splitting**
- [ ] **Update build configuration**

## Phase 9: Deployment & Monitoring

### 9.1 Staging Deployment
- [ ] **Deploy to staging environment**
- [ ] **Run full test suite**
- [ ] **User acceptance testing**
- [ ] **Performance monitoring**

### 9.2 Production Deployment
- [ ] **Create deployment plan**
- [ ] **Set up rollback strategy**
- [ ] **Monitor error rates**
- [ ] **Track performance metrics**

## Risk Mitigation

### High-Risk Areas
- [ ] **Complex form interactions**
- [ ] **Mission question builder**
- [ ] **File upload components**
- [ ] **Rich text editor integration**
- [ ] **Authentication flows**

### Rollback Plan
- [ ] **Maintain feature branches**
- [ ] **Document breaking changes**
- [ ] **Create rollback procedures**
- [ ] **Test rollback scenarios**

## Success Criteria

### Technical Goals
- [ ] **Bundle size reduction** (target: 20-30% smaller)
- [ ] **Performance improvement** (target: 10-15% faster loading)
- [ ] **Zero accessibility regressions**
- [ ] **100% feature parity**

### User Experience Goals
- [ ] **Consistent visual design**
- [ ] **Improved mobile experience**
- [ ] **Faster interaction feedback**
- [ ] **Better dark mode support**

## Timeline Estimation

### Phase Duration (estimated)
- **Phase 0-1**: 1-2 weeks (Setup & Infrastructure)
- **Phase 2**: 1 week (Base Components)
- **Phase 3**: 3-4 weeks (Component Migration)
- **Phase 4**: 2-3 weeks (Page Migration)
- **Phase 5**: 1-2 weeks (Styling & Theme)
- **Phase 6**: 1-2 weeks (Advanced Features)
- **Phase 7**: 1-2 weeks (Testing & QA)
- **Phase 8**: 1 week (Cleanup)
- **Phase 9**: 1 week (Deployment)

**Total Estimated Duration**: 12-18 weeks

## Notes

### Component Mapping Reference
| Chakra UI | ShadCN/Custom Equivalent |
|-----------|-------------------------|
| Button | Button |
| Input | Input |
| Box | div with Tailwind |
| Flex | div with flex classes |
| Grid | div with grid classes |
| Text | Custom Text component |
| Heading | Custom Heading component |
| Modal | Dialog |
| Toast | Toast + Sonner |
| Accordion | Accordion |
| Tabs | Tabs |
| Menu | DropdownMenu |
| Avatar | Avatar |
| Badge | Badge |
| Card | Card |
| Alert | Alert |

### Key Dependencies to Monitor
- `@radix-ui/*` packages for primitives
- `class-variance-authority` for component variants
- `tailwind-merge` for class merging
- `lucide-react` for icons

### Migration Strategy
1. **Gradual migration** - Component by component
2. **Feature flags** - Allow rollback of individual components
3. **Parallel development** - Maintain both systems temporarily
4. **Progressive enhancement** - Start with simpler components
5. **User testing** - Validate each major milestone