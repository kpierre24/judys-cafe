# Contributing to Judy's Cafe

Thank you for your interest in contributing to Judy's Cafe! This document provides guidelines and information for contributors.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Submitting Changes](#submitting-changes)
- [Reporting Issues](#reporting-issues)

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Git
- Basic knowledge of Vue 3, TypeScript, and Tailwind CSS

### Setting Up Your Development Environment

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/judys-cafe.git
   cd judys-cafe
   ```
3. **Add the original repository** as upstream:
   ```bash
   git remote add upstream https://github.com/original-owner/judys-cafe.git
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Start the development server**:
   ```bash
   npm run dev
   ```

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/feature-name` - Feature development
- `hotfix/fix-name` - Critical bug fixes

### Making Changes

1. **Create a feature branch** from `develop`:
   ```bash
   git checkout develop
   git pull upstream develop
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards

3. **Test your changes**:
   ```bash
   npm run test:unit
   npm run lint
   npm run type-check
   ```

4. **Commit your changes** with a descriptive message:
   ```bash
   git add .
   git commit -m "feat: add new feature description"
   ```

## Coding Standards

### TypeScript

- Use strict TypeScript configuration
- Prefer explicit types over `any`
- Use proper interface definitions
- Follow Vue 3 Composition API patterns

### Vue Components

- Use `<script setup>` syntax
- Implement proper TypeScript interfaces for props
- Follow shadcn-ui component patterns
- Maintain consistent naming conventions

### Styling

- Use Tailwind CSS v3 classes
- Follow the existing design system
- Ensure responsive design
- Maintain accessibility standards

### Code Formatting

- **ESLint**: All code must pass ESLint checks
- **Prettier**: All code must be formatted with Prettier
- **Run before committing**:
  ```bash
  npm run lint
  npx prettier --write .
  ```

### Architecture Guidelines

- **Branch-Aware Design**: All stores must maintain branch-specific data
- **Role-Based Access**: Implement proper permission checks
- **Component Composition**: Use provide/inject for complex components
- **Type Safety**: Prioritize TypeScript type safety

## Submitting Changes

### Pull Request Process

1. **Update your branch** with the latest changes:
   ```bash
   git checkout develop
   git pull upstream develop
   git checkout feature/your-feature-name
   git rebase develop
   ```

2. **Push your changes**:
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create a Pull Request** on GitHub with:
   - Clear title and description
   - Reference any related issues
   - Include screenshots for UI changes
   - List breaking changes if any

### Pull Request Checklist

- [ ] Code follows the project's coding standards
- [ ] All tests pass (`npm run test:unit`)
- [ ] ESLint passes (`npm run lint`)
- [ ] TypeScript compiles without errors (`npm run type-check`)
- [ ] Code is formatted with Prettier
- [ ] Documentation is updated if needed
- [ ] Branch is up to date with develop

## Reporting Issues

### Bug Reports

When reporting bugs, please include:

- **Environment**: OS, Node.js version, browser
- **Steps to reproduce** the issue
- **Expected behavior**
- **Actual behavior**
- **Screenshots** if applicable
- **Error messages** or console logs

### Feature Requests

When requesting features:

- **Use case**: Describe why this feature is needed
- **Proposed solution**: How should it work?
- **Alternatives**: What other approaches could work?
- **Additional context**: Any other relevant information

## Development Guidelines

### Store Architecture

- All stores must be branch-aware
- Use Pinia for state management
- Implement proper TypeScript interfaces
- Maintain data isolation between branches

### Component Development

- Follow shadcn-ui patterns adapted for Vue
- Use TypeScript for all components
- Implement proper prop validation
- Ensure accessibility compliance

### Testing

- Write unit tests for new functionality
- Test edge cases and error conditions
- Ensure tests pass in CI/CD pipeline
- Maintain good test coverage

### Performance

- Optimize bundle size
- Implement code splitting where appropriate
- Use lazy loading for routes
- Minimize re-renders and computations

## Questions?

If you have questions about contributing, please:

1. Check existing issues and discussions
2. Create a new issue with the "question" label
3. Reach out to the maintainers

Thank you for contributing to Judy's Cafe! 🎉