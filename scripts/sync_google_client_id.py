from pathlib import Path
import json
import re

project = Path(__file__).resolve().parents[1]
env_dump = Path('/tmp/saki_convex_env_names.log').read_text()
match = re.search(r'^AUTH_GOOGLE_ID=(.+)$', env_dump, re.MULTILINE)
if not match:
    raise SystemExit('AUTH_GOOGLE_ID was not found in Convex environment output')
client_id = match.group(1).strip().strip("'")
if not client_id.endswith('.apps.googleusercontent.com'):
    raise SystemExit('Convex AUTH_GOOGLE_ID does not look like a Google OAuth client ID')
login_path = project / 'src/pages/LoginPage.tsx'
source = login_path.read_text()
updated, count = re.subn(r'(clientId:\s*)"[^"]+"', rf'\1"{client_id}"', source, count=1)
if count != 1:
    raise SystemExit('Could not locate the native Google clientId in LoginPage.tsx')
login_path.write_text(updated)

services_path = project / 'android/app/google-services.json'
services = json.loads(services_path.read_text())
changed = False
for oauth_client in services.get('client', [{}])[0].get('oauth_client', []):
    if oauth_client.get('client_type') == 3 and oauth_client.get('client_id') != client_id:
        oauth_client['client_id'] = client_id
        changed = True
for oauth_client in services.get('client', [{}])[0].get('services', {}).get('appinvite_service', {}).get('other_platform_oauth_client', []):
    if oauth_client.get('client_type') == 3 and oauth_client.get('client_id') != client_id:
        oauth_client['client_id'] = client_id
        changed = True
if changed:
    services_path.write_text(json.dumps(services, indent=2) + '\\n')
print('Updated native Google client ID and Google Services configuration without printing their values.')
