import json as _j

FAQ = [
    ("How much does it cost?", "Bookings and reminders 4,500 CZK a month (750 bookings included), feedback 2,500 CZK and email replies 2,500 CZK. All together 7,500 CZK a month. No commitment, cancel any time."),
    ("How does it reduce no-shows?", "Every patient gets an automatic reminder by email or WhatsApp the day before the session. If they cannot come, they reply to it and rebook. The slot is freed for another patient instead of going to waste."),
    ("Does it work with Google Calendar?", "Yes, by design. The assistant connects directly to your calendar: it sees free slots, writes in bookings and reads the information for reminders from it. If you keep a paper diary, I move it over during the setup."),
    ("What about GDPR?", "The assistant works only with the name, contact and appointment time. It does not store medical records or case histories. We sign a data processing agreement under Art. 28 GDPR with every client."),
    ("How long does the setup take?", "5 to 7 working days from the first fifteen-minute call. I set up, connect and test everything for you."),
]
SERVICE = {
    "@context": "https://schema.org", "@type": "Service", "name": "AI assistant for physiotherapists", "inLanguage": "en",
    "serviceType": "Automated appointment booking and reminders for physiotherapy practices",
    "description": "The assistant books patients through the website or WhatsApp, writes the appointment into Google Calendar and sends a reminder the day before. It does not store medical records.",
    "areaServed": {"@type": "Country", "name": "Czech Republic"},
    "provider": {"@type": "Organization", "name": "ALSflow", "legalName": "Jakub Ryvola", "taxID": "30112702", "url": "https://alsflow.cz"},
    "offers": [
        {"@type": "Offer", "name": "Bookings and reminders", "price": "4500", "priceCurrency": "CZK"},
        {"@type": "Offer", "name": "Feedback and repeat bookings", "price": "2500", "priceCurrency": "CZK"},
        {"@type": "Offer", "name": "Email replies", "price": "2500", "priceCurrency": "CZK"},
    ],
}
FAQLD = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in FAQ]}
FAQHTML = "\n".join(
    f'        <details class="rev"{"" if i == 0 else f" data-d=\"{i}\""}><summary>{q}</summary><p>{a}</p></details>' for i, (q, a) in enumerate(FAQ))

