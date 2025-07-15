# Documentation

This document defines what to document and how. The core principle: **Less is more**. Document only what is absolutely necessary, as outdated documentation is worse than no documentation.

## What NOT to Document

### 1. Self-Explanatory Code
```typescript
// ❌ Bad: Documenting the obvious
/**
 * Gets the user by ID
 * @param userId - The user ID
 * @returns The user
 */
function getUserById(userId: string): User {
  return database.users.findById(userId);
}

// ✅ Good: Code speaks for itself
function getUserById(userId: string): User {
  return database.users.findById(userId);
}
```

### 2. UI-Only Components
```typescript
// ❌ Bad: Documenting simple UI components
/**
 * Button component that renders a button element
 * @param label - The button label
 * @param onClick - Click handler
 */
function Button({ label, onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}

// ✅ Good: No documentation needed
function Button({ label, onClick }: ButtonProps) {
  return <button onClick={onClick}>{label}</button>;
}
```

### 3. Simple CRUD Operations
If it's just basic Create, Read, Update, Delete - the method name is enough.

## What TO Document

### 1. Public APIs and Interfaces

```typescript
/**
 * Authentication service interface for third-party integrations.
 * 
 * Rate limits: 100 requests per minute per API key
 * Authentication: Bearer token in Authorization header
 */
export interface AuthenticationAPI {
  /**
   * Validates user credentials and returns JWT tokens.
   * 
   * @throws {ValidationError} Invalid email format or password requirements
   * @throws {AuthenticationError} Invalid credentials
   * @throws {RateLimitError} Too many failed attempts
   */
  login(credentials: LoginCredentials): Promise<TokenPair>;

  /**
   * Refreshes access token using valid refresh token.
   * 
   * Note: Refresh tokens are single-use. A new refresh token 
   * is returned with each successful refresh.
   */
  refreshToken(refreshToken: string): Promise<TokenPair>;
}
```

### 2. REST API Endpoints

```typescript
/**
 * User Management API
 * Base URL: https://api.example.com/v1
 * Authentication: Required for all endpoints
 */

/**
 * Create new user account
 * 
 * POST /users
 * 
 * Request:
 * {
 *   email: string (required, unique)
 *   password: string (required, min 8 chars, 1 uppercase, 1 number)
 *   name: string (required)
 *   role: 'user' | 'admin' (optional, defaults to 'user')
 * }
 * 
 * Response: 201 Created
 * {
 *   id: string
 *   email: string
 *   name: string
 *   role: string
 *   createdAt: ISO8601
 * }
 * 
 * Errors:
 * - 400: Validation failed
 * - 409: Email already exists
 * - 429: Rate limit exceeded (5 accounts per hour per IP)
 */
```

### 3. Complex Business Logic

```typescript
/**
 * Calculates shipping cost based on multiple factors.
 * 
 * Pricing rules:
 * - Base rate: $5 for first pound
 * - Additional weight: $0.50 per pound
 * - Express shipping: 2x base rate
 * - International: Additional $15 + 1.5x domestic rate
 * - Free shipping: Orders over $100 (domestic only)
 * 
 * Special cases:
 * - Hazardous materials: Additional $25
 * - Oversized items: Use dimensional weight if greater
 */
function calculateShipping(order: Order, options: ShippingOptions): ShippingCost {
  // Implementation
}
```

### 4. Non-Obvious Constraints

```typescript
/**
 * Process payment through payment gateway.
 * 
 * IMPORTANT: This function implements idempotency using the 
 * order ID. Multiple calls with the same order ID will return
 * the same result without charging again.
 * 
 * Timeout: Gateway has 30-second timeout. For amounts over
 * $1000, use processLargePayment() which implements retry logic.
 */
async function processPayment(order: Order): Promise<PaymentResult> {
  // Implementation
}
```

## Process Documentation

### README.md Structure

```markdown
# Project Name

Brief one-line description of what this project does.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- Redis (for caching)

## Installation

\`\`\`bash
git clone <repo>
cd <project>
npm install
\`\`\`

## Environment Setup

Copy `.env.example` to `.env` and fill in required values:

\`\`\`bash
# Required
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
JWT_SECRET=<generate with: openssl rand -base64 32>
API_KEY=<get from https://dashboard.example.com>

# Optional (defaults shown)
PORT=3000
LOG_LEVEL=info
\`\`\`

## Running Locally

\`\`\`bash
# Start database
docker-compose up -d postgres redis

# Run migrations
npm run db:migrate

# Seed development data
npm run db:seed

# Start development server
npm run dev
\`\`\`

Server runs at http://localhost:3000

## Testing

\`\`\`bash
npm test              # Unit tests
npm run test:e2e      # End-to-end tests
npm run test:coverage # Coverage report
\`\`\`

## Deployment

### Environments

- **Development**: Auto-deploys from `develop` branch
- **Staging**: Auto-deploys from `main` branch  
- **Production**: Manual deployment from `main` tags

### Deploy Process

\`\`\`bash
# Deploy to staging
npm run deploy:staging

# Deploy to production (requires MFA)
npm run deploy:production
\`\`\`

### Post-Deployment

1. Check health endpoint: `<url>/health`
2. Run smoke tests: `npm run test:smoke -- --env=staging`
3. Monitor logs: `npm run logs:staging`

## Troubleshooting

### Common Issues

**Database connection fails**
- Check DATABASE_URL format
- Ensure PostgreSQL is running
- Verify network connectivity

**Authentication errors**
- JWT_SECRET must match across deployments
- Check token expiration settings
- Verify API_KEY is active

## Architecture Decisions

See [docs/architecture/decisions/](docs/architecture/decisions/) for:
- Why we chose PostgreSQL over MongoDB
- Authentication strategy
- Caching approach
- API versioning strategy
```

