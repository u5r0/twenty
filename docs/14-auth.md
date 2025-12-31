# Authentication & Authorization

Complete guide to authentication and authoriTwenty.

## Overview

Twenty implements a comprehensive security model with:
- **JWT-based authentication**
- **Role-based access control (RBAC)**
- **Workspace-level isolation**
- **Object-level permissions**
- **Field-level permissions**

## Authentication Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ 1. Login Request (email/password)
       ▼
┌─────────────┐
│   Server    │
└──────┬──────┘
       │ 2. Validate Credentials
       │ 3. Generate JWT Tokens
       ▼
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ 4. Store Tokens
       │ 5. Include in Requests
       ▼
┌─────────────┐
│   Server    │
└──────┬──────┘
       │ 6. Validate Token
       │ 7. Extract User Context
       │ 8. Check Permissions
       ▼
┌─────────────┐
│  Response   │
└─────────────┘
```

## JWT Tokens

### Token Types

Twenty uses three types of JWT tokens:

1. **Access Token** - Short-lived (15 minutes)
2. **Refresh Token** - Long-lived (7 days)
3. **Login Token** - One-time use for email verification

### Token Structure

```typescript
interface AccessTokenPayload {
  sub: string;        // User ID
  email: string;      // User email
  workspaceId: string; // Current workspace
  role: string;       // User role
  iat: number;        // Issued at
  exp: number;        // Expires at
}

interface RefreshTokenPayload {
  sub: string;        // User ID
  tokenFamily: string; // Token family ID
  iat: number;
  exp: number;
}
```

## Backend Implementation

### Auth Module

```typescript
// modules/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.ACCESS_TOKEN_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    GoogleStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
```

### Auth Service

```typescript
// modules/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(user: User, workspaceId: string) {
    const accessToken = this.generateAccessToken(user, workspaceId);
    const refreshToken = this.generateRefreshToken(user);

    // Store refresh token
    await this.storeRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async register(data: RegisterDto): Promise<User> {
    // Check if user exists
    const existingUser = await this.userService.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await this.userService.create({
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
    });

    // Send verification email
    await this.sendVerificationEmail(user);

    return user;
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.REFRESH_TOKEN_SECRET,
      });

      // Validate refresh token
      const isValid = await this.validateRefreshToken(
        payload.sub,
        refreshToken,
      );

      if (!isValid) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.userService.findById(payload.sub);
      const workspaceId = await this.getDefaultWorkspace(user.id);

      return this.login(user, workspaceId);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private generateAccessToken(user: User, workspaceId: string): string {
    const payload = {
      sub: user.id,
      email: user.email,
      workspaceId,
      role: user.role,
    };

    return this.jwtService.sign(payload, {
      secret: process.env.ACCESS_TOKEN_SECRET,
      expiresIn: '15m',
    });
  }

  private generateRefreshToken(user: User): string {
    const payload = {
      sub: user.id,
      tokenFamily: uuid(),
    };

    return this.jwtService.sign(payload, {
      secret: process.env.REFRESH_TOKEN_SECRET,
      expiresIn: '7d',
    });
  }

  private async storeRefreshToken(
    userId: string,
    token: string,
  ): Promise<void> {
    const hashedToken = await bcrypt.hash(token, 10);
    await this.redis.set(
      `refresh_token:${userId}`,
      hashedToken,
      'EX',
      7 * 24 * 60 * 60, // 7 days
    );
  }

  private async validateRefreshToken(
    userId: string,
    token: string,
  ): Promise<boolean> {
    const storedToken = await this.redis.get(`refresh_token:${userId}`);
    if (!storedToken) return false;

    return bcrypt.compare(token, storedToken);
  }
}
```

### JWT Strategy

```typescript
// modules/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('ACCESS_TOKEN_SECRET'),
    });
  }

  async validate(payload: any) {
    const user = await this.userService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      workspaceId: payload.workspaceId,
      role: payload.role,
    };
  }
}
```

### Auth Guards

```typescript
// guards/jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}

// guards/workspace.guard.ts
@Injectable()
export class WorkspaceGuard implements CanActivate {
  constructor(private workspaceService: WorkspaceService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();

    const user = req.user;
    if (!user) return false;

    // Verify user has access to workspace
    const hasAccess = await this.workspaceService.hasAccess(
      user.userId,
      user.workspaceId,
    );

    if (!hasAccess) {
      throw new ForbiddenException('Access denied to workspace');
    }

    // Attach workspace to request
    req.workspace = await this.workspaceService.findById(user.workspaceId);

    return true;
  }
}

// guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );

    if (!requiredRoles) {
      return true;
    }

    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();
    const user = req.user;

    return requiredRoles.includes(user.role);
  }
}
```

### Auth Controller

```typescript
// modules/auth/auth.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body() data: RegisterDto) {
    return this.authService.register(data);
  }

  @Post('login')
  async login(@Body() data: LoginDto) {
    const user = await this.authService.validateUser(
      data.email,
      data.password,
    );
    return this.authService.login(user, data.workspaceId);
  }

  @Post('refresh')
  async refresh(@Body() data: RefreshTokenDto) {
    return this.authService.refreshTokens(data.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@CurrentUser() user: User) {
    await this.authService.logout(user.id);
    return { success: true };
  }

  @Post('forgot-password')
  async forgotPassword(@Body() data: ForgotPasswordDto) {
    await this.authService.sendPasswordResetEmail(data.email);
    return { success: true };
  }

  @Post('reset-password')
  async resetPassword(@Body() data: ResetPasswordDto) {
    await this.authService.resetPassword(data.token, data.password);
    return { success: true };
  }
}
```

## Frontend Implementation

### Auth Context

```typescript
// modules/auth/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user from token
    const token = localStorage.getItem('accessToken');
    if (token) {
      loadUser(token);
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async (token: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const user = await response.json();
      setUser(user);
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const { accessToken, refreshToken, user } = await response.json();

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    setUser(user);
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
    }
  };

  const register = async (data: RegisterData) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Registration failed');
    }

    const { accessToken, refreshToken, user } = await response.json();

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);

    setUser(user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Protected Routes

```typescript
// components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <Spinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Usage in router
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route
    path="/dashboard"
    element={
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    }
  />
</Routes>
```

### Apollo Client Setup

```typescript
// apollo-client.ts
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: 'http://localhost:3001/graphql',
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('accessToken');

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
```

### Token Refresh

```typescript
// utils/tokenRefresh.ts
import { apolloClient } from './apollo-client';

let refreshPromise: Promise<string> | null = null;

export async function refreshAccessToken(): Promise<string> {
  // Prevent multiple simultaneous refresh requests
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const { accessToken, refreshToken: newRefreshToken } = await response.json();

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', newRefreshToken);

      return accessToken;
    } catch (error) {
      // Clear tokens and redirect to login
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      throw error;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Apollo error link for automatic token refresh
import { onError } from '@apollo/client/link/error';

const errorLink = onError(({ graphQLErrors, operation, forward }) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      if (err.extensions?.code === 'UNAUTHENTICATED') {
        return fromPromise(
          refreshAccessToken().catch(() => {
            // Redirect to login
            window.location.href = '/login';
            return;
          })
        ).flatMap(() => forward(operation));
      }
    }
  }
});
```

## Authorization

### Role-Based Access Control

```typescript
// Roles
enum UserRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER',
}

// Role decorator
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);

// Usage in resolver
@Resolver()
export class CompanyResolver {
  @Query(() => [Company])
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MEMBER)
  async companies() {
    return this.companyService.findAll();
  }

  @Mutation(() => Company)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async deleteCompany(@Args('id') id: string) {
    return this.companyService.delete(id);
  }
}
```

### Object-Level Permissions

```typescript
// Permission check service
@Injectable()
export class PermissionService {
  async canAccessObject(
    userId: string,
    objectName: string,
    action: 'read' | 'create' | 'update' | 'delete',
  ): Promise<boolean> {
    const permissions = await this.getPermissions(userId, objectName);
    return permissions[action] === true;
  }

  async canAccessField(
    userId: string,
    objectName: string,
    fieldName: string,
    action: 'read' | 'write',
  ): Promise<boolean> {
    const permissions = await this.getFieldPermissions(
      userId,
      objectName,
      fieldName,
    );
    return permissions[action] === true;
  }
}

// Permission guard
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private permissionService: PermissionService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.get<{
      object: string;
      action: string;
    }>('permission', context.getHandler());

    if (!requiredPermission) {
      return true;
    }

    const ctx = GqlExecutionContext.create(context);
    const { req } = ctx.getContext();
    const user = req.user;

    return this.permissionService.canAccessObject(
      user.userId,
      requiredPermission.object,
      requiredPermission.action,
    );
  }
}
```

## OAuth Integration

### Google OAuth

```typescript
// modules/auth/strategies/google.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private configService: ConfigService) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;

    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
      accessToken,
    };

    done(null, user);
  }
}
```

## Best Practices

1. **Never store passwords in plain text**
2. **Use HTTPS in production**
3. **Implement rate limiting**
4. **Use secure token storage**
5. **Implement token rotation**
6. **Log authentication events**
7. **Use strong password requirements**
8. **Implement account lockout**
9. **Use CSRF protection**
10. **Validate all inputs**

## Next Steps

- [Backend Architecture](./11-backend-architecture.md)
- [GraphQL API](./13-graphql-api.md)
- [System Architecture](./04-system-architecture.md)

---

**Related Documentation:**
- [Deployment](./18-deployment.md)
- [Troubleshooting](./26-troubleshooting.md)

