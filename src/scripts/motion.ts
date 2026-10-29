// Page motion with GSAP. Seizure rule from the PO: slow moves, one direction,
// no flashes, nothing repeats. With prefers-reduced-motion nothing animates,
// the video does not autoplay, and it keeps its native controls.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

const root = document.documentElement;
const mm = gsap.matchMedia();

mm.add('(prefers-reduced-motion: no-preference)', () => {
  const ease = 'power3.out';

  // Hero: text, buttons, then the phone and its chips. Runs once on load.
  gsap.timeline({ defaults: { ease, duration: 0.9 } })
    .fromTo('[data-reveal="hero"]', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, stagger: 0.08 })
    .fromTo('[data-reveal="phone"]', { autoAlpha: 0, y: 48, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 1.1 }, '-=0.5')
    .fromTo('[data-reveal="chip"]', { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, stagger: 0.15, duration: 0.7 }, '-=0.5');

  // Statement: words brighten one by one while it scrolls through the view.
  const statement = document.querySelector<HTMLElement>('[data-reveal="words"]');
  if (statement) {
    gsap.set(statement, { autoAlpha: 1 });
    const split = SplitText.create(statement, { type: 'words' });
    gsap.fromTo(split.words, { opacity: 0.15 }, {
      opacity: 1, stagger: 0.1, ease: 'none',
      scrollTrigger: { trigger: statement, start: 'top 80%', end: 'bottom 45%', scrub: true },
    });
  }

  // Steps and cards: fade up once as they enter.
  gsap.set('[data-reveal="up"]', { autoAlpha: 0, y: 32 });
  ScrollTrigger.batch('[data-reveal="up"]', {
    start: 'top 88%',
    once: true,
    onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, stagger: 0.1, duration: 0.8, ease }),
  });

  // Video: grows into place while it scrolls in, plays muted while in view.
  const box = document.querySelector<HTMLElement>('.video');
  const video = box?.querySelector('video');
  const sound = box?.querySelector<HTMLButtonElement>('.sound');
  if (box && video) {
    gsap.set(box, { autoAlpha: 1 });
    gsap.fromTo(box, { scale: 0.82 }, {
      scale: 1, ease: 'none',
      scrollTrigger: { trigger: box, start: 'top bottom', end: 'center center', scrub: true },
    });
    video.controls = false;
    ScrollTrigger.create({
      trigger: box,
      start: 'top 70%',
      end: 'bottom 30%',
      onToggle: (self) => (self.isActive ? video.play().catch(() => {}) : video.pause()),
    });
    video.addEventListener('click', () => (video.paused ? video.play() : video.pause()));
    sound?.addEventListener('click', () => {
      video.muted = !video.muted;
      sound.textContent = video.muted ? 'Tap for sound' : 'Sound on';
      if (video.paused) video.play().catch(() => {});
    });
  }

  return () => {
    if (video) video.controls = true;
  };
});

// The head script hides reveal targets only when motion is allowed. GSAP owns them now.
root.classList.add('motion-ready');
