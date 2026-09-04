/**
 * School Domain Canonicalization, Validation, and Suggestion Utilities
 * --------------------------------------------------------------------
 * Ensures consistent domain normalization (stripping protocols, www, paths),
 * robust user-friendly domain validation, and institutional recommendations.
 */

export interface NormalizedDomainResult {
  raw: string;
  normalized: string;
  isSpecificDomain: boolean;
  cleanLabel: string;
  explicitTld?: string;
  suggestedDomains: string[];
}

export interface DomainValidationResult {
  isValid: boolean;
  error?: string;
}

export interface SchoolExtensionRecommendation {
  extension: string;
  label: string;
  badge: string;
  reason: string;
  indicativePrice?: number; // Optional indicative standard reference price in INR
}

export const SCHOOL_RECOMMENDED_EXTENSIONS: SchoolExtensionRecommendation[] = [
  {
    extension: '.in',
    label: '.in (India)',
    badge: 'Good for India',
    reason: 'Affordable, trusted, and highly recognized for institutions across India.',
  },
  {
    extension: '.com',
    label: '.com (Universal)',
    badge: 'Universal Recognition',
    reason: 'The worldwide gold standard for credibility and parent trust.',
  },
  {
    extension: '.org',
    label: '.org (Organization)',
    badge: 'Institutional Standard',
    reason: 'Established identity tailored for educational trusts, academies, and societies.',
  },
  {
    extension: '.school',
    label: '.school (Dedicated)',
    badge: 'Modern Educational',
    reason: 'Modern specialized extension immediately communicating a school campus.',
  },
  {
    extension: '.ac.in',
    label: '.ac.in (Academic India)',
    badge: 'Accredited Academic',
    reason: 'Reserved academic domain for recognized schools and collegiate institutions in India.',
  },
];

/**
 * Normalizes any domain or school name input:
 * - Trims whitespace
 * - Converts to lowercase
 * - Strips protocols (https://, http://)
 * - Strips leading 'www.'
 * - Strips trailing slashes and any paths
/**
 * Normalizes any domain or school name input:
 * - Trims whitespace
 * - Converts to lowercase
 * - Strips protocols (https://, http://)
 * - Strips leading 'www.'
 * - Strips query strings (?...) and URL fragments (#...)
 * - Strips trailing slashes and any paths (/...)
 * - Never saves 'www.' or protocol as canonical domain
 */
export function normalizeDomainInput(input: string): NormalizedDomainResult {
  const raw = (input || '').trim();
  let cleaned = raw
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/[?#].*$/, '') // strip query parameters and hash fragments
    .replace(/\/.*$/, '')   // strip trailing slashes and paths
    .trim();

  // Check if user input is an explicit domain
  // Explicit domain conditions:
  // 1. Must NOT contain whitespace (e.g. "Spark Nest Academy" has spaces -> school name)
  // 2. Must contain at least one dot separating label and extension
  // 3. The segment after the last dot must be letters only, length >= 2 (valid TLD format)
  const hasSpace = /\s/.test(cleaned);
  const dotIndex = cleaned.lastIndexOf('.');
  const tldPart = dotIndex > 0 ? cleaned.slice(dotIndex + 1) : '';
  const isExplicitDomain =
    !hasSpace &&
    dotIndex > 0 &&
    dotIndex < cleaned.length - 1 &&
    /^[a-z]{2,}$/i.test(tldPart);

  if (isExplicitDomain) {
    // Canonical normalized domain without www, protocol, path, query, or fragment
    const normalized = cleaned.replace(/[^a-z0-9.-]/g, '');

    // Extract primary label for suggestions:
    // For "myschool.com", label is "myschool"
    // For "myschool.ac.in" or "myschool.co.in", label is "myschool"
    // For "sub.myschool.com", label is "myschool"
    const parts = normalized.split('.');
    let label = parts[0];
    let explicitTld = `.${parts.slice(1).join('.')}`;

    if (parts.length >= 3) {
      const secondToLast = parts[parts.length - 2];
      const last = parts[parts.length - 1];
      if (['ac', 'co', 'edu', 'gov', 'org', 'net'].includes(secondToLast) && last.length === 2) {
        label = parts[parts.length - 3] || parts[0];
        explicitTld = `.${secondToLast}.${last}`;
      } else {
        label = parts[parts.length - 2] || parts[0];
        explicitTld = `.${last}`;
      }
    }
    label = label.replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, '');

    // Suggestions based on this label
    const suggestedDomains = SCHOOL_RECOMMENDED_EXTENSIONS.map(
      (ext) => `${label}${ext.extension}`
    );

    return {
      raw,
      normalized,
      isSpecificDomain: true,
      cleanLabel: label,
      explicitTld,
      suggestedDomains,
    };
  }

  // School name or keyword entered: e.g. "Sparknest Academy" or "Spark Nest Academy"
  // Convert spaces to single seamless label (e.g. "sparknestacademy")
  const cleanLabel = cleaned
    .replace(/[^a-z0-9]/g, '') // remove spaces and special characters for a clean school domain label
    .trim();

  const suggestedDomains = SCHOOL_RECOMMENDED_EXTENSIONS.map(
    (ext) => `${cleanLabel}${ext.extension}`
  );

  return {
    raw,
    normalized: cleanLabel,
    isSpecificDomain: false,
    cleanLabel,
    suggestedDomains,
  };
}

