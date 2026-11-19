"""Builds ../index.html — one page, two complete experiences (F1 default, Dark cinematic).
Run from this folder:  python3 assemble.py"""
import base64, re

read = lambda p: open(p, encoding='utf-8').read()

photo = 'data:image/webp;base64,' + base64.b64encode(open('ayaan.webp', 'rb').read()).decode()
f1_css = re.search(r'<style>(.*?)</style>', read('head.html'), re.S).group(1)
body = read('body.html').replace('<body>', '', 1).replace('src="__PHOTO__"', 'data-photo')

a = read('main-a.js')
imports = [l for l in a.splitlines() if l.startswith('import ')]
a = '\n'.join(l for l in a.splitlines() if not l.startswith('import '))
b = read('main-b.js').replace('const PHOTO = "__PHOTO__";\n', '')
f1_code = d = read('data.js') + read('f1-portfolio.js') + a + b + read('main-c.js')
f1_module = '\n'.join(imports) + '\nconst PHOTO = "' + photo + '";\nfor (const img of document.querySelectorAll("img[data-photo]")) img.src = PHOTO;\n' + f1_code
dark_module = read('dark.js')
for name, code in (('f1', f1_module), ('dark', dark_module)):
    assert '</script' not in code.lower(), f'{name} module contains </script'
open('check-f1.mjs', 'w').write('const PHOTO="";\n' + f1_code)

BOOT = r'''<script>
/* boot: pick the experience before anything paints. First visit → F1. ?theme=dark|f1 also works. */
(function () {
  var t = "f1";
  try { t = localStorage.getItem("ayaan-theme") || "f1"; } catch (e) {}
  try { var q = new URLSearchParams(location.search).get("theme"); if (q === "dark" || q === "f1") t = q; } catch (e) {}
  if (t !== "dark") t = "f1";
  var h = document.documentElement;
  h.setAttribute("data-theme", t);
  try { var sw = JSON.parse(sessionStorage.getItem("ayaan-switch") || "null"); if (sw && sw.to === t) { h.classList.add("is-switching"); window.__switch = sw; } sessionStorage.removeItem("ayaan-switch"); } catch (e) {}
  history.scrollRestoration = "manual"; window.scrollTo(0, 0);
})();
</script>'''

LOADER = r'''<script>
/* mount only the active experience: its module is injected, the other never runs */
(function () {
  var t = document.documentElement.getAttribute("data-theme");
  var src = document.getElementById("theme-" + t);
  if (t !== "f1") { var f = document.getElementById("f1-root"); if (f) f.remove(); }
  var s = document.createElement("script");
  s.type = "module";
  s.textContent = src.textContent;
  document.body.appendChild(s);
})();
</script>'''

out = f'''<!doctype html>
<html lang="en" data-theme="f1">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Shaik Ayaan — Student Developer & Creative Technologist</title>
<meta name="description" content="Shaik Ayaan — Grade 9 student developer, robotics enthusiast and creative technologist from Kuwait. Young mind. Big ideas. Building the future.">
{BOOT}
<script type="importmap">
{{
  "imports": {{
    "three": "https://cdn.jsdelivr.net/npm/three@0.185.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.185.0/examples/jsm/",
    "lenis": "https://cdn.jsdelivr.net/npm/lenis@1.3.26/dist/lenis.mjs"
  }}
}}
</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;700&family=Space+Grotesk:wght@400;500;700&family=Anton&family=Onest:wght@400;500;600&display=swap" rel="stylesheet">
<style>
/* ═══ THEME 01 — F1 (default) ═══ */
{f1_css}
</style>
<style>
{read('dark.css')}
</style>
<style>
{read('shared.css')}
</style>
</head>
<body>
{body}
<div id="dark-root"></div>
<script>
{read('site-data.js')}
</script>
<script type="text/x-theme-module" id="theme-f1">
{f1_module}
</script>
<script type="text/x-theme-module" id="theme-dark">
{dark_module}
</script>
{LOADER}
<script>
{read('shared.js')}
</script>
</body>
</html>
'''
open('../index.html', 'w', encoding='utf-8').write(out)
print(len(out))
