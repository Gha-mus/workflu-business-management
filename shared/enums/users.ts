// User and authentication related enums

export const UserRole = ['admin', 'finance', 'purchasing', 'warehouse', 'sales', 'worker'] as const;
export type UserRole = typeof UserRole[number];

export const AuthProvider = ['replit', 'supabase'] as const;
export type AuthProvider = typeof AuthProvider[number];

export const PermissionScope = [
  'global', 'finance', 'purchasing', 'warehouse', 'sales', 'quality', 'reporting'
] as const;
export type PermissionScope = typeof PermissionScope[number];