// User and authentication related enums

export const UserRole = ['admin', 'finance', 'purchasing', 'warehouse', 'sales', 'worker'] as const;
export type UserRole = typeof UserRole[number];

// Enum constants for use in code
export const USER_ROLE = {
  ADMIN: 'admin' as const,
  FINANCE: 'finance' as const,
  PURCHASING: 'purchasing' as const,
  WAREHOUSE: 'warehouse' as const,
  SALES: 'sales' as const,
  WORKER: 'worker' as const
} as const;

export const AuthProvider = ['replit', 'supabase'] as const;
export type AuthProvider = typeof AuthProvider[number];

export const PermissionScope = [
  'global', 'finance', 'purchasing', 'warehouse', 'sales', 'quality', 'reporting'
] as const;
export type PermissionScope = typeof PermissionScope[number];