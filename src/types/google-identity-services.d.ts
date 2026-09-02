/**
 * Minimal ambient types for the slice of Google Identity Services (GIS)
 * this app actually uses. Deliberately hand-written rather than pulling
 * in an npm types package: GIS ships no official TypeScript types, and
 * the alternatives are unofficial/unmaintained third-party packages —
 * not worth a dependency for four method signatures.
 * https://developers.google.com/identity/gsi/web/reference/js-reference
 */

interface GoogleCredentialResponse {
  /** The Google ID token (a JWT) — this is the only thing sent to servora-auth. */
  credential: string;
  select_by?: string;
}

interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  itp_support?: boolean;
}

interface GoogleButtonConfiguration {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  shape?: "rectangular" | "pill" | "circle" | "square";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  logo_alignment?: "left" | "center";
  width?: number | string;
}

interface GoogleAccountsId {
  initialize: (config: GoogleIdConfiguration) => void;
  renderButton: (parent: HTMLElement, options: GoogleButtonConfiguration) => void;
  prompt: () => void;
  cancel: () => void;
  disableAutoSelect: () => void;
}

interface Window {
  google?: {
    accounts: {
      id: GoogleAccountsId;
    };
  };
}