BASE = '''<Base
  lang="en"
  title="AI assistant for physiotherapists: bookings | ALSflow"
  description="Patient bookings around the clock, a reminder the day before and replies to emails. Works with Google Calendar. From 2,500 CZK a month."
  canonical="https://alsflow.cz/ai-asistent-pro-fyzioterapeuty"
  ogTitle="AI assistant for physiotherapists"
  ogDescription="Fewer no-shows and no phone calls during therapy. From 2,500 CZK a month."
  current="/ai-asistenti"
>
  <Fragment slot="head">
  <script type="application/ld+json">
''' + _j.dumps(SERVICE, ensure_ascii=False, indent=2) + '''
  </script>
  <script type="application/ld+json">
''' + _j.dumps(FAQLD, ensure_ascii=False, indent=2) + '''
  </script>
  </Fragment>

  <section class="hero hero-plain">
    <div class="aurora" aria-hidden="true"><i class="a1"></i><i class="a2"></i></div>
    <div class="wrap">
      <h1 class="h-hero fade-head reveal-words" style="max-width:17ch">Fewer empty hours, <span class="grad">no phone calls</span> during therapy</h1>
      <p class="lead">You cannot interrupt a session for the phone. Patients call, send emails, and some simply forget
        their appointment, and the hour is lost. The assistant books patients, confirms the appointment and reminds them
        the day before. Your hands and your head stay on the work.</p>
      <div class="btn-row">
        <a class="btn btn-grad btn-shine" href="/kontakt">Get a free quote</a>
        <a class="btn btn-quiet" href="/cenik">Pricing</a>
      </div>
    </div>
  </section>

  <section class="sec sec-line scene-host" id="co-to-resi">
    <div class="wrap">
      <div class="sec-head">
        <h2 class="h-sec fade-head reveal-words">A no-show is the <span class="grad">most expensive hour</span> of the week</h2>
        <p class="lead">Nobody pays for it, and another patient could have had it. Most people do not miss it
          out of bad will, but because they forgot.</p>
      </div>
      <div class="rows">
        <div class="row rev"><span class="num">01</span><div><h3>A reminder the day before</h3><p>By email or WhatsApp, with the date, time and address. Patients can reply to the reminder directly.</p></div></div>
        <div class="row rev" data-d="1"><span class="num">02</span><div><h3>Rebooking without a phone call</h3><p>The patient replies to the reminder and the assistant offers a new time. The original hour is freed instead of going to waste.</p></div></div>
        <div class="row rev" data-d="2"><span class="num">03</span><div><h3>Booking around the clock</h3><p>New patients book through the website or WhatsApp, outside practice hours too.</p></div></div>
        <div class="row rev" data-d="3"><span class="num">04</span><div><h3>Answers to common questions</h3><p>Price, session length, what to bring, parking. Without interrupting your work.</p></div></div>
        <div class="row rev" data-d="4"><span class="num">05</span><div><h3>A message after the session</h3><p>A thank-you, a feedback question, and for long-term patients a reminder of the next visit at the right time.</p></div></div>
      </div>
    </div>
  </section>

  <section class="sec sec-dark sec-line" id="kalendar">
    <div class="wrap">
      <div class="sec-head">
        <h2 class="h-sec fade-head reveal-words">It writes straight into <span class="grad">your calendar</span></h2>
        <p class="lead">The assistant connects directly to Google Calendar: it sees free slots, writes in new
          bookings and reads the information for reminders from it. No extra system for you to learn. If you keep a paper diary, I move it to a shared calendar during the setup; that is
          the only change waiting for you.</p>
      </div>
    </div>
  </section>

  <section class="sec sec-line" id="jak">
    <div class="wrap">
      <div class="sec-head">
        <h2 class="h-sec fade-head reveal-words">How it <span class="grad">works</span></h2>
      </div>
      <div class="cards-3">
        <div class="panel panel-pad panel-glow rev">
          <h3>1. A fifteen-minute call</h3>
          <p>You tell me how the practice runs and what takes up most of your time.</p>
        </div>
        <div class="panel panel-pad panel-glow rev" data-d="1">
          <h3>2. I set it up for you</h3>
          <p>Within 5 to 7 working days I connect the calendar, prepare the texts and test everything.</p>
        </div>
        <div class="panel panel-pad panel-glow rev" data-d="2">
          <h3>3. It runs by itself</h3>
          <p>Every month you get a report: how many reminders went out and how many patients booked.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="sec sec-dark sec-line" id="gdpr">
    <div class="wrap">
      <div class="sec-head">
        <h2 class="h-sec fade-head reveal-words">We do not store <span class="grad">medical records</span></h2>
        <p class="lead">We sign a data processing agreement under Art. 28 GDPR with every client.
          The assistant works only with what it really needs for reminders and bookings: name, contact
          and appointment time. It stores no case histories or medical records, and we never use your
          practice's data for anything else. Details in the <a href="/ochrana_dat">privacy policy</a>.</p>
      </div>
    </div>
  </section>

  <section class="sec sec-line" id="ceny">
    <div class="wrap">
      <div class="sec-head">
        <h2 class="h-sec fade-head reveal-words">Monthly, <span class="grad">no commitment</span></h2>
        <p class="lead">You can have each part on its own, or all of them together.</p>
      </div>
      <div class="cards-3">
        <div class="panel panel-pad panel-glow rev">
          <h3>Bookings and reminders</h3>
          <p class="price-big">4,500 CZK <span>/ month</span></p>
          <p>Booking through the website and WhatsApp, written into the calendar, a reminder the day before. 750 bookings included.</p>
        </div>
        <div class="panel panel-pad panel-glow rev" data-d="1">
          <h3>Feedback</h3>
          <p class="price-big">2,500 CZK <span>/ month</span></p>
          <p>A question after the visit, a draft reply to the review and an invitation for the next appointment.</p>
        </div>
        <div class="panel panel-pad panel-glow rev" data-d="2">
          <h3>Email replies</h3>
          <p class="price-big">2,500 CZK <span>/ month</span></p>
          <p>The assistant reads your email, answers routine questions and passes on whatever it does not know.</p>
        </div>
      </div>
      <p class="lead rev" data-d="3" style="margin-top:1.6rem">All three together <b>7,500 CZK a month</b>.
        One-time setup 8,000 to 10,000 CZK. Cancel any time.</p>
    </div>
  </section>

  <section class="sec sec-dark sec-line" id="faq">
    <div class="wrap">
      <div class="sec-head">
        <h2 class="h-sec fade-head reveal-words">Your questions</h2>
      </div>
      <div class="faq">
''' + FAQHTML + '''
      </div>
    </div>
  </section>

  <section class="sec">
    <div class="wrap" style="text-align:center">
      <h2 class="h-sec fade-head reveal-words">Let us work out what <span class="grad">empty hours</span> cost you</h2>
      <p class="lead lead-center rev" data-d="1">A free fifteen-minute call. We go through how the practice
        runs and I suggest a solution and a price.</p>
      <div class="btn-row rev" data-d="2" style="justify-content:center">
        <a class="btn btn-grad btn-shine" href="/kontakt">Get a free quote</a>
        <a class="btn btn-quiet" href="/ai-asistenti">All assistants</a>
      </div>
    </div>
  </section>

  <Fragment slot="tail">'''

EDITS = [("<<", "<Base", '<Fragment slot="tail">', BASE)]
