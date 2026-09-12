import { useMemo } from 'react';
import type { UniversalIntakeData } from '@/lib/types';
import {
  getCampusAcademicScope,
  type CanonicalCampusAcademicScope,
} from '@/lib/campusAcademicScopeService';

/**
 * Custom hook to reactively retrieve the canonical academic scope for a given campus.
 * Automatically synchronizes whenever intakeData.campuses or active campus changes.
 */
export function useCampusAcademicScope(
  campusId?: string,
  intakeData?: Partial<UniversalIntakeData> | null
): CanonicalCampusAcademicScope {
  return useMemo(() => {
    return getCampusAcademicScope(campusId, intakeData);
  }, [
    campusId,
    intakeData?.campuses,
    intakeData?.institutionStructure?.classes,
    intakeData?.schoolProfile?.schoolType,
  ]);
}
