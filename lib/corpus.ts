import raw from './data/corpus.json';
import type { Corpus } from './types';
export const corpus = raw as Corpus;
export const articleMap = new Map(corpus.articles.map(a => [a.id, a]));
