import urllib.request

paths = [
    '/manifest.json',
    '/manifest.webmanifest',
    '/sw.js',
    '/icon-192.png',
    '/icon-512.png',
    '/icon-maskable-192.png',
    '/icon-maskable-512.png',
    '/apple-touch-icon.png',
    '/icon.svg'
]

for p in paths:
    url = f'http://localhost:5173{p}'
    try:
        req = urllib.request.urlopen(url)
        content = req.read()
        print(f"{p:25}: status={req.status}, Content-Type={req.headers.get('Content-Type')}, size={len(content)}")
    except Exception as e:
        print(f"{p:25}: ERROR {e}")
