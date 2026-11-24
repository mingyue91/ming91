/**
 * Docker 学习路径：状态与纯逻辑
 * - XP / 等级 / 徽章 / 连续学习天数 / 星级 / 卡牌收集
 * - 状态保存在 localStorage，纯前端
 */

export const STORAGE_KEY = 'docker-course-v1';
export const QUIZ_BONUS_XP = 20;

export interface QuizQuestion {
    q: string;
    options: string[];
    answer: number;
    explain?: string;
}

export interface Lesson {
    id: string;
    title: string;
    xp: number;
    minutes: number;
    quiz?: QuizQuestion[];
    lab?: unknown;
}

export interface Chapter {
    id: string;
    title: string;
    icon?: string;
    lessons: Lesson[];
}

export interface Rank {
    name: string;
    xp: number;
    icon?: string;
}

export interface Badge {
    id: string;
    name: string;
    desc: string;
    icon: string;
}

export interface Curriculum {
    chapters: Chapter[];
    ranks: Rank[];
    badges: Badge[];
}

export interface LessonState {
    done?: boolean;
    quizBest?: number;
    day?: string;
    /** 终端通关星级 1-3；0 / 未设置表示没有终端成绩 */
    stars?: number;
}

export interface CardProgress {
    owned: Record<string, number>;
    packs: number;
    pity: number;
    fragments: number;
}

export interface State {
    lessons: Record<string, LessonState>;
    streak: { count: number; last: string };
    badges: string[];
    cards: CardProgress;
}

export function emptyState(): State {
    return {
        lessons: {},
        streak: { count: 0, last: '' },
        badges: [],
        cards: { owned: {}, packs: 0, pity: 0, fragments: 0 },
    };
}

export function emptyCardProgress(): CardProgress {
    return { owned: {}, packs: 0, pity: 0, fragments: 0 };
}

export function readCurriculum(): Curriculum | null {
    const el = document.getElementById('docker-course-data');
    if (!el) return null;
    try {
        return JSON.parse(el.textContent || '{}') as Curriculum;
    } catch (err) {
        console.error('[docker-course] 课程数据解析失败', err);
        return null;
    }
}

export function loadState(): State {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return emptyState();
        const parsed = JSON.parse(raw) as Partial<State>;
        const cards = parsed.cards || emptyCardProgress();
        return {
            lessons: parsed.lessons || {},
            streak: parsed.streak || { count: 0, last: '' },
            badges: Array.isArray(parsed.badges) ? parsed.badges : [],
            cards: {
                owned: cards.owned || {},
                packs: Number(cards.packs) || 0,
                pity: Number(cards.pity) || 0,
                fragments: Number(cards.fragments) || 0,
            },
        };
    } catch {
        return emptyState();
    }
}

export function saveState(state: State) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        /* 隐私模式下静默失败，仅本次会话有效 */
    }
}

export function todayKey(date = new Date()): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

export function previousDayKey(key: string): string {
    const date = new Date(`${key}T00:00:00`);
    date.setDate(date.getDate() - 1);
    return todayKey(date);
}

export function flattenLessons(cur: Curriculum): Lesson[] {
    const all: Lesson[] = [];
    cur.chapters.forEach(ch => ch.lessons.forEach(l => all.push(l)));
    return all;
}

export function lessonXp(lesson: Lesson, state: State): number {
    const st = state.lessons[lesson.id];
    if (!st) return 0;
    let xp = st.done ? lesson.xp : 0;
    if (st.quizBest === 100) xp += QUIZ_BONUS_XP;
    return xp;
}

export function totalXp(cur: Curriculum, state: State): number {
    return flattenLessons(cur).reduce((sum, l) => sum + lessonXp(l, state), 0);
}

export function currentRank(cur: Curriculum, xp: number): { rank: Rank; next?: Rank } {
    const ranks = [...cur.ranks].sort((a, b) => a.xp - b.xp);
    let rank = ranks[0];
    let next: Rank | undefined;
    for (const r of ranks) {
        if (xp >= r.xp) rank = r;
        else { next = r; break; }
    }
    return { rank, next };
}

export function ownedCardCount(state: State): number {
    return Object.keys(state.cards.owned).length;
}

export function threeStarCount(state: State): number {
    return Object.values(state.lessons).filter(l => l.stars === 3).length;
}

export function earnedBadges(cur: Curriculum, state: State): string[] {
    const ids = new Set<string>();
    const done = new Set(Object.keys(state.lessons).filter(id => state.lessons[id].done));

    if (done.size > 0) ids.add('first-step');

    cur.chapters.forEach((ch, index) => {
        if (ch.lessons.length && ch.lessons.every(l => done.has(l.id))) {
            ids.add(`chapter-${index + 1}`);
        }
    });

    if (Object.values(state.lessons).some(s => s.quizBest === 100)) ids.add('quiz-master');
    if (state.streak.count >= 3) ids.add('streak-3');

    if (ownedCardCount(state) >= 10) ids.add('card-collector');
    if (threeStarCount(state) >= 5) ids.add('terminal-ace');

    const total = flattenLessons(cur).length;
    if (total > 0 && done.size >= total) ids.add('all-clear');

    return [...ids];
}

export function touchStreak(state: State) {
    const today = todayKey();
    if (state.streak.last === today) return;
    if (state.streak.last && state.streak.last === previousDayKey(today)) {
        state.streak.count += 1;
    } else {
        state.streak.count = 1;
    }
    state.streak.last = today;
}

/** 保存状态并结算新徽章，返回新解锁的徽章 */
export function commit(cur: Curriculum, state: State): Badge[] {
    const earned = earnedBadges(cur, state);
    const newIds = earned.filter(id => !state.badges.includes(id));
    state.badges = earned;
    saveState(state);
    return cur.badges.filter(b => newIds.includes(b.id));
}

export const __stateInternals = {
    flattenLessons,
    lessonXp,
    totalXp,
    currentRank,
    earnedBadges,
    touchStreak,
};
