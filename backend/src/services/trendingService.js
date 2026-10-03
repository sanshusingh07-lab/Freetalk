export function calculateTrendingScore(post) {
  const commentWeight = 3.5;
  const reactionWeight = 2.0;
  const viewWeight = 0.1;

  const commentCount = post._count?.comments || post.comments?.length || 0;
  const reactionCount = post._count?.reactions || post.reactions?.length || 0;
  const views = post.views || 0;

  const baseEngagement = (commentCount * commentWeight) + (reactionCount * reactionWeight) + (views * viewWeight);

  // Time decay: hours since creation
  const hoursSinceCreation = Math.max(0.1, (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60));
  const gravity = 1.6;

  const score = (baseEngagement + 1) / Math.pow(hoursSinceCreation + 2, gravity);
  return parseFloat(score.toFixed(4));
}
