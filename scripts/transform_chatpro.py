import urllib.request
import re

url = 'https://raw.githubusercontent.com/alexxcrz/COPMEC/main/client/src/components/ChatPro.jsx'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
content = urllib.request.urlopen(req).read().decode('utf-8')
print(f'Downloaded: {len(content)} chars')

# 1. Remove COPMEC-specific imports
content = content.replace('import { authFetch, useAuth } from "../AuthContext";', '// COPMEC: removed authFetch/useAuth')
content = content.replace('import { getServerUrl, getServerUrlSync } from "../config/server";', '// COPMEC: removed getServerUrl')
content = content.replace('import ReunionesPerfilUsuario from "./ReunionesPerfilUsuario";', '// COPMEC: removed ReunionesPerfilUsuario')

# 2. Stub ReunionesPerfilUsuario
stub = '\n// -- COPMEC stubs --\nfunction ReunionesPerfilUsuario() { return null; }\n'
content = content.replace('import "./ChatPro.css";', 'import "./ChatPro.css";' + stub)

# 3. Remove serverUrl state
content = content.replace('  const [serverUrl, setServerUrl] = useState(null);', '')

# 4. Remove the loadServerUrl useEffect block
old_block = (
    '  // Cargar URL del servidor de forma asíncrona\n'
    '  useEffect(() => {\n'
    '    const loadServerUrl = async () => {\n'
    '      const url = await getServerUrl();\n'
    '      setServerUrl(url);\n'
    '    };\n'
    '    loadServerUrl();\n'
    '  }, []);'
)
if old_block in content:
    print('Found loadServerUrl block - removing')
    content = content.replace(old_block, '')
else:
    print('WARNING: loadServerUrl block NOT found - checking partial match')
    if 'loadServerUrl' in content:
        print('  loadServerUrl exists in content')

# 5. Replace useAuth line and inject authFetch
old_useauth = '  const { perms, token } = useAuth();'
if old_useauth in content:
    print('Found useAuth line')
    new_useauth = (
        "  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';\n"
        "  const authFetch = async (url, opts = {}) => {\n"
        "    const fullUrl = url.startsWith('http') ? url : (API_BASE_URL + (url.startsWith('/') ? url : '/' + url));\n"
        "    const r = await fetch(fullUrl, { ...opts, credentials: 'include' });\n"
        "    if (!r.ok) { const err = new Error(r.statusText || 'Request failed'); err.status = r.status; throw err; }\n"
        "    try { return await r.json(); } catch { return null; }\n"
        "  };"
    )
    content = content.replace(old_useauth, new_useauth)
else:
    print('WARNING: useAuth line NOT found')

# 6. Replace esAdmin
content = content.replace(
    'const esAdmin = perms?.includes("tab:admin");',
    "const esAdmin = user?.role === 'Lead';"
)

# 7. Replace SERVER_URL assignment
content = content.replace(
    '  const SERVER_URL = serverUrl || getServerUrlSync();',
    '  const SERVER_URL = API_BASE_URL;'
)

# 8. Replace /chat/ with /api/chat/ in relative URL strings
content = re.sub(r'authFetch\(`/chat/', 'authFetch(`/api/chat/', content)
content = re.sub(r"authFetch\('/chat/", "authFetch('/api/chat/", content)
content = re.sub(r'authFetch\("/chat/', 'authFetch("/api/chat/', content)
content = content.replace('`${SERVER_URL}/chat/', '`${SERVER_URL}/api/chat/')

# 9. Remove token from image URLs
content = content.replace('?token=${encodeURIComponent(token)}', '')
content = content.replace('?token=${encodeURIComponent(authToken)}', '')
content = content.replace('&token=${encodeURIComponent(token)}', '')
content = content.replace('&token=${encodeURIComponent(authToken)}', '')

# 10. Remove Authorization headers (cookies handle auth now)
content = re.sub(r"headers:\s*token\s*\?\s*\{[^}]*Authorization[^}]*\}\s*:\s*\{\},?", 'headers: {},', content)
content = re.sub(r"Authorization:\s*`Bearer \$\{[^}]+\}`,?\n?", '', content)

print(f'Done. Final size: {len(content)} chars')

out_path = 'frontend/src/components/ChatPro.jsx'
with open(out_path, 'w', encoding='utf-8') as f:
    f.write(content)
print(f'Saved to {out_path}')

# Also download CSS
print('\nDownloading ChatPro.css...')
css_url = 'https://raw.githubusercontent.com/alexxcrz/COPMEC/main/client/src/components/ChatPro.css'
css_req = urllib.request.Request(css_url, headers={'User-Agent': 'Mozilla/5.0'})
css_content = urllib.request.urlopen(css_req).read().decode('utf-8')
print(f'Downloaded CSS: {len(css_content)} chars')
with open('frontend/src/components/ChatPro.css', 'w', encoding='utf-8') as f:
    f.write(css_content)
print('Saved ChatPro.css')
