(() => {
  const cfg = window.AMOOPREP_CONFIG || {};
  const pageCourseId = document.body?.dataset?.courseId || cfg.defaultCourseId || '';
  const rootPath = document.body?.dataset?.rootPath || '';
  const internalUrl = (u) => !u || /^(?:https?:|mailto:|#)/i.test(u) ? u : `${rootPath}${u}`;
  const getCourse = (id) => (cfg.courses || {})[id] || {};

  document.querySelectorAll('[data-price]').forEach(el => {
    const id = el.dataset.courseId || pageCourseId;
    el.textContent = getCourse(id).price || '$9.99';
  });

  document.querySelectorAll('[data-buy-premium]').forEach(btn => {
    const id = btn.dataset.courseId || pageCourseId;
    const course = getCourse(id);
    if (course.checkoutUrl) {
      btn.href = course.checkoutUrl;
      btn.target = '_blank';
      btn.rel = 'noopener noreferrer';
      if (btn.dataset.keepLabel !== 'true' && /coming soon/i.test(btn.textContent || '')) {
        btn.textContent = `Buy Premium — ${course.price || '$9.99'}`;
      }
    } else {
      btn.href = internalUrl(course.pageUrl || 'courses/index.html');
      btn.classList.add('btn-disabled');
      btn.title = 'Checkout is not available for this course yet.';
      if (btn.dataset.keepLabel !== 'true') btn.textContent = 'Premium — Coming Soon';
    }
  });

  document.querySelectorAll('[data-chrome-store]').forEach(btn => {
    const id = btn.dataset.courseId || pageCourseId;
    const course = getCourse(id);
    const storeUrl = course.chromeStoreUrl || cfg.chromeStoreUrl || '';

    if (storeUrl) {
      btn.hidden = false;
      btn.href = storeUrl;
      btn.target = '_blank';
      btn.rel = 'noopener noreferrer';
      if (!btn.textContent.trim()) btn.textContent = 'Install on Chrome';
    } else {
      btn.hidden = true;
      btn.removeAttribute('href');
      btn.removeAttribute('target');
      btn.removeAttribute('rel');
    }
  });

  document.querySelectorAll('[data-support-email]').forEach(link => {
    if (cfg.supportEmail) {
      link.href = `mailto:${cfg.supportEmail}`;
      link.textContent = cfg.supportEmail;
    } else {
      link.href = internalUrl('contact.html');
      link.textContent = 'Contact / Support';
    }
  });

  const menu = document.querySelector('.menu-btn');
  const nav = document.querySelector('.nav-links');
  menu?.addEventListener('click', () => nav?.classList.toggle('open'));
  nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
  document.querySelectorAll('.faq-q').forEach(q => q.addEventListener('click', () => q.closest('.faq-item').classList.toggle('open')));
})();
