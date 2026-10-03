export function scorePostForUser(post, user) {
  let score = 0;

  // Topic match if user follows topic
  const followedTopicIds = user?.followedTopics?.map(f => f.topicId) || [];
  if (followedTopicIds.includes(post.topicId)) {
    score += 40;
  }

  // Interest match with topic slug or hashtags
  const userInterests = user?.interests || [];
  if (userInterests.includes(post.topic?.slug) || userInterests.some(interest => post.hashtags?.includes(interest))) {
    score += 25;
  }

  // Engagement score
  const comments = post._count?.comments || 0;
  const reactions = post._count?.reactions || 0;
  score += Math.min(30, (comments * 2) + reactions);

  // Recency bonus (decays over 7 days)
  const daysOld = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  const recencyBonus = Math.max(0, 20 - (daysOld * 3));
  score += recencyBonus;

  return score;
}
