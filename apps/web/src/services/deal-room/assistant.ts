import type { AgreementContent } from "./domain";

export interface AgreementAssistant {
  readonly provider: string;
  propose(input: {
    current: AgreementContent;
    messages?: readonly string[];
    externalProcessingConsent: boolean;
  }): Promise<{ proposal: AgreementContent; missingFields: string[] }>;
}

export class DeterministicAgreementAssistant implements AgreementAssistant {
  readonly provider = "deterministic";

  async propose(input: {
    current: AgreementContent;
    messages?: readonly string[];
    externalProcessingConsent: boolean;
  }) {
    const proposal = structuredClone(input.current);
    const missingFields = [
      !proposal.title && "Agreement title",
      !proposal.description && "Description",
      proposal.deliverables.length === 0 && "Deliverables",
      proposal.acceptanceCriteria.length === 0 && "Acceptance criteria",
      !proposal.deadline && "Deadline",
    ].filter((value): value is string => Boolean(value));
    return { proposal, missingFields };
  }
}

export function createAgreementAssistant(): AgreementAssistant {
  // External providers are intentionally not invoked until an explicit,
  // audited provider adapter and per-room consent path are configured.
  return new DeterministicAgreementAssistant();
}
