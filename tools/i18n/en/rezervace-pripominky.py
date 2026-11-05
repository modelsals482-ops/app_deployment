import json as _j

FAQ = [
    ("How much do AI bookings and reminders cost?", "4,500 CZK a month, with 750 bookings included. On its own, or together with email replies and feedback for 7,500 CZK a month. One-time setup 8,000 to 10,000 CZK. No commitment, cancel any time."),
    ("Do I need a new booking system for this?", "No. It works with the WhatsApp, website or Google Calendar you already have, and it can run alongside your current system. If you have none and keep appointments on paper or by phone, I set the whole thing up for you."),
    ("How does it reduce no-shows?", "With a reminder the day before that people can reply to and rebook straight away. The slot is freed for someone else instead of going empty."),
    ("Does it take bookings outside opening hours?", "Yes, around the clock. Customers book in the evening and at weekends, with no phone call and no waiting."),
    ("How long does the setup take?", "5 to 7 working days from the first fifteen-minute call. I handle the calendar connection, the texts and the testing."),
]
SERVICE = {
    "@context": "https://schema.org", "@type": "Service", "name": "Bookings and reminders", "inLanguage": "en",
    "serviceType": "Automated appointment booking and reminders for small businesses",
    "description": "The assistant takes bookings around the clock, confirms them straight away and sends a reminder the day before.",
    "areaServed": {"@type": "Country", "name": "Czech Republic"},
    "provider": {"@type": "Organization", "name": "ALSflow", "legalName": "Jakub Ryvola", "taxID": "30112702", "url": "https://alsflow.cz"},
    "offers": {"@type": "Offer", "price": "4500", "priceCurrency": "CZK", "priceSpecification": {"@type": "UnitPriceSpecification", "price": "4500", "priceCurrency": "CZK", "unitCode": "MON"}},
}
FAQLD = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in FAQ]}
FAQHTML = "\n".join(
    f'        <details class="rev"{"" if i == 0 else f" data-d=\"{i}\""}><summary>{q}</summary><p>{a}</p></details>' for i, (q, a) in enumerate(FAQ))

