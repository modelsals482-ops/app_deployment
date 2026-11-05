ARROW = '<svg class="arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5"/></svg>'

LD = '''<script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "ALSflow",
    "legalName": "Jakub Ryvola",
    "taxID": "30112702",
    "url": "https://alsflow.cz",
    "image": "https://alsflow.cz/og-image.png",
    "description": "AI assistants for small businesses: automated email replies, bookings and customer communication.",
    "telephone": "+420770162346",
    "email": "info@alsflow.cz",
    "priceRange": "2500-7500 CZK",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Předenická 684/17, Písnice",
      "addressLocality": "Prague 4",
      "postalCode": "142 00",
      "addressCountry": "CZ"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "email": "info@alsflow.cz",
      "telephone": "+420770162346",
      "contactType": "customer service",
      "availableLanguage": ["Czech", "English"]
    },
    "areaServed": "Praha",
    "sameAs": [
      "https://www.instagram.com/als.flow"
    ]
  }
  </script>
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "AI automation for small businesses",
    "provider": { "@type": "Organization", "name": "ALSflow" },
    "areaServed": "CZ",
    "description": "Automated email replies, online bookings and feedback for hair salons, physiotherapists, vets and dental practices.",
    "offers": [
      { "@type": "Offer", "name": "Email replies", "price": "2500", "priceCurrency": "CZK" },
      { "@type": "Offer", "name": "Bookings and reminders", "price": "4500", "priceCurrency": "CZK" },
      { "@type": "Offer", "name": "Complete bundle", "price": "7500", "priceCurrency": "CZK" }
    ]
  }
  </script>'''

HERO = '''<section class="hero-plain hero-move">
    <canvas class="scene scene-wide" data-dotwave aria-hidden="true"></canvas>
    <div class="wrap">
      <h1 class="h-hero fade-head reveal-words" style="max-width:16ch">A customer writes. <span class="grad">The assistant replies.</span></h1>
      <p class="lead">It replies to customers, books appointments and reminds them. On WhatsApp, email and your website, in your tone. I set it up for you.</p>
      <div class="btn-row">
        <a class="btn btn-grad btn-shine" href="/kontakt">Get a free quote</a>
        <a class="btn btn-magnet" href="#ukazka">Try it live ''' + ARROW + '''</a>
      </div>
      <div class="facts">
        <span class="fact">From <b>2,500 CZK</b>/month</span>
        <span class="fact">Live in <b>5 to 7 working days</b></span>
        <span class="fact">No commitment, <b>cancel any time</b></span>
      </div>
    </div>
  </section>'''

FOR_WHO = '''<section class="sec sec-line" id="pro-koho">
    <div class="wrap">
      <div class="sec-head">
        <h2 class="h-sec fade-head reveal-words">Who I build <span class="grad">assistants for</span></h2>
        <p class="lead">Most often it is businesses where the owner works with their hands and cannot get to the phone.</p>
      </div>
      <div class="cards-3 cards-4">
        <div class="panel panel-pad panel-glow panel-sheen tilt rev ai-c" style="--c: var(--cyan)"><h3>Physiotherapists</h3><p>Fewer calls and fewer emails. You focus on the client on the table, the assistant handles the rest.</p></div>
          <div class="panel panel-pad panel-glow panel-sheen tilt rev ai-c" data-d="1" style="--c: var(--blue)"><h3>Hair and beauty salons</h3><p>No missed bookings. The assistant takes an appointment even on Saturday evening while you are with a customer.</p></div>
          <div class="panel panel-pad panel-glow panel-sheen tilt rev ai-c" data-d="2" style="--c: var(--violet)"><h3>Vets</h3><p>Clients ask and book any time, without disturbing the practice or the night shift.</p></div>
          <div class="panel panel-pad panel-glow panel-sheen tilt rev ai-c" data-d="3" style="--c: var(--green)"><h3>Dental practices</h3><p>The assistant answers questions, confirms appointments and sends reminders. A reception desk that never sleeps.</p></div>
      </div>
      <p class="lead" style="margin-top:2rem">And any other small business that does not want to lose customers because it cannot keep up with replies.</p>
    </div>
  </section>'''