/**
 * Validates domain or school name inputs.
 * Distinguishes between keyword entry and explicit domain entry.
 * Strictly rejects localhost, IP addresses, URLs with paths, queries, fragments,
 * spaces in domains, malformed syntax, and invalid TLDs.
 */
export function validateDomainInput(
  input: string,
  options?: { requireFullDomain?: boolean }
): DomainValidationResult {
  const trimmed = (input || '').trim();

  if (!trimmed || trimmed.length < 2) {
    return {
      isValid: false,
      error: 'Please enter your school name or preferred domain (at least 2 characters).',
    };
  }

  // Check for dangerous protocol or scheme attempts
  if (/^(javascript|ftp|data|file|blob):/i.test(trimmed)) {
    return {
      isValid: false,
      error: 'Please enter a valid school name or domain without protocol schemes.',
    };
  }

  // Reject URL query strings and hash anchors
  if (trimmed.includes('?')) {
    return {
      isValid: false,
      error: 'Please enter only the domain name without query parameters.',
    };
  }

  if (trimmed.includes('#')) {
    return {
      isValid: false,
      error: 'Please enter only the domain name without URL anchors or fragments.',
    };
  }

  // Check for page paths beyond domain (e.g. https://example.com/path or example.com/path)
  const withoutProtocol = trimmed.replace(/^https?:\/\//i, '');
  if (withoutProtocol.includes('/')) {
    const pathPart = withoutProtocol.split('/')[1];
    if (pathPart && pathPart.trim().length > 0) {
      return {
        isValid: false,
        error: 'Please enter only the domain name without page paths (e.g. myschool.com).',
      };
    }
  }

  // Clean host for localhost and IP address inspection
  const hostWithoutSlash = withoutProtocol
    .replace(/\/.*$/, '')
    .replace(/^www\./i, '')
    .trim()
    .toLowerCase();

  // Check for localhost
  if (
    hostWithoutSlash === 'localhost' ||
    hostWithoutSlash.startsWith('localhost:') ||
    hostWithoutSlash.endsWith('.localhost')
  ) {
    return {
      isValid: false,
      error: 'Localhost is not a valid public school domain. Please enter a public domain name (e.g. myschool.com).',
    };
  }

  // Check for IPv4 addresses (e.g. 127.0.0.1, 192.168.1.1, with or without port)
  const hostNoPort = hostWithoutSlash.replace(/:\d+$/, '');
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostNoPort)) {
    return {
      isValid: false,
      error: 'IP addresses are not permitted. Please enter a valid public domain name (e.g. myschool.com or sparknestacademy.in).',
    };
  }

  // Check for IPv6 addresses (e.g. ::1, [::1], fe80::)
  if (/^\[?[a-f0-9:]+\]?$/i.test(hostWithoutSlash) && hostWithoutSlash.includes(':')) {
    return {
      isValid: false,
      error: 'IP addresses are not permitted. Please enter a valid public domain name (e.g. myschool.com or sparknestacademy.in).',
    };
  }

  // Check if explicit domain format is required (via option or presence of dot)
  const hasDot = hostWithoutSlash.includes('.');

  if (options?.requireFullDomain || hasDot) {
    // Domains cannot contain whitespace
    if (/\s/.test(trimmed)) {
      return {
        isValid: false,
        error: 'Domains cannot contain spaces. Use a format like myschool.com or myschool.in.',
      };
    }

    // Cannot contain consecutive dots
    if (hostWithoutSlash.includes('..')) {
      return {
        isValid: false,
        error: 'Domain contains consecutive dots. Please enter a valid domain like myschool.com.',
      };
    }

    // Check domain structure: at least label.tld (labels: alphanumeric, hyphens not at start/end)
    const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/i;
    if (!domainRegex.test(hostWithoutSlash)) {
      return {
        isValid: false,
        error: 'Please enter a valid domain such as myschool.com or sparknestacademy.in.',
      };
    }

    // Check TLD length and valid alphabetic characters (TLD cannot be numbers or 1 letter)
    const parts = hostWithoutSlash.split('.');
    const tld = parts[parts.length - 1];
    if (tld.length < 2 || !/^[a-z]+$/i.test(tld)) {
      return {
        isValid: false,
        error: 'Domain extension is incomplete or invalid (e.g. .in, .com, .org, .school).',
      };
    }
  } else {
    // School name or keyword validation
    // Disallow dangerous symbols or excessive punctuation
    if (/[<>{}[\]\\^~`$@!#%&*+=:;?]/.test(trimmed)) {
      return {
        isValid: false,
        error: 'Please enter a valid school name using letters and numbers (e.g. Sparknest Academy).',
      };
    }

    const clean = trimmed.replace(/[^a-z0-9]/gi, '');
    if (clean.length < 2) {
      return {
        isValid: false,
        error: 'Please enter at least 2 alphanumeric characters for your school name.',
      };
    }
  }

  return { isValid: true };
}
