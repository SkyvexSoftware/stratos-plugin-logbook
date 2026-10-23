/** Shape of an axios-style error from the shell's VA client. */
type VaErrorLike = { response?: { status?: number }; message?: string };

/**
 * The message to show for a failed VA request. A 5xx says the airline's
 * server is down, so pilots don't go looking for the fault on their own PC;
 * anything else keeps the error's own message.
 */
export function vaErrorMessage(err: unknown): string | undefined {
  const e = err as VaErrorLike | null | undefined;
  const status = e?.response?.status;
  if (typeof status === "number" && status >= 500) {
    return `Your airline's server isn't responding right now (${status}). This is on the airline's side, so try again shortly or let your airline's staff know.`;
  }
  return e?.message;
}
