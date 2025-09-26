/**
 * User role enums and constants
 */

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  EMPLOYEE = 'employee',
  VIEWER = 'viewer'
}

export const USER_ROLE = UserRole;

export const userRoleLabels: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Super Administrator',
  [UserRole.ADMIN]: 'Administrator',
  [UserRole.MANAGER]: 'Manager',
  [UserRole.EMPLOYEE]: 'Employee',
  [UserRole.VIEWER]: 'Viewer'
};

export const userRoleDescriptions: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Full system access with all permissions',
  [UserRole.ADMIN]: 'Administrative access with user management',
  [UserRole.MANAGER]: 'Management access with approval rights',
  [UserRole.EMPLOYEE]: 'Standard employee access',
  [UserRole.VIEWER]: 'Read-only access to assigned areas'
};

export const userRoleOptions = Object.entries(userRoleLabels).map(([value, label]) => ({
  value,
  label,
  description: userRoleDescriptions[value as UserRole]
}));

// Role hierarchy for permission checking
export const roleHierarchy: Record<UserRole, number> = {
  [UserRole.SUPER_ADMIN]: 5,
  [UserRole.ADMIN]: 4,
  [UserRole.MANAGER]: 3,
  [UserRole.EMPLOYEE]: 2,
  [UserRole.VIEWER]: 1
};

// Check if user has required role level
export function hasRoleLevel(userRole: UserRole, requiredRole: UserRole): boolean {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

// Get roles that can be assigned by current user
export function getAssignableRoles(currentUserRole: UserRole): UserRole[] {
  const currentLevel = roleHierarchy[currentUserRole];
  return Object.entries(roleHierarchy)
    .filter(([, level]) => level < currentLevel)
    .map(([role]) => role as UserRole);
}