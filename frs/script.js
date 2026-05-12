const stickyCta = document.querySelector(".sticky-cta");
const contactSection = document.querySelector("#contact");
const demoSubmit = document.querySelector("#demoSubmit");

function updateStickyCta() {
  if (!stickyCta || !contactSection) return;

  const contactTop = contactSection.getBoundingClientRect().top + window.scrollY;
  const shouldShow = window.scrollY > 520 && window.scrollY < contactTop - 360;
  stickyCta.classList.toggle("is-visible", shouldShow);
}

window.addEventListener("scroll", updateStickyCta, { passive: true });
window.addEventListener("resize", updateStickyCta);
updateStickyCta();

if (demoSubmit) {
  demoSubmit.addEventListener("click", () => {
    const form = demoSubmit.closest("form");
    const name = form?.querySelector('[name="name"]')?.value.trim();
    const place = form?.querySelector('[name="place"]')?.value;
    const message = form?.querySelector('[name="message"]')?.value.trim();

    const summary = [
      name ? `${name}様` : "お客様",
      place ? `気になる場所：${place}` : "",
      message ? "ご相談内容を確認しました。" : "ご相談内容を入力すると、より具体的に確認できます。"
    ].filter(Boolean).join("\n");

    window.alert(summary);
  });
}
