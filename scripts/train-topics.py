"""Train real BERTopic on English article snapshots, offline from the web app.

Embeddings average overlapping word windows so long articles are not silently
truncated to the model's first tokens. Cluster IDs are NOT legal categories.
"""
import os
os.environ.setdefault("HF_HUB_DISABLE_XET", "1")
os.environ.setdefault("HF_HUB_DOWNLOAD_TIMEOUT", "120")
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
from pathlib import Path
from datetime import datetime, timezone
import hashlib, json, collections
import numpy as np
from sentence_transformers import SentenceTransformer
from bertopic import BERTopic
from sklearn.feature_extraction.text import CountVectorizer
from umap import UMAP
from hdbscan import HDBSCAN
import importlib.metadata

ROOT=Path(__file__).resolve().parents[1]
path=ROOT/'lib/data/corpus.json'
corpus=json.loads(path.read_text(encoding='utf8'))
model_name='sentence-transformers/all-MiniLM-L6-v2'
cache=ROOT.parent/'.model-cache'
cache.mkdir(exist_ok=True)
print('Loading embedding model', model_name, flush=True)
embedding=SentenceTransformer(model_name,cache_folder=str(cache),device='cpu')
docs=[a['title']+'\n'+a['text'] for a in corpus['articles']]
windows=[]; owners=[]
for i,doc in enumerate(docs):
    words=doc.split()
    for start in range(0,len(words),120):
        windows.append(' '.join(words[start:start+160])); owners.append(i)
print('Encoding',len(windows),'windows for',len(docs),'articles',flush=True)
vectors=embedding.encode(windows,batch_size=32,show_progress_bar=True,normalize_embeddings=True)
pooled=np.zeros((len(docs),vectors.shape[1]),dtype=np.float32)
for i,v in zip(owners,vectors): pooled[i]+=v
pooled/=np.maximum(np.linalg.norm(pooled,axis=1,keepdims=True),1e-12)
topic_model=BERTopic(embedding_model=embedding,
    umap_model=UMAP(n_neighbors=15,n_components=5,min_dist=0.0,metric='cosine',random_state=42),
    hdbscan_model=HDBSCAN(min_cluster_size=10,min_samples=3,metric='euclidean',prediction_data=True),
    vectorizer_model=CountVectorizer(stop_words='english',ngram_range=(1,2),min_df=2),
    verbose=True,calculate_probabilities=False)
topics,_=topic_model.fit_transform(docs,pooled)
counts=collections.Counter(int(t) for t in topics)
for a,t in zip(corpus['articles'],topics): a['topic']=int(t)
corpus['topics']=[{'id':t,'keywords':[w for w,_ in topic_model.get_topic(t)[:10]],'count':counts[t]} for t in sorted(counts) if t!=-1]
corpus['analysis']={'status':'ready','method':'BERTopic','version':importlib.metadata.version('bertopic'),
    'embeddingModel':model_name,'documentCount':len(docs),'windowCount':len(windows),'topicCount':len(corpus['topics']),
    'outlierCount':counts.get(-1,0),'seed':42,'trainedAt':datetime.now(timezone.utc).isoformat(),
    'corpusSha256':hashlib.sha256('\n'.join(docs).encode()).hexdigest(),
    'limitations':'Exploratory clusters on original English snapshots. No legal accuracy claim or measured retrieval improvement.'}
path.write_text(json.dumps(corpus,ensure_ascii=False,separators=(',',':')),encoding='utf8')
artifacts=ROOT/'data/analysis';artifacts.mkdir(exist_ok=True)
np.save(artifacts/'article-embeddings.npy',pooled)
(artifacts/'training-report.json').write_text(json.dumps(corpus['analysis'],ensure_ascii=False,indent=2),encoding='utf8')
topic_model.save(str(cache/'bertopic-legal'),serialization='safetensors',save_ctfidf=True,save_embedding_model=model_name)
print(json.dumps(corpus['analysis'],ensure_ascii=True),flush=True)
