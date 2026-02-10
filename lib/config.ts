const requiredPublic = ["NEXT_PUBLIC_APP_URL"] as const;

export function validatePublicEnv() {
  const missing = requiredPublic.filter((key) => !process.env[key]);
  return {
    ok: missing.length === 0,
    missing
  };
}

export const appConfig = {
  ideaPriceInCents: 100,
  initialApprovalTemplate:
    "Congrats! This idea has been initially screened and we are looking into creating this.",
  adminRole: "admin"
};
