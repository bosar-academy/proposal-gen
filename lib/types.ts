export type ProblemItem = {
  title: string;
  description: string;
  consequence: string;
};

export type SolutionComponent = {
  name: string;
  description: string;
  benefit: string;
};

export type ProofBlock = {
  headline: string;
  description: string;
};

export type TimelineStep = {
  step: string;
  title: string;
  description: string;
  why: string;
};

export type InvestmentItem = {
  item: string;
  amount: string;
};

export type ProposalStructuredContent = {
  opening: string;
  problemContext: string;
  problems: ProblemItem[];
  solutionOverview: string;
  solutionComponents: SolutionComponent[];
  whyUsStatement: string;
  proofBlocks: ProofBlock[];
  whyMatters: string[];
  whyMattersClosing: string;
  teamStory: string;
  timeline: TimelineStep[];
  investmentItems: InvestmentItem[];
  investmentRoi: string;
  agreement: string;
  providerCompany: string;
  logoUrl?: string;
  teamMember1PhotoUrl?: string;
  teamMember1Name?: string;
  teamMember2PhotoUrl?: string;
  teamMember2Name?: string;
  providerSignerName?: string;
  providerSignerTitle?: string;
  providerSignatureData?: string;
  proposalDate?: string;
};

export type ProposalContent = {
  type: "structured";
  structured: ProposalStructuredContent;
  html: string; // fallback HTML for editor
};

export type Proposal = {
  id: string;
  user_id: string;
  title: string;
  client_name: string | null;
  client_email: string | null;
  content: ProposalContent;
  status: "draft" | "sent" | "viewed" | "signed" | "paid";
  payment_type: "one_time" | "deposit_milestone" | "subscription" | null;
  total_amount: number | null;
  deposit_amount: number | null;
  currency: string;
  stripe_price_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Signature = {
  id: string;
  proposal_id: string;
  signer_name: string;
  signer_email: string;
  signature_data: string;
  ip_address: string | null;
  signed_at: string;
};

export type Payment = {
  id: string;
  proposal_id: string;
  stripe_session_id: string | null;
  stripe_subscription_id: string | null;
  amount: number;
  status: "pending" | "succeeded" | "failed";
  type: "one_time" | "deposit" | "milestone" | "subscription";
  created_at: string;
};

export type BusinessProfile = {
  id: string;
  user_id: string;
  company_name: string | null;
  company_description: string | null;
  years_in_business: string | null;
  team_description: string | null;
  key_differentiators: string | null;
  notable_clients: string | null;
  industry_focus: string | null;
  website_url: string | null;
  logo_url: string | null;
  team_member1_photo_url: string | null;
  team_member1_name: string | null;
  team_member2_photo_url: string | null;
  team_member2_name: string | null;
  provider_signer_name: string | null;
  provider_signer_title: string | null;
  provider_signature_data: string | null;
  created_at: string;
  updated_at: string;
};

export type ProposalEvent = {
  id: string;
  proposal_id: string;
  event_type: "viewed" | "signed" | "paid" | "created";
  metadata: Record<string, unknown>;
  created_at: string;
};
