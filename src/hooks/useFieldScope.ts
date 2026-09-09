'use client';

import { useMemo } from 'react';
import {
  type ProductId,
  FIELD_SCOPE_REGISTRY,
  isFieldApplicable,
  getVisibleFields,
  hasSectionApplicableFields,
} from '../lib/fieldScopeRegistry';

export interface UseFieldScopeResult {
  /** Check if a specific field should be rendered */
  isFieldVisible: (fieldKey: string) => boolean;
  /** Get all visible field keys for the section */
  getVisibleFieldKeys: () => string[];
  /** True if the entire section is a single-scope wildcard (no per-field filtering needed) */
  isWildcardSection: boolean;
  /** Get the scope tag for a field */
  scopeTag: (fieldKey: string) => string | undefined;
  /** True if the section has any applicable fields for the current product */
  hasSectionContent: boolean;
}

/**
 * React hook for field-level scope filtering in onboarding form sections.
 * 
 * Usage:
 * ```tsx
 * const { isFieldVisible } = useFieldScope(productId, 'admissions');
 * 
 * return (
 *   <div>
 *     {isFieldVisible('session') && <SessionField />}
 *     {isFieldVisible('applicationOptions.onlineApplication') && <OnlineAppField />}
 *   </div>
 * );
 * ```
 */
export function useFieldScope(
  productId: string | null | undefined,
  sectionKey: string
): UseFieldScopeResult {
  return useMemo(() => {
    const registry = FIELD_SCOPE_REGISTRY[sectionKey];
    
    // If no registry entry exists for this section, or no product selected,
    // show all fields (safe fallback)
    if (!productId || !registry || registry.length === 0) {
      return {
        isFieldVisible: () => true,
        getVisibleFieldKeys: () => [],
        isWildcardSection: true,
        scopeTag: () => undefined,
        hasSectionContent: true,
      };
    }

    const pid = productId as ProductId;
    
    // Check if this is a wildcard section (single '*' entry)
    const isWildcard = registry.length === 1 && registry[0].fieldKey === '*';
    
    // Pre-compute visible fields for performance
    const visibleFields = getVisibleFields(sectionKey, pid);
    const visibleSet = new Set(visibleFields);
    const hasWildcard = visibleFields.includes('*');
    
    return {
      isFieldVisible: (fieldKey: string): boolean => {
        if (hasWildcard) return true;
        if (visibleSet.has(fieldKey)) return true;
        // If the field isn't in the registry at all, show it (safe default)
        const fieldEntry = registry.find(e => e.fieldKey === fieldKey);
        if (!fieldEntry) return true;
        return false;
      },
      getVisibleFieldKeys: () => visibleFields,
      isWildcardSection: isWildcard && hasWildcard,
      scopeTag: (fieldKey: string): string | undefined => {
        const entry = registry.find(e => e.fieldKey === fieldKey);
        return entry?.scopeTag;
      },
      hasSectionContent: hasSectionApplicableFields(sectionKey, pid),
    };
  }, [productId, sectionKey]);
}
