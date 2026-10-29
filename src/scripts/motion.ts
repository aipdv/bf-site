// Page motion with GSAP.
// Scroll-linked and click-linked motion runs for every visitor: the visitor drives it.
// Self-running motion (the hero rise-in) runs only when the visitor allows motion.
// PO seizure rule: slow moves, one direction, no flashes.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, ScrollToPlugin, SplitText);

const ease = 'power3.out';
const NAV = 96; // space the fixed navbar takes at the top

// Smooth scrolling on desktop. Touch keeps native scrolling.
const smoother = ScrollSmoother.create({
  wrapper: '#smooth-wrapper',
  content: '#smooth-content',
  smooth: 1.1,
  smoothTouch: 0,
  effects: false,
});

// Navbar and button links to sections on this page glide there.
document.querySelectorAll<HTMLAnchorElement>('a[href^="#"], a[href^="/#"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    const id = a.getAttribute('href')!.replace(/^\//, '');
    const target = document.querySelector<HTMLElement>(id);
    if (!target) return;
    e.preventDefault();
    // Full-screen sections (the video) align to the top; others clear the navbar.
    smoother.scrollTo(target, true, target.classList.contains('vid') ? 'top top' : `top ${NAV}px`);
    history.replaceState(null, '', id);
  });
});
document.querySelectorAll<HTMLAnchorElement>('a[href="/"]').forEach((a) => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    smoother.scrollTo(0, true);
  });
});

// Hero: the phone starts huge and cropped by the fold, then shrinks into view as you scroll.
const hero = document.querySelector<HTMLElement>('.hero');
const stage = document.querySelector<HTMLElement>('[data-stage]');
const heroText = gsap.utils.toArray<HTMLElement>('[data-reveal="hero"]');
if (hero && stage) {
  const PHONE_H = 660; // .rp height at scale 1
  const big = () => Math.max(1, Math.min(2.6, (innerWidth * 0.86) / 340));
  const small = () => Math.min(1, (innerHeight - NAV - 40) / PHONE_H);
  // Move the stage so the small phone sits centered below the navbar.
  const endY = () => {
    const top = stage.offsetTop - hero.offsetTop;
    const want = NAV + (innerHeight - NAV - PHONE_H * small()) / 2;
    return want - top;
  };
  gsap.timeline({
    scrollTrigger: { trigger: hero, start: 'top top', end: '+=120%', pin: true, scrub: 1, invalidateOnRefresh: true },
  })
    .fromTo(stage, { scale: big, y: 0 }, { scale: small, y: endY, ease: 'power1.inOut', duration: 1 }, 0)
    .to('.hero-copy', { autoAlpha: 0, y: -60, ease: 'power1.in', duration: 0.45 }, 0)
    .fromTo('[data-reveal="chip"]', { autoAlpha: 0, scale: 0.9 }, { autoAlpha: 1, scale: 1, stagger: 0.08, duration: 0.25, ease }, 0.72);
}

// Self-running: the hero text rises in once on load.
gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
  gsap.fromTo(heroText, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.9, ease, immediateRender: false });
});

// Statement: words brighten one by one while it scrolls through the view.
const statement = document.querySelector<HTMLElement>('[data-reveal="words"]');
if (statement) {
  const split = SplitText.create(statement, { type: 'words' });
  gsap.fromTo(split.words, { opacity: 0.15 }, {
    opacity: 1, stagger: 0.1, ease: 'none',
    scrollTrigger: { trigger: statement, start: 'top 80%', end: 'bottom 45%', scrub: 1 },
  });
}

// Steps and cards: fade up as they enter.
gsap.set('[data-reveal="up"]', { autoAlpha: 0, y: 32 });
ScrollTrigger.batch('[data-reveal="up"]', {
  start: 'top 88%',
  once: true,
  onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, stagger: 0.1, duration: 0.9, ease }),
});

// Video: no controls bar. It grows into place, plays muted while in view, pauses outside.
const box = document.querySelector<HTMLElement>('.video');
const video = box?.querySelector('video');
const sound = box?.querySelector<HTMLButtonElement>('.sound');
if (box && video) {
  video.controls = false;
  gsap.fromTo(box, { scale: 0.82 }, {
    scale: 1, ease: 'none',
    scrollTrigger: { trigger: box, start: 'top bottom', end: 'center center', scrub: 1 },
  });
  ScrollTrigger.create({
    trigger: box,
    start: 'top 75%',
    end: 'bottom 25%',
    onToggle: (self) => (self.isActive ? video.play().catch(() => {}) : video.pause()),
  });
  video.addEventListener('click', () => (video.paused ? video.play() : video.pause()));
  sound?.addEventListener('click', () => {
    video.muted = !video.muted;
    sound.textContent = video.muted ? 'Tap for sound' : 'Sound on';
    if (video.paused) video.play().catch(() => {});
  });
}

document.documentElement.classList.add('motion-ready');
