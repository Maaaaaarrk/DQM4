export function SiteDisclaimer() {
  return (
    <p className="mx-auto mt-1 max-w-4xl text-center text-[11px] font-bold leading-snug text-gold/75">
      Dragon Quest and Dragon Quest Monsters are trademarks of Square Enix. Synthline is an
      unofficial fan database and is not affiliated with or endorsed by Square Enix.
    </p>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t-[3px] border-chrome-hi bg-chrome px-3 py-2">
      <p className="text-center font-display text-xs font-extrabold tracking-[0.18em] text-gold">
        Scout. Synth. Repeat.
      </p>
      <SiteDisclaimer />
    </footer>
  );
}
