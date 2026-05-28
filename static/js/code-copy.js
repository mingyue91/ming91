(function() {
    'use strict';
    
    function setupCodeCopy() {
        const highlights = document.querySelectorAll('.article-content div.highlight');
        const copyText = '复制';
        const copiedText = '已复制!';

        if (!navigator.clipboard) {
            console.warn('Clipboard API not supported, copy button will not work.');
            return;
        }

        highlights.forEach(function(highlight) {
            if (highlight.querySelector('.copyCodeButton')) return;

            const copyButton = document.createElement('button');
            copyButton.innerHTML = '<span class="copy-icon">📋</span><span class="copy-text">' + copyText + '</span>';
            copyButton.classList.add('copyCodeButton');
            copyButton.setAttribute('aria-label', '复制代码');
            highlight.appendChild(copyButton);

            const codeBlock = highlight.querySelector('code[data-lang]');
            if (!codeBlock) return;

            copyButton.addEventListener('click', function() {
                const codeText = codeBlock.textContent || '';
                
                navigator.clipboard.writeText(codeText)
                    .then(function() {
                        copyButton.classList.add('copied');
                        copyButton.innerHTML = '<span class="copy-icon">✨</span><span class="copy-text">' + copiedText + '</span>';
                        copyButton.setAttribute('aria-label', '代码已复制');

                        setTimeout(function() {
                            copyButton.classList.remove('copied');
                            copyButton.innerHTML = '<span class="copy-icon">📋</span><span class="copy-text">' + copyText + '</span>';
                            copyButton.setAttribute('aria-label', '复制代码');
                        }, 2000);
                    })
                    .catch(function(err) {
                        console.error('复制失败:', err);
                        copyButton.innerHTML = '<span class="copy-icon">❌</span><span class="copy-text">失败</span>';
                        
                        setTimeout(function() {
                            copyButton.innerHTML = '<span class="copy-icon">📋</span><span class="copy-text">' + copyText + '</span>';
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
