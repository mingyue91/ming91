/**
 * Docker 知识卡牌：掉落、抽卡、图鉴与记忆闪卡
 */

import { commit, loadState, readCurriculum, saveState, type State } from './docker-state';
import { burstConfetti, celebrateBadges, showToast } from './docker-ui';

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface CardDef {
    id: string;
    name: string;
    category: string;
    rarity: Rarity;
    icon: string;
    summary: string;
    command: string;
    lesson: string;
}

export interface PackConfig {
    weights: Record<Rarity, number>;
    pity: number;
    fragmentsPerDuplicate: number;
    fragmentsForCard: number;
}

export interface CardsData {
    packs: PackConfig;
    items: CardDef[];
}

export const CATEGORY_LABELS: Record<string, string> = {
    image: '镜像',
    container: '容器',
    network: '网络',
    storage: '存储',
    compose: '编排',
    security: '安全',
};

export const RARITY_LABELS: Record<Rarity, string> = {
    common: '普通',
    rare: '稀有',
    epic: '史诗',
    legendary: '传说',
};

const RARITY_ORDER: Rarity[] = ['common', 'rare', 'epic', 'legendary'];

export function readCardsData(): CardsData | null {
    const el = document.getElementById('docker-cards-data');
    if (!el) return null;
    try {
        const data = JSON.parse(el.textContent || '{}') as CardsData;
        if (!data.items || !data.packs) return null;
        return data;
    } catch (err) {
        console.error('[docker-cards] 卡牌数据解析失败', err);
        return null;
    }
}

function pickRarity(state: State, config: PackConfig): Rarity {
    const pityLimit = config.pity || 10;
    if (state.cards.pity >= pityLimit - 1) {
        return Math.random() < 0.1 ? 'legendary' : 'epic';
    }
    const weights = config.weights || { common: 60, rare: 30, epic: 9, legendary: 1 };
    const total = RARITY_ORDER.reduce((sum, r) => sum + (weights[r] || 0), 0) || 1;
    let roll = Math.random() * total;
    for (const rarity of RARITY_ORDER) {
        roll -= weights[rarity] || 0;
        if (roll <= 0) return rarity;
    }
    return 'common';
}

function randomOf<T>(list: T[]): T {
    return list[Math.floor(Math.random() * list.length)];
}

/** 把卡牌放进收藏，重复则转碎片；返回是否重复 */
export function addCard(state: State, data: CardsData, card: CardDef): boolean {
    const owned = state.cards.owned[card.id] || 0;
    const duplicate = owned > 0;
    state.cards.owned[card.id] = owned + 1;
    if (duplicate) {
        state.cards.fragments += data.packs.fragmentsPerDuplicate || 1;
    }
    return duplicate;
}

/** 开一个卡包：优先给未拥有的卡，史诗有保底 */
export function openPack(state: State, data: CardsData): { card: CardDef; duplicate: boolean; rarity: Rarity } | null {
    if (state.cards.packs <= 0) return null;
    state.cards.packs -= 1;

    const rarity = pickRarity(state, data.packs);
    const owned = (id: string) => Boolean(state.cards.owned[id]);

    let pool = data.items.filter(card => card.rarity === rarity && !owned(card.id));
    if (!pool.length) {
        // 该稀有度已经集齐，按稀有度从高到低找任何未拥有的卡
        const ordered = [...data.items].filter(card => !owned(card.id))
            .sort((a, b) => RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity));
        pool = ordered.length ? [ordered[0]] : [];
    }
    if (!pool.length) {
        // 全部集齐：随机给一张重复卡
        pool = data.items.filter(card => card.rarity === rarity);
    }

    const card = pool.length ? randomOf(pool) : randomOf(data.items);
    const duplicate = addCard(state, data, card);

    state.cards.pity = rarity === 'epic' || rarity === 'legendary' ? 0 : state.cards.pity + 1;
    return { card, duplicate, rarity };
}

/** 碎片合成：随机获得一张未拥有的卡 */
export function composeFragments(state: State, data: CardsData): CardDef | null {
    const cost = data.packs.fragmentsForCard || 5;
    if (state.cards.fragments < cost) return null;
    const unowned = data.items.filter(card => !state.cards.owned[card.id]);
    if (!unowned.length) return null;
    state.cards.fragments -= cost;
    const card = randomOf(unowned);
    addCard(state, data, card);
    return card;
}

/** 首次通关某关时掉落的主题卡（该关尚未拥有的第一张） */
export function lessonDrop(data: CardsData, lessonId: string, state: State): CardDef | null {
    const pool = data.items.filter(card => card.lesson === lessonId && !state.cards.owned[card.id]);
    return pool.length ? pool[0] : null;
}

/** 根据星级决定额外卡包数量 */
export function packsForStars(stars: number): number {
    return stars >= 3 ? 1 : 0;
}

