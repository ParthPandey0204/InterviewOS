type RevocationResult = { count: number };

// Use an atomic conditional update so only one concurrent refresh can consume a token.
export const revokeRefreshTokenOnce = async (
  revokeIfActive: () => Promise<RevocationResult>
) => (await revokeIfActive()).count === 1;
