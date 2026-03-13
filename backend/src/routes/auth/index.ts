import { Router, Response } from 'express';
import { z } from 'zod';
import { userRepository } from '../../db/repositories/userRepository';
import { authService } from '../../services/authService';
import { AuthRequest } from '../../middleware/errorHandler';
import { ValidationError, ConflictError, UnauthorizedError } from '../../utils/errors';
import { UserRole } from '../../types';
import type { NextFunction } from 'express';

const router = Router();

// Validation schemas
const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['caregiver', 'care_seeker']),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string(),
});

interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  role: UserRole;
}

const buildAuthResponse = (
  user: { id: string; email: string; role: UserRole },
  token: string
): AuthResponse => ({
  token,
  userId: user.id,
  email: user.email,
  role: user.role,
});

const handleValidationError = (error: unknown, next: NextFunction): void => {
  if (error instanceof z.ZodError) {
    next(new ValidationError('Validation failed', error.issues));
    return;
  }

  next(error);
};

const createSignupHandler = (role: UserRole) => async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const validated = signupSchema.parse({ ...req.body, role });

    const existingUser = await userRepository.findByEmail(validated.email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    const passwordHash = await authService.hashPassword(validated.password);
    const user = await userRepository.create(validated.email, passwordHash, validated.role as UserRole);

    const token = authService.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      success: true,
      data: buildAuthResponse(user, token),
    });
  } catch (error) {
    handleValidationError(error, next);
  }
};

// Caregiver signup endpoint - NO AUTH REQUIRED
router.post('/auth/caregiver/signup', createSignupHandler('caregiver'));

// Care seeker signup endpoint - NO AUTH REQUIRED
router.post('/auth/care_seeker/signup', createSignupHandler('care_seeker'));

// Login endpoint - NO AUTH REQUIRED
router.post('/auth/login', async (req: AuthRequest, res: Response, next) => {
  try {
    const validated = loginSchema.parse(req.body);

    // Find user
    const user = await userRepository.findByEmail(validated.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const passwordValid = await authService.verifyPassword(
      validated.password,
      user.password_hash
    );
    if (!passwordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate token
    const token = authService.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(200).json({ success: true, data: buildAuthResponse(user, token) });
  } catch (error) {
    handleValidationError(error, next);
  }
});

export default router;
