# Security

Minimal security practices that actually matter. No theater, just essentials.

## Environment Variables

### Never Commit Secrets

```bash
# .env.local (NEVER commit this)
STRIPE_KEY=sk_live_xxx
JWT_SECRET=your-secret-here
AWS_ACCESS_KEY_ID=xxx

# .env.example (commit this)
STRIPE_KEY=
JWT_SECRET=
AWS_ACCESS_KEY_ID=
```

### Use Proper Secret Management

```typescript
// ❌ Bad
const apiKey = "sk_live_1234567890";

// ✅ Good - Local development
const apiKey = process.env.STRIPE_KEY;

// ✅ Good - Production (SST)
import { Config } from "sst/node/config";
const apiKey = Config.STRIPE_KEY;
```

## Authentication

### JWT Basics

```typescript
// Generate tokens with expiration
const token = jwt.sign(
  { userId: user.id },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

// Always verify tokens
try {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
} catch (error) {
  // Invalid token
}
```

### Password Handling

```typescript
// Never store plain text passwords
import bcrypt from 'bcryptjs';

// Hash passwords
const hashedPassword = await bcrypt.hash(password, 10);

// Verify passwords
const isValid = await bcrypt.compare(password, hashedPassword);
```

## Input Validation

### Always Validate User Input

```typescript
// Use a validation library
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  age: z.number().min(0).max(150),
});

// Validate before using
try {
  const validData = userSchema.parse(userInput);
  // Safe to use validData
} catch (error) {
  // Invalid input
}
```

### SQL Injection Prevention

```typescript
// ❌ Bad - SQL injection vulnerable
const query = `SELECT * FROM users WHERE id = ${userId}`;

// ✅ Good - Use parameterized queries
const query = 'SELECT * FROM users WHERE id = ?';
db.query(query, [userId]);

// ✅ Good - Use an ORM
const user = await User.findById(userId);
```

## API Security

### Rate Limiting

```typescript
// Basic rate limiting
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
});

app.use('/api/', limiter);
```

### CORS Configuration

```typescript
// Production - specific origins only
const corsOptions = {
  origin: ['https://myapp.com'],
  credentials: true,
};

// Development - allow localhost
if (process.env.NODE_ENV !== 'production') {
  corsOptions.origin = ['http://localhost:3000'];
}

app.use(cors(corsOptions));
```

## Data Privacy

### Personal Data

```typescript
// Log only what's necessary
logger.info('User login', { 
  userId: user.id,
  // Don't log: email, password, personal info
});

// Redact sensitive data in responses
function sanitizeUser(user) {
  const { password, ssn, ...safeUser } = user;
  return safeUser;
}
```

### Data Retention

```typescript
// Delete data when no longer needed
async function deleteInactiveUsers() {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  await User.deleteMany({
    lastActive: { $lt: ninetyDaysAgo },
    status: 'inactive'
  });
}
```

## HTTPS & Security Headers

### Always Use HTTPS

```typescript
// Redirect HTTP to HTTPS
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

### Security Headers

```typescript
import helmet from 'helmet';

// Basic security headers
app.use(helmet());

// Or customize
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));
```

## File Uploads

### Validate File Types

```typescript
import multer from 'multer';

const upload = multer({
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    // Only allow images
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only images allowed'));
    }
    cb(null, true);
  },
});
```

### Sanitize Filenames

```typescript
import path from 'path';
import crypto from 'crypto';

function generateSafeFilename(originalName) {
  const ext = path.extname(originalName);
  const randomName = crypto.randomBytes(16).toString('hex');
  return `${randomName}${ext}`;
}
```

## Session Management

### Secure Sessions

```typescript
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only
    httpOnly: true, // No JS access
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict',
  },
}));
```

## Error Handling

### Don't Leak Information

```typescript
// ❌ Bad - Exposes internal details
app.use((err, req, res, next) => {
  res.status(500).json({ 
    error: err.message,
    stack: err.stack,
    query: req.query
  });
});

// ✅ Good - Generic error for production
app.use((err, req, res, next) => {
  logger.error('Request failed', { 
    error: err,
    url: req.url,
    userId: req.user?.id 
  });
  
  res.status(500).json({ 
    error: 'Something went wrong',
    requestId: req.id
  });
});
```

## Dependencies

### Keep Dependencies Updated

```bash
# Check for vulnerabilities
npm audit

# Fix automatically where possible
npm audit fix

# Check before deploying
npm audit --production
```

### Lock Dependencies

```json
// Always commit package-lock.json
// Use exact versions for critical packages
{
  "dependencies": {
    "bcryptjs": "2.4.3",  // Exact version
    "express": "^4.18.0"  // Minor updates OK
  }
}
```

## Quick Security Checklist

Before deploying:

- [ ] No secrets in code
- [ ] Environment variables configured
- [ ] Input validation on all endpoints
- [ ] Authentication required where needed
- [ ] HTTPS enforced in production
- [ ] Dependencies updated
- [ ] Rate limiting enabled
- [ ] Error messages don't leak info
- [ ] Logs don't contain sensitive data
- [ ] File uploads validated

## Remember

- Security is about layers, not perfection
- Start with the basics, add more as needed
- Most breaches are from simple mistakes
- When in doubt, don't trust user input
- Keep it simple - complexity breeds vulnerabilities