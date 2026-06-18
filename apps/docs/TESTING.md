# Testing Guide

This project uses Jest for the API and Vitest + React Testing Library for the web app.

## Quick Commands (Repo Root)

- Unit tests: `pnpm test`

## API Tests (NestJS + Jest)

Location: `apps/api`

- Unit tests: `pnpm --filter api test`
- Watch mode: `pnpm --filter api test:watch`
- Coverage: `pnpm --filter api test:cov`

Unit test files use `*.spec.ts` in `apps/api/src/**`.

## Web Unit Tests (Vitest + RTL)

Location: `apps/web`

- Unit tests: `pnpm --filter web test`
- Watch mode: `pnpm --filter web test:watch`
- Coverage: `pnpm --filter web test:cov`

Test files live in `apps/web/tests/**/*.test.tsx`.

## Coverage Policy

Coverage thresholds are set to 80% (lines, branches, functions, statements). Keep or improve coverage when adding new logic.

## Writing Tests: Best Practices

### General Principles

1. **Test behavior, not implementation** — Test what the code does, not how it does it
2. **Keep tests focused** — Each test should verify one behavior
3. **Use clear names** — Test names should describe what is being tested:
   - Good: `should return empty array when no documents exist`
   - Bad: `test1`, `returns data`
4. **Arrange-Act-Assert pattern** — Structure tests clearly:

   ```typescript
   // Arrange: set up data and mocks
   const input = { title: "Test" };

   // Act: call the function being tested
   const result = createDocument(input);

   // Assert: verify the result
   expect(result.title).toBe("Test");
   ```

### API Tests (NestJS + Jest)

**File location:** `apps/api/src/**/*.spec.ts`

**Example:**

```typescript
describe("DocumentService", () => {
  let service: DocumentService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [DocumentService],
    }).compile();
    service = module.get<DocumentService>(DocumentService);
  });

  it("should create a document", () => {
    const result = service.create({ title: "Test" });
    expect(result.title).toBe("Test");
  });

  it("should throw error if title is missing", () => {
    expect(() => service.create({})).toThrow();
  });
});
```

**Tips:**

- Use `beforeEach` to set up mocked dependencies
- Mock external services to isolate unit tests
- Test both success and error cases

### Web Tests (Vitest + React Testing Library)

**File location:** `apps/web/tests/**/*.test.tsx`

**Example:**

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';

describe('Button', () => {
  it('should render with label', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);

    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
```

**Tips:**

- Use semantic queries: `getByRole`, `getByLabelText` instead of `getByTestId`
- Test from the user's perspective (click, type, etc.)
- Use `userEvent` for realistic interactions, not `fireEvent`
- Mock API calls with MSW or `vi.mock()`

### Maintaining Coverage

- **New features:** Add tests before or alongside implementation
- **Bug fixes:** Add a test that reproduces the bug, then fix it
- **Refactoring:** Keep existing test coverage unchanged
- **Check coverage:** `pnpm --filter api test:cov` or `pnpm --filter web test:cov`
- **Goal:** Never decrease coverage; aim to improve it
