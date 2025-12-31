# Security Best Practices

Comprehensive security guidelines for oping and deploying Twenty.

## Table of Contents

- [Overview](#overview)
- [Authentication Security](#authentication-security)
- [Authorization](#authorization)
- [Data Protection](#data-protection)
- [API Security](#api-security)
- [Frontend Security](#frontend-security)
- [Backend Security](#backend-security)
- [Database Security](#database-security)
- [Infrastructure Security](#infrastructure-security)
- [Security Checklist](#security-checklist)

## Overview

Security is a critical aspect of Twenty. This guide covers best practices for keeping the application and user data secure.

### Security Principles

1. **Defense in Depth** - Multiple layers of security
2. **Least Privilege** - Minimal access rights
3. **Secure by Default** - Security built-in from the start
4. **Zero Trust** - Verify everything
5. **Privacy by Design** - Data protection at the core

## Authentication Security

### Password Security

#### Password Hashing

```typescript
// packages/twenty-server/src/core/auth/services/auth.service.ts
import * as bcrypt from 'bcrypt';

export class AuthService {
  private readonly SALT_ROUNDS = 12;

  async hashPassword(password: string): Promise<string> {
    // Use bcrypt with appropriate salt rounds
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
```

#### Password Requirements

```typescript
// packages/twenty-server/src/core/auth/validators/password.validator.ts
import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') return false;

          // Minimum 8 characters
          if (value.length < 8) return false;

          // At least one uppercase letter
          if (!/[A-Z]/.test(value)) return false;

          // At least one lowercase letter
          if (!/[a-z]/.test(value)) return false;

          // At least one number
          if (!/[0-9]/.test(value)) return false;

          // At least one special character
          if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return false;

          return true;
        },
        defaultMessage() {
          return 'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
        },
      },
    });
  };
}

// Usage
export class SignUpInput {
  @IsStrongPassword()
  password: string;
}
```

### JWT Security

#### Token Configuration

```typescript
// packages/twenty-server/src/core/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
      algorithms: ['HS256'], // Specify allowed algorithms
    });
  }

  async validate(payload: any) {
    // Validate token payload
    if (!payload.sub || !payload.workspaceId) {
      throw new UnauthorizedException('Invalid token');
    }

    return {
      userId: payload.sub,
      workspaceId: payload.workspaceId,
      email: payload.email,
    };
  }
}
```

#### Token Rotation

```typescript
export class AuthService {
  async refreshToken(refreshToken: string) {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      // Check if token is blacklisted
      const isBlacklisted = await this.tokenBlacklistService.isBlacklisted(
        refreshToken
      );

      if (isBlacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }

      // Generate new access token
      const accessToken = this.generateAccessToken(payload);

      // Generate new refresh token
      const newRefreshToken = this.generateRefreshToken(payload);

      // Blacklist old refresh token
      await this.tokenBlacklistService.blacklist(refreshToken);

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateAccessToken(payload: any): string {
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '15m', // Short-lived access tokens
    });
  }

  private generateRefreshToken(payload: any): string {
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d', // Longer-lived refresh tokens
    });
  }
}
```

### Multi-Factor Authentication

```typescript
// packages/twenty-server/src/core/auth/services/mfa.service.ts
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

export class MfaService {
  async generateSecret(userId: string, email: string) {
    const secret = speakeasy.generateSecret({
      name: `Twenty (${email})`,
      issuer: 'Twenty',
    });

    // Store secret in database
    await this.userRepository.update(userId, {
      mfaSecret: secret.base32,
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
    };
  }

  async verifyToken(userId: string, token: string): Promise<boolean> {
    const user = await this.userRepository.findOne(userId);

    if (!user.mfaSecret) {
      throw new BadRequestException('MFA not enabled');
    }

    return speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps before/after
    });
  }

  async enableMfa(userId: string, token: string) {
    const isValid = await this.verifyToken(userId, token);

    if (!isValid) {
      throw new BadRequestException('Invalid MFA token');
    }

    await this.userRepository.update(userId, {
      mfaEnabled: true,
    });

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();
    await this.storeBackupCodes(userId, backupCodes);

    return { backupCodes };
  }

  private generateBackupCodes(): string[] {
    const codes = [];
    for (let i = 0; i < 10; i++) {
      codes.push(
        Math.random().toString(36).substring(2, 10).toUpperCase()
      );
    }
    return codes;
  }
}
```

## Authorization

### Role-Based Access Control (RBAC)

```typescript
// packages/twenty-server/src/core/auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export enum Role {
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

// Usage in resolver
@Resolver()
export class CompanyResolver {
  @Mutation(() => Company)
  @Roles(Role.ADMIN, Role.MEMBER)
  async createCompany(@Args('data') data: CreateCompanyInput) {
    return this.companyService.create(data);
  }

  @Query(() => [Company])
  @Roles(Role.ADMIN, Role.MEMBER, Role.VIEWER)
  async companies() {
    return this.companyService.findAll();
  }
}
```

#### Roles Guard

```typescript
// packages/twenty-server/src/core/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const ctx = GqlExecutionContext.create(context);
    const { user } = ctx.getContext().req;

    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}
```

### Resource-Level Permissions

```typescript
// packages/twenty-server/src/core/auth/services/permission.service.ts
export class PermissionService {
  async canAccessResource(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: 'read' | 'write' | 'delete'
  ): Promise<boolean> {
    // Check workspace membership
    const membership = await this.workspaceMemberRepository.findOne({
      where: { userId, workspaceId: resource.workspaceId },
    });

    if (!membership) {
      return false;
    }

    // Check role permissions
    const hasPermission = this.checkRolePermission(
      membership.role,
      resourceType,
      action
    );

    if (!hasPermission) {
      return false;
    }

    // Check resource-specific permissions
    const resourcePermission = await this.resourcePermissionRepository.findOne({
      where: { userId, resourceType, resourceId },
    });

    return resourcePermission?.actions.includes(action) ?? true;
  }

  private checkRolePermission(
    role: Role,
    resourceType: string,
    action: string
  ): boolean {
    const permissions = {
      [Role.ADMIN]: ['read', 'write', 'delete'],
      [Role.MEMBER]: ['read', 'write'],
      [Role.VIEWER]: ['read'],
    };

    return permissions[role]?.includes(action) ?? false;
  }
}
```

## Data Protection

### Encryption at Rest

```typescript
// packages/twenty-server/src/core/encryption/encryption.service.ts
import * as crypto from 'crypto';

export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  decrypt(encryptedText: string): string {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':');

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

// Usage in entity
@Entity()
export class SensitiveData {
  @Column()
  @Transform(({ value }) => encryptionService.encrypt(value), { toPlainOnly: true })
  @Transform(({ value }) => encryptionService.decrypt(value), { toClassOnly: true })
  secretField: string;
}
```

### Data Sanitization

```typescript
// packages/twenty-server/src/core/sanitization/sanitizer.service.ts
import * as DOMPurify from 'isomorphic-dompurify';

export class SanitizerService {
  sanitizeHtml(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
      ALLOWED_ATTR: ['href', 'target'],
    });
  }

  sanitizeInput(input: string): string {
    // Remove null bytes
    let sanitized = input.replace(/\0/g, '');

    // Trim whitespace
    sanitized = sanitized.trim();

    // Remove control characters
    sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

    return sanitized;
  }

  sanitizeFilename(filename: string): string {
    // Remove path traversal attempts
    let sanitized = filename.replace(/\.\./g, '');

    // Remove special characters
    sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');

    return sanitized;
  }
}
```

### PII Protection

```typescript
// packages/twenty-server/src/core/privacy/pii-masker.service.ts
export class PiiMaskerService {
  maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    const maskedLocal = local.charAt(0) + '***' + local.charAt(local.length - 1);
    return `${maskedLocal}@${domain}`;
  }

  maskPhone(phone: string): string {
    return phone.replace(/\d(?=\d{4})/g, '*');
  }

  maskCreditCard(cardNumber: string): string {
    return cardNumber.replace(/\d(?=\d{4})/g, '*');
  }

  redactPii(text: string): string {
    // Email pattern
    text = text.replace(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      '[EMAIL]'
    );

    // Phone pattern
    text = text.replace(
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
      '[PHONE]'
    );

    // SSN pattern
    text = text.replace(
      /\b\d{3}-\d{2}-\d{4}\b/g,
      '[SSN]'
    );

    return text;
  }
}
```

## API Security

### Rate Limiting

```typescript
// packages/twenty-server/src/core/rate-limit/rate-limit.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomRateLimitGuard extends ThrottlerGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Different limits for different endpoints
    const limits = {
      '/auth/login': { ttl: 60, limit: 5 },
      '/auth/signup': { ttl: 3600, limit: 3 },
      '/graphql': { ttl: 60, limit: 100 },
    };

    const config = limits[request.path] || { ttl: 60, limit: 50 };

    // Check rate limit
    const key = this.generateKey(context, request.ip);
    const { totalHits } = await this.storageService.increment(key, config.ttl);

    if (totalHits > config.limit) {
      throw new ThrottlerException('Too many requests');
    }

    return true;
  }
}
```

### Input Validation

```typescript
// packages/twenty-server/src/core/validation/validation.pipe.ts
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToClass(metatype, value);
    const errors = await validate(object, {
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true, // Throw error on unknown properties
      forbidUnknownValues: true,
    });

    if (errors.length > 0) {
      throw new BadRequestException('Validation failed');
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
```

### CORS Configuration

```typescript
// packages/twenty-server/src/main.ts
app.enableCors({
  origin: (origin, callback) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count'],
  maxAge: 3600,
});
```

## Frontend Security

### XSS Prevention

```typescript
// packages/twenty-front/src/modules/core/utils/sanitize.ts
import DOMPurify from 'dompurify';

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href'],
  });
}

// Usage in component
export const RichTextDisplay = ({ content }: { content: string }) => {
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: sanitizeHtml(content),
      }}
    />
  );
};
```

### CSRF Protection

```typescript
// packages/twenty-front/src/modules/core/api/apollo-client.ts
import { ApolloClient, createHttpLink } from '@apollo/client';

const httpLink = createHttpLink({
  uri: process.env.REACT_APP_API_URL,
  credentials: 'include', // Send cookies
  headers: {
    'X-CSRF-Token': getCsrfToken(), // Include CSRF token
  },
});

function getCsrfToken(): string {
  return document
    .querySelector('meta[name="csrf-token"]')
    ?.getAttribute('content') || '';
}
```

### Secure Storage

```typescript
// packages/twenty-front/src/modules/core/storage/secure-storage.ts
export class SecureStorage {
  private readonly prefix = 'twenty_';

  set(key: string, value: any): void {
    try {
      const encrypted = this.encrypt(JSON.stringify(value));
      sessionStorage.setItem(this.prefix + key, encrypted);
    } catch (error) {
      console.error('Failed to store data', error);
    }
  }

  get(key: string): any {
    try {
      const encrypted = sessionStorage.getItem(this.prefix + key);
      if (!encrypted) return null;

      const decrypted = this.decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Failed to retrieve data', error);
      return null;
    }
  }

  remove(key: string): void {
    sessionStorage.removeItem(this.prefix + key);
  }

  clear(): void {
    Object.keys(sessionStorage)
      .filter(key => key.startsWith(this.prefix))
      .forEach(key => sessionStorage.removeItem(key));
  }

  private encrypt(text: string): string {
    // Use Web Crypto API for encryption
    // Implementation depends on your requirements
    return btoa(text); // Simplified for example
  }

  private decrypt(encrypted: string): string {
    return atob(encrypted); // Simplified for example
  }
}
```

## Backend Security

### SQL Injection Prevention

```typescript
// Always use parameterized queries with TypeORM
export class CompanyService {
  async findByName(name: string) {
    // Good: Parameterized query
    return this.companyRepository.findOne({
      where: { name },
    });

    // Also good: Query builder with parameters
    return this.companyRepository
      .createQueryBuilder('company')
      .where('company.name = :name', { name })
      .getOne();

    // BAD: Never do this!
    // return this.companyRepository.query(
    //   `SELECT * FROM company WHERE name = '${name}'`
    // );
  }
}
```

### Command Injection Prevention

```typescript
// packages/twenty-server/src/core/file/file.service.ts
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class FileService {
  async processFile(filename: string) {
    // Validate and sanitize filename
    const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '');

    if (sanitized !== filename) {
      throw new BadRequestException('Invalid filename');
    }

    // Use array syntax to prevent injection
    const { stdout } = await execAsync('file', [sanitized]);

    return stdout;
  }
}
```

### Secure File Upload

```typescript
// packages/twenty-server/src/core/file/file-upload.service.ts
import * as fileType from 'file-type';
import * as crypto from 'crypto';

export class FileUploadService {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

  async uploadFile(file: Express.Multer.File) {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new BadRequestException('File too large');
    }

    // Verify file type by content, not extension
    const type = await fileType.fromBuffer(file.buffer);

    if (!type || !this.ALLOWED_TYPES.includes(type.mime)) {
      throw new BadRequestException('Invalid file type');
    }

    // Generate secure filename
    const hash = crypto.randomBytes(16).toString('hex');
    const extension = type.ext;
    const filename = `${hash}.${extension}`;

    // Scan for malware (if antivirus service available)
    await this.scanFile(file.buffer);

    // Store file
    await this.storageService.store(filename, file.buffer);

    return { filename, url: this.getFileUrl(filename) };
  }

  private async scanFile(buffer: Buffer): Promise<void> {
    // Integrate with antivirus service
    // throw error if malware detected
  }
}
```

## Database Security

### Connection Security

```typescript
// packages/twenty-server/src/database/database.config.ts
export const databaseConfig = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: true,
    ca: fs.readFileSync(process.env.DB_SSL_CA_PATH),
  } : false,
  extra: {
    max: 20, // Connection pool size
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
  },
};
```

### Data Access Patterns

```typescript
// Use workspace isolation
export class CompanyService {
  async findAll(workspaceId: string) {
    // Always filter by workspace
    return this.companyRepository.find({
      where: { workspaceId },
    });
  }

  async findOne(id: string, workspaceId: string) {
    const company = await this.companyRepository.findOne({
      where: { id, workspaceId },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }
}
```

## Infrastructure Security

### Environment Variables

```bash
# .env.example - Never commit actual .env file
# Use strong, randomly generated secrets

# JWT Secrets (generate with: openssl rand -hex 32)
JWT_SECRET=your-secret-here-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-here

# Encryption Key (generate with: openssl rand -hex 32)
ENCRYPTION_KEY=your-encryption-key-here

# Database
DB_PASSWORD=strong-password-here

# API Keys
STRIPE_SECRET_KEY=sk_live_...
SENDGRID_API_KEY=SG...
```

### Docker Security

```dockerfile
# Use specific versions, not latest
FROM node:18.17.0-alpine

# Run as non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Copy only necessary files
COPY --chown=nodejs:nodejs package*.json ./
COPY --chown=nodejs:nodejs dist ./dist

# Set read-only root filesystem
# Use in docker-compose or k8s
# read_only: true
```

### Kubernetes Security

```yaml
# k8s-security.yaml
apiVersion: v1
kind: Pod
metadata:
  name: twenty-server
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1001
    fsGroup: 1001
  containers:
  - name: server
    image: twenty-server:latest
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop:
        - ALL
    resources:
      limits:
        memory: "512Mi"
        cpu: "500m"
      requests:
        memory: "256Mi"
        cpu: "250m"
```

## Security Checklist

### Development

- [ ] Use strong password hashing (bcrypt, scrypt)
- [ ] Implement JWT with short expiration
- [ ] Enable MFA for admin accounts
- [ ] Validate all user inputs
- [ ] Sanitize HTML output
- [ ] Use parameterized queries
- [ ] Implement rate limiting
- [ ] Enable CORS properly
- [ ] Use HTTPS only
- [ ] Implement CSRF protection

### Deployment

- [ ] Use environment variables for secrets
- [ ] Enable SSL/TLS
- [ ] Configure firewall rules
- [ ] Set up intrusion detection
- [ ] Enable audit logging
- [ ] Implement backup strategy
- [ ] Use secrets management (Vault, AWS Secrets Manager)
- [ ] Configure security headers
- [ ] Set up monitoring and alerts
- [ ] Perform security scanning

### Operations

- [ ] Regular security updates
- [ ] Dependency vulnerability scanning
- [ ] Penetration testing
- [ ] Security incident response plan
- [ ] Access control review
- [ ] Log monitoring
- [ ] Backup testing
- [ ] Disaster recovery plan
- [ ] Security training for team
- [ ] Compliance audits

## Related Documentation

- [Authentication](./14-auth.md) - Authentication implementation
- [Backend Architecture](./11-backend-architecture.md) - Server architecture
- [Deployment Guide](./18-deployment.md) - Production deployment
- [Configuration](./19-configuration.md) - Environment configuration

---

*Last updated: December 31, 2024*

