"""Rank article neighbors using trained document embeddings within BERTopic clusters.
No API, model download or training is performed. Fail if corpus and vectors differ.
"""
from pathlib import Path
import hashlib,json
import numpy as np
root=Path(__file__).resolve().parents[1]
c=json.loads((root/'lib/data/corpus.json').read_text(encoding='utf8'))
digest=hashlib.sha256('\n'.join(a['title']+'\n'+a['text'] for a in c['articles']).encode()).hexdigest()
training=json.loads((root/'data/analysis/training-report.json').read_text(encoding='utf8'))
assert digest==training['corpusSha256']==c['analysis']['corpusSha256'],'Rebuild embeddings for the changed corpus'
vectors=np.load(root/'data/analysis/article-embeddings.npy')
assert len(vectors)==len(c['articles'])
similarity=vectors @ vectors.T
neighbors={}
for i,a in enumerate(c['articles']):
    candidates=[j for j,b in enumerate(c['articles']) if i!=j and a['topic']>=0 and a['topic']==b['topic']]
    ranked=sorted(candidates,key=lambda j:float(similarity[i,j]),reverse=True)[:8]
    neighbors[a['id']]=[{'id':c['articles'][j]['id'],'score':round(float(similarity[i,j]),5)} for j in ranked]
out={'corpusSha256':digest,'method':'cosine similarity within BERTopic cluster','embeddingModel':training['embeddingModel'],'neighbors':neighbors}
(root/'lib/data/neighbors.json').write_text(json.dumps(out,ensure_ascii=False,separators=(',',':')),encoding='utf8')
print('Built semantic neighbors for',len(neighbors),'articles')
