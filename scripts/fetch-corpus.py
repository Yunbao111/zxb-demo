"""Fetch immutable Official Journal snapshots from the EU Publications Office.

These are original enacted texts, NOT a consolidated/current-law service.
No generated text is used as a legal source.
"""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path
import hashlib
import json
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data" / "raw"
SOURCES = [
    {"id": "gpsr", "celex": "32023R0988", "number": "2023/988", "name": "通用产品安全条例", "short": "产品安全", "published": "2023-05-23", "description": "产品安全、经营者义务、远程销售与召回。"},
    {"id": "surveillance", "celex": "32019R1020", "number": "2019/1020", "name": "市场监管与产品合规条例", "short": "市场监管", "published": "2019-06-25", "description": "市场监管、经营者责任与进入欧盟市场的产品。"},
    {"id": "customs", "celex": "32013R0952", "number": "952/2013", "name": "欧盟海关法典", "short": "海关程序", "published": "2013-10-10", "description": "海关程序、货物原产地、估价与报关。"},
    {"id": "accreditation", "celex": "32008R0765", "number": "765/2008", "name": "认可与市场监管条例", "short": "认可与标志", "published": "2008-08-13", "description": "认可、合格评定与 CE 标志；收录的是原始文本。"},
]

def fetch(source):
    target = RAW / f"{source['celex']}.xhtml"
    url = f"https://publications.europa.eu/resource/celex/{source['celex']}.ENG.xhtml"
    if not target.exists():
        for attempt in range(3):
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "EUTradeLawResearchDemo/0.1", "Accept": "application/xhtml+xml"})
                with urllib.request.urlopen(req, timeout=60) as response:
                    payload = response.read()
                    if response.status != 200 or len(payload) < 10000 or b"Article" not in payload:
                        raise ValueError("Source did not return a legal document")
                target.write_bytes(payload)
                break
            except Exception:
                if attempt == 2:
                    raise
                time.sleep(2)
    payload = target.read_bytes()
    return {**source, "sourceUrl": f"https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:{source['celex']}", "downloadUrl": url, "sha256": hashlib.sha256(payload).hexdigest(), "bytes": len(payload), "version": "原始公布文本（非现行整合版）", "fetchedAt": datetime.now(timezone.utc).isoformat()}

if __name__ == "__main__":
    RAW.mkdir(parents=True, exist_ok=True)
    sources = list(ThreadPoolExecutor(max_workers=4).map(fetch, SOURCES))
    (ROOT / "data" / "sources.json").write_text(json.dumps(sources, ensure_ascii=False, indent=2), encoding="utf8")
    for source in sources:
        print(source["celex"], source["bytes"], source["sha256"][:16])