BASE = '''<Base
  lang="en"
  title="Bookings and reminders | ALSflow"
  description="The assistant takes a booking even in the evening, confirms it straight away and sends a reminder the day before. 4,500 CZK a month, no commitment."
  canonical="https://alsflow.cz/rezervace-pripominky"
  ogTitle="Bookings and reminders"
  ogDescription="A diary that fills itself, and forgotten appointments stop going to waste. 4,500 CZK a month."
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
      <h1 class="h-hero fade-head reveal-words" style="max-width:16ch">A diary that fills itself. <span class="grad">And no more wasted slots.</span></h1>
      <p class="lead">A customer wants to book in the evening, but you are closed. Someone forgets their appointment
        and the hour goes empty. The assistant takes a booking any time, confirms it straight away and sends
        a reminder the day before.</p>
      <div class="btn-row">
        <a class="btn btn-grad btn-shine" href="/kontakt">Get a free quote</a>
        <a class="btn btn-quiet" href="/cenik">Pricing</a>
      </div>
    </div>
  </section>

  <section class="sec sec-line scene-host" id="co-dela">
    <div class="wrap">
      <div class="sec-head">
        <h2 class="h-sec fade-head reveal-words">Everything around <span class="grad">one appointment</span></h2>
        <p class="lead">Booking someone in is not one task. It is five small things, and each of them takes time.</p>
      </div>
      <div class="rows">
        <div class="row rev"><span class="num">01</span><div><h3>Takes a booking any time</h3><p>Through WhatsApp or your website, in the evening and at weekends too. The customer does not have to wait until you open.</p></div></div>
        <div class="row rev" data-d="1"><span class="num">02</span><div><h3>Confirms the slot straight away</h3><p>The customer knows they have a place. No &ldquo;I will get back to you&rdquo; and no waiting during which they change their mind.</p></div></div>
        <div class="row rev" data-d="2"><span class="num">03</span><div><h3>Reminds them the day before</h3><p>A forgotten appointment is the quietest loss you have. Nobody complains, they just do not come.</p></div></div>
        <div class="row rev" data-d="3"><span class="num">04</span><div><h3>Frees the slot when someone cannot come</h3><p>People can reply to the reminder and rebook. The hour is freed for someone else instead of going to waste.</p></div></div>
        <div class="row rev" data-d="4"><span class="num">05</span><div><h3>Answers questions around the appointment</h3><p>Prices, availability, how things work at your place. You stop answering the same things again and again.</p></div></div>
      </div>
    </div>
  </section>

  <section class="sec sec-dark sec-line" id="proc">
    <div class="wrap">
      <div class="sec-head">
        <h2 class="h-sec fade-head reveal-words">It runs <span class="grad">alongside your system, not instead of it</span></h2>
        <p class="lead">This is not another system you would have to switch to, and I do not want you to
          abandon something that works for you because of me. If you already handle bookings somehow, the assistant connects
          to WhatsApp, your website or Google Calendar and takes on everything around them: questions, confirmations,
          reminders. And if you have no system and keep appointments on paper or by phone, I set the whole thing up for you.</p>
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
          <p>How people come to you, what they ask, and where you keep your appointments. No tech talk.</p>
        </div>
        <div class="panel panel-pad panel-glow rev" data-d="1">
          <h3>2. I set it up for you</h3>
          <p>Within 5 to 7 working days I connect the calendar, set up the reminders and test them.</p>
        </div>
        <div class="panel panel-pad panel-glow rev" data-d="2">
          <h3>3. The diary runs itself</h3>
          <p>The assistant books and reminds from the first minute. You just glance at the monthly report.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="sec sec-dark sec-line" id="cena">
    <div class="wrap">
      <div class="sec-head">
        <h2 class="h-sec fade-head reveal-words">4,500 CZK a month, <span class="grad">no commitment</span></h2>
        <p class="lead">750 bookings a month are included. You can have it on its own, or together
          with the other two assistants for 7,500 CZK a month. One-time setup 8,000 to 10,000 CZK.
          Cancel any time, with no notice period.</p>
        <div class="btn-row">
          <a class="btn btn-grad btn-magnet" href="/kontakt">I want this one</a>
          <a class="btn btn-quiet" href="/cenik">Full pricing</a>
        </div>
      </div>
    </div>
  </section>

  <section class="sec sec-line" id="dalsi">
    <div class="wrap">
      <div class="sec-head">
        <h2 class="h-sec fade-head reveal-words">Other <span class="grad">assistants</span></h2>
      </div>
      <div class="cards-2">
        <a class="panel panel-pad panel-glow rev" href="/e-mailove-odpovedi">
          <h3>Email replies</h3>
          <p>Reads your email, answers routine questions and passes on whatever it does not know. 2,500 CZK a month.</p>
        </a>
        <a class="panel panel-pad panel-glow rev" data-d="1" href="/zpetna-vazba">
          <h3>Feedback and repeat bookings</h3>
          <p>Asks after the visit, drafts a reply to the review and invites the customer back. 2,500 CZK a month.</p>
        </a>
      </div>
        <p class="lead" style="max-width:none;margin-top:1.4rem">Want to see it for your own field?
          <a href="/ai-asistent-pro-fyzioterapeuty">For physiotherapists</a> or
          <a href="/ai-asistent-pro-kadernictvi">for hair salons</a>.</p>
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
      <h2 class="h-sec fade-head reveal-words">What does an <span class="grad">empty hour</span> cost you?</h2>
      <p class="lead lead-center rev" data-d="1">A free fifteen-minute call. We go through what you need and I suggest a solution and a price.</p>
      <div class="btn-row rev" data-d="2" style="justify-content:center">
        <a class="btn btn-grad btn-shine" href="/kontakt">Get a free quote</a>
        <a class="btn btn-quiet" href="/ai-asistenti">All assistants</a>
      </div>
    </div>
  </section>
</Base>'''

EDITS = [("<<", "<Base", "</Base>", BASE)]
