/**
 * System User Protection Utility
 * 
 * Provides centralized protection for system-critical user accounts that are required
 * for platform operations and cannot be deleted or modified in certain ways.
 */

// System user identifiers - centralize configuration here
const SYSTEM_USER_ID = 'system';
const SYSTEM_USER_EMAIL = 'system@workflu.local';

/**
 * Domain error for system user protection violations
 */
export class SystemUserProtectionError extends Error {
  public readonly code: string;
  public readonly userFriendlyMessage: string;

  constructor(operation: string, userId: string) {
    const message = `System user protection: Cannot ${operation} system user ${userId} - required for platform operations`;
    super(message);
    this.name = 'SystemUserProtectionError';
    this.code = 'system_user_protected';
    this.userFriendlyMessage = `System user cannot be ${operation} - required for platform operations`;
  }
}

/**
 * Check if a user ID represents a system user
 */
export function isSystemUser(userIdOrUser: string | { id: string } | { email: string }): boolean {
  if (typeof userIdOrUser === 'string') {
    return userIdOrUser === SYSTEM_USER_ID;
  }
  
  if ('id' in userIdOrUser) {
    return userIdOrUser.id === SYSTEM_USER_ID;
  }
  
  if ('email' in userIdOrUser) {
    return userIdOrUser.email === SYSTEM_USER_EMAIL;
  }
  
  return false;
}

/**
 * Get the canonical system user ID
 */
export function getSystemUserId(): string {
  return SYSTEM_USER_ID;
}

/**
 * Get the canonical system user email
 */
export function getSystemUserEmail(): string {
  return SYSTEM_USER_EMAIL;
}

/**
 * Guard function to prevent operations on system users
 * Throws SystemUserProtectionError if the user is a system user
 */
export function guardSystemUser(userIdOrUser: string | { id: string } | { email: string }, operation: string): void {
  if (isSystemUser(userIdOrUser)) {
    const userId = typeof userIdOrUser === 'string' 
      ? userIdOrUser 
      : 'id' in userIdOrUser 
        ? userIdOrUser.id 
        : userIdOrUser.email;
    throw new SystemUserProtectionError(operation, userId);
  }
}

/**
 * Safely check if a user can be deleted
 */
export function canDeleteUser(userIdOrUser: string | { id: string } | { email: string }): boolean {
  return !isSystemUser(userIdOrUser);
}

/**
 * Safely check if a user can be deactivated
 */
export function canDeactivateUser(userIdOrUser: string | { id: string } | { email: string }): boolean {
  return !isSystemUser(userIdOrUser);
}

/**
 * Safely check if a user can be anonymized
 */
export function canAnonymizeUser(userIdOrUser: string | { id: string } | { email: string }): boolean {
  return !isSystemUser(userIdOrUser);
}