/** 收集卡牌后同步徽章（卡牌页没有课程首页那套刷新逻辑） */
function syncBadges(state: State) {
    const cur = readCurriculum();
    if (!cur) return;
    const unlocked = commit(cur, state);
    if (unlocked.length) celebrateBadges(unlocked);
}

/* ---------------- 展示 ---------------- */

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
    const node = document.createElement(tag);
    node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

export interface RevealOptions {
    subtitle?: string;
    readOnly?: boolean;
}

/** 全屏翻牌展示，返回 Promise 以便结算流程等待 */
export function revealCard(card: CardDef, options: RevealOptions = {}): Promise<void> {
    return new Promise(resolve => {
        const overlay = el('div', 'card-reveal');
        const inner = el('div', `card-reveal-inner rarity-${card.rarity}`);

        const closeBtn = el('button', 'card-reveal-close', '×');
        closeBtn.type = 'button';
        closeBtn.setAttribute('aria-label', '关闭');

        const rarity = el('span', `card-rarity rarity-${card.rarity}`, RARITY_LABELS[card.rarity]);
        const icon = el('span', 'card-reveal-icon', card.icon);
        const name = el('h3', 'card-reveal-name', card.name);
        const command = el('code', 'card-reveal-command', card.command);
        const summary = el('p', 'card-reveal-summary', card.summary);
        const from = el('p', 'card-reveal-from', options.subtitle || '');
        const ok = el('button', 'card-reveal-ok', options.readOnly ? '关闭' : '收入图鉴 ✨');
        ok.type = 'button';

        const badge = el('span', 'card-reveal-badge', 'NEW');
        if (!options.readOnly) badge.classList.add('is-visible');

        inner.append(closeBtn, rarity, icon, name, command, summary, from, ok, badge);
        overlay.appendChild(inner);
        document.body.appendChild(overlay);

        const close = () => {
            overlay.classList.remove('is-open');
            document.removeEventListener('keydown', onKey);
            window.setTimeout(() => {
                overlay.remove();
                resolve();
            }, 220);
        };
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') close();
        };

        closeBtn.addEventListener('click', close);
        ok.addEventListener('click', close);
        overlay.addEventListener('click', event => {
            if (event.target === overlay) close();
        });
        document.addEventListener('keydown', onKey);

        requestAnimationFrame(() => {
            overlay.classList.add('is-open');
            burstConfetti(18);
        });
    });
}

/* ---------------- 图鉴页 ---------------- */

