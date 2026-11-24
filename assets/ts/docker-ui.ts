/**
 * 课程通用 UI 小工具：Toast、彩纸、文案替换
 */

export function showToast(message: string, duration = 2400) {
    const old = document.querySelector('.course-toast');
    if (old) old.remove();

    const toast = document.createElement('div');
    toast.className = 'course-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));
    window.setTimeout(() => {
        toast.classList.remove('show');
        window.setTimeout(() => toast.remove(), 300);
    }, duration);
}

export function burstConfetti(count = 28) {
    const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];
    for (let i = 0; i < count; i++) {
        const bit = document.createElement('span');
        bit.className = 'course-confetti';
        bit.style.left = `${Math.random() * 100}vw`;
        bit.style.background = colors[i % colors.length];
        bit.style.animationDelay = `${Math.random() * 0.25}s`;
        bit.style.setProperty('--drift', `${(Math.random() - 0.5) * 120}px`);
        document.body.appendChild(bit);
        window.setTimeout(() => bit.remove(), 1600);
    }
}

export function celebrateBadges(badges: { icon: string; name: string }[]) {
    badges.forEach((badge, index) => {
        window.setTimeout(() => {
            showToast(`🏅 解锁徽章：${badge.icon} ${badge.name}`);
        }, index * 900);
    });
    if (badges.length) burstConfetti();
}

export function setText(selector: string, text: string) {
    const el = document.querySelector(selector);
    if (el) el.textContent = text;
}
