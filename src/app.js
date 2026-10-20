(() => {
  'use strict';

  // ==========================================
  // 1. CONFIGURACIÓN Y ESTRUCTURA DE NOTICIAS AVANZADA
  // ==========================================
  const STORAGE_KEY = 'grupo-ponce-noticias-provisional';
  const CATEGORIES = ['Accidentes', 'Agentes de Seguros', 'Autos', 'Capacitación', 'Seguros'];

  const ORIGINAL_NEWS = [
    { id: 'original-8', title: 'Desafíos de la madre profesional en el mundo laboral', summary: 'Uno de los retos más grandes que enfrentan las mujeres que son madres cuando buscan trabajo es equilibrar su desarrollo profesional y familiar.', content: '', date: '2023-03-17', category: 'Agentes de Seguros', url: 'https://www.grupoponce.com.mx/noticia/8-Desaf%C3%ADos-de-la-madre-profesional-en-el-mundo-laboral' },
    { id: 'original-7', title: 'Beneficios de tener tu información en la nube', summary: 'Disponer de copias de seguridad en línea brinda una mayor garantía para proteger la información y la continuidad de una empresa.', content: '', date: '2023-03-17', category: 'Capacitación', url: 'https://www.grupoponce.com.mx/noticia/7-Beneficios-de-tener-tu-informaci%C3%B3n-en-la-nube.' },
    { id: 'original-6', title: '¿Cómo activar la emoción en las ventas?', summary: 'La pasión y la empatía forman parte de las habilidades necesarias para conectar con las personas y crecer profesionalmente en ventas.', content: '', date: '2023-03-17', category: 'Agentes de Seguros', url: 'https://www.grupoponce.com.mx/noticia/6-%C2%BFC%C3%B3mo-activar-la-emoci%C3%B3n-en-las-ventas?' },
    { id: 'original-4', title: 'La edad de retiro, ¿una ilusión o una preocupación?', summary: 'Revisar con anticipación las condiciones del retiro ayuda a convertir una preocupación futura en un plan financiero con objetivos claros.', content: '', date: '2015-03-12', category: 'Seguros', url: 'https://www.grupoponce.com.mx/noticia/4-la-edad-de-retiro-una-ilusion-o-una-preocupacion' },
    { id: 'original-5', title: 'Cómo superar el miedo a las ventas', summary: 'Vencer el miedo al fracaso y otras barreras psicológicas es el primer paso para desarrollar confianza y mejorar el desempeño comercial.', content: '', date: '2015-03-12', category: 'Capacitación', url: 'https://www.grupoponce.com.mx/noticia/5-como-superar-el-miedo-a-las-ventas' },
    { id: 'original-3', title: 'Viviendo con un significado', summary: 'Una reflexión sobre propósito, servicio y la manera en que el trabajo adquiere significado cuando contribuye al bienestar de otras personas.', content: '', date: '2015-03-12', category: 'Agentes de Seguros', url: 'https://www.grupoponce.com.mx/noticia/3-viviendo-con-un-significado' },
    { id: 'original-2', title: '¿Sabías que el 90% de los accidentes que ocurren en el hogar se pueden evitar?', summary: 'La prevención en casa puede reducir accidentes frecuentes. Identificar riesgos y adoptar hábitos seguros ayuda a proteger a toda la familia.', content: '', date: '2015-03-12', category: 'Seguros', url: 'https://www.grupoponce.com.mx/noticia/2-sabias-que-el-90-de-los-accidentes-que-ocurren-en-el-hogar-se-pueden-evitar' }
  ];

  const cloneOriginals = () => ORIGINAL_NEWS.map(item => ({ ...item }));
  const today = () => new Date().toISOString().slice(0, 10);
  const makeId = () => globalThis.crypto?.randomUUID?.() || `noticia-${Date.now()}`;
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

  function safeUrl(value) {
    if (!value) return '';
    try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : ''; }
    catch { return ''; }
  }

  function formatDate(value) {
    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }).format(date).replace('.', '');
  }

  function normalize(item, index = 0) {
    return {
      id: String(item.id || `noticia-${index}-${Date.now()}`),
      title: String(item.title || '').trim(),
      summary: String(item.summary || '').trim(),
      content: String(item.content || '').trim(),
      date: /^\d{4}-\d{2}-\d{2}$/.test(item.date || '') ? item.date : today(),
      category: CATEGORIES.includes(item.category) ? item.category : 'Seguros',
      url: safeUrl(item.url)
    };
  }

  function getNews() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!Array.isArray(stored)) return cloneOriginals();
      return stored.map(normalize).filter(item => item.title && item.summary);
    } catch { return cloneOriginals(); }
  }

  function saveNews(items) {
    const normalized = items.map(normalize).filter(item => item.title && item.summary);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  }

  let drafts = getNews();

  // ==========================================
  // 2. CAPTURA DE ELEMENTOS DEL DOM (SOPORTA AMBAS VISTAS)
  // ==========================================
  const archiveGrid = document.querySelector('#archive-grid, #newsGrid');
  const empty = document.querySelector('#archive-empty, #newsEmpty');
  const search = document.querySelector('#archive-search, #newsSearch');
  const filters = document.querySelector('#category-filters');
  const resultCount = document.querySelector('#result-count');
  const articleModalElement = document.querySelector('#article-modal');
  const articleModal = articleModalElement ? bootstrap.Modal.getOrCreateInstance(articleModalElement) : null;
  const contactForm = document.getElementById('contactForm');

  const editor = document.querySelector('#newsEditor, #news-editor');
  const editorForm = document.querySelector('#newsEditorForm, #news-editor-form');
  const editorStatus = document.querySelector('#editorStatus, #editor-status');
  const googleSignInContainer = document.getElementById('googleSignInContainer');
  const spinnerWrapperEl =  document.querySelector('.spinner-wrapper');
  const accessModalElement = document.querySelector('#accessModal, #private-access-modal');
  const btnReset = document.querySelector('#resetNews, #reset-news');
  const btnExit = document.querySelector('#editorExit, #editor-exit');
  const btnAdd = document.querySelector('#add-news, #addNews'); 

  let selectedCategory = 'Todas';

  // ==========================================
  // 3. RENDERIZADO PÚBLICO
  // ==========================================
  function renderCard(item) {
    const url = safeUrl(item.url);
    const action = url
      ? `<a class="text-brand fw-bold text-decoration-none mt-auto text-start" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">Leer publicación ↗</a>`
      : `<button class="btn btn-link text-brand fw-bold p-0 mt-auto text-start" type="button" data-news-id="${escapeHtml(item.id)}">Leer publicación →</button>`;

    return `
      <div class="col-lg-4 col-md-6 mb-4">
        <article class="news-card shadow-sm">
          <div class="card-body d-flex flex-column p-4">
            <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
              <time class="eyebrow" datetime="${escapeHtml(item.date)}">${escapeHtml(formatDate(item.date))}</time>
              <span class="eyebrow">${escapeHtml(item.category)}</span>
            </div>
            <h3 class="card-title h4">${escapeHtml(item.title)}</h3>
            <p class="card-text text-secondary mb-4">${escapeHtml(item.summary)}</p>
            ${action}
          </div>
        </article>
      </div>
    `;
  }

  function renderArchive() {
    if (!archiveGrid) return;
    const items = getNews();
    const term = search ? search.value.trim().toLocaleLowerCase('es-MX') : '';

    const filtered = items.filter(item => {
      const matchesCategory = selectedCategory === 'Todas' || item.category === selectedCategory;
      const searchable = `${item.title} ${item.summary} ${item.content} ${item.category}`.toLocaleLowerCase('es-MX');
      return matchesCategory && searchable.includes(term);
    });

    if (filters) {
      filters.innerHTML = ['Todas', ...CATEGORIES].map(category => {
        const count = category === 'Todas' ? items.length : items.filter(i => i.category === category).length;
        const active = category === selectedCategory;
        return `<button class="btn btn-sm ${active ? 'btn-primary' : 'btn-outline-primary'} rounded-pill m-1" type="button" data-category="${escapeHtml(category)}" aria-pressed="${active}">${escapeHtml(category)} <span class="ms-1">${count}</span></button>`;
      }).join('');
    }

    const visibleItems = archiveGrid.id === 'newsGrid'
    ? filtered.slice(0, 3)
    : filtered;

    if (
      archiveGrid.id === 'newsGrid' &&
      archiveGrid.dataset.view === 'carousel'
    ) {
      const carouselElement = document.getElementById('homeNewsCarousel');

      // Reiniciar el carrusel cuando cambie la búsqueda o las noticias.
      bootstrap.Carousel.getInstance(carouselElement)?.dispose();

      const slides = [];

      for (let i = 0; i < filtered.length; i += 3) {
        slides.push(`
          <div class="carousel-item ${i === 0 ? 'active' : ''}">
            <div class="row g-3">
              ${filtered.slice(i, i + 3).map(renderCard).join('')}
            </div>
          </div>
        `);
      }

      archiveGrid.innerHTML = slides.join('');

      const multipleSlides = slides.length > 1;

      carouselElement.querySelectorAll('[data-bs-slide]').forEach(button => {
        button.hidden = !multipleSlides;
      });

      if (multipleSlides) {
        new bootstrap.Carousel(carouselElement, {
          interval: false
        });
      }
    } else {
      archiveGrid.innerHTML = filtered.map(renderCard).join('');
    }
    
    if (empty) {
        empty.classList.toggle('d-none', filtered.length === 0);
        empty.hidden = filtered.length > 0;
    }
    if (resultCount) resultCount.textContent = `${filtered.length} ${filtered.length === 1 ? 'publicación' : 'publicaciones'}`;
  }

  // ==========================================
  // 4. EDITOR Y GESTIÓN DE NOTICIAS (CRUD)
  // ==========================================
  function categoryOptions(selected) {
    return CATEGORIES.map(category => `<option value="${escapeHtml(category)}" ${category === selected ? 'selected' : ''}>${escapeHtml(category)}</option>`).join('');
  }

  function renderEditor() {
    if (!editorForm) return;
    editorForm.innerHTML = drafts.map((item, index) => `
      <fieldset class="border-top py-4" data-news-index="${index}">
        <div class="d-flex justify-content-between align-items-center gap-3 mb-3">
          <h4 class="h5 text-brand mb-0">Noticia ${index + 1}</h4>
          <button class="btn btn-sm btn-outline-primary" type="button" data-delete-index="${index}">Eliminar</button>
        </div>
        <input type="hidden" name="id-${index}" value="${escapeHtml(item.id)}">
        <div class="mb-3">
          <label class="form-label fw-bold">Título</label>
          <input class="form-control" name="title-${index}" required value="${escapeHtml(item.title)}">
        </div>
        <div class="row g-3 mb-3">
          <div class="col-md-5">
            <label class="form-label fw-bold">Fecha</label>
            <input class="form-control" name="date-${index}" type="date" required value="${escapeHtml(item.date)}">
          </div>
          <div class="col-md-7">
            <label class="form-label fw-bold">Categoría</label>
            <select class="form-select" name="category-${index}" required>${categoryOptions(item.category)}</select>
          </div>
        </div>
        <div class="mb-3">
          <label class="form-label fw-bold">Resumen</label>
          <textarea class="form-control" name="summary-${index}" rows="3" required>${escapeHtml(item.summary)}</textarea>
        </div>
        <div class="mb-3">
          <label class="form-label fw-bold">Contenido (Opcional si hay enlace externo)</label>
          <textarea class="form-control" name="content-${index}" rows="4">${escapeHtml(item.content)}</textarea>
        </div>
        <div class="mb-3">
          <label class="form-label fw-bold">Hipervínculo externo (Opcional)</label>
          <input class="form-control" name="url-${index}" type="url" value="${escapeHtml(safeUrl(item.url))}" placeholder="https://">
        </div>
      </fieldset>
    `).join('');

    if (editorStatus) editorStatus.textContent = drafts.length ? '' : 'No hay noticias. Añade una nueva.';
  }

  function readDrafts() {
    if (!editorForm || !editorForm.elements.length) return drafts;
    return drafts.map((item, index) => ({
      id: editorForm.elements[`id-${index}`]?.value || item.id,
      title: editorForm.elements[`title-${index}`]?.value ?? item.title,
      date: editorForm.elements[`date-${index}`]?.value || item.date,
      category: editorForm.elements[`category-${index}`]?.value || item.category,
      summary: editorForm.elements[`summary-${index}`]?.value ?? item.summary,
      content: editorForm.elements[`content-${index}`]?.value ?? item.content,
      url: editorForm.elements[`url-${index}`]?.value ?? item.url
    }));
  }

  // ==========================================
  // 5. GOOGLE IDENTITY Y FLUJO DE ACCESO
  // ==========================================
  function parseJwt(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(jsonPayload);
  }

  window.handleCredentialResponse = (response) => {
    const responsePayload = parseJwt(response.credential);
    if (googleSignInContainer) {
        googleSignInContainer.classList.add('d-none');
        googleSignInContainer.hidden = true;
    }
    if (editor) {
        editor.classList.remove('d-none');
        editor.hidden = false;
    }
    drafts = getNews(); 
    renderEditor();
  };

  if (googleSignInContainer) {

  const showSpinner = () => {
    if (spinnerWrapperEl) {
      spinnerWrapperEl.classList.remove('d-none');
    }
  };

  const hideSpinner = () => {
    if (spinnerWrapperEl) {
      spinnerWrapperEl.classList.add('d-none');
    }
  };

  // Espera a que la librería de Google haya terminado de cargar
  const waitForGoogleIdentity = () => {
    return new Promise((resolve, reject) => {

      if (window.google?.accounts?.id) {
        resolve();
        return;
      }

      const start = Date.now();

      const interval = setInterval(() => {

        if (window.google?.accounts?.id) {
          clearInterval(interval);
          resolve();
        }

        if (Date.now() - start > 10000) {
          clearInterval(interval);
          reject(new Error('Google Identity no pudo cargarse.'));
        }

      }, 50);
    });
  };


  // Espera a que Google inserte físicamente el botón
  const waitForGoogleButton = () => {
    return new Promise((resolve) => {

      if (googleSignInContainer.children.length > 0) {
        resolve();
        return;
      }

      const observer = new MutationObserver(() => {

        if (googleSignInContainer.children.length > 0) {
          observer.disconnect();

          // Dejamos que el navegador pinte el botón
          requestAnimationFrame(resolve);
        }

      });

      observer.observe(googleSignInContainer, {
        childList: true,
        subtree: true
      });

    });
  };


  const initGoogleAuth = async () => {

    await waitForGoogleIdentity();

    google.accounts.id.initialize({
      client_id:
        "633211460268-mk4o4oil4tt8l7hmp18vln3dug4i4aup.apps.googleusercontent.com",

      callback: handleCredentialResponse
    });

    // Empezamos a observar ANTES de pedirle a Google
    // que genere el botón.
    const buttonReady = waitForGoogleButton();

    google.accounts.id.renderButton(
      googleSignInContainer,
      {
        theme: "outline",
        size: "large",
        text: "continue_with"
      }
    );

    await buttonReady;
  };


  if (accessModalElement) {

    let isGoogleButtonRendered = false;

    accessModalElement.addEventListener(
      'shown.bs.modal',
      async () => {

        // Si ya fue renderizado anteriormente,
        // no necesitamos volver a mostrar el spinner.
        if (isGoogleButtonRendered) {
          hideSpinner();
          return;
        }

        showSpinner();

        try {

          await initGoogleAuth();

          isGoogleButtonRendered = true;

        } catch (error) {

          console.error(
            'Error cargando Google Identity:',
            error
          );

        } finally {

          hideSpinner();

        }

      }
    );


    accessModalElement.addEventListener(
      'hidden.bs.modal',
      () => {

        if (editor) {
          editor.classList.add('d-none');
          editor.hidden = true;
        }

        if (googleSignInContainer) {
          googleSignInContainer.classList.remove('d-none');
          googleSignInContainer.hidden = false;
        }

      }
    );

  } else {

    initGoogleAuth();

  }
}

  // ==========================================
  // 6. EVENTOS Y LISTENERS
  // ==========================================
  renderArchive();

  if (search) search.addEventListener('input', renderArchive);

  if (filters) {
    filters.addEventListener('click', event => {
      const button = event.target.closest('[data-category]');
      if (!button) return;
      selectedCategory = button.dataset.category;
      renderArchive();
    });
  }

  if (archiveGrid) {
    archiveGrid.addEventListener('click', event => {
      const button = event.target.closest('[data-news-id]');
      if (!button || !articleModal) return;
      const item = getNews().find(n => n.id === button.dataset.newsId);
      if (!item || item.url) return;

      const catEl = document.querySelector('#article-category');
      const titleEl = document.querySelector('#article-title');
      const dateEl = document.querySelector('#article-date');
      const contentEl = document.querySelector('#article-content');

      if (catEl) catEl.textContent = item.category;
      if (titleEl) titleEl.textContent = item.title;
      if (dateEl) dateEl.textContent = formatDate(item.date);
      if (contentEl) contentEl.textContent = item.content;

      articleModal.show();
    });
  }

  if (btnAdd) {
    btnAdd.addEventListener('click', () => {
      drafts = readDrafts();
      drafts.unshift({ id: makeId(), title: '', summary: '', content: '', date: today(), category: 'Seguros', url: '' });
      renderEditor();
    });
  }

  if (editorForm) {
    editorForm.addEventListener('click', event => {
      const deleteBtn = event.target.closest('[data-delete-index]');
      if (!deleteBtn) return;
      drafts = readDrafts();
      drafts.splice(Number(deleteBtn.dataset.deleteIndex), 1);
      renderEditor();
    });

    editorForm.addEventListener('submit', event => {
      event.preventDefault();
      if (!editorForm.reportValidity()) return;

      const nextItems = readDrafts().map(item => normalize(item));
      const missingContent = nextItems.findIndex(item => !item.url && !item.content);

      if (missingContent >= 0) {
        if (editorStatus) editorStatus.textContent = `Añade contenido o un hipervínculo a la noticia ${missingContent + 1}.`;
        return;
      }

      drafts = saveNews(nextItems);
      renderEditor();
      renderArchive();
      if (editorStatus) editorStatus.textContent = 'Noticias guardadas en este navegador.';
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEY);
      drafts = cloneOriginals();
      renderEditor();
      renderArchive();
      if (editorStatus) editorStatus.textContent = 'Se restauraron las publicaciones originales.';
    });
  }

  if (btnExit) {
    btnExit.addEventListener('click', () => {
      if (editor) {
        editor.classList.add('d-none');
        editor.hidden = true;
      }
      if (googleSignInContainer) {
        googleSignInContainer.classList.remove('d-none');
        googleSignInContainer.hidden = false;
      }
    });
  }

  // Interacciones generales del sitio (Contacto, Navbar)
  if (contactForm) {
    contactForm.addEventListener('submit', event => {
      event.preventDefault();
      if (!event.currentTarget.reportValidity()) return;
      const status = document.getElementById('formStatus');
      if (status) status.textContent = 'Gracias. Tu solicitud quedó preparada para enviarse al equipo correspondiente.';
    });
  }

  // Disparadores del formulario de contacto
