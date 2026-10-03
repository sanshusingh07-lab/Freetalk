from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum

class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class ActionRecommended(str, Enum):
    PUBLISH = "publish"
    REVIEW = "review"
    BLOCK = "block"

class InstantAction(str, Enum):
    PASSED = "PASSED"
    CLEANED = "CLEANED"
    BLOCKED = "BLOCKED"

class ModerationRequest(BaseModel):
    content: str = Field(..., description="Post, comment or message text to analyze")
    title: Optional[str] = Field(None, description="Optional title for posts")
    target_type: Optional[str] = Field("post", description="post, comment, or message")

class ModerationResponse(BaseModel):
    toxicity_score: float
    harassment_score: float
    spam_score: float
    threat_score: float
    negativity_score: float
    risk_level: RiskLevel
    recommended_action: ActionRecommended
    instant_action: InstantAction
    flagged_keywords: List[str]
    detected_badwords: List[str]
    cleaned_content: str
    is_safe: bool
    summary: str
    block_reason: Optional[str] = None
