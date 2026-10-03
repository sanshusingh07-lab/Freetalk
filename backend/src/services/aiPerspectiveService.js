import { prisma } from '../config/db.js';

/**
 * Feature 5: Perspective Mode
 * Synthesizes contrasting perspectives and arguments from a discussion
 */
export async function generatePerspectivesForPost(postId) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: {
      comments: {
        where: { status: 'PUBLISHED' },
        take: 30,
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!post) {
    throw new Error("Discussion not found.");
  }

  const title = post.title;
  const content = post.content;
  const comments = post.comments || [];

  // Group comments into affirmative vs dissenting/alternative
  const supportingArguments = [];
  const counterArguments = [];

  // Categorize any explicitly labeled Challenge comments
  comments.forEach(c => {
    if (c.challengeType === 'AGREE' || c.challengeType === 'EVIDENCE') {
      supportingArguments.push(c.content);
    } else if (c.challengeType === 'DISAGREE' || c.challengeType === 'ALTERNATIVE') {
      counterArguments.push(c.content);
    } else {
      // Heuristic split based on contrast words
      const text = c.content.toLowerCase();
      if (text.includes('however') || text.includes('disagree') || text.includes('but ') || text.includes('contrary') || text.includes('problem with')) {
        counterArguments.push(c.content);
      } else {
        supportingArguments.push(c.content);
      }
    }
  });

  // Extract structured bullet points
  const sideAPoints = [
    `Primary Thesis: ${post.title}`,
    post.content.length > 180 ? `${post.content.slice(0, 180)}...` : post.content
  ];

  if (supportingArguments.length > 0) {
    supportingArguments.slice(0, 3).forEach(arg => {
      sideAPoints.push(arg.length > 140 ? `${arg.slice(0, 140)}...` : arg);
    });
  } else {
    sideAPoints.push("Focuses on core efficiency, individual autonomy, and initial principles outlined in the thought.");
  }

  const sideBPoints = [];
  if (counterArguments.length > 0) {
    counterArguments.slice(0, 4).forEach(arg => {
      sideBPoints.push(arg.length > 140 ? `${arg.slice(0, 140)}...` : arg);
    });
  } else {
    sideBPoints.push(
      "Considers edge cases, unexpected systemic trade-offs, and counter-perspectives.",
      "Questions underlying assumptions regarding scalability and unintended friction."
    );
  }

  return {
    postId: post.id,
    topic: post.title,
    sideA: {
      title: `Perspectives Affirming the Premise`,
      points: sideAPoints
    },
    sideB: {
      title: `Counter-Arguments & Alternative Angles`,
      points: sideBPoints
    },
    synthesis: `FreeTalk Perspective Engine evaluated ${comments.length + 1} perspectives. Both positions reflect valid trade-offs. Weigh the evidence and vote based on argument rigor.`
  };
}
