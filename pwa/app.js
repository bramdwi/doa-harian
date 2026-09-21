// ==========================================================================
// Daily Du'a — Mukhtashar Al-Hizbul A'zham & Sholawat 40
// PWA Application Logic
// ==========================================================================

(function () {
    'use strict';

    // --- State Management ---
    const STATE = {
        activeChapter: 'jumat',
        fontScale: 1.0,
        showTranslation: true,
        showLatin: true,
        bookmarks: [] // Array of item IDs e.g. ["jumat-1", "sholawat-25"]
    };

    const CHAPTER_ORDER = ['jumat', 'sabtu', 'ahad', 'senin', 'selasa', 'rabu', 'kamis', 'sholawat'];
    const DAY_MAP = { 5: 'jumat', 6: 'sabtu', 0: 'ahad', 1: 'senin', 2: 'selasa', 3: 'rabu', 4: 'kamis' };

    // --- DOM Elements ---
    let elContentContainer, elZoomLabel, elToggleArtiBtn, elToggleLatinBtn;
    let elBookmarkCount, elBookmarkModal, elBookmarkList, elToast;
    let elMenuDrawerBackdrop, elMenuChaptersList, elActiveChapterName;

    // --- Initialization ---
    document.addEventListener('DOMContentLoaded', () => {
        initDOMElements();
        loadSavedState();
        registerServiceWorker();
        updateActiveChapterUI();
        renderChapter(STATE.activeChapter);
        applyFontScale();
        applyTranslationVisibility();
        applyLatinVisibility();
        updateBookmarkCount();
    });

    function initDOMElements() {
        elContentContainer = document.getElementById('content-container');
        elZoomLabel = document.getElementById('zoom-label');
        elToggleArtiBtn = document.getElementById('toggle-arti-btn');
        elToggleLatinBtn = document.getElementById('toggle-latin-btn');
        elBookmarkCount = document.getElementById('bookmark-count');
        elBookmarkModal = document.getElementById('bookmark-modal');
        elBookmarkList = document.getElementById('bookmark-list');
        elToast = document.getElementById('toast');
        elMenuDrawerBackdrop = document.getElementById('menu-drawer-backdrop');
        elMenuChaptersList = document.getElementById('menu-chapters-list');
        elActiveChapterName = document.getElementById('active-chapter-name');

        // Hamburger Menu & Chapter Selector
        document.getElementById('open-menu-btn')?.addEventListener('click', openMenuDrawer);
        document.getElementById('close-menu-btn')?.addEventListener('click', closeMenuDrawer);
        document.getElementById('chapter-selector-btn')?.addEventListener('click', openMenuDrawer);
        elMenuDrawerBackdrop?.addEventListener('click', (e) => {
            if (e.target === elMenuDrawerBackdrop) closeMenuDrawer();
        });

        // Zoom Buttons
        document.getElementById('zoom-in-btn')?.addEventListener('click', () => changeFontSize(0.1));
        document.getElementById('zoom-out-btn')?.addEventListener('click', () => changeFontSize(-0.1));

        // Toggle Latin & Arti Buttons
        elToggleLatinBtn?.addEventListener('click', toggleLatin);
        elToggleArtiBtn?.addEventListener('click', toggleTranslation);

        // Bookmark Modal Buttons
        document.getElementById('open-bookmarks-btn')?.addEventListener('click', openBookmarkModal);
        document.getElementById('close-bookmarks-btn')?.addEventListener('click', closeBookmarkModal);
        elBookmarkModal?.addEventListener('click', (e) => {
            if (e.target === elBookmarkModal) closeBookmarkModal();
        });

        // Close on Escape Key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeMenuDrawer();
                closeBookmarkModal();
            }
        });
    }

    // --- Load Persisted State from LocalStorage ---
    function loadSavedState() {
        try {
            // Bookmarks
            const savedBm = localStorage.getItem('dua_bookmarks');
            if (savedBm) STATE.bookmarks = JSON.parse(savedBm);

            // Font Scale
            const savedScale = localStorage.getItem('dua_font_scale');
            if (savedScale) STATE.fontScale = parseFloat(savedScale);

            // Latin Toggle
            const savedLatin = localStorage.getItem('dua_show_latin');
            if (savedLatin !== null) STATE.showLatin = savedLatin === 'true';

            // Translation Toggle
            const savedTr = localStorage.getItem('dua_show_translation');
            if (savedTr !== null) STATE.showTranslation = savedTr === 'true';

            // Active Chapter: Check last read, else default to today's day
            const savedChapter = localStorage.getItem('dua_last_chapter');
            const todayDay = new Date().getDay();
            const todayChapter = DAY_MAP[todayDay] || 'jumat';

            if (savedChapter && window.HIZIB_DATA[savedChapter]) {
                STATE.activeChapter = savedChapter;
            } else {
                STATE.activeChapter = todayChapter;
            }
        } catch (e) {
            console.error('Error loading state from localStorage:', e);
        }
    }

    const MENU_NAMES = {
        'jumat': 'Hari Jumat',
        'sabtu': 'Hari Sabtu',
        'ahad': 'Hari Ahad',
        'senin': 'Hari Senin',
        'selasa': 'Hari Selasa',
        'rabu': 'Hari Rabu',
        'kamis': 'Hari Kamis',
        'sholawat': '40 Shalawat'
    };

    // --- Navigation Drawer (Hamburger Menu) ---
    function renderMenuChapters() {
        if (!elMenuChaptersList) return;
        const todayDay = new Date().getDay();
        const todayChapter = DAY_MAP[todayDay];

        let html = '';
        CHAPTER_ORDER.forEach((key) => {
            const data = window.HIZIB_DATA[key];
            if (!data) return;

            const isActive = STATE.activeChapter === key;
            const isToday = todayChapter === key;
            const displayName = MENU_NAMES[key] || data.titleIndo;

            html += `
                <div class="chapter-menu-item ${isActive ? 'active' : ''}" onclick="window.app.selectChapterFromMenu('${key}')">
                    <div class="chapter-item-left">
                        <span class="chapter-item-title">
                            ${escapeHTML(displayName)}
                            ${isToday ? '<span class="today-tag">Hari Ini</span>' : ''}
                        </span>
                    </div>
                    <div class="chapter-item-right">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </div>
                </div>
            `;
        });

        elMenuChaptersList.innerHTML = html;
    }

    function openMenuDrawer() {
        renderMenuChapters();
        elMenuDrawerBackdrop?.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeMenuDrawer() {
        elMenuDrawerBackdrop?.classList.remove('open');
        document.body.style.overflow = '';
    }

    window.app = window.app || {};
    window.app.selectChapterFromMenu = function (chapterId) {
        closeMenuDrawer();
        window.app.switchChapter(chapterId);
    };

    function updateActiveChapterUI() {
        if (elActiveChapterName) {
            elActiveChapterName.textContent = MENU_NAMES[STATE.activeChapter] || 'Pilih Hari';
        }
    }

    // --- Switch Active Chapter ---
    window.app.switchChapter = function (chapterId) {
        if (!window.HIZIB_DATA[chapterId]) return;
        STATE.activeChapter = chapterId;
        try {
            localStorage.setItem('dua_last_chapter', chapterId);
        } catch (e) {}

        updateActiveChapterUI();
        renderChapter(chapterId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // --- Render Chapter Content ---
    function renderChapter(chapterId) {
        const chapter = window.HIZIB_DATA[chapterId];
        if (!chapter || !elContentContainer) return;

        let html = '';

        // 1. Chapter Hero
        html += `
            <div class="chapter-hero">
                <h2 class="hero-title-in">${escapeHTML(chapter.titleIndo)}</h2>
                ${chapter.mukaddimah ? `<div class="hero-mukaddimah">${escapeHTML(chapter.mukaddimah)}</div>` : ''}
            </div>
        `;

        // 2. Doa List
        html += '<div class="doa-list">';
        chapter.items.forEach((item) => {
            const isBm = STATE.bookmarks.includes(item.id);

            // Subheader divider (e.g. Hadits 26 Tasyahhud)
            if (item.subheader) {
                html += `
                    <div class="section-divider">
                        <div class="section-divider-ar">${escapeHTML(item.subheader.titleArab)}</div>
                        <div class="section-divider-in">${escapeHTML(item.subheader.titleIndo)}</div>
                    </div>
                `;
            }

            html += `
                <div class="card-item" id="card-${item.id}">
                    <div class="card-header">
                        <span class="doa-badge">${item.num}</span>
                        <div class="card-actions">
                            <button class="card-action-btn ${isBm ? 'bookmarked' : ''}" 
                                    title="${isBm ? 'Hapus Bookmark' : 'Simpan ke Bookmark'}" 
                                    onclick="window.app.toggleBookmark('${item.id}')">
                                ${isBm ? getBookmarkFilledIcon() : getBookmarkOutlineIcon()}
                            </button>
                            <button class="card-action-btn" 
                                    title="Bagikan Doa" 
                                    onclick="window.app.shareDoa('${chapterId}', ${item.num})">
                                ${getShareIcon()}
                            </button>
                        </div>
                    </div>
                    <div class="card-arabic">${escapeHTML(item.arabic)}</div>
                    ${item.latin ? `
                        <div class="card-latin">${escapeHTML(item.latin)}</div>
                    ` : ''}
                    ${item.reference ? `<div class="card-ref">${escapeHTML(item.reference)}</div>` : ''}
                    ${item.translation ? `
                        <div class="card-translation">
                            <span class="tr-label">Terjemahan:</span> ${formatRichText(item.translation)}
                        </div>
                    ` : ''}
                    ${item.note ? `
                        <div class="card-note">
                            <span class="note-label">${escapeHTML(item.note.label)}</span> ${formatRichText(item.note.text)}
                        </div>
                    ` : ''}
                </div>
            `;
        });

        // 3. Doa Penutup (Ikhtitam) dengan gaya kartu standar (bg putih & tata letak identik)
        html += `
            <div class="card-item" id="card-penutup">
                <div class="card-header">
                    <span class="doa-badge badge-text">Penutup</span>
                    <div class="card-actions">
                        <button class="card-action-btn" 
                                title="Bagikan Doa Penutup" 
                                onclick="window.app.shareClosingDoa()">
                            ${getShareIcon()}
                        </button>
                    </div>
                </div>
                <div class="card-arabic">وَآخِرُ دَعْوَانَا أَنِ الْحَمْدُ لِلَّهِ رَبِّ الْعٰلَمِيْنَ ۝</div>
                <div class="card-latin">Wa akhiru da'wana anil-hamdulillahi rabbil-'alamin.</div>
                <div class="card-ref">(Doa Penutup — QS. Yunus: 10)</div>
                <div class="card-translation">
                    <span class="tr-label">Terjemahan:</span> Dan penutup doa kami adalah: "Segala puji bagi Allah, Tuhan semesta alam."
                </div>
            </div>
        `;

        html += '</div>'; // close .doa-list

        elContentContainer.innerHTML = html;
    }

    // --- Font Scaling (Zoom In / Out) ---
    function changeFontSize(delta) {
        STATE.fontScale = Math.round(Math.min(1.6, Math.max(0.75, STATE.fontScale + delta)) * 10) / 10;
        try {
            localStorage.setItem('dua_font_scale', STATE.fontScale);
        } catch (e) {}
        applyFontScale();
        showToast(`Ukuran font: ${Math.round(STATE.fontScale * 100)}%`);
    }

    function applyFontScale() {
        document.documentElement.style.setProperty('--font-scale-arabic', STATE.fontScale);
        document.documentElement.style.setProperty('--font-scale-latin', STATE.fontScale);
        if (elZoomLabel) {
            elZoomLabel.textContent = `${Math.round(STATE.fontScale * 100)}%`;
        }
    }

    // --- Toggle Latin Transliteration ---
    function toggleLatin() {
        STATE.showLatin = !STATE.showLatin;
        try {
            localStorage.setItem('dua_show_latin', STATE.showLatin);
        } catch (e) {}
        applyLatinVisibility();
        showToast(STATE.showLatin ? 'Bacaan Latin diaktifkan' : 'Bacaan Latin disembunyikan');
    }

    function applyLatinVisibility() {
        if (STATE.showLatin) {
            document.body.classList.remove('hide-latin');
            if (elToggleLatinBtn) {
                elToggleLatinBtn.classList.add('active');
                elToggleLatinBtn.innerHTML = `${getTextLatinIcon()} <span>Latin: ON</span>`;
            }
        } else {
            document.body.classList.add('hide-latin');
            if (elToggleLatinBtn) {
                elToggleLatinBtn.classList.remove('active');
                elToggleLatinBtn.innerHTML = `${getTextLatinOffIcon()} <span>Latin: OFF</span>`;
            }
        }
    }

    // --- Toggle Translation (Arti) ---
    function toggleTranslation() {
        STATE.showTranslation = !STATE.showTranslation;
        try {
            localStorage.setItem('dua_show_translation', STATE.showTranslation);
        } catch (e) {}
        applyTranslationVisibility();
        showToast(STATE.showTranslation ? 'Terjemahan diaktifkan' : 'Terjemahan disembunyikan');
    }

    function applyTranslationVisibility() {
        if (STATE.showTranslation) {
            document.body.classList.remove('hide-translation');
            if (elToggleArtiBtn) {
                elToggleArtiBtn.classList.add('active');
                elToggleArtiBtn.innerHTML = `${getEyeIcon()} <span>Arti: ON</span>`;
            }
        } else {
            document.body.classList.add('hide-translation');
            if (elToggleArtiBtn) {
                elToggleArtiBtn.classList.remove('active');
                elToggleArtiBtn.innerHTML = `${getEyeOffIcon()} <span>Arti: OFF</span>`;
            }
        }
    }

    // --- Bookmark Logic ---
    window.app.toggleBookmark = function (itemId) {
        const idx = STATE.bookmarks.indexOf(itemId);
        let added = false;
        if (idx > -1) {
            STATE.bookmarks.splice(idx, 1);
        } else {
            STATE.bookmarks.push(itemId);
            added = true;
        }

        try {
            localStorage.setItem('dua_bookmarks', JSON.stringify(STATE.bookmarks));
        } catch (e) {}

        // Update card button UI immediately
        const card = document.getElementById(`card-${itemId}`);
        if (card) {
            const btn = card.querySelector('.card-action-btn');
            if (btn) {
                if (added) {
                    btn.classList.add('bookmarked');
                    btn.innerHTML = getBookmarkFilledIcon();
                } else {
                    btn.classList.remove('bookmarked');
                    btn.innerHTML = getBookmarkOutlineIcon();
                }
            }
        }

        updateBookmarkCount();
        showToast(added ? 'Doa disimpan ke bookmark' : 'Doa dihapus dari bookmark');
    };

    function updateBookmarkCount() {
        if (!elBookmarkCount) return;
        const count = STATE.bookmarks.length;
        elBookmarkCount.textContent = count;
        elBookmarkCount.style.display = count > 0 ? 'flex' : 'none';
    }

    function openBookmarkModal() {
        if (!elBookmarkModal || !elBookmarkList) return;

        let html = '';
        if (STATE.bookmarks.length === 0) {
            html = `
                <div class="empty-state">
                    ${getBookmarkOutlineIcon(48)}
                    <p>Belum ada doa yang ditandai.</p>
                    <small>Klik ikon bookmark pada kartu doa untuk menyimpannya di sini.</small>
                </div>
            `;
        } else {
            STATE.bookmarks.forEach((itemId) => {
                const parts = itemId.split('-');
                const chapId = parts[0];
                const itemNum = parseInt(parts[1], 10);
                const chap = window.HIZIB_DATA[chapId];
                if (!chap) return;
                const item = chap.items.find((x) => x.num === itemNum);
                if (!item) return;

                html += `
                    <div class="bookmark-item" onclick="window.app.jumpToBookmark('${chapId}', '${itemId}')">
                        <div class="bm-info">
                            <div class="bm-tag">${escapeHTML(chap.titleIndo)} — Doa ${item.num}</div>
                            <div class="bm-snippet-ar">${escapeHTML(item.arabic.slice(0, 60))}...</div>
                            <div class="bm-snippet-in">${escapeHTML(stripTags(item.translation || ''))}</div>
                        </div>
                        <button class="bm-remove-btn" title="Hapus" onclick="event.stopPropagation(); window.app.removeBookmarkFromModal('${itemId}')">
                            ${getTrashIcon()}
                        </button>
                    </div>
                `;
            });
        }

        elBookmarkList.innerHTML = html;
        elBookmarkModal.classList.add('open');
    }

    function closeBookmarkModal() {
        if (!elBookmarkModal) return;
        elBookmarkModal.classList.remove('open');
    }

    window.app.removeBookmarkFromModal = function (itemId) {
        window.app.toggleBookmark(itemId);
        openBookmarkModal(); // Refresh modal list
    };

    window.app.jumpToBookmark = function (chapterId, itemId) {
        closeBookmarkModal();
        if (STATE.activeChapter !== chapterId) {
            window.app.switchChapter(chapterId);
        }
        setTimeout(() => {
            const card = document.getElementById(`card-${itemId}`);
            if (card) {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                card.style.borderColor = 'var(--gold-dark)';
                card.style.boxShadow = '0 0 15px rgba(184, 147, 90, 0.4)';
                setTimeout(() => {
                    card.style.borderColor = '';
                    card.style.boxShadow = '';
                }, 2000);
            }
        }, 150);
    };

    // --- Share Logic ---
    window.app.shareDoa = function (chapterId, itemNum) {
        const chap = window.HIZIB_DATA[chapterId];
        if (!chap) return;
        const item = chap.items.find((x) => x.num === itemNum);
        if (!item) return;

        let shareText = `${item.arabic}\n\n`;
        if (item.latin) {
            shareText += `Bacaan Latin:\n${item.latin}\n\n`;
        }
        if (item.translation) {
            shareText += `Artinya:\n"${stripTags(item.translation)}"\n\n`;
        }
        if (item.reference) {
            shareText += `${item.reference}\n\n`;
        }
        shareText += `— Dikutip dari Doa Harian (${chap.titleIndo})`;

        if (navigator.share) {
            navigator.share({
                title: `${chap.titleIndo} - Doa ${item.num}`,
                text: shareText
            }).catch(() => {
                copyToClipboard(shareText);
            });
        } else {
            copyToClipboard(shareText);
        }
    };

    window.app.shareClosingDoa = function () {
        const arabic = 'وَآخِرُ دَعْوَانَا أَنِ الْحَمْدُ لِلَّهِ رَبِّ الْعٰلَمِيْنَ ۝';
        const latin = "Wa akhiru da'wana anil-hamdulillahi rabbil-'alamin.";
        const translation = "Dan penutup doa kami adalah: 'Segala puji bagi Allah, Tuhan semesta alam.'";
        const shareText = `${arabic}\n\nBacaan Latin:\n${latin}\n\nArtinya:\n"${translation}"\n\n(Doa Penutup — QS. Yunus: 10)\n\n— Dikutip dari Doa Harian`;

        if (navigator.share) {
            navigator.share({
                title: "Doa Penutup — Doa Harian",
                text: shareText
            }).catch(() => {
                copyToClipboard(shareText);
            });
        } else {
            copyToClipboard(shareText);
        }
    };

    function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                showToast('Teks doa disalin ke papan klip!');
            }).catch(() => {
                fallbackCopyText(text);
            });
        } else {
            fallbackCopyText(text);
        }
    }

    function fallbackCopyText(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            showToast('Teks doa disalin ke papan klip!');
        } catch (err) {
            showToast('Gagal menyalin teks');
        }
        document.body.removeChild(textarea);
    }

    // --- Toast Notification ---
    let toastTimeout;
    function showToast(message) {
        if (!elToast) return;
        elToast.textContent = message;
        elToast.classList.add('show');
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            elToast.classList.remove('show');
        }, 2200);
    }

    // --- Service Worker Registration ---
    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js', { scope: '/' }).then((reg) => {
                    console.log('Daily Du\'a SW registered:', reg.scope);
                }).catch((err) => {
                    console.log('Daily Du\'a SW registration failed:', err);
                });
            });
        }
    }

    // --- Helpers & SVG Icons ---
    function escapeHTML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function formatRichText(str) {
        if (!str) return '';
        return escapeHTML(str)
            .replace(/&lt;em&gt;/g, '<em>')
            .replace(/&lt;\/em&gt;/g, '</em>')
            .replace(/&lt;i&gt;/g, '<em>')
            .replace(/&lt;\/i&gt;/g, '</em>')
            .replace(/&lt;strong&gt;/g, '<strong>')
            .replace(/&lt;\/strong&gt;/g, '</strong>');
    }

    function stripTags(str) {
        if (!str) return '';
        return str.replace(/<\/?[^>]+(>|$)/g, '');
    }

    function getBookmarkOutlineIcon(size = 18) {
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`;
    }

    function getBookmarkFilledIcon(size = 18) {
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`;
    }

    function getShareIcon(size = 18) {
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>`;
    }

    function getEyeIcon(size = 16) {
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    }

    function getEyeOffIcon(size = 16) {
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
    }

    function getTrashIcon(size = 16) {
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`;
    }

    function getTextLatinIcon(size = 15) {
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"></polyline><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="20"></line></svg>`;
    }

    function getTextLatinOffIcon(size = 15) {
        return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="2" x2="22" y2="22"></line><polyline points="4 7 4 4 10 4"></polyline><line x1="14" y1="4" x2="20" y2="4"></line><line x1="20" y1="7" x2="20" y2="4"></line><line x1="9" y1="20" x2="15" y2="20"></line><line x1="12" y1="4" x2="12" y2="15"></line></svg>`;
    }

})();