WHAT = '''<section class="sec">
    <div class="wrap">
      <div class="sec-head">
        <h2 class="h-sec fade-head reveal-words">What the assistant <span class="grad">can do</span></h2>
        <p class="lead">Each service has its own page with the process, the price and what the monthly fee includes.</p>
      </div>
      <div class="cards-3">
        <a class="panel panel-pad tilt rev ai-c" href="/e-mailove-odpovedi" style="--c: var(--cyan)">
          <h3>Email replies</h3>
          <p>The assistant reads and answers customer emails in your tone.</p>
          <span class="ai-more">Learn more &rarr;</span>
        </a>
        <a class="panel panel-pad tilt rev ai-c" data-d="1" href="/rezervace-pripominky" style="--c: var(--blue)">
          <h3>Bookings and reminders</h3>
          <p>Booking around the clock, instant confirmation and a reminder the day before.</p>
          <span class="ai-more">Learn more &rarr;</span>
        </a>
        <a class="panel panel-pad tilt rev ai-c" data-d="2" href="/zpetna-vazba" style="--c: var(--violet)">
          <h3>Feedback <span class="ai-tag ai-tag--soon">Coming soon</span></h3>
          <p>A question after the visit, a reply to the review and an invitation to come back.</p>
          <span class="ai-more">Learn more &rarr;</span>
        </a>
      </div>
      <div class="cards-2 ai-obor">
        <a class="panel panel-pad tilt rev ai-c" data-d="3" href="/ai-asistent-pro-fyzioterapeuty" style="--c: var(--green)">
          <h3>For physiotherapists</h3>
          <p>Fewer no-shows and a diary that fills itself.</p>
          <span class="ai-more">Learn more &rarr;</span>
        </a>
        <a class="panel panel-pad tilt rev ai-c" data-d="4" href="/ai-asistent-pro-kadernictvi" style="--c: var(--amber)">
          <h3>For hair salons</h3>
          <p>Bookings outside opening hours too, without interrupting your work.</p>
          <span class="ai-more">Learn more &rarr;</span>
        </a>
      </div>
    </div>
  </section>'''

SPLIT = '''<section class="sec sec-line">
    <div class="wrap">
      <div class="split">
        <div>
          <h2 class="h-sec fade-head reveal-words">An appointment booked <span class="grad">within a minute</span></h2>
          <p class="lead">People keep asking the same things: when are you free, how much is it, where can I park. The assistant answers in your tone and from your own information, books the appointment in the calendar and sends a reminder the day before.</p>
          <ul class="list" style="margin-top:2.1rem">
            <li><strong>It replies at ten in the evening too.</strong> When your hands are busy, the customer does not wait until morning.</li>
            <li><strong>It runs where you already are.</strong> WhatsApp, email and the chat on the website you have.</li>
            <li><strong>It does not make things up.</strong> When it does not know, it sends the question straight to you.</li>
          </ul>
          <div class="btn-row">
            <a class="btn btn-fill" href="#postup">How the assistant works ''' + ARROW + '''</a>
          </div>
        </div>
        <div class="chat-demo panel-ring rev-pop" data-d="1">
          <div class="chat-top">
            <span class="av">AI</span>
            <div>
              <div class="who">Hair salon assistant</div>
              <div class="live">usually replies within a minute</div>
            </div>
            <span class="ai-badge">AI</span>
          </div>
          <div class="chat-body">
            <div class="chat-row me"><span class="msg">Hi, do you have anything free on Friday afternoon?</span></div>
            <div class="chat-row bot"><span class="msg">Hello! On Friday we have 14:30 and 16:00 free. Which suits you better?</span></div>
            <div class="chat-row me"><span class="msg">16:00, please.</span></div>
            <div class="chat-row bot"><span class="msg">Booked for Friday 16:00. I will send you a reminder on WhatsApp the day before.</span></div>
            <div class="chat-row bot"><span class="msg"><span class="typing" aria-hidden="true"><i></i><i></i><i></i></span><span class="vh">The assistant is typing another reply.</span></span></div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="closer">
    <div class="wrap">
      <h2 class="h-sec fade-head reveal-words">Shall we try it on your business?</h2>
      <p class="lead lead-center rev" data-d="1">A free fifteen-minute call. I will tell you what the assistant can handle, what it cannot, and how much it will cost.</p>
      <div class="btn-row rev" data-d="2" style="justify-content:center">
        <a class="btn btn-grad btn-shine" href="/kontakt">Get a free quote</a>
        <a class="btn-quiet" href="/cenik">Full pricing ''' + ARROW + '''</a>
      </div>
    </div>
  </section>'''