export function initCardsPage(): boolean {
    const root = document.querySelector<HTMLElement>('[data-cards-page]');
    if (!root) return false;

    const data = readCardsData();
    if (!data) return false;

    const state = loadState();
    const grid = root.querySelector<HTMLElement>('[data-card-grid]');
    const countEl = root.querySelector<HTMLElement>('[data-card-count]');
    const totalEl = root.querySelector<HTMLElement>('[data-card-total]');
    const packsEl = root.querySelector<HTMLElement>('[data-card-packs]');
    const fragmentsEl = root.querySelector<HTMLElement>('[data-card-fragments]');
    const progressEl = root.querySelector<HTMLElement>('[data-card-progress]');
    const packBtn = root.querySelector<HTMLButtonElement>('[data-card-pack]');
    const composeBtn = root.querySelector<HTMLButtonElement>('[data-card-compose]');
    const packHint = root.querySelector<HTMLElement>('[data-card-pack-hint]');

    const total = data.items.length;
    if (totalEl) totalEl.textContent = String(total);

    const render = () => {
        const ownedCount = Object.keys(state.cards.owned).length;
        if (countEl) countEl.textContent = String(ownedCount);
        if (packsEl) packsEl.textContent = String(state.cards.packs);
        if (fragmentsEl) fragmentsEl.textContent = `${state.cards.fragments}/${data.packs.fragmentsForCard}`;
        if (progressEl) progressEl.style.width = `${total ? Math.round((ownedCount / total) * 100) : 0}%`;

        if (packBtn) {
            packBtn.textContent = state.cards.packs > 0 ? `🎁 开卡包（${state.cards.packs}）` : '🎁 开卡包';
            packBtn.classList.toggle('is-empty', state.cards.packs <= 0);
        }
        if (composeBtn) {
            const canCompose = state.cards.fragments >= data.packs.fragmentsForCard;
            composeBtn.disabled = !canCompose;
            composeBtn.textContent = `🧩 合成（${data.packs.fragmentsForCard} 碎片）`;
        }
        if (packHint) {
            packHint.textContent = state.cards.packs > 0
                ? `还有 ${state.cards.packs} 个卡包待开启`
                : '通关（2★ 以上）或自测满分可获得卡包';
        }

        if (!grid) return;
        grid.innerHTML = '';
        const categories = Object.keys(CATEGORY_LABELS).filter(cat => data.items.some(card => card.category === cat));
        categories.forEach(category => {
            const section = el('section', 'card-category');
            const title = el('h2', 'card-category-title');
            const cardsInCategory = data.items.filter(card => card.category === category);
            const ownedInCategory = cardsInCategory.filter(card => state.cards.owned[card.id]).length;
            title.textContent = `${CATEGORY_LABELS[category]} · ${ownedInCategory}/${cardsInCategory.length}`;
            const list = el('div', 'card-grid');
            cardsInCategory.forEach(card => {
                const owned = Boolean(state.cards.owned[card.id]);
                const tile = el('button', `card-tile rarity-${card.rarity}${owned ? ' is-owned' : ' is-locked'}`);
                tile.type = 'button';
                tile.dataset.cardId = card.id;

                const icon = el('span', 'card-tile-icon', owned ? card.icon : '❔');
                const name = el('span', 'card-tile-name', owned ? card.name : '未获得');
                const rarity = el('span', `card-tile-rarity rarity-${card.rarity}`, RARITY_LABELS[card.rarity]);
                const count = el('span', 'card-tile-count', owned ? (state.cards.owned[card.id] > 1 ? `×${state.cards.owned[card.id]}` : '') : '🔒');

                tile.append(icon, name, rarity, count);
                if (owned) {
                    tile.addEventListener('click', () => {
                        void revealCard(card, { subtitle: '已收入图鉴', readOnly: true });
                    });
                }
                list.appendChild(tile);
            });
            section.append(title, list);
            grid.appendChild(section);
        });
    };

    packBtn?.addEventListener('click', () => {
        if (state.cards.packs <= 0) {
            showToast('还没有卡包：通关（2★ 以上）或自测满分可以获得');
            return;
        }
        const result = openPack(state, data);
        if (!result) return;
        saveState(state);
        syncBadges(state);
        render();
        void revealCard(result.card, { subtitle: `卡包开出 · ${RARITY_LABELS[result.rarity]}` }).then(() => {
            if (result.duplicate) showToast('重复卡已转换为碎片 🧩 +1');
        });
    });

    composeBtn?.addEventListener('click', () => {
        const card = composeFragments(state, data);
        if (!card) {
            showToast('碎片不足，或图鉴已经集齐');
            return;
        }
        saveState(state);
        syncBadges(state);
        render();
        void revealCard(card, { subtitle: '碎片合成' });
    });

    /* ---- 记忆闪卡 ---- */
    const reviewStart = root.querySelector<HTMLButtonElement>('[data-review-start]');
    const reviewBoard = root.querySelector<HTMLElement>('[data-review-board]');
    const reviewCard = root.querySelector<HTMLElement>('[data-review-card]');
    const reviewFront = root.querySelector<HTMLElement>('[data-review-front]');
    const reviewBack = root.querySelector<HTMLElement>('[data-review-back]');
    const reviewNext = root.querySelector<HTMLButtonElement>('[data-review-next]');
    const reviewExit = root.querySelector<HTMLButtonElement>('[data-review-exit]');
    const reviewProgress = root.querySelector<HTMLElement>('[data-review-progress]');

    let queue: CardDef[] = [];
    let reviewIndex = 0;

    const renderReview = () => {
        if (!reviewCard || !reviewFront || !reviewBack) return;
        const card = queue[reviewIndex];
        if (!card) return;
        reviewCard.classList.remove('is-flipped');
        reviewFront.innerHTML = '';
        reviewFront.append(
            el('span', 'review-icon', card.icon),
            el('strong', 'review-name', card.name),
            el('code', 'review-command', card.command),
            el('span', 'review-tip', '点击卡片翻面'),
        );
        reviewBack.innerHTML = '';
        reviewBack.append(
            el('p', 'review-summary', card.summary),
            el('span', `review-rarity rarity-${card.rarity}`, RARITY_LABELS[card.rarity]),
        );
        if (reviewProgress) reviewProgress.textContent = `${reviewIndex + 1}/${queue.length}`;
        if (reviewNext) reviewNext.textContent = reviewIndex + 1 >= queue.length ? '完成复习 ✓' : '下一张 →';
    };

    reviewStart?.addEventListener('click', () => {
        const owned = data.items.filter(card => state.cards.owned[card.id]);
        if (!owned.length) {
            showToast('先收集几张卡再来复习吧');
            return;
        }
        queue = [...owned].sort(() => Math.random() - 0.5).slice(0, 5);
        reviewIndex = 0;
        if (reviewBoard) reviewBoard.hidden = false;
        if (reviewStart) reviewStart.disabled = true;
        renderReview();
    });

    reviewCard?.addEventListener('click', () => {
        reviewCard.classList.toggle('is-flipped');
    });

    reviewNext?.addEventListener('click', () => {
        if (reviewIndex + 1 >= queue.length) {
            if (reviewBoard) reviewBoard.hidden = true;
            if (reviewStart) reviewStart.disabled = false;
            showToast('复习完成，记忆 +1 🧠');
            return;
        }
        reviewIndex++;
        renderReview();
    });

    reviewExit?.addEventListener('click', () => {
        if (reviewBoard) reviewBoard.hidden = true;
        if (reviewStart) reviewStart.disabled = false;
    });

    render();
    return true;
}
