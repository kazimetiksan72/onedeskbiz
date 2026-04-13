import type { CurrentUser } from '../../../types/common';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse extends AuthTokens {
  user: CurrentUser;
}