### API Documentation

```yaml
# api-docs.yml
openapi: 3.0.0
info:
  title: Example API
  version: 1.0.0
  description: |
    Base URL: https://api.example.com
    
    Authentication: Bearer token in Authorization header
    Rate limiting: 1000 requests per hour per token
    
servers:
  - url: https://api.example.com/v1
    description: Production
  - url: https://staging-api.example.com/v1
    description: Staging

paths:
  /health:
    get:
      summary: Health check
      responses:
        200:
          description: Service is healthy
          content:
            application/json:
              schema:
                type: object
                properties:
                  status:
                    type: string
                    example: "healthy"
                  version:
                    type: string
                    example: "1.0.0"
                  timestamp:
                    type: string
                    format: date-time
```

## Code Documentation Guidelines

### 1. Document the "Why", Not the "What"

```typescript
// ❌ Bad: Explaining what the code does
// Increment counter by 1
counter++;

// ✅ Good: Explaining why
// Compensate for zero-based index when displaying to users
const displayIndex = index + 1;
```

### 2. Document Gotchas and Edge Cases

```typescript
// IMPORTANT: This regex intentionally allows + in email addresses
// to support Gmail-style email aliases (user+tag@gmail.com)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// NOTE: We're using Promise.allSettled instead of Promise.all
// to ensure partial failures don't block the entire batch
const results = await Promise.allSettled(promises);
```

### 3. Document External Dependencies

```typescript
/**
 * Stripe webhook handler
 * 
 * IMPORTANT: Stripe sends events multiple times. This handler
 * must be idempotent. We track processed events in the database.
 * 
 * Webhook secret: Set STRIPE_WEBHOOK_SECRET in env
 * Stripe CLI testing: stripe listen --forward-to localhost:3000/webhooks/stripe
 */
```

### 4. Document Performance Considerations

```typescript
/**
 * Batch process user notifications
 * 
 * Performance: Processes 1000 users per batch to avoid memory issues.
 * Run time: ~5 seconds per 1000 users
 * 
 * For datasets over 100k users, use the queue-based processor instead.
 */
```

## Documentation Maintenance

### Keep Docs Close to Code

```typescript
// In user.service.ts
/**
 * User authentication flow:
 * 1. Validate credentials
 * 2. Check account status (not locked/suspended)
 * 3. Generate JWT tokens
 * 4. Log authentication event
 * 5. Update last login timestamp
 */
```

### Update Docs with Code

- Documentation updates must be in the same PR as code changes
- Outdated documentation should be deleted, not marked as "outdated"
- Use code examples that actually run (test them!)

### Regular Cleanup

- Remove documentation for deleted features
- Update examples to use current APIs
- Delete TODO comments older than 3 months

## Documentation Anti-patterns

### 1. Over-Documentation
```typescript
// ❌ Don't do this
/**
 * UserService class handles user-related operations
 * 
 * This service provides methods for:
 * - Creating users
 * - Updating users  
 * - Deleting users
 * - Finding users
 * 
 * @class UserService
 * @module services/user
 */
class UserService {
  // 50 more lines of obvious documentation
}
```

### 2. Changelog in Code
```typescript
// ❌ Don't do this
/**
 * @modified 2023-01-15 - John - Added validation
 * @modified 2023-02-20 - Jane - Fixed bug
 * @modified 2023-03-10 - Bob - Refactored
 */
```

Use git history instead.

### 3. Commented-Out Code
```typescript
// ❌ Don't do this
function processData(data) {
  // const oldWay = data.map(item => item.value);
  // return oldWay.filter(v => v > 0);
  
  return data
    .filter(item => item.isActive)
    .map(item => item.value);
}
```

Delete it. Git remembers everything.

## Summary

Document:
- **Interfaces** that others will implement
- **APIs** that others will consume  
- **Complex logic** that isn't obvious
- **Deployment process** and environments
- **Setup steps** and requirements
- **Non-obvious decisions** and constraints

Don't document:
- What the code already says clearly
- UI components without logic
- Simple CRUD operations
- Historical changes (use git)
- Obvious variable/function purposes

Remember: The best documentation is code that doesn't need documentation.