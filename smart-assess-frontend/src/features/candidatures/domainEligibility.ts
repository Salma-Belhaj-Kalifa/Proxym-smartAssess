// src/features/candidatures/domainEligibility.ts

export interface EligibilityResult {
  eligible: boolean;
  matched_domain?: string;
  reason: string;
}

export const checkDomainEligibility = async (
  candidateDomain: string,
  acceptedDomains: string[]
): Promise<EligibilityResult> => {

  const response = await fetch("http://localhost:8000/api/v1/eligibility", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      candidate_domain: candidateDomain,
      accepted_domains: acceptedDomains
    })
  });

  if (!response.ok) {
    return { eligible: false, reason: "Erreur serveur" };
  }

  return response.json();
};