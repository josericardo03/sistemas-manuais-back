export interface ManualApprovalRule {
  manual_id: string;
  required_approvals: number;
}

export interface ManualApproval {
  manual_id: string;
  version_seq: number;
  approver_username: string;
  decision_seq: number;
  decision: "approved" | "rejected" | "pending";
  comment?: string;
  decided_at?: Date;
}

export interface ApprovalRequest {
  manual_id: string;
  version_seq: number;
  title: string;
  submitted_by: string;
  submitted_at: Date;
  status: "pending" | "approved" | "rejected";
  current_approvals: number;
  required_approvals: number;
}

export interface ApprovalDecision {
  manual_id: string;
  version_seq: number;
  approver_username: string;
  decision: "approved" | "rejected";
  comment?: string;
}

export interface ApprovalSummary {
  manual_id: string;
  version_seq: number;
  title: string;
  status: "pending" | "approved" | "rejected";
  approvals_count: number;
  required_approvals: number;
  last_decision?: Date;
  approvers: string[];
}
