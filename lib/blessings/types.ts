export interface BlessingItem {
  clientId: string;
  author: string;
  message: string;
  createdAt: string;
}

export interface SubmitBlessingPayload {
  slug: string;
  clientId: string;
  author: string;
  message: string;
  honeypot?: string;
}

export type SubmitBlessingResult =
  | {
      ok: true;
      persisted: true;
      duplicate: boolean;
      blessing: BlessingItem;
    }
  | {
      ok: false;
      error: string;
      message?: string;
    };
