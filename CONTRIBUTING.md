# Contributing to Personal Finance Tracker

Thank you for your interest in contributing to the Personal Finance Tracker! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Process](#contributing-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Issue Reporting](#issue-reporting)
- [Pull Request Process](#pull-request-process)
- [Community](#community)

## Code of Conduct

This project follows a standard code of conduct. By participating, you are expected to uphold this code:

### Our Pledge
- **Be respectful**: Treat all contributors with respect and kindness
- **Be inclusive**: Welcome contributors from all backgrounds and experience levels
- **Be collaborative**: Work together constructively and share knowledge
- **Be professional**: Maintain professional communication in all interactions

### Unacceptable Behavior
- Harassment, discrimination, or personal attacks
- Trolling, insulting comments, or inflammatory language
- Publishing private information without permission
- Any conduct that would be inappropriate in a professional setting

## Getting Started

### Prerequisites
- **Node.js** 20.x or higher
- **Git** for version control
- **Docker** (optional, for containerized development)
- **Text Editor/IDE** (VS Code recommended)

### Fork and Clone
```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/your-username/finance-tracker.git
cd finance-tracker

# Add upstream remote
git remote add upstream https://github.com/original-owner/finance-tracker.git
```

### Development Setup
```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev

# Open browser to http://localhost:5000
```

## Development Setup

### Environment Configuration
```env
# Development environment
NODE_ENV=development
PORT=5000
SESSION_SECRET=your-development-secret

# Database (choose one)
# SQLite (default for development)
# SUPABASE_URL=your-supabase-url
# SUPABASE_ANON_KEY=your-anon-key
# DATABASE_URL=postgresql://...
```

### VS Code Setup
Recommended extensions:
- **TypeScript**: Enhanced TypeScript support
- **Prettier**: Code formatting
- **ESLint**: Code linting
- **Auto Rename Tag**: HTML/JSX tag management
- **Tailwind CSS IntelliSense**: CSS class suggestions

### Workspace Settings
```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

## Contributing Process

### 1. Choose an Issue
- Browse [open issues](https://github.com/your-repo/issues)
- Look for issues labeled `good first issue` for beginners
- Comment on the issue to indicate you're working on it

### 2. Create a Branch
```bash
# Update your main branch
git checkout main
git pull upstream main

# Create feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

### 3. Make Changes
- Follow the coding standards outlined below
- Write tests for new functionality
- Update documentation as needed
- Test your changes thoroughly

### 4. Commit Changes
```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add transaction filtering by date range

- Add date picker components for start/end dates
- Implement filtering logic in transaction API
- Update UI to show filtered results
- Add tests for date filtering functionality

Closes #123"
```

### 5. Push and Create PR
```bash
# Push to your fork
git push origin feature/your-feature-name

# Create pull request on GitHub
```

## Coding Standards

### TypeScript Guidelines
- Use TypeScript for all new code
- Define interfaces for all data structures
- Use proper typing, avoid `any` where possible
- Export types from shared schema when appropriate

```typescript
// Good
interface TransactionFormData {
  amount: number;
  description: string;
  categoryId: string;
  date: string;
}

// Bad
const formData: any = { ... };
```

### React Guidelines
- Use functional components with hooks
- Implement proper error boundaries
- Use React Query for API calls
- Follow component composition patterns

```tsx
// Good
interface TransactionListProps {
  userId: string;
  filters?: TransactionFilters;
}

export function TransactionList({ userId, filters }: TransactionListProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/transactions', userId, filters],
  });

  if (isLoading) return <TransactionListSkeleton />;
  if (error) return <ErrorMessage error={error} />;
  
  return (
    <div className="space-y-2">
      {data?.map(transaction => (
        <TransactionItem key={transaction.id} transaction={transaction} />
      ))}
    </div>
  );
}
```

### CSS Guidelines
- Use Tailwind CSS classes exclusively
- Prefer semantic class names for complex components
- Use CSS variables for theme customization
- Follow mobile-first responsive design

```tsx
// Good
<div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
    Transaction Details
  </h3>
</div>

// Bad
<div style={{ backgroundColor: 'white', padding: '16px' }}>
```

### API Guidelines
- Use RESTful endpoints with proper HTTP methods
- Validate all input with Zod schemas
- Return consistent response formats
- Include proper error handling

```typescript
// Good
app.post('/api/transactions', async (req, res) => {
  try {
    const data = createTransactionSchema.parse(req.body);
    const transaction = await storage.createTransaction(data);
    res.status(201).json({ data: transaction });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### Database Guidelines
- Use Drizzle ORM for all database operations
- Define schemas in `shared/schema.ts`
- Use proper foreign key relationships
- Implement database transactions for complex operations

```typescript
// Good
export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  description: text('description'),
  date: date('date').notNull(),
  accountId: text('account_id').references(() => accounts.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
});
```

## Testing Guidelines

### Unit Tests
- Write tests for utility functions
- Test component logic and rendering
- Use React Testing Library for component tests
- Mock external dependencies appropriately

```typescript
// Example: utility function test
describe('formatCurrency', () => {
  it('should format positive amounts correctly', () => {
    expect(formatCurrency(123.45)).toBe('$123.45');
  });

  it('should format negative amounts correctly', () => {
    expect(formatCurrency(-123.45)).toBe('-$123.45');
  });
});

// Example: component test
describe('TransactionItem', () => {
  it('should render transaction details', () => {
    const transaction = {
      id: '1',
      amount: -25.50,
      description: 'Coffee Shop',
      date: '2025-01-15',
      type: 'expense' as const,
    };

    render(<TransactionItem transaction={transaction} />);
    
    expect(screen.getByText('Coffee Shop')).toBeInTheDocument();
    expect(screen.getByText('-$25.50')).toBeInTheDocument();
  });
});
```

### Integration Tests
- Test API endpoints with supertest
- Use test database for integration tests
- Test complete user workflows
- Verify database operations

```typescript
// Example: API integration test
describe('POST /api/transactions', () => {
  it('should create a new transaction', async () => {
    const transactionData = {
      amount: -50.00,
      description: 'Test expense',
      date: '2025-01-15',
      type: 'expense',
      accountId: 'test-account-id',
    };

    const response = await request(app)
      .post('/api/transactions')
      .send(transactionData)
      .expect(201);

    expect(response.body.data).toMatchObject(transactionData);
  });
});
```

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- TransactionItem.test.tsx
```

## Documentation

### Code Documentation
- Use JSDoc comments for complex functions
- Document component props with TypeScript interfaces
- Add inline comments for business logic
- Update README.md for architectural changes

```typescript
/**
 * Calculates the progress percentage for a financial goal
 * @param currentAmount - The current saved amount
 * @param targetAmount - The target goal amount
 * @returns Progress percentage (0-100)
 */
function calculateGoalProgress(currentAmount: number, targetAmount: number): number {
  if (targetAmount <= 0) return 0;
  return Math.min(100, Math.max(0, (currentAmount / targetAmount) * 100));
}
```

### API Documentation
- Update `docs/api.md` for new endpoints
- Include request/response examples
- Document query parameters and filters
- Add error response formats

### User Documentation
- Update user-facing documentation for new features
- Include screenshots for UI changes
- Write clear setup and configuration instructions
- Provide troubleshooting guides

## Issue Reporting

### Bug Reports
Use the bug report template:

```markdown
**Bug Description**
A clear and concise description of the bug.

**Steps to Reproduce**
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected Behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment**
- OS: [e.g. macOS, Windows, Ubuntu]
- Browser: [e.g. Chrome, Firefox]
- Node.js Version: [e.g. 20.1.0]
- Application Version: [e.g. 1.0.0]

**Additional Context**
Add any other context about the problem.
```

### Feature Requests
Use the feature request template:

```markdown
**Feature Description**
A clear and concise description of the feature.

**Problem Statement**
What problem does this feature solve?

**Proposed Solution**
How would you like this to work?

**Alternatives Considered**
What other solutions have you considered?

**Additional Context**
Add any other context or screenshots.
```

## Pull Request Process

### PR Template
```markdown
## Description
Brief description of the changes.

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] New tests added for new functionality
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or documented)

## Screenshots (if applicable)
Add screenshots of UI changes.

## Related Issues
Closes #123
Related to #456
```

### Review Process
1. **Automated Checks**: All CI/CD checks must pass
2. **Code Review**: At least one maintainer review required
3. **Testing**: Verify tests pass and functionality works
4. **Documentation**: Ensure documentation is updated
5. **Merge**: Squash and merge after approval

### Review Criteria
Reviewers will check for:
- Code quality and style compliance
- Test coverage and quality
- Performance implications
- Security considerations
- Documentation completeness
- Breaking change impact

## Community

### Communication Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and community support
- **Pull Requests**: Code review and collaboration

### Getting Help
- Check existing [documentation](README.md)
- Search [existing issues](https://github.com/your-repo/issues)
- Ask questions in [GitHub Discussions](https://github.com/your-repo/discussions)
- Join community discussions

### Recognition
Contributors are recognized through:
- GitHub contributor graphs
- Release notes acknowledgments
- Community shoutouts
- Maintainer nominations for significant contributions

## Development Workflow

### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test improvements

### Commit Messages
Follow conventional commits:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Maintenance tasks

### Release Process
1. Version bump in `package.json`
2. Update `CHANGELOG.md`
3. Create release tag
4. Update documentation
5. Deploy to production

## Questions?

If you have any questions not covered in this guide:
1. Check the [README.md](README.md)
2. Search existing [issues](https://github.com/your-repo/issues)
3. Create a new [discussion](https://github.com/your-repo/discussions)
4. Reach out to maintainers

Thank you for contributing to Personal Finance Tracker! 🎉

---

**Happy coding!** 💻