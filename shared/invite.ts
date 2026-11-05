export const DEFAULT_APP_ORIGIN = "https://ourcalendar-1ze.pages.dev";

/** The link a user opens runs on the app origin (Pages), never the Worker API host. */
export function buildInviteUrl(appOrigin: string, token: string): string {
  return `${appOrigin.replace(/\/+$/, "")}/invite/${token}`;
}
