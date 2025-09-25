import { z } from 'zod';
import { UserRole, AuthProvider, PermissionScope } from '../enums/users';

export const zUserRole = z.enum(UserRole);
export const zAuthProvider = z.enum(AuthProvider);
export const zPermissionScope = z.enum(PermissionScope);