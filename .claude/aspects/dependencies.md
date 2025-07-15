# Dependencies

Keep dependencies under control. Less is more.

## Adding Dependencies

### Think Before Installing

```bash
# ❌ Bad - Installing for trivial functionality
npm install left-pad

# ✅ Good - Write simple utilities yourself
function leftPad(str, len, char = ' ') {
  return str.padStart(len, char);
}
```

### Check Package Quality

Before adding a dependency, check:
- Weekly downloads (> 1000 is good)
- Last publish date (< 1 year old)
- Open issues (reasonable number)
- License (MIT, Apache, ISC are safe)

```bash
# Quick check
npm view express

# Check package size
npm view express size
```

## Managing Dependencies

### Lock Versions

```bash
# Always commit lock files
git add package-lock.json

# Use npm ci in CI/CD
npm ci  # Installs from lock file
```

### Separate Dev and Production

```json
{
  "dependencies": {
    // Only what's needed in production
    "express": "^4.18.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    // Development tools
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

## Security

### Regular Audits

```bash
# Check for vulnerabilities
npm audit

# Fix if possible
npm audit fix

# Check production only
npm audit --production
```

### Update Strategy

```bash
# Check outdated packages
npm outdated

# Update minor versions (safer)
npm update

# Update major versions (careful)
npm install package@latest
```

## Version Pinning

### When to Pin Versions

```json
{
  "dependencies": {
    // Pin critical dependencies
    "bcryptjs": "2.4.3",      // Security-critical: exact version
    
    // Allow minor updates for others
    "express": "^4.18.0",     // ^4.18.0 = 4.18.x, 4.19.x, etc.
    "react": "~18.2.0"        // ~18.2.0 = 18.2.x only
  }
}
```

## Minimal Dependencies Policy

### Prefer Built-in Solutions

```javascript
// ❌ Don't install moment.js
import moment from 'moment';
const date = moment().format('YYYY-MM-DD');

// ✅ Use native Date
const date = new Date().toISOString().split('T')[0];
```

### Common Unnecessary Dependencies

- **Date formatting**: Use `Intl.DateTimeFormat` or native Date
- **UUID**: Use `crypto.randomUUID()` (Node 16+)
- **Simple HTTP**: Use native `fetch` (Node 18+)
- **Deep clone**: Use `structuredClone()` (Node 17+)

## Dependency Checklist

Before adding a new dependency:

- [ ] Is there a native alternative?
- [ ] Is it actively maintained?
- [ ] Is the license compatible?
- [ ] Is the size reasonable?
- [ ] Are there security advisories?
- [ ] Can I implement it myself in < 50 lines?

## Remove Unused Dependencies

```bash
# Find unused dependencies
npx depcheck

# Remove unused
npm uninstall unused-package
```

## Essential Dependencies Only

For most projects, you need surprisingly few dependencies:

**Backend**:
- Framework: `express` or `fastify`
- Validation: `zod`
- Database: `pg` or DynamoDB SDK
- Auth: `bcryptjs`, `jsonwebtoken`

**Frontend**:
- Framework: `react` or `vue`
- Routing: Framework-specific
- State: Framework built-ins
- Styles: CSS modules or Tailwind

**Both**:
- TypeScript: `typescript`
- Testing: `vitest`
- Linting: `biome`

Remember: Every dependency is technical debt. Choose wisely.