document.querySelectorAll('.interest-trigger').forEach(trigger => {
  trigger.addEventListener('click', () => {

    const interest = trigger.dataset.interest;
    const interestSelect = document.getElementById('interest');
    const contactoSection = document.getElementById('contacto');

    if (!interest) return;

    // Si estamos en index y el formulario existe,
    // seleccionamos directamente la opción.
    if (interestSelect) {
      interestSelect.value = interest;

      if (contactoSection) {
        contactoSection.scrollIntoView({
          behavior: 'smooth'
        });
      }
    }

    // Si estamos en otra página, guardamos temporalmente
    // el interés antes de ir al index.
    else {
      sessionStorage.setItem('contactInterest', interest);
    }
  });
});


// Recuperar interés cuando llegamos al index desde otra página
const storedInterest = sessionStorage.getItem('contactInterest');
const interestSelect = document.getElementById('interest');

if (storedInterest && interestSelect) {
  interestSelect.value = storedInterest;

  // Ya no lo necesitamos
  sessionStorage.removeItem('contactInterest');
}

  document.querySelectorAll('#navbarMain a, #navbarMain button').forEach(item => {
    item.addEventListener('click', () => {
      const collapseElement = document.getElementById('navbarMain');
      if (collapseElement) {
        const instance = bootstrap.Collapse.getInstance(collapseElement);
        if (instance && window.innerWidth < 1200) instance.hide();
      }
    });
  });

})();

document.addEventListener('DOMContentLoaded', function() {
 var currentYear = new Date().getFullYear();
 document.getElementById('currentYear').textContent = currentYear;
});

