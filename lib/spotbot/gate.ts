/**
 * The gate. This is the part that matters.
 *
 * SpotBot explains the platform. It does not advise. That distinction has
 * to survive every future change to how answers are produced, so the
 * classifier runs over the question BEFORE the answer engine is called and
 * refuses on its own authority. Swapping the engine for a live model does
 * not move this file, and a model that is never asked cannot be talked
 * into an opinion.
 *
 * The classifier is deliberately literal. It matches intent phrasings, not
 * bare keywords, because "what are the fees" and "are these fees worth it"
 * are the same subject and opposite questions. When it is unsure it lets
 * the question through, and the knowledge base answers structurally or not
 * at all. Over-refusing a mechanics question is its own kind of failure.
 *
 * Rules are evaluated in order, so the more specific intent wins the label:
 * "how much should I invest" is sizing, not a recommendation.
 */
import { questionsFor } from './knowledge';
import type { RefusalReason, SpotBotAnswer } from './types';

interface GateRule {
  reason: RefusalReason;
  patterns: readonly RegExp[];
}

/** Lowercase, straighten quotes, drop punctuation that breaks word runs. */
export function normalize(question: string): string {
  return question
    .toLowerCase()
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\w\s'$%.,?/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const RULES: readonly GateRule[] = [
  {
    // Sizing first: "how much should I put in" is about the investor's
    // finances, and would otherwise read as a generic recommendation.
    reason: 'position_sizing',
    patterns: [
      /\bhow much (should|do|would|ought) (i|we)\b/,
      /\bhow much (money )?(should|would) .*\b(invest|commit|put in|allocate)\b/,
      /\bwhat('s| is| would be)? ?(a |the )?(good|right|best|reasonable|appropriate|sensible|smart|safe|typical) (amount|size|allocation|check|number|minimum for me)\b/,
      /\bhow (should|do) (i|we) (size|allocate|split)\b/,
      /\b(position sizing|size (my|the) (position|check|investment))\b/,
      /\bwhat (percent|percentage|share|portion|fraction) of (my|our) (portfolio|net worth|assets|savings|capital)\b/,
      /\bhow many deals should (i|we)\b/,
      /\bis \$?[\d,.]+ ?k? (a )?(good|right|too much|too little|enough|sensible)\b/,
      /\bshould (i|we) (invest|put|commit|start with) (more|less|the minimum|\$?[\d,.]+)/,
      /\bhow much (of my|of our) (money|capital|portfolio|net worth)\b/,
    ],
  },
  {
    reason: 'performance_prediction',
    patterns: [
      /\b(how much|what) (will|would|could|can|might) (i|we|this|it|the deal|they)\b.*\b(make|earn|return|returns|get back|be worth|grow|profit)\b/,
      /\bhow much (money )?(will|can|could) (i|we)\b/,
      /\b(expected|projected|likely|guaranteed|realistic|typical|average|target|estimated) (return|returns|irr|moic|multiple|profit|profits|yield|upside|performance|gain|gains)\b/,
      /\bwhat (kind|sort|type) of returns?\b/,
      /\bwhat returns?\b/,
      /\b(should|can|will) (i|we) expect\b/,
      /\bwill (this|it|the deal|the company|they) (go up|double|triple|succeed|fail|work out|exit|ipo|\d+ ?x|be worth)\b/,
      /\b(how likely|what are the (odds|chances)|probability of)\b/,
      /\b(price target|upside case|downside case)\b/,
      /\bwhen will (i|we) (see|make) (a |any )?(return|profit|money|gain|gains)\b/,
      /\bhow (much|well) (has|did|does) .*\b(perform|performed|return|returned)\b/,
      /\b(beat|outperform|outperformed) (the )?(market|s ?& ?p|index|stocks|real estate)\b/,
      /\b(is|are) (this|it|these) going to (work|make money|be worth)\b/,
      /\bhow (big|large) (a |an )?(return|multiple|exit)\b/,
    ],
  },
  {
    reason: 'deal_comparison',
    patterns: [
      /\bwhich (deal|one|of these|opportunity|investment|company)\b.*\b(better|best|stronger|safer|riskier|should|pick|choose|prefer|invest|go with)\b/,
      /\b(better|best|stronger|safer|riskier|worse) (deal|investment|opportunity|bet|option|choice)\b/,
      /\b(compare|comparing|rank|ranking|stack up|stacks up)\b.*\b(deals?|investments?|opportunities|these|them)\b/,
      /\bwhich (would|do|should) you (pick|choose|prefer|recommend|go with)\b/,
      /\bwhich is better\b/,
      /\bbetter than (the |this |that )?(other|one|deal|first|second)\b/,
      /\bwhich has the (best|better|highest) (return|upside|odds)\b/,
    ],
  },
  {
    reason: 'tax_or_legal_advice',
    patterns: [
      /\b(tax|taxes|legal|estate|attorney|lawyer|cpa|accountant)\b.*\b(advice|advise)\b/,
      /\bwill (i|we) (owe|pay|be taxed|get taxed)\b/,
      /\bhow (much|will) .*\b(taxed|taxes|tax bill)\b/,
      /\btax (implications|consequences|treatment|impact|efficient|advantaged)\b/,
      /\b(can|should) (i|we) (deduct|write off|claim|defer|offset|shelter)\b/,
      /\bshould (i|we) (use|open|set up|form|create|hold (it|this) (in|through)|put (it|this) in)\b/,
      /\bwhich (profile|entity|structure|account|vehicle|one) (should|would) (i|we)\b/,
      /\b(is|are) (this|it) (legal|allowed|permitted|ok) for (me|us|my)\b/,
      /\b(better|best) for (taxes|tax purposes|my taxes|my estate)\b/,
      /\bpersonal or (an )?(entity|llc|ira)\b.*\b(should|better|best)\b/,
    ],
  },
  {
    reason: 'investment_recommendation',
    patterns: [
      /\bshould (i|we)\b.*\b(invest|buy|subscribe|commit|participate|back this|get in)\b/,
      /\bshould (i|we) do (this|it|that)\b/,
      /\b(do|would|can|could) you (recommend|advise|suggest)\b/,
      /\bwhat (would|do) you (do|invest in|pick|choose|buy)\b/,
      /\byour (opinion|take|advice|thoughts|view) (on|about|of)\b/,
      /\b(is|are) (this|that|it|these|they|the)( deal| investment| one| opportunity)? ?(a )?(good|bad|smart|great|solid|safe|risky|wise|strong|weak)\b/,
      /\b(is|are) (this|it) worth (it|investing|buying|the money|the risk)\b/,
      /\bworth investing\b/,
      /\b(is|are) (this|it) (a )?(scam|legit|legitimate|too risky)\b/,
      /\bwould you (invest|put money|buy)\b/,
      /\bdo you (like|believe in|think) (about )?(this|that|it)\b/,
      /\bwhat do you think\b/,
      /\btell me (if|whether) (i|we) should\b/,
      /\b(convince|talk) me (into|out of)\b/,
      /\bis now a good time\b/,
      /\bhow confident (are you|is altspot)\b/,
    ],
  },
];

export interface GateVerdict {
  allowed: boolean;
  reason?: RefusalReason;
}

/**
 * The only entry point. Returns the refusal reason, or an allowance.
 * Callers must run this before any answer is produced.
 */
export function classify(question: string): GateVerdict {
  const text = normalize(question);
  if (!text) return { allowed: true };

  for (const rule of RULES) {
    if (rule.patterns.some((pattern) => pattern.test(text))) {
      return { allowed: false, reason: rule.reason };
    }
  }
  return { allowed: true };
}

/**
 * Refusal copy. Warm, brief, and it always hands over a real path: the
 * offering documents, an advisor, or a person at AltSpot. A refusal that
 * ends in a dead end is just a wall.
 */
const REFUSALS: Record<RefusalReason, { body: string; followUps: string[] }> = {
  investment_recommendation: {
    body:
      'That one I have to hand back to you. Whether a deal belongs in your portfolio is advice, and I only explain how things work. The offering documents in the data room set out the terms and the risks in full, and an advisor can weigh this against everything else you hold. If part of the structure is unclear, ask me that part and I will explain it properly.',
    followUps: ['deal-page', 'sourcing', 'data-room'],
  },
  performance_prediction: {
    body:
      'I cannot forecast returns, and you should be wary of anything that does. Any projections belong to the operator and live in the offering documents, stated alongside the assumptions they depend on. What I can explain is the economics you are actually signing: when the management fee is charged, how carried interest is calculated, and what has to happen for capital to come back at all.',
    followUps: ['fees', 'carry-mechanics', 'illiquidity'],
  },
  position_sizing: {
    body:
      'How much to commit is a question about your finances, not about the platform, so I will leave it with you and your advisor. What I can give you is the mechanics: the minimum on the deal terms, the all-in cost itemized before you sign, and the 10 day window to fund once you have signed.',
    followUps: ['allocation', 'fees', 'funding-window'],
  },
  tax_or_legal_advice: {
    body:
      'That belongs with your CPA or your attorney. I can tell you how the platform works, not how a decision lands on your return or in your estate. What I can describe is what each profile type is, who signs and funds under each one, and which forms arrive in Docs. Take that to your advisor and the conversation will be quicker.',
    followUps: ['profile-types', 'documents', 'ira-profile'],
  },
  deal_comparison: {
    body:
      'Ranking deals against each other is investment advice, so it is outside what I do. Every deal page is built in the same order for exactly this reason: committed capital, numbers, story, thesis, risks, terms, fees, data room. Read them side by side, then take the comparison to your advisor or to the AltSpot team.',
    followUps: ['deal-page', 'sourcing', 'contact'],
  },
};

export function refusalAnswer(reason: RefusalReason): SpotBotAnswer {
  const refusal = REFUSALS[reason];
  return {
    body: refusal.body,
    source: 'AltSpot platform guide, SpotBot scope',
    refused: true,
    reason,
    followUps: questionsFor(refusal.followUps),
  };
}
