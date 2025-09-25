import { z } from 'zod';
import { 
  NotificationStatus, NotificationChannel, NotificationPriority, 
  AlertType, AlertCategory, NotificationFrequency 
} from '../enums/notifications';

export const zNotificationStatus = z.enum(NotificationStatus);
export const zNotificationChannel = z.enum(NotificationChannel);
export const zNotificationPriority = z.enum(NotificationPriority);
export const zAlertType = z.enum(AlertType);
export const zAlertCategory = z.enum(AlertCategory);
export const zNotificationFrequency = z.enum(NotificationFrequency);