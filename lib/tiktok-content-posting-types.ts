export type TikTokCreatorInfo = {
  creatorAvatarUrl: string | null;
  creatorUsername: string;
  creatorNickname: string;
  privacyLevelOptions: string[];
  commentDisabled: boolean;
  duetDisabled: boolean;
  stitchDisabled: boolean;
  maxVideoPostDurationSec: number;
};

export type TikTokCreatorInfoErrorCode =
  | "unauthenticated"
  | "not_connected"
  | "missing_publish_scope"
  | "authorization_expired"
  | "rate_limited"
  | "posting_unavailable"
  | "request_failed"
  | "invalid_response";

export type TikTokCreatorInfoResult =
  | {
      ok: true;
      creatorInfo: TikTokCreatorInfo;
    }
  | {
      ok: false;
      code: TikTokCreatorInfoErrorCode;
      message: string;
    };
