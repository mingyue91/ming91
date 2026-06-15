(function() {
    'use strict';

    var copyIcon = '<svg class="copy-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2"/></svg>';
    var checkIcon = '<svg class="copy-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>';

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

    function setupCodeCopy() {
        var highlights = document.querySelectorAll('.article-content div.highlight');
        var copyText = '复制';
        var copiedText = '已复制';

        if (!navigator.clipboard) {
            console.warn('Clipboard API not supported, copy button will not work.');
            return;
        }

        highlights.forEach(function(highlight) {
            if (highlight.querySelector('.copyCodeButton')) return;

            var copyButton = document.createElement('button');
            copyButton.innerHTML = copyIcon + '<span class="copy-text">' + copyText + '</span>';
            copyButton.classList.add('copyCodeButton');
            copyButton.setAttribute('aria-label', '复制代码');
            highlight.appendChild(copyButton);

            var codeBlock = highlight.querySelector('code[data-lang]');
            if (!codeBlock) return;

            copyButton.addEventListener('click', function() {
                var codeText = codeBlock.textContent || '';

                navigator.clipboard.writeText(codeText)
                    .then(function() {
                        copyButton.classList.add('copied');
                        copyButton.innerHTML = checkIcon + '<span class="copy-text">' + copiedText + '</span>';
                        copyButton.setAttribute('aria-label', '代码已复制');
                        showToast('✅ ' + copiedText);

                        setTimeout(function() {
                            copyButton.classList.remove('copied');
                            copyButton.innerHTML = copyIcon + '<span class="copy-text">' + copyText + '</span>';
                            copyButton.setAttribute('aria-label', '复制代码');
                        }, 2000);
                    })
                    .catch(function(err) {
                        console.error('复制失败:', err);
                        copyButton.innerHTML = copyIcon + '<span class="copy-text">失败</span>';

                        setTimeout(function() {
                            copyButton.innerHTML = copyIcon + '<span class="copy-text">' + copyText + '</span>';
                        }, 1500);
                    });
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupCodeCopy);
    } else {
        setupCodeCopy();
    }
})();
