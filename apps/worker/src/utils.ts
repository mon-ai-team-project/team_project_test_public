export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function normalizeDoi(doi: string | null | undefined): string {
  return doi?.replace(/^https?:\/\/doi\.org\//i, "") ?? "";
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unexpected Worker error";
}
