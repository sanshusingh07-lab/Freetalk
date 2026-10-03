export function serializeUser(user, activeIdentity = null) {
  if (!user) return null;
  return {
    id: user.id,
    role: user.role,
    status: user.status,
    reputationScore: user.reputationScore,
    contributionBadge: user.contributionBadge,
    interests: user.interests || [],
    identityPreference: user.identityPreference,
    messagePermission: user.messagePermission,
    personalizedFeed: user.personalizedFeed,
    activityVisibility: user.activityVisibility,
    createdAt: user.createdAt,
    activeIdentity: activeIdentity ? serializePublicIdentity(activeIdentity) : null
  };
}

export function serializePublicIdentity(identity) {
  if (!identity) return null;
  return {
    id: identity.id,
    displayName: identity.displayName,
    avatarSeed: identity.avatarSeed,
    avatarShape: identity.avatarShape,
    avatarColor: identity.avatarColor,
    identityType: identity.identityType
  };
}
