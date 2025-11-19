import { Request, Response } from 'express';
import { User } from '../models';
import { generateTokens, generateResetToken, verifyResetToken } from '../utils/jwt';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema, updateProfileSchema } from '../validators/auth';
import { AuthenticatedRequest } from '../middleware/auth';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    
    if (error) {
      res.status(400).json({
        success: false,
        message: error.details[0].message
      });
      return;
    }

    const { email, password, firstName, lastName, role, licenseNumber } = value;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
      return;
    }

    // Set default permissions based on role
    let permissions: string[] = [];
    switch (role) {
      case 'dentist':
        permissions = [
          'patients.create', 'patients.read', 'patients.update', 'patients.delete',
          'appointments.create', 'appointments.read', 'appointments.update', 'appointments.delete',
          'treatments.create', 'treatments.read', 'treatments.update', 'treatments.delete',
          'invoices.create', 'invoices.read', 'invoices.update', 'invoices.delete',
          'inventory.manage', 'reports.view'
        ];
        break;
      case 'assistant':
        permissions = [
          'patients.read', 'patients.update',
          'appointments.create', 'appointments.read', 'appointments.update',
          'treatments.read', 'treatments.update',
          'invoices.read',
          'inventory.manage'
        ];
        break;
      case 'receptionist':
        permissions = [
          'patients.create', 'patients.read', 'patients.update',
          'appointments.create', 'appointments.read', 'appointments.update',
          'invoices.create', 'invoices.read', 'invoices.update',
          'reports.view'
        ];
        break;
    }

    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      role,
      licenseNumber,
      permissions
    });

    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    
    if (error) {
      res.status(400).json({
        success: false,
        message: error.details[0].message
      });
      return;
    }

    const { email, password } = value;

    // Find user by email
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
      return;
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.userId);
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { error, value } = updateProfileSchema.validate(req.body);
    
    if (error) {
      res.status(400).json({
        success: false,
        message: error.details[0].message
      });
      return;
    }

    const user = await User.findById(req.user!.userId);
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Update user profile
    Object.assign(user, value);
    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { error, value } = changePasswordSchema.validate(req.body);
    
    if (error) {
      res.status(400).json({
        success: false,
        message: error.details[0].message
      });
      return;
    }

    const { currentPassword, newPassword } = value;

    const user = await User.findById(req.user!.userId);
    
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
      return;
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = forgotPasswordSchema.validate(req.body);
    
    if (error) {
      res.status(400).json({
        success: false,
        message: error.details[0].message
      });
      return;
    }

    const { email } = value;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
      return;
    }

    // Generate reset token
    const resetToken = generateResetToken(email);

    // TODO: Send email with reset link
    // For now, we'll just return the token (in production, this should be sent via email)

    res.json({
      success: true,
      message: 'Password reset instructions sent to your email',
      data: {
        resetToken // Remove this in production
      }
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = resetPasswordSchema.validate(req.body);
    
    if (error) {
      res.status(400).json({
        success: false,
        message: error.details[0].message
      });
      return;
    }

    const { token, password } = value;

    // Verify reset token
    const email = verifyResetToken(token);

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
      return;
    }

    // Update password
    user.password = password;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token'
    });
  }
};