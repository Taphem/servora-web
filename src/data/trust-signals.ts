import type { TrustSignalCopy } from "@/types/domain";

/**
 * Copy is deliberately careful not to overstate what any single signal
 * guarantees — each is one data point, not a certification of character.
 */
export const trustSignals: TrustSignalCopy[] = [
  {
    id: "EMAIL_VERIFIED",
    label: "Email verified",
    description: "Confirmed ownership of a working email address.",
  },
  {
    id: "PHONE_VERIFIED",
    label: "Phone verified",
    description: "Confirmed via one-time code sent by SMS.",
  },
  {
    id: "IDENTITY_LINKED",
    label: "Identity connected",
    description: "Linked to a Google account — one identity signal, not a background check.",
  },
  {
    id: "BUSINESS_VERIFIED",
    label: "Business verified",
    description: "Registration details reviewed against submitted business documents.",
  },
  {
    id: "BACKGROUND_CHECKED",
    label: "Background checked",
    description: "Completed an identity and background screening for this category.",
  },
];