EDITS = [
    # ---- demo ----
    ('name: "AI asistent ukázkové ordinace",', 'name: "Sample practice AI assistant",'),
    ('botLabel: "AI asistent",', 'botLabel: "AI assistant",'),
    ('idle: "Vyberte zprávu vlevo…",', 'idle: "Pick a message on the left…",'),
    ('{ id: "email", label: "E-mailové odpovědi", color: "var(--cyan)", name: "Schránka ukázkové ordinace",', '{ id: "email", label: "Email replies", color: "var(--cyan)", name: "Sample practice inbox",'),
    ('desc: "Pomůže, když vám odpovídání na e-maily bere večery.",', 'desc: "Helps when answering emails eats your evenings.",'),
    ('{ from: "Kateřina Nováková", time: "e-mail · 19:12", text: "Dobrý den, máte volný termín tento týden?",', '{ from: "Kate Novak", time: "email · 19:12", text: "Hello, do you have a free slot this week?",'),
    ('steps: ["Čte e-mail", "Kontroluje kalendář", "Píše vaším tónem"],', 'steps: ["Reads the email", "Checks the calendar", "Writes in your tone"],'),
    ('reply: "Dobrý den, Kateřino, ve středu od 10:00 a ve čtvrtek od 14:00 mám volno. Hodí se vám některý z termínů? Píše vám AI asistent ordinace." },',
     'reply: "Hello Kate, I have Wednesday from 10:00 and Thursday from 14:00 free. Would either of those suit you? This is the practice\'s AI assistant." },'),
    ('{ from: "Marek Svoboda", time: "e-mail · 20:40", text: "Kolik stojí první návštěva a jak dlouho trvá?",', '{ from: "Mark Smith", time: "email · 20:40", text: "How much is the first visit and how long does it take?",'),
    ('steps: ["Čte e-mail", "Hledá v ceníku"],', 'steps: ["Reads the email", "Looks it up in the price list"],'),
    ('reply: "Dobrý den, Marku, první návštěva stojí 850 Kč a trvá zhruba 45 minut. Chcete rovnou naplánovat termín? Píše vám AI asistent ordinace." },',
     'reply: "Hello Mark, the first visit is 850 CZK and takes about 45 minutes. Would you like to book a time straight away? This is the practice\'s AI assistant." },'),
    ('{ from: "Petra K.", time: "e-mail · 21:05", text: "Dáte mi slevu, když přijdu i s kamarádkou?",', '{ from: "Petra K.", time: "email · 21:05", text: "Can I get a discount if I bring a friend?",'),
    ('steps: ["Čte e-mail", "Sleva není v podkladech", "Nechá to na vás"],', 'steps: ["Reads the email", "No discount in its information", "Leaves it to you"],'),
    ('reply: "Dobrý den, na tohle vám odpoví přímo majitelka, předal jsem jí váš dotaz. Píše vám AI asistent ordinace.",',
     'reply: "Hello, the owner will answer this one herself, I have passed your question to her. This is the practice\'s AI assistant.",'),
    ('end: "approve", endText: "Dotaz čeká na vás", doneText: "Hotovo, převzali jste to" },', 'end: "approve", endText: "The question is waiting for you", doneText: "Done, you have taken over" },'),
    ('{ id: "rez", label: "Rezervace a připomínky", color: "var(--blue)", name: "WhatsApp ukázkové ordinace",', '{ id: "rez", label: "Bookings and reminders", color: "var(--blue)", name: "Sample practice WhatsApp",'),
    ('desc: "Pomůže, když zvoní telefon, zatímco máte klienta.",', 'desc: "Helps when the phone rings while you are with a client.",'),
    ('{ from: "WhatsApp", time: "18:30", text: "Kdy máte volno tento týden?",', '{ from: "WhatsApp", time: "18:30", text: "When are you free this week?",'),
    ('steps: ["Kontroluje kalendář", "Našel 5 volných časů"],', 'steps: ["Checks the calendar", "Found 5 free times"],'),
    ('reply: "Volno je ve středu v 10:00 a 15:30, ve čtvrtek v 9:00 a 14:00 a v pátek v 11:00. Který vám vyhovuje? Píše vám AI asistent." },',
     'reply: "We have Wednesday at 10:00 and 15:30, Thursday at 9:00 and 14:00, and Friday at 11:00. Which one suits you? This is the AI assistant." },'),
    ('{ from: "WhatsApp", time: "18:34", text: "Zarezervuj mi pátek 14:00.",', '{ from: "WhatsApp", time: "18:34", text: "Book me in for Friday at 14:00.",'),
    ('steps: ["Ověří, že je volno", "Zapíše do kalendáře", "Naplánuje připomínku"],', 'steps: ["Checks the slot is free", "Writes it in the calendar", "Schedules a reminder"],'),
    ('reply: "Hotovo, pátek 14:00 je váš. Potvrzení vám přijde e-mailem a ve čtvrtek večer pošlu připomínku. Píše vám AI asistent.",',
     'reply: "Done, Friday at 14:00 is yours. You will get a confirmation by email and I will send a reminder on Thursday evening. This is the AI assistant.",'),
    ('endText: "Hotovo, zapsáno do kalendáře" },', 'endText: "Done, written in the calendar" },'),
    ('{ from: "WhatsApp", time: "07:50", text: "Musím zrušit čtvrteční termín, omlouvám se.",', '{ from: "WhatsApp", time: "07:50", text: "I am sorry, I have to cancel my Thursday appointment.",'),
    ('steps: ["Najde termín", "Uvolní ho v kalendáři"],', 'steps: ["Finds the appointment", "Frees it in the calendar"],'),
    ('reply: "Nevadí, čtvrteční termín jsem zrušil. Chcete rovnou najít náhradní? Píše vám AI asistent.",',
     'reply: "No problem, I have cancelled the Thursday appointment. Shall I find you another one straight away? This is the AI assistant.",'),
    ('endText: "Hotovo, termín je volný pro další" },', 'endText: "Done, the slot is free for someone else" },'),
    ('{ id: "rate", label: "Zpětná vazba", color: "var(--violet)", soon: true, name: "Recenze ukázkové ordinace",', '{ id: "rate", label: "Feedback", color: "var(--violet)", soon: true, name: "Sample practice reviews",'),
    ('desc: "Pomůže, když chcete víc recenzí a klienty, kteří se vrací.",', 'desc: "Helps when you want more reviews and clients who come back.",'),
    ('{ from: "Hodnocení ★★★★★", time: "Google", text: "Skvělá péče, odcházela jsem spokojená. Určitě se vrátím.",', '{ from: "Review ★★★★★", time: "Google", text: "Great care, I left very happy. I will definitely be back.",'),
    ('steps: ["Přečte hodnocení", "Navrhne poděkování"],', 'steps: ["Reads the review", "Drafts a thank-you"],'),
    ('reply: "Moc děkujeme za hezká slova, těšíme se na vás. Kdybyste chtěla rovnou další termín, stačí odpovědět.",', 'reply: "Thank you so much for the kind words, we look forward to seeing you. If you would like your next appointment, just reply.",'),
    ('end: "approve", endText: "Odpověď čeká na schválení", doneText: "Hotovo, odpověď zveřejněna" },', 'end: "approve", endText: "The reply is waiting for approval", doneText: "Done, the reply is published" },'),
    ('{ from: "Hodnocení ★★★★☆", time: "Google", text: "Ošetření super, ale čekala jsem skoro dvacet minut.",', '{ from: "Review ★★★★☆", time: "Google", text: "Great treatment, but I waited almost twenty minutes.",'),
    ('steps: ["Přečte hodnocení", "Pozná výtku", "Navrhne omluvu"],', 'steps: ["Reads the review", "Spots the complaint", "Drafts an apology"],'),
    ('reply: "Omlouváme se za čekání, mrzí nás to. Děkujeme, že jste nám to napsala, dáme si na to pozor.",', 'reply: "We are sorry about the wait. Thank you for telling us, we will make sure it does not happen again.",'),
    # ---- head ----
    ('title="AI asistenti pro malé firmy a živnostníky | ALSflow"', 'title="AI assistants for small businesses | ALSflow"'),
    ('description="Asistent odpovídá zákazníkům, objednává termíny a připomíná je, česky a vaším tónem. Od 2 500 Kč měsíčně, nasazení do 5 až 7 dnů."',
     'description="An assistant that replies to customers, books appointments and reminds them, in your tone. From 2,500 CZK a month, set up in 5 to 7 days."'),
    ('ogDescription="Váš e-mail. Váš kalendář. Váš AI. Nastavím vše za vás, vy se staráte o klienty."', 'ogDescription="Your email. Your calendar. Your AI. I set it all up, you look after your clients."'),
    ("<<", '<script type="application/ld+json">', '</script>\n  <script type="application/ld+json">', 'LD_PLACEHOLDER'),
    ("<<", 'LD_PLACEHOLDER', '</script>', LD),
    ("<<", '<section class="hero-plain hero-move">', '</section>', HERO),
    # ---- prices ----
    ('Veřejné <span class="grad">ceny</span>.', 'Public <span class="grad">prices</span>.'),
    ('M&ecaron;s&iacute;&ccaron;n&ecaron;, bez z&aacute;vazku, zru&scaron;&iacute;te kdykoli. Nejsem plátce DPH, ceny jsou konečné.', 'Monthly, no commitment, cancel any time. I am not a VAT payer, so the prices are final.'),
    ('<div class="ba-mail"><b>Kateřina N.</b><span>Máte volný termín tento týden?</span></div>', '<div class="ba-mail"><b>Kate N.</b><span>Do you have a free slot this week?</span></div>'),
    ('<div class="ba-mail"><b>Marek S.</b><span>Kolik stojí první návštěva?</span></div>', '<div class="ba-mail"><b>Mark S.</b><span>How much is the first visit?</span></div>'),
    ('<div class="ba-mail ba-ai"><b>AI návrh</b><span>Dobrý den, ve středu od 10:00…</span></div>', '<div class="ba-mail ba-ai"><b>AI draft</b><span>Hello, on Wednesday from 10:00…</span></div>'),
    ('>1 500 e-mailů v ceně</span>', '>1,500 emails included</span>'),
    ('>Gmail i Outlook</span>', '>Gmail and Outlook</span>'),
    ('>Nejistý dotaz nechá na vás</span>', '>Leaves unclear questions to you</span>'),
    ('<h3>E-mailové odpovědi</h3>\n            <p>Čte poštu, odpovídá na běžné dotazy vaším tónem a co nezná, předá vám.</p>',
     '<h3>Email replies</h3>\n            <p>Reads your email, answers routine questions in your tone, and passes on whatever it does not know.</p>'),
    ('<p class="bot-cost"><b>2&nbsp;500&nbsp;Kč</b> / měsíc</p>', '<p class="bot-cost"><b>2,500&nbsp;CZK</b> / month</p>'),
    ('>Chci tenhle</a>', '>I want this one</a>'),
    ('<span>Po</span><span>Út</span><span>St</span><span>Čt</span><span>Pá</span>', '<span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span>'),
    ('<div class="ba-wa">Pátek 14:00 je váš &#10003;</div>', '<div class="ba-wa">Friday 14:00 is yours &#10003;</div>'),
    ('>Nejčastěji</span>', '>Most popular</span>'),
    ('>Rovnou do Google Kalendáře</span>', '>Straight into Google Calendar</span>'),
    ('>Připomínka den předem</span>', '>Reminder the day before</span>'),
    ('<h3>Rezervace a připomínky</h3>\n            <p>Objedná termín přes WhatsApp i web, zapíše ho do kalendáře, den předem připomene. Přesun i zrušení bez telefonu. 750 rezervací měsíčně v ceně.</p>',
     '<h3>Bookings and reminders</h3>\n            <p>Books appointments through WhatsApp and your website, writes them in the calendar and sends a reminder the day before. Rescheduling and cancelling without a phone call. 750 bookings a month included.</p>'),
    ('<p class="bot-cost"><b>4&nbsp;500&nbsp;Kč</b> / měsíc</p>', '<p class="bot-cost"><b>4,500&nbsp;CZK</b> / month</p>'),
    ('<b>Skvělá péče</b><span>Určitě se vrátím.</span>', '<b>Great care</b><span>I will definitely be back.</span>'),
    ('<div class="ba-rev ba-ai"><b>Návrh odpovědi</b><span>Moc děkujeme, těšíme se na vás.</span></div>', '<div class="ba-rev ba-ai"><b>Draft reply</b><span>Thank you so much, see you soon.</span></div>'),
    ('>Připravuji</span>', '>Coming soon</span>'),
    ('>Pozve na další termín</span>', '>Invites them back</span>'),
    ('<h3>Zpětná vazba</h3>\n            <p>Po návštěvě se zeptá na spokojenost, navrhne odpověď na recenzi a pozve na další termín. Měsíční přehled hodnocení.</p>',
     '<h3>Feedback</h3>\n            <p>After the visit it asks how it went, drafts a reply to the review and invites the customer back. A monthly overview of ratings.</p>'),
    ('<a class="btn btn-quiet" href="/zpetna-vazba">Zjistit víc</a>', '<a class="btn btn-quiet" href="/zpetna-vazba">Learn more</a>'),
    ('<div class="k">V&scaron;echno dohromady</div><div class="v">7&nbsp;500 K&ccaron;/m&ecaron;s</div>', '<div class="k">All together</div><div class="v">7,500 CZK/month</div>'),
    ('<div class="k">Jednor&aacute;zov&eacute; nastaven&iacute;</div><div class="v">8 000–10 000 Kč</div>', '<div class="k">One-time setup</div><div class="v">8,000–10,000 CZK</div>'),
    ('<div class="k">Spu&scaron;t&ecaron;n&iacute;</div><div class="v">do 5 a&zcaron; 7 pracovn&iacute;ch dn&uring;</div>', '<div class="k">Launch</div><div class="v">within 5 to 7 working days</div>'),
    ('Chci nez&aacute;vaznou nab&iacute;dku <svg', 'Get a free quote <svg'),
    # ---- demo section ----
    ('Zkuste si to <span class="grad">teď</span>', 'Try it <span class="grad">now</span>'),
    ('Vyberte, co vás nejvíc zdržuje, a klikněte na zprávu od zákazníka. Uvidíte, jak asistent zprávu přečte, co si ověří a co odpoví. A co sám neřeší, nechá na vás ke schválení.',
     'Choose what slows you down the most and click a message from a customer. You will see how the assistant reads it, what it checks and what it replies. Whatever it does not handle itself, it leaves to you to approve.'),
    ('<ChatDemo config={demo} hint="Klikněte na zprávu" />', '<ChatDemo config={demo} hint="Click a message" lang="en" />'),
    ('Odpovědi v ukázce jsou připravené dopředu. Živou asistentku Kláru najdete v chatu vpravo dole.', 'The replies in this demo are prepared in advance. You will find the live assistant Klára in the chat in the bottom right corner.'),
    ("<<", '<section class="sec sec-line" id="pro-koho">', '</section>', FOR_WHO),
    ("<<", '<section class="sec">\n    <div class="wrap">\n      <div class="sec-head">\n        <h2 class="h-sec fade-head reveal-words">Co asistent', '</section>', WHAT),
    ('Google Kalend&aacute;&rcaron;</span>', 'Google Calendar</span>'),
    ('Nastav&iacute;m to <span class="grad">za v&aacute;s</span>', 'I set it up <span class="grad">for you</span>'),
    ('T&rcaron;i kroky od prvn&iacute;ho hovoru po provoz. Technick&eacute; znalosti nepot&rcaron;ebujete &zcaron;&aacute;dn&eacute;.', 'Three steps from the first call to a running assistant. You need no technical knowledge at all.'),
    ('{ c: "cyan", t: "Zavoláte nebo napíšete", p: "Řeknete, jak váš provoz funguje a co vám bere nejvíc času. Stačí patnáct minut.", get: "Návrh, co asistent převezme, a cenu" },',
     '{ c: "cyan", t: "You call or write", p: "You tell me how your business runs and what takes up most of your time. Fifteen minutes is enough.", get: "A proposal of what the assistant takes over, and a price" },'),
    ('{ c: "violet", t: "Nastavím všechno já", p: "Do 5 až 7 pracovních dnů asistenta napojím na vaši poštu, kalendář a WhatsApp, naučím ho váš tón a otestuji ho.", get: "Asistenta, který mluví jako vy" },',
     '{ c: "violet", t: "I set everything up", p: "Within 5 to 7 working days I connect the assistant to your email, calendar and WhatsApp, teach it your tone and test it.", get: "An assistant that sounds like you" },'),
    ('{ c: "green", t: "Asistent začne pracovat", p: "Běží od první minuty. Každý měsíc dostanete přehled toho, co vyřídil.", get: "Měsíční přehled vyřízených zpráv" },',
     '{ c: "green", t: "The assistant starts working", p: "It runs from the first minute. Every month you get an overview of what it handled.", get: "A monthly report of handled messages" },'),
    (']} />\n      <script src="/assets/js/zigzag.js"', ']} lang="en" />\n      <script src="/assets/js/zigzag.js"'),
    ("<<", '<section class="sec sec-line">\n    <div class="wrap">\n      <div class="split">', '</section>\n\n  <section class="closer">', 'SPLIT_PLACEHOLDER\n\n  <section class="closer">'),
    ("<<", 'SPLIT_PLACEHOLDER\n\n  <section class="closer">', '</section>', SPLIT),
]
KEEP_CZECH = ["Předenická", "Praha\""]
