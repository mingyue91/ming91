(function() {
    'use strict';

    var copyIcon = '<span class="copy-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2"/></svg></span>';
    var checkIcon = '<span class="copy-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg></span>';

    function showToast(text) {
        var existing = document.querySelector('.copy-toast');
        if (existing) existing.remove();

        var toast = document.createElement('div');
        toast.className = 'copy-toast';
        toast.textContent = text;
        document.body.appendChild(toast);

        requestAnimationFrame(function() {
            toast.classList.add('show');
        });

        setTimeout(function() {
            toast.classList.remove('show');
            setTimeout(function() { toast.remove(); }, 300);
        }, 1800);
    }

    function enhanceCopyButtons() {
        if (!navigator.clipboard) return;

        var buttons = document.querySelectorAll('.copyCodeButton');
        buttons.forEach(function(btn) {
            if (btn.getAttribute('data-enhanced')) return;

            var text = btn.textContent.trim();

            btn.innerHTML = copyIcon + '<span class="copy-text">' + text + '</span>';
            btn.setAttribute('data-enhanced', 'true');

            var newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);

            var highlight = newBtn.closest('.highlight');
            if (!highlight) return;
            var codeBlock = highlight.querySelector('code[data-lang]');
            if (!codeBlock) return;

            newBtn.addEventListener('click', function() {
                var codeText = codeBlock.textContent || '';

                navigator.clipboard.writeText(codeText)
                    .then(function() {
                        newBtn.classList.add('copied');
                        newBtn.innerHTML = checkIcon + '<span class="copy-text">已复制</span>';
                        newBtn.setAttribute('aria-label', '代码已复制');
                        showToast('✅ 已复制');

                        setTimeout(function() {
                            newBtn.classList.remove('copied');
                            newBtn.innerHTML = copyIcon + '<span class="copy-text">' + text + '</span>';
                            newBtn.setAttribute('aria-label', '复制代码');
                        }, 2000);
                    })
                    .catch(function(err) {
                        console.error('复制失败:', err);
                        newBtn.innerHTML = copyIcon + '<span class="copy-text">失败</span>';

                        setTimeout(function() {
                            newBtn.innerHTML = copyIcon + '<span class="copy-text">' + text + '</span>';
                        }, 1500);
                    });
            });
        });
    }

    function init() {
        if (document.readyState === 'complete') {
            setTimeout(enhanceCopyButtons, 50);
        } else {
            window.addEventListener('load', function() {
                setTimeout(enhanceCopyButtons, 50);
            });
        }
    }

    init();
})();
