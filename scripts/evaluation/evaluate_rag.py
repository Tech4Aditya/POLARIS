import argparse, json, re, statistics, sys, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
QUESTIONS = ROOT / 'scripts' / 'evaluation' / 'questions.json'

def call_api(base, question):
    data = json.dumps({'query': question}).encode()
    req = urllib.request.Request(base.rstrip('/') + '/api/knowledge/ask', data=data, headers={'Content-Type':'application/json'})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode())

def norm(s):
    return re.sub(r'[^a-z0-9]+',' ',s.lower()).strip()

def source_hit(result, expected):
    titles = [norm(x.get('title','')) for x in result.get('sources',[])]
    return any(any(norm(e) in t or t in norm(e) for t in titles) for e in expected)

def keyword_coverage(result, keywords):
    text = norm(result.get('answer',''))
    hits = sum(1 for k in keywords if norm(k) in text)
    return hits / len(keywords) if keywords else 1.0

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--base',default='http://localhost:8001')
    ap.add_argument('--out',default='docs/evaluation/latest_results.json')
    args=ap.parse_args()
    qs=json.loads(QUESTIONS.read_text())
    rows=[]
    for q in qs:
        try:
            r=call_api(args.base,q['question'])
            hit=source_hit(r,q['expected_sources'])
            cov=keyword_coverage(r,q['answer_keywords'])
            rows.append({'id':q['id'],'question':q['question'],'source_hit':hit,'keyword_coverage':round(cov,3),'answer':r.get('answer',''),'sources':[s.get('title') for s in r.get('sources',[])]})
            print(f"{q['id']} source={'PASS' if hit else 'FAIL'} keywords={cov:.0%}")
        except Exception as e:
            rows.append({'id':q['id'],'question':q['question'],'error':str(e),'source_hit':False,'keyword_coverage':0})
            print(f"{q['id']} ERROR {e}")
    valid=[r for r in rows if 'error' not in r]
    source_recall=sum(r['source_hit'] for r in valid)/len(valid) if valid else 0
    kw=sum(r['keyword_coverage'] for r in valid)/len(valid) if valid else 0
    report={'benchmark':'POLARIS Antarctic RAG benchmark v1','questions':len(qs),'completed':len(valid),'source_recall_at_5':round(source_recall,4),'answer_keyword_coverage':round(kw,4),'results':rows}
    out=ROOT/args.out
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps(report,indent=2),encoding='utf-8')
    print('\nSUMMARY')
    print(f"Source recall@5: {source_recall:.1%}")
    print(f"Answer keyword coverage: {kw:.1%}")
    print(f"Results: {out}")

if __name__=='__main__': main()
