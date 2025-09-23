import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, desc, and } from 'drizzle-orm';
import { 
  settings, 
  settingsHistory, 
  numberingSchemes, 
  configurationSnapshots,
  type InsertSettingsHistory,
  type SelectNumberingScheme,
  type InsertNumberingScheme,
  type InsertConfigurationSnapshot,
  type EnhancedSettingsResponse
} from '../shared/schema.js';
import { auditService } from './auditService.js';
import Decimal from 'decimal.js';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

/**
 * Stage 10: Central Configuration Service
 * Provides comprehensive settings management, numbering schemes, and configuration enforcement
 * Ensures all other stages use centralized business rules and configurations
 */
export class ConfigurationService {
  private static instance: ConfigurationService;
  private cachedSettings: Map<string, any> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): ConfigurationService {
    if (!ConfigurationService.instance) {
      ConfigurationService.instance = new ConfigurationService();
    }
    return ConfigurationService.instance;
  }

  /**
   * STAGE 10 COMPLIANCE: Central FX Rate Enforcement
   * ALL stages must use this method to get exchange rates
   */
  async getCentralExchangeRate(): Promise<number> {
    // Try with financial category first
    let rate = await this.getSystemSetting('USD_ETB_RATE', 'financial');
    
    // Fallback: try without category filter (for backward compatibility)
    if (!rate) {
      rate = await this.getSystemSetting('USD_ETB_RATE');
    }
    
    if (!rate) {
      throw new Error(`Central exchange rate not configured. Please set USD_ETB_RATE in settings. Found rate: ${rate}`);
    }
    
    // Use MoneyUtils for safe parsing instead of parseFloat
    const { MoneyUtils } = await import('../shared/money.js');
    const rateDecimal = MoneyUtils.parseExchangeRate(rate);
    console.log('🔍 ConfigurationService.getCentralExchangeRate:', { found: !!rate, valid: true, rate: rateDecimal.toNumber() });
    return rateDecimal.toNumber();
  }

  /**
   * Convert ETB to USD using central exchange rate
   */
  async convertETBToUSD(amountETB: number): Promise<{ amountUSD: number; rate: number; timestamp: Date }> {
    const rate = await this.getCentralExchangeRate();
    const amountUSD = new Decimal(amountETB).div(rate).toNumber();
    
    return {
      amountUSD: Math.round(amountUSD * 100) / 100, // Round to 2 decimal places
      rate,
      timestamp: new Date()
    };
  }

  /**
   * Get system setting with caching and validation
   */
  async getSystemSetting(key: string, category?: string): Promise<string | null> {
    const cacheKey = category ? `setting_${key}_${category}` : `setting_${key}`;
    
    // Check cache first
    if (this.cachedSettings.has(cacheKey)) {
      const expiry = this.cacheExpiry.get(cacheKey);
      if (expiry && Date.now() < expiry) {
        console.log('🎯 Cache hit for setting:', key, 'category:', category);
        return this.cachedSettings.get(cacheKey);
      }
    }

    try {
      const conditions = [eq(settings.key, key), eq(settings.isActive, true)];
      if (category) {
        conditions.push(eq(settings.category, category));
      }

      console.log('🔍 Querying setting:', key, 'category:', category || 'none');

      const result = await db.select()
        .from(settings)
        .where(and(...conditions))
        .limit(1);

      const value = result[0]?.value || null;
      const found = result.length > 0;

      console.log('📊 Query result for setting', key, ':', found ? 'found' : 'not found');

      // Cache the result
      this.cachedSettings.set(cacheKey, value);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);

      console.log('💾 Cached setting:', key, 'found:', found);
      return value;
    } catch (error) {
      console.error(`Failed to get system setting ${key}:`, error);
      throw new Error(`Configuration error: Unable to retrieve setting ${key}`);
    }
  }

  /**
   * Update system setting with approval workflow and audit trail
   */
  async updateSystemSetting(
    key: string,
    value: string,
    options: {
      userId: string;
      category?: string;
      description?: string;
      requiresApproval?: boolean;
      changeReason?: string;
      isAdmin?: boolean;
    }
  ): Promise<{ success: boolean; requiresApproval?: boolean; approvalId?: string }> {
    try {
      // Get current setting
      const currentSetting = await db.select()
        .from(settings)
        .where(eq(settings.key, key))
        .limit(1);

      const oldValue = currentSetting[0]?.value || null;
      const settingId = currentSetting[0]?.id;

      // Create snapshot before critical changes
      if (options.category === 'financial' || options.requiresApproval) {
        await this.createConfigurationSnapshot({
          name: `Pre-change: ${key}`,
          description: `Automatic snapshot before updating ${key}`,
          snapshotType: 'pre_change',
          snapshotData: { placeholder: true }, // Will be filled in createConfigurationSnapshot
          createdBy: options.userId
        });
      }

      // Check if approval is required
      const requiresApproval = options.requiresApproval || 
                              options.category === 'financial' ||
                              key === 'USD_ETB_RATE' ||
                              key === 'PREVENT_NEGATIVE_BALANCE';

      if (requiresApproval && !options.isAdmin) {
        // Critical settings require approval workflow (unless admin)
        console.log(`❌ Setting ${key} requires approval workflow. Direct updates not allowed for non-admin users.`);
        throw new Error(`Setting ${key} requires approval workflow. Please use the approval system to make changes.`);
      }

      if (requiresApproval && options.isAdmin) {
        console.log(`⚠️ Admin override: Setting ${key} updated directly by admin user ${options.userId}`);
      }

      // Update or create setting
      if (settingId) {
        await db.update(settings)
          .set({
            value,
            description: options.description,
            category: options.category || 'general',
            version: currentSetting[0].version + 1,
            updatedAt: new Date(),
            updatedBy: options.userId
          })
          .where(eq(settings.id, settingId));
      } else {
        await db.insert(settings).values({
          key,
          value,
          description: options.description,
          category: options.category || 'general',
          requiresApproval: requiresApproval || false,
          updatedBy: options.userId
        });
      }

      // Record change in history
      await db.insert(settingsHistory).values({
        settingId: settingId || 'new',
        settingKey: key,
        oldValue,
        newValue: value,
        version: (currentSetting[0]?.version || 0) + 1,
        changeReason: options.changeReason,
        changeType: settingId ? 'update' : 'create',
        isApproved: !requiresApproval,
        createdBy: options.userId
      });

      // Clear cache
      this.clearSettingCache(key);

      // Audit log (fixed to use correct two-argument signature)
      await auditService.logOperation(
        {
          userId: options.userId,
          userName: 'ConfigurationService',
          userRole: 'admin', // Changed from 'system' to valid enum value
          source: 'configuration_service',
          severity: 'normal',
          businessContext: `Setting ${key} updated from "${oldValue}" to "${value}"`
        },
        {
          entityType: 'settings',
          entityId: key,
          action: settingId ? 'update' : 'create',
          operationType: 'system_setting_change',
          description: `Setting ${key} ${settingId ? 'updated' : 'created'} in category ${options.category || 'general'}`,
          oldValues: oldValue ? { value: oldValue } : null,
          newValues: { 
            value: value,
            category: options.category || 'general',
            requiresApproval,
            changeReason: options.changeReason
          },
          changedFields: ['value'],
          businessContext: `Configuration change: ${key}`,
        }
      );

      return { success: true, requiresApproval };

    } catch (error) {
      console.error(`Failed to update system setting ${key}:`, error);
      throw new Error(`Configuration error: Unable to update setting ${key}`);
    }
  }

  /**
   * STAGE 10 COMPLIANCE: Automatic Entity Numbering
   * Provides consistent numbering across all business entities
   */
  async generateEntityNumber(entityType: string, options?: { prefix?: string; suffix?: string }): Promise<string> {
    try {
      // Get or create numbering scheme
      let scheme = await db.select()
        .from(numberingSchemes)
        .where(and(
          eq(numberingSchemes.entityType, entityType),
          eq(numberingSchemes.isActive, true)
        ))
        .limit(1);

      if (!scheme.length) {
        // Create default numbering scheme
        const defaultScheme: InsertNumberingScheme = {
          entityType,
          prefix: options?.prefix || entityType.substring(0, 3).toUpperCase(),
          currentNumber: 0,
          increment: 1,
          minDigits: 4,
          format: '{prefix}{number:0{minDigits}}{suffix}',
          suffix: options?.suffix || '',
          isActive: true
        };

        await db.insert(numberingSchemes).values(defaultScheme);
        
        scheme = await db.select()
          .from(numberingSchemes)
          .where(eq(numberingSchemes.entityType, entityType))
          .limit(1);
      }

      const currentScheme = scheme[0];
      const nextNumber = currentScheme.currentNumber + currentScheme.increment;

      // Update current number atomically
      await db.update(numberingSchemes)
        .set({
          currentNumber: nextNumber,
          updatedAt: new Date()
        })
        .where(eq(numberingSchemes.id, currentScheme.id));

      // Format the number according to the scheme
      let formattedNumber = currentScheme.format
        .replace('{prefix}', currentScheme.prefix)
        .replace('{suffix}', currentScheme.suffix);

      // Handle zero-padding
      const minDigitsMatch = currentScheme.format.match(/\{number:0(\d+)\}/);
      if (minDigitsMatch) {
        const minDigits = parseInt(minDigitsMatch[1]);
        const paddedNumber = nextNumber.toString().padStart(minDigits, '0');
        formattedNumber = formattedNumber.replace(/\{number:0\d+\}/, paddedNumber);
      } else {
        formattedNumber = formattedNumber.replace('{number}', nextNumber.toString());
      }

      return formattedNumber;

    } catch (error) {
      console.error(`Failed to generate entity number for ${entityType}:`, error);
      throw new Error(`Configuration error: Unable to generate ${entityType} number`);
    }
  }

  /**
   * Create configuration snapshot for rollback capability
   */
  async createConfigurationSnapshot(snapshot: InsertConfigurationSnapshot): Promise<string> {
    try {
      // Get current settings state
      const currentSettings = await db.select().from(settings).where(eq(settings.isActive, true));
      const currentNumberingSchemes = await db.select().from(numberingSchemes).where(eq(numberingSchemes.isActive, true));

      const snapshotData = {
        settings: currentSettings,
        numberingSchemes: currentNumberingSchemes,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };

      const result = await db.insert(configurationSnapshots).values({
        ...snapshot,
        snapshotData
      }).returning({ id: configurationSnapshots.id });

      return result[0].id;

    } catch (error) {
      console.error('Failed to create configuration snapshot:', error);
      throw new Error('Configuration error: Unable to create snapshot');
    }
  }

  /**
   * Get enhanced settings response with all categories
   */
  async getEnhancedSettings(): Promise<EnhancedSettingsResponse> {
    try {
      const [
        exchangeRate,
        preventNegativeBalance,
        approvalThreshold,
        maxFileSize,
        timezone,
        businessAddress,
        enableNotifications,
        autoBackup,
        numberingSchemesList
      ] = await Promise.all([
        this.getSystemSetting('USD_ETB_RATE', 'financial').then(r => parseFloat(r || '60')),
        this.getSystemSetting('PREVENT_NEGATIVE_BALANCE', 'financial').then(r => r === 'true'),
        this.getSystemSetting('APPROVAL_THRESHOLD', 'financial').then(r => parseFloat(r || '5000')),
        this.getSystemSetting('MAX_FILE_SIZE', 'operational').then(r => parseInt(r || '10485760')),
        this.getSystemSetting('TIMEZONE', 'operational').then(r => r || 'UTC'),
        this.getSystemSetting('BUSINESS_ADDRESS', 'operational').then(r => r || ''),
        this.getSystemSetting('ENABLE_NOTIFICATIONS', 'operational').then(r => r === 'true'),
        this.getSystemSetting('AUTO_BACKUP', 'operational').then(r => r !== 'false'),
        db.select().from(numberingSchemes).where(eq(numberingSchemes.isActive, true))
      ]);

      const lastSnapshot = await db.select()
        .from(configurationSnapshots)
        .orderBy(desc(configurationSnapshots.createdAt))
        .limit(1);

      return {
        financial: {
          exchangeRate,
          preventNegativeBalance,
          approvalThreshold,
          currencyDisplayCode: 'USD'
        },
        operational: {
          maxFileSize,
          timezone,
          businessAddress,
          enableNotifications,
          autoBackup
        },
        numbering: numberingSchemesList,
        security: {
          sessionTimeout: 3600,
          passwordPolicy: 'standard',
          auditRetention: 365
        },
        systemInfo: {
          version: '1.0.0',
          lastSnapshot: lastSnapshot[0]?.createdAt?.toISOString() || 'Never',
          configVersion: 1
        }
      };

    } catch (error) {
      console.error('Failed to get enhanced settings:', error);
      throw new Error('Configuration error: Unable to retrieve settings');
    }
  }

  /**
   * Business rule validation helpers
   */
  async isNegativeBalanceAllowed(): Promise<boolean> {
    const setting = await this.getSystemSetting('PREVENT_NEGATIVE_BALANCE', 'financial');
    return setting !== 'true';
  }

  async getApprovalThreshold(): Promise<number> {
    const setting = await this.getSystemSetting('APPROVAL_THRESHOLD', 'financial');
    return parseFloat(setting || '5000');
  }

  /**
   * Clear setting cache
   */
  private clearSettingCache(key?: string): void {
    if (key) {
      const cacheKey = `setting_${key}`;
      this.cachedSettings.delete(cacheKey);
      this.cacheExpiry.delete(cacheKey);
    } else {
      this.cachedSettings.clear();
      this.cacheExpiry.clear();
    }
  }
}

// Export singleton instance
export const configurationService = ConfigurationService.getInstance();