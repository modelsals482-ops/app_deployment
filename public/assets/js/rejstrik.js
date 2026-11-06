/* Rejstřík služeb na telefonu (6. 11. 2026): na dotykové obrazovce není najetí myší,
   tak se rozsvítí ten řádek, který je právě uprostřed obrazovky. Na počítači to dělá :hover v CSS. */
(() => {
  const rows = document.querySelectorAll(".svc-row");
  if (!rows.length || !("IntersectionObserver" in window)) return;
  const phone = matchMedia("(max-width: 900px)");
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) e.target.classList.toggle("is-lit", e.isIntersecting && phone.matches);
  }, { rootMargin: "-40% 0px -40% 0px" });
  rows.forEach((r) => io.observe(r));
})();
