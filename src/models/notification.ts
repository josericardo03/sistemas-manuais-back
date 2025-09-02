export interface Notification {
  id: number;
  user_username: string;
  title: string;
  message: string;
  type: "approval_request" | "approval_decision" | "manual_update" | "system";
  related_manual_id?: string;
  related_version_seq?: number;
  is_read: boolean;
  created_at: Date;
  read_at?: Date;
}

export interface CreateNotification {
  user_username: string;
  title: string;
  message: string;
  type: Notification["type"];
  related_manual_id?: string;
  related_version_seq?: number;
}

export interface NotificationResponse {
  success: boolean;
  data?: Notification | Notification[];
  message?: string;
  count?: number;
}
