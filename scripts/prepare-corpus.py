"""Parse original legal articles and extract auditable citation candidates."""
from pathlib import Path
from datetime import datetime, timezone
import json, re, hashlib, xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]

def clean(s):
    return " ".join(s.split())

def prepare():
    sources = json.loads((ROOT / "data/sources.json").read_text(encoding="utf8"))
    articles = []
    for source in sources:
        tree = ET.fromstring((ROOT / f"data/raw/{source['celex']}.xhtml").read_bytes())
        for element in tree.iter():
            identifier = element.get("id", "")
            if not re.fullmatch(r"art_\d+", identifier):
                continue
            number = int(identifier[4:])
            ps = [p for p in element.iter() if p.tag.endswith("}p")]
            headings = [clean("".join(p.itertext())) for p in ps if "sti-art" in p.get("class", "")]
            title = headings[0] if headings else f"Article {number}"
            paragraphs = [clean("".join(p.itertext())) for p in ps if "ti-art" not in p.get("class", "")]
            paragraphs = [p for p in paragraphs if p]
            text = "\n\n".join(paragraphs)
            articles.append({"id": f"{source['id']}:{number}", "lawId": source["id"], "number": number, "title": title, "text": text, "paragraphs": paragraphs, "sourceUrl": f"{source['downloadUrl']}#art_{number}", "references": [], "topic": -1})
        source["articleCount"] = sum(a["lawId"] == source["id"] for a in articles)
    ids = {a["id"] for a in articles}
    laws_by_number = {s["number"]: s["id"] for s in sources}
    # Stop before prose; parenthesised paragraph/point qualifiers remain in the evidence.
    expression = re.compile(r"\bArticles?\s+(\d+[a-z]?(?:\([\da-zivx]+\))*(?:\s*(?:,|and|to)\s*\d+[a-z]?(?:\([\da-zivx]+\))*)*)", re.I)
    for article in articles:
        seen = set()
        for match in expression.finditer(article["text"]):
            rest = article["text"][match.end():match.end()+160]
            external = re.match(r"\s*(?:and\s*\([\da-z]+\)\s*)*(?:,?\s*(?:point|paragraph)\s*\([\da-z]+\),?\s*)?of\s+(?:the\s+)?(Regulation|Directive|Decision|Treaty)\b([^.;\n]{0,90})", rest, re.I)
            target_law = article["lawId"]
            external_label = None
            ambiguous = re.match(r"\s*(?:,?\s*(?:point|paragraph)\s*\([\da-z]+\),?\s*)?(?:of\s+(?:that|those|the said|a delegated|an implementing)\s+(?:Regulation|Directive|Decision)|(?:of\s+the\s+)?(?:TFEU|TEU|EC Treaty))\b", rest, re.I)
            if ambiguous:
                target_law = None
                external_label = clean(ambiguous.group(0))
            if external:
                suffix = external.group(0)
                number_match = re.search(r"\b(\d{1,4}/\d{1,4})\b", suffix)
                law_number = number_match.group(1) if number_match else ""
                target_law = laws_by_number.get(law_number) if external.group(1).lower() == "regulation" else None
                external_label = clean(suffix.removeprefix(" of "))
            sequence = re.sub(r"\([^)]*\)", "", match.group(1))
            numbers = [int(n) for n in re.findall(r"\d+", sequence)]
            if " to " in sequence and len(numbers) == 2 and 0 < numbers[1]-numbers[0] <= 30:
                numbers = list(range(numbers[0], numbers[1]+1))
            for n in numbers:
                target = f"{target_law}:{n}" if target_law else None
                if target == article["id"]:
                    continue
                evidence = clean(article["text"][max(0,match.start()-85):min(len(article["text"]),match.end()+160)])
                key = (target_law, n, external_label)
                if key in seen:
                    continue
                seen.add(key)
                article["references"].append({"targetId": target if target in ids else None, "number": n, "lawId": target_law, "label": f"Article {n}" + (f" · {external_label}" if external_label else " · 本条例"), "evidence": evidence, "kind": "external" if external or ambiguous else "internal", "verified": False})
    corpus = {"generatedAt": datetime.now(timezone.utc).isoformat(), "versionNote": "四部法规的原始公布文本；不含后续修订整合，不代表现行法完整覆盖。", "sources": sources, "articles": articles, "topics": [], "analysis": {"status": "pending", "method": "BERTopic"}}
    out = ROOT / "lib/data/corpus.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    if out.exists():
        previous=json.loads(out.read_text(encoding='utf8'))
        digest=hashlib.sha256('\n'.join(a['title']+'\n'+a['text'] for a in articles).encode()).hexdigest()
        if previous.get('analysis',{}).get('corpusSha256')==digest:
            assignments={a['id']:a['topic'] for a in previous['articles']}
            for a in articles:a['topic']=assignments[a['id']]
            corpus['analysis']=previous['analysis'];corpus['topics']=previous['topics']
    out.write_text(json.dumps(corpus, ensure_ascii=False, separators=(",", ":")), encoding="utf8")
    print(json.dumps({"articles": len(articles), "references": sum(len(a['references']) for a in articles), "bytes": out.stat().st_size}))

if __name__ == "__main__":
    prepare()
