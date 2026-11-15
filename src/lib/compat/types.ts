/**
 * Are We Compatible? — core types.
 *
 * Everything in src/lib/compat (except ./server) is pure TypeScript with no
 * server or browser dependencies, so the question bank, scoring engine and
 * report builder can run anywhere and are unit-tested in isolation.
 */

export type DimensionId = 'communication' | 'emotional' | 'lifestyle' | 'future' | 'conflict';

/**
 * Individual tendencies, each a spectrum from -1 to +1. Options nudge a
 * person along one or more axes; a person's position is the mean of the
 * nudges from their answers. Used for the individual profiles only — never
 * for the compatibility scores.
 */
export type AxisId = 'expression' | 'togetherness' | 'engagement' | 'structure' | 'reassurance' | 'horizon';

export type Role = 'a' | 'b';

export interface QuestionOption {
  id: string;
  /** What the participant reads and taps (first person). */
  label: string;
  /** Third-person verb phrase that follows a name: "Sam {trait}". */
  trait: string;
  /** Plural verb phrase that follows "you both": "you both {plural}". */
  plural: string;
  axes?: Partial<Record<AxisId, number>>;
}

/** Two different answers with a specific meaning when they meet. */
export interface OptionPair {
  a: string;
  b: string;
  /** Second-person-plural explanation shown in the report. */
  note: string;
}

export interface BlindSpotRule {
  /** When BOTH participants' answers are in this set, it is a shared blind spot (even if they agree). */
  options: string[];
  note: string;
}

export interface Question {
  id: string;
  dimension: DimensionId;
  /**
   * scale  — options are ordered along a spectrum; distance = difference.
   * choice — options are categories; differences are neutral unless a pair
   *          says they are complementary or a likely source of friction.
   */
  kind: 'scale' | 'choice';
  prompt: string;
  /** Short name used as a heading in the report, e.g. "Daily contact". */
  topic: string;
  /** Relative importance within its dimension (default 1). */
  weight?: number;
  options: QuestionOption[];
  /** scale only: a distance of at least this many steps is a likely misunderstanding. Default: the full width of the scale. */
  tensionAt?: number;
  /**
   * Alignment (0–100) given to a neutral difference. Defaults to 45. Questions
   * about personal *needs* use a higher value: wanting different things is
   * information to act on, not a mismatch.
   */
  differentScore?: number;
  complements?: OptionPair[];
  frictions?: OptionPair[];
  blindSpots?: BlindSpotRule[];
  insight: {
    /** Why this topic matters (one sentence). */
    why: string;
    /** When you answered the same. */
    shared: string;
    /** When you answered differently (no specific pair note). */
    different: string;
    /** A practical way to bridge the difference. */
    bridge: string;
  };
  /** A conversation starter tied to this topic. */
  starter: string;
}

export interface Dimension {
  id: DimensionId;
  label: string;
  short: string;
  description: string;
}

export interface QuestionSet {
  version: string;
  dimensions: Dimension[];
  questions: Question[];
}

/** A participant's answers: question id → option id. */
export type Answers = Record<string, string>;

export type Relation = 'shared' | 'close' | 'complementary' | 'different' | 'tension';

export interface QuestionComparison {
  questionId: string;
  dimension: DimensionId;
  a: string;
  b: string;
  relation: Relation;
  /** How alike the two answers are, 0–1 (pure similarity, no interpretation). */
  similarity: number;
  /** How well the two answers sit together, 0–100 (interpretation, see scoring.ts). */
  alignment: number;
  /** Both answers fall in a blind-spot set for this question. */
  blindSpot: string | null;
  /** The pair-specific note when the two answers form a known complement or friction. */
  pairNote: string | null;
  weight: number;
}

export interface DimensionScore {
  id: DimensionId;
  alignment: number;
  similarity: number;
  counts: Record<Relation, number>;
  blindSpots: number;
}

export type SignatureId = 'mirror' | 'puzzle' | 'anchors' | 'bridge' | 'explorers' | 'conversation' | 'balanced';

export interface ScoringResult {
  scoringVersion: string;
  questionSetVersion: string;
  overall: {
    /** Mean of the five dimension alignments, 0–100. */
    alignment: number;
    /** Overall similarity indicator, 0–100. */
    similarity: number;
    sameAnswers: number;
    total: number;
    counts: Record<Relation, number>;
    blindSpots: number;
  };
  dimensions: DimensionScore[];
  comparisons: QuestionComparison[];
  axes: Record<Role, Record<AxisId, number | null>>;
  signature: SignatureId;
}

export type RelationshipContext = 'talking' | 'dating' | 'long_term' | 'married' | 'other';
