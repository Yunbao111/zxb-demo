export type Reference = { targetId: string | null; number: number; lawId: string | null; label: string; evidence: string; kind: string; verified: boolean };
export type Article = { id: string; lawId: string; number: number; title: string; text: string; paragraphs: string[]; sourceUrl: string; references: Reference[]; topic: number };
export type Law = { id: string; celex: string; number: string; name: string; short: string; published: string; description: string; sourceUrl: string; downloadUrl: string; sha256: string; version: string; fetchedAt: string; articleCount: number };
export type Topic = { id: number; keywords: string[]; count: number };
export type Corpus = { generatedAt: string; versionNote: string; sources: Law[]; articles: Article[]; topics: Topic[]; analysis: { status: string; method: string; [key: string]: unknown } };
export type SearchHit = { article: Article; score: number; matchedTerms: string[]; topicBoost: boolean };
