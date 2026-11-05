import json as _j

FAQ = [
    ("How much does it cost?", "Bookings and reminders 4,500 CZK a month (750 bookings included), feedback 2,500 CZK and email replies 2,500 CZK. All together 7,500 CZK a month, one-time setup 8,000 to 10,000 CZK. No commitment."),
    ("How long does the setup take?", "5 to 7 working days. You do not have to install or set up anything; a fifteen-minute call about how the salon runs is enough."),
    ("Do I need new apps or a new system?", "No. The assistant works with the WhatsApp, email and website you already have. Customers write where they are used to writing."),
    ("Will customers know an AI is replying?", "Yes. The assistant introduces itself right at the start as your salon's AI assistant. It writes in your tone and with your signature. It answers specific questions (prices, free slots, how things work), and when it does not know, it hands the conversation to you instead of making something up."),
    ("What if I change my mind?", "It is paid monthly with no commitment. You can cancel any time, with no notice period and no fixed-term contract."),
]
SERVICE = {
    "@context": "https://schema.org", "@type": "Service", "name": "AI assistant for hair salons", "inLanguage": "en",
    "serviceType": "Automated bookings and appointment reminders for hair and beauty salons",
    "description": "The assistant books customers through WhatsApp or the website, confirms the appointment and sends a reminder the day before. It works with the tools the salon already uses.",
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
  title="AI assistant for hair and beauty salons | ALSflow"
  description="WhatsApp bookings around the clock, a reminder the day before and answers to customer questions. Bookings from 4,500 CZK a month, set up in 5 to 7 working days."
  canonical="https://alsflow.cz/ai-asistent-pro-kadernictvi"
  ogTitle="AI assistant for hair salons"
  ogDescription="Bookings and reminders without picking up the phone. From 2,500 CZK a month."
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
      <h1 class="h-hero fade-head reveal-words" style="max-width:17ch">Bookings without <span class="grad">picking up the phone</span></h1>
      <p class="lead">You are cutting hair and the phone rings. In the evening you catch up on WhatsApp and email messages.
        The assistant handles it for you: it books the customer, confirms the appointment and reminds them the day before.
        You get on with the work you love.</p>
      <div class="btn-row">
        <a class="btn btn-grad btn-shine" href="/kontakt">Get a free quote</a>
        <a class="btn btn-quiet" href="/cenik">Pricing</a>
      </div>
    </div>
  </section>

  <section class="sec sec-line scene-host" id="co-vyresi">
    <div class="wrap">
      <div class="sec-head">
        <h2 class="h-sec fade-head reveal-words">What you do <span class="grad">over and over</span></h2>
      </div>
      <div class="rows">
        <div class="row rev"><span class="num">01</span><div><h3>Bookings around the clock</h3><p>Customers book through WhatsApp or your website, even while you are cutting hair or closed.</p></div></div>
        <div class="row rev" data-d="1"><span class="num">02</span><div><h3>Instant confirmation</h3><p>The customer knows straight away they have a place. No &ldquo;I will get back to you&rdquo;.</p></div></div>
        <div class="row rev" data-d="2"><span class="num">03</span><div><h3>A reminder the day before</h3><p>Forgotten appointments are the most common loss in salons. A reminder is quiet work that keeps your diary full.</p></div></div>
        <div class="row rev" data-d="3"><span class="num">04</span><div><h3>Answers to common questions</h3><p>Prices, free slots, how long a colour takes. The assistant answers in your tone.</p></div></div>
        <div class="row rev" data-d="4"><span class="num">05</span><div><h3>A message after the visit</h3><p>A thank-you, a question about how it went and, at the right time, an offer of the next appointment.</p></div></div>
      </div>
    </div>
  </section>

  <section class="sec sec-dark sec-line" id="bez-noveho-systemu">
    <div class="wrap">
      <div class="sec-head">
        <h2 class="h-sec fade-head reveal-words">No need to <span class="grad">switch anything</span></h2>
        <p class="lead">That is the main difference from classic booking systems. The assistant connects
          to the tools you already use: WhatsApp, email, your website or Google Calendar. Customers
          write where they are used to writing. I set it up; you just watch the admin shrink.
          And when the assistant does not know what to do, it hands the conversation to you.</p>
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
          <p>You tell me how the salon runs and what takes up most of your time. No technical knowledge needed.</p>
        </div>
        <div class="panel panel-pad panel-glow rev" data-d="1">
          <h3>2. I set it up for you</h3>
          <p>Within 5 to 7 working days I connect WhatsApp and the calendar, prepare the texts and test it.</p>
        </div>
        <div class="panel panel-pad panel-glow rev" data-d="2">
          <h3>3. It runs by itself</h3>
          <p>Every month you get a report: how many bookings the assistant handled and how many reminders it sent.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="sec sec-dark sec-line" id="ceny">
    <div class="wrap">
      <div class="sec-head">
        <h2 class="h-sec fade-head reveal-words">Monthly, <span class="grad">no commitment</span></h2>
        <p class="lead">You can have each part on its own, or all of them together.</p>
      </div>
      <div class="cards-3">
        <div class="panel panel-pad panel-glow rev">
          <h3>Bookings and reminders</h3>
          <p class="price-big">4,500 CZK <span>/ month</span></p>
          <p>Booking through WhatsApp and the website, confirmation, a reminder the day before. 750 bookings included.</p>
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
        One-time setup 8,000 to 10,000 CZK. Cancel any time, with no notice period.</p>
    </div>
  </section>

  <section class="sec sec-line" id="faq">
    <div class="wrap">
      <div class="sec-head">
        <h2 class="h-sec fade-head reveal-words">Your questions</h2>
      </div>
      <div class="faq">
''' + FAQHTML + '''
      </div>
    </div>
  </section>

  <section class="sec sec-dark">
    <div class="wrap" style="text-align:center">
      <h2 class="h-sec fade-head reveal-words">Want to see how it would work <span class="grad">for you</span>?</h2>
      <p class="lead lead-center rev" data-d="1">A free fifteen-minute call, no pressure.
        You tell me what slows you down and I suggest a solution and a price.</p>
      <div class="btn-row rev" data-d="2" style="justify-content:center">
        <a class="btn btn-grad btn-shine" href="/kontakt">Get a free quote</a>
        <a class="btn btn-quiet" href="/ai-asistenti">All assistants</a>
      </div>
    </div>
  </section>

  <Fragment slot="tail">'''

EDITS = [("<<", "<Base", '<Fragment slot="tail">', BASE)]
