"""Anglická verze alsflow.cz (5. 11. 2026).

Každá anglická stránka v src/pages/en/ se VYRÁBÍ z české stránky:
    python tools/i18n/make_en.py            # všechny stránky
    python tools/i18n/make_en.py o-nas      # jen jedna

Skript zkopíruje českou stránku, opraví importy, přepíše odkazy podle
src/i18n.mjs a nahradí české texty anglickými z tools/i18n/en/<stránka>.py.
Kód, styly a skripty stránky se nekopírují ručně, takže se nerozejdou.

Soubor s překladem obsahuje seznam EDITS. Položka je buď
    ("český text", "anglický text")            - přesná náhrada, musí se najít
    ("<<", "začátek", "konec", "nový obsah")   - celý úsek od začátku po konec
                                                  (včetně) se nahradí novým
Když se česká stránka změní a náhrada se nenajde, skript skončí chybou
a řekne kde: anglická verze tak nikdy tiše nezastará.

Na konci vypíše řádky, kde v anglické stránce zůstala čeština.
"""
import pathlib
import re
import sys
import runpy

ROOT = pathlib.Path(__file__).resolve().parents[2]
PAGES = ROOT / "src" / "pages"
TR = pathlib.Path(__file__).resolve().parent / "en"

CS2EN = dict(re.findall(r'"(/[^"]*)":\s*"(/en[^"]*)"', (ROOT / "src" / "i18n.mjs").read_text(encoding="utf-8")))
CZ = re.compile(r"[áčďéěíňóřšťúůýžÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]|&[a-zA-Z]caron;|&uring;")


def cs_path(name):
    return "/" if name == "index" else "/" + name


def out_file(en_path):
    rel = en_path[len("/en"):].strip("/") or "index"
    return PAGES / "en" / (rel + ".astro")


def map_links(s):
    # nejdelší cesty první, ať /ai-asistenti nepřepíše /ai-asistent-pro-...
    for cs in sorted((p for p in CS2EN if p != "/"), key=len, reverse=True):
        en = CS2EN[cs]
        s = re.sub(r'(href=")' + re.escape(cs) + r'(?=["#?])', r"\g<1>" + en, s)
        s = re.sub(r'(current=")' + re.escape(cs) + r'(?=")', r"\g<1>" + en, s)
        s = re.sub(r'(https://alsflow\.cz)' + re.escape(cs) + r'(?=["#?/ ])', r"\g<1>" + en, s)
    s = re.sub(r'href="/"', 'href="/en"', s)
    s = re.sub(r'href="/#', 'href="/en#', s)
    s = s.replace('canonical="https://alsflow.cz/"', 'canonical="https://alsflow.cz/en"')
    s = s.replace('"url": "https://alsflow.cz/"', '"url": "https://alsflow.cz/en"')
    return s


def apply(s, edits, name):
    for i, e in enumerate(edits):
        if e[0] == "<<":
            _, a, b, new = e
            i0 = s.find(a)
            i1 = s.find(b, i0 + len(a)) if i0 >= 0 else -1
            if i0 < 0 or i1 < 0:
                sys.exit(f"{name}: úsek #{i} nenalezen: {a[:60]!r} .. {b[:40]!r}")
            s = s[:i0] + new + s[i1 + len(b):]
        else:
            old, new = e
            if old not in s:
                sys.exit(f"{name}: text #{i} nenalezen: {old[:80]!r}")
            s = s.replace(old, new)
    return s


def leftovers(s):
    """Řádky s češtinou mimo komentáře a <style>."""
    t = re.sub(r"<style[\s\S]*?</style>", lambda m: "\n" * m.group(0).count("\n"), s)
    t = re.sub(r"/\*[\s\S]*?\*/", lambda m: "\n" * m.group(0).count("\n"), t)
    t = re.sub(r"<!--[\s\S]*?-->", lambda m: "\n" * m.group(0).count("\n"), t)
    out = []
    for n, line in enumerate(t.split("\n"), 1):
        code = re.sub(r"(^|\s)//.*$", "", line)
        if CZ.search(code) and "Předenická" not in code and "lang=\"cs\"" not in code:
            out.append((n, line.strip()))
    return out


def build(name):
    tr_file = TR / f"{name}.py"
    if not tr_file.exists():
        return None
    cfg = runpy.run_path(str(tr_file))
    src = (PAGES / f"{name}.astro").read_text(encoding="utf-8").replace("\r\n", "\n")
    s = src.replace('from "../', 'from "../../')
    s = s.replace("<Base\n", '<Base\n  lang="en"\n', 1)
    s = apply(s, cfg["EDITS"], name)
    s = map_links(s)
    head = (f"// VYGENEROVÁNO z src/pages/{name}.astro skriptem tools/i18n/make_en.py.\n"
            f"// Neupravovat ručně: změny patří do tools/i18n/en/{name}.py.\n")
    s = s.replace("---\n", "---\n" + head, 1)
    dst = out_file(CS2EN[cs_path(name)])
    dst.parent.mkdir(parents=True, exist_ok=True)
    dst.write_text(s, encoding="utf-8", newline="\n")
    left = [x for x in leftovers(s) if x[0] > 3]
    # vlastní jména a adresy zůstávají česky
    allowed = ["Klár", "Kl&aacute;r", "IČO", "I&Ccaron;O", "Česky", "Česká verze", "Praha 4"] + cfg.get("KEEP_CZECH", [])
    left = [x for x in left if not any(k in x[1] for k in allowed)]
    print(f"{name:32} -> {dst.relative_to(ROOT)}  zbývá češtiny: {len(left)}")
    for n, line in left[:40]:
        print(f"    {n}: {line[:150]}")
    return len(left)


if __name__ == "__main__":
    names = sys.argv[1:] or sorted(p.stem for p in TR.glob("*.py"))
    bad = sum(build(n) or 0 for n in names)
    sys.exit(1 if bad else 0)
