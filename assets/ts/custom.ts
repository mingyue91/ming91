/**
 * 站点自定义脚本（由主题 footer/components/script.html 自动加载）
 * - 代码块复制
 * - 长代码块折叠 / 展开
 * - Docker 学习路径游戏化逻辑
 */

import { initDockerCourse } from './docker-course';

const COPY_ICON =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2"/></svg>';

const CHECK_ICON =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>';

const CHEVRON_UP = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>';

const CHEVRON_DOWN = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';

function getCodeElement(wrapper: Element): HTMLElement | null {
    const codes = wrapper.querySelectorAll('code');
    if (!codes.length) return null;
    return codes[codes.length - 1] as HTMLElement;
}

function resetCopyButton(btn: HTMLButtonElement) {
    btn.classList.remove('copied');
    const icon = btn.querySelector('.copy-icon');
    const text = btn.querySelector('.copy-text');
    if (icon) icon.innerHTML = COPY_ICON;
    if (text) text.textContent = '复制';
    btn.setAttribute('aria-label', '复制代码');
}

async function copyCode(btn: HTMLButtonElement) {
    const wrapper = btn.closest('.code-block-wrapper');
    if (!wrapper) return;

    const codeEl = getCodeElement(wrapper);
    if (!codeEl) return;

    const text = (codeEl.innerText || codeEl.textContent || '').replace(/\n+$/, '');

    try {
        await navigator.clipboard.writeText(text);
        btn.classList.add('copied');
        const icon = btn.querySelector('.copy-icon');
        const label = btn.querySelector('.copy-text');
        if (icon) icon.innerHTML = CHECK_ICON;
        if (label) label.textContent = '已复制';
        btn.setAttribute('aria-label', '代码已复制');
        window.setTimeout(() => resetCopyButton(btn), 1800);
    } catch (err) {
        console.error('复制失败:', err);
    }
}

function toggleCode(btn: HTMLButtonElement) {
    const wrapper = btn.closest('.code-block-wrapper');
    const content = wrapper?.querySelector('.code-block-content');
    if (!content) return;

    const collapsed = content.classList.toggle('collapsed');
    const icon = btn.querySelector('.toggle-icon');
    const label = btn.querySelector('.toggle-text');
    if (icon) icon.innerHTML = collapsed ? CHEVRON_DOWN : CHEVRON_UP;
    if (label) label.textContent = collapsed ? '展开' : '折叠';
}

function init() {
    document.querySelectorAll<HTMLButtonElement>('.code-block-copy').forEach(btn => {
        btn.addEventListener('click', () => copyCode(btn));
    });

    document.querySelectorAll<HTMLButtonElement>('.code-block-toggle').forEach(btn => {
        btn.addEventListener('click', () => toggleCode(btn));
    });

    initDockerCourse();
}

if (document.readyState === 'complete') {
    init();
} else {
    window.addEventListener('load', () => window.setTimeout(init, 0));
}
