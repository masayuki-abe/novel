document.addEventListener('DOMContentLoaded', () => {
    console.log("JSの実行を開始しました");

    // --- 1. 要素の取得チェック ---
    const SCROLL_KEY = "viewer_scroll_pos";
    const viewer = document.querySelector('.viewer');
    const pages = document.querySelectorAll('.page');
    const saveBtn = document.getElementById('saveScrollBtn');
    const indexBtn = document.getElementById('indexBtn');
    const sectionTitle = document.querySelector('.section-title');

    console.log("要素取得結果:", {
        viewer: !!viewer,
        pagesCount: pages.length,
        sectionTitle: !!sectionTitle
    });

    if (!viewer || pages.length === 0) {
        console.error("必須要素が見つかりません。中断します。");
        return;
    }

    // --- 2. ブラウザ独自のスクロール復元無効化 ---
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }

    // --- 3. しおりの復元処理 ---
    const savedX = localStorage.getItem(SCROLL_KEY);
    if (savedX !== null) {
        const targetX = parseFloat(savedX);
        window.addEventListener('load', () => {
            let attempts = 0;
            const tryScroll = () => {
                viewer.scrollLeft = targetX;
                if (Math.abs(viewer.scrollLeft - targetX) < 10 || attempts > 20) {
                    console.log(`復元完了: ${viewer.scrollLeft}`);
                } else {
                    attempts++;
                    requestAnimationFrame(tryScroll);
                }
            };
            tryScroll();
        });
    }

    // --- 4. 保存処理 ---
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            localStorage.setItem(SCROLL_KEY, viewer.scrollLeft);
            alert("位置を保存しました");
        });
    }

    // --- 5. 目次関連（省略せずに維持） ---
    const closeModal = () => {
        const modal = document.getElementById('indexModal');
        if (modal) modal.classList.remove('is-show');
    };

    const createIndexModal = () => {
        const modal = document.createElement('div');
        modal.id = 'indexModal';
        modal.className = 'index-modal';
        let listItems = '';
        pages.forEach((page) => {
            const h2 = page.querySelector('.page-title');
            if (h2) {
                listItems += `<li><button class="index-link" data-target="${page.id}">${h2.textContent}</button></li>`;
            }
        });
        modal.innerHTML = `<div class="index-content"><h3>目次</h3><ul class="index-list">${listItems}</ul><button id="closeIndexBtn" class="close-btn">閉じる</button></div>`;
        document.body.appendChild(modal);
        modal.querySelectorAll('.index-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const targetEl = document.getElementById(e.target.getAttribute('data-target'));
                if (targetEl) {
                    const targetRightPos = targetEl.offsetLeft + targetEl.offsetWidth - viewer.clientWidth;
                    viewer.scrollTo({ left: targetRightPos, behavior: 'smooth' });
                    closeModal();
                }
            });
        });
        modal.querySelector('#closeIndexBtn').addEventListener('click', closeModal);
    };

    if (indexBtn) {
        indexBtn.addEventListener('click', () => {
            if (!document.getElementById('indexModal')) createIndexModal();
            document.getElementById('indexModal').classList.add('is-show');
        });
    }

    // --- 6. 【修正版】現在のセクションタイトル表示 (Intersection Observer) ---
    // root を viewer から null (画面全体) に変更し、判定を確実にします
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0 // 1ピクセルでも入ったら発火
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // デバッグログ：すべての交差イベントを表示
            console.log(`交差イベント発生: ${entry.target.id} | 入ったか: ${entry.isIntersecting}`);

            if (entry.isIntersecting) {
                const h2 = entry.target.querySelector('h2');
                if (h2 && sectionTitle) {
                    sectionTitle.textContent = h2.textContent;
                    console.log("タイトルを更新:", h2.textContent);
                }
            }
        });
    }, observerOptions);

    pages.forEach(page => {
        observer.observe(page);
    });
});