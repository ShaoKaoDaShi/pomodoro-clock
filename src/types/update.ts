export type UpdateStatus =
  | "idle"
  | "checking"
  | "downloading"
  | "available"
  | "downloaded"
  | "installing"
  | "not-available"
  | "error"
  | "unsupported";

export interface UpdateState {
  status: UpdateStatus;
  currentVersion: string;
  latestVersion?: string;
  message?: string;
  error?: string;
}
