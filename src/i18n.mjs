/* Česká adresa -> anglická (5. 11. 2026). Jediné místo, kde se páruje:
   čte ho Base.astro (přepínač CZ/EN a hreflang) i tools/i18n/make_en.py
   (odkazy v anglických stránkách). Nová stránka = nový řádek tady. */
export const CS2EN = {
  "/": "/en",
  "/tvorba-webu": "/en/websites",
  "/vyvoj-softwaru": "/en/software",
  "/ai-asistenti": "/en/ai-assistants",
  "/cenik": "/en/pricing",
  "/reference": "/en/work",
  "/o-nas": "/en/about",
  "/kontakt": "/en/contact",
  "/otazky": "/en/faq",
  "/ochrana_dat": "/en/privacy",
  "/dekujeme": "/en/thank-you",
  "/e-mailove-odpovedi": "/en/email-replies",
  "/rezervace-pripominky": "/en/bookings-and-reminders",
  "/zpetna-vazba": "/en/feedback",
  "/ai-asistent-pro-fyzioterapeuty": "/en/ai-assistant-for-physiotherapists",
  "/ai-asistent-pro-kadernictvi": "/en/ai-assistant-for-hair-salons",
};
export const EN2CS = Object.fromEntries(Object.entries(CS2EN).map(([c, e]) => [e, c]));
