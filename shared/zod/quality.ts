import { z } from 'zod';
import { InspectionType, InspectionStatus, QualityGrade } from '../enums/quality';

export const zInspectionType = z.enum(InspectionType);
export const zInspectionStatus = z.enum(InspectionStatus);
export const zQualityGrade = z.enum(QualityGrade);