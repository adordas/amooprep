(() => {
  const cfg = window.AMOOPREP_CONFIG || {};
  const buyButtons = document.querySelectorAll('[data-buy-premium]');
  const chromeButtons = document.querySelectorAll('[data-chrome-store]');
  const supportLinks = document.querySelectorAll('[data-support-email]');
  const priceEls = document.querySelectorAll('[data-price]');

  priceEls.forEach(el => el.textContent = cfg.price || '$9.99');

  buyButtons.forEach(btn => {
    if (cfg.lemonCheckoutUrl) {
      btn.href = cfg.lemonCheckoutUrl;
      btn.target = '_blank';
      btn.rel = 'noopener';
    } else {
      btn.href = 'product.html';
      btn.classList.add('btn-disabled');
      btn.title = 'Checkout link will be added after the Lemon Squeezy product is created.';
      if (btn.dataset.labelComing !== 'false') btn.textContent = 'Premium — Checkout Coming Soon';
    }
  });

  chromeButtons.forEach(btn => {
    if (cfg.chromeStoreUrl) {
      btn.href = cfg.chromeStoreUrl;
      btn.target = '_blank';
      btn.rel = 'noopener';
    } else {
      btn.href = 'product.html';
      btn.classList.add('btn-disabled');
      btn.textContent = 'Chrome Web Store — Coming Soon';
    }
  });

  supportLinks.forEach(link => {
    if (cfg.supportEmail) {
      link.href = `mailto:${cfg.supportEmail}`;
      link.textContent = cfg.supportEmail;
    } else {
      link.href = 'contact.html';
      link.textContent = 'Contact / Support';
    }
  });

  const menu = document.querySelector('.menu-btn');
  const nav = document.querySelector('.nav-links');
  menu?.addEventListener('click', () => nav?.classList.toggle('open'));
  nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

  document.querySelectorAll('.faq-q').forEach(q => {
    q.addEventListener('click', () => q.closest('.faq-item').classList.toggle('open'));
  });
})();
