from pathlib import Path
import re

p = Path('/home/ubuntu/work_saku/github_sakichat_new/research_raffle_crow/raffleCrow_rule/static/js/app.1731554441100.js')
data = p.read_bytes().decode('utf-8', errors='ignore')
patterns = [
    r'https?://[^"\'\\ ]+',
    r'wss?://[^"\'\\ ]+',
    r'[\u0600-\u06ff]{2,}',
    r'[A-Za-z][A-Za-z _-]{3,40}',
]
seen = set()
for pat in patterns:
    for value in re.findall(pat, data):
        value = value.strip()
        if len(value) >= 4 and value not in seen:
            seen.add(value)
            print(value)
