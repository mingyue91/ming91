/**
 * Docker 学习路径：游戏化逻辑
 * - XP / 等级 / 徽章 / 连续学习天数
 * - 课程页进度、继续学习
 * - 关卡自测评分与完成
 * 状态保存在 localStorage，纯前端。
 */

const STORAGE_KEY = 'docker-course-v1';
const QUIZ_BONUS_XP = 20;

interface QuizQuestion {
    q: string;
    options: string[];
    answer: number;
    explain?: string;
}

interface Lesson {
    id: string;
    title: string;
    xp: number;
    minutes: number;
    quiz?: QuizQuestion[];
}

interface Chapter {
    id: string;
    title: string;
    icon?: string;
    lessons: Lesson[];
}

interface Rank {
    name: string;
    xp: number;
    icon?: string;
}

interface Badge {
    id: string;
    name: string;
    desc: string;
    icon: string;
}

interface Curriculum {
    chapters: Chapter[];
    ranks: Rank[];
    badges: Badge[];
}

interface LessonState {
    done?: boolean;
    quizBest?: number;
    day?: string;
}

interface State {
    lessons: Record<string, LessonState>;
    streak: { count: number; last: string };
    badges: string[];
}

function emptyState(): State {
    return { lessons: {}, streak: { count: 0, last: '' }, badges: [] };
}

function readCurriculum(): Curriculum | null {
    const el = document.getElementById('docker-course-data');
    if (!el) return null;
    try {
        return JSON.parse(el.textContent || '{}') as Curriculum;
    } catch (err) {
        console.error('[docker-course] 课程数据解析失败', err);
        return null;
    }
}

function loadState(): State {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return emptyState();
        const parsed = JSON.parse(raw) as State;
        return {
            lessons: parsed.lessons || {},
            streak: parsed.streak || { count: 0, last: '' },
            badges: Array.isArray(parsed.badges) ? parsed.badges : [],
        };
    } catch {
        return emptyState();
    }
}

function saveState(state: State) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        /* 隐私模式下静默失败，仅本次会话有效 */
    }
}

function todayKey(date = new Date()): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function previousDayKey(key: string): string {
    const date = new Date(`${key}T00:00:00`);
    date.setDate(date.getDate() - 1);
    return todayKey(date);
}

function flattenLessons(cur: Curriculum): Lesson[] {
    const all: Lesson[] = [];
    cur.chapters.forEach(ch => ch.lessons.forEach(l => all.push(l)));
    return all;
}

function lessonXp(lesson: Lesson, state: State): number {
    const st = state.lessons[lesson.id];
    if (!st) return 0;
    let xp = st.done ? lesson.xp : 0;
    if (st.quizBest === 100) xp += QUIZ_BONUS_XP;
    return xp;
}

function totalXp(cur: Curriculum, state: State): number {
    return flattenLessons(cur).reduce((sum, l) => sum + lessonXp(l, state), 0);
}

function currentRank(cur: Curriculum, xp: number): { rank: Rank; next?: Rank } {
    const ranks = [...cur.ranks].sort((a, b) => a.xp - b.xp);
    let rank = ranks[0];
    let next: Rank | undefined;
    for (const r of ranks) {
        if (xp >= r.xp) rank = r;
        else { next = r; break; }
    }
    return { rank, next };
}

function earnedBadges(cur: Curriculum, state: State): string[] {
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

    const total = flattenLessons(cur).length;
    if (total > 0 && done.size >= total) ids.add('all-clear');

    return [...ids];
}

function touchStreak(state: State) {
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
function commit(cur: Curriculum, state: State): Badge[] {
    const earned = earnedBadges(cur, state);
    const newIds = earned.filter(id => !state.badges.includes(id));
    state.badges = earned;
    saveState(state);
    return cur.badges.filter(b => newIds.includes(b.id));
}

function setText(selector: string, text: string) {
    const el = document.querySelector(selector);
    if (el) el.textContent = text;
}

function showToast(message: string) {
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
    }, 2200);
}

function burstConfetti() {
    const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6'];
    for (let i = 0; i < 28; i++) {
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

function celebrateNewBadges(badges: Badge[]) {
    badges.forEach((badge, index) => {
        window.setTimeout(() => {
            showToast(`🏅 解锁徽章：${badge.icon} ${badge.name}`);
        }, index * 900);
    });
    if (badges.length) burstConfetti();
}

/* ---------------- 课程首页 ---------------- */

function initHome(cur: Curriculum) {
    const state = loadState();
    const lessons = flattenLessons(cur);
    const total = lessons.length;
    const done = lessons.filter(l => state.lessons[l.id]?.done).length;
    const xp = totalXp(cur, state);
    const percent = total ? Math.round((done / total) * 100) : 0;
    const { rank, next } = currentRank(cur, xp);

    const ring = document.querySelector<HTMLElement>('[data-course-ring]');
    if (ring) ring.style.setProperty('--p', `${percent}%`);

    setText('[data-course-percent]', `${percent}%`);
    setText('[data-course-xp]', String(xp));
    setText('[data-course-done]', `${done}/${total}`);
    setText('[data-course-rank]', `${rank.icon || ''} ${rank.name}`.trim());
    setText('[data-course-streak]', `🔥 连续 ${state.streak.count} 天`);

    if (next) {
        setText('[data-course-next-rank]', `距离「${next.icon || ''} ${next.name}」还差 ${next.xp - xp} XP`);
    } else {
        setText('[data-course-next-rank]', '已达成最高等级，继续巩固吧 🚢');
    }

    // 关卡状态
    document.querySelectorAll<HTMLElement>('.course-lesson').forEach(item => {
        const id = item.dataset.lessonId;
        if (!id) return;
        const st = state.lessons[id];
        item.classList.toggle('is-done', Boolean(st?.done));
        const status = item.querySelector<HTMLElement>('.lesson-status');
        if (status) status.textContent = st?.done ? '✓' : '';
        if (st?.quizBest !== undefined) {
            const quizCount = item.querySelector<HTMLElement>('.lesson-quiz-count');
            if (quizCount) quizCount.textContent = `📝 最佳 ${st.quizBest} 分`;
        }
    });

    // 章节进度
    cur.chapters.forEach(ch => {
        const el = document.querySelector<HTMLElement>(`[data-chapter-progress="${ch.id}"]`);
        if (!el) return;
        const chDone = ch.lessons.filter(l => state.lessons[l.id]?.done).length;
        el.textContent = `${chDone}/${ch.lessons.length}`;
    });

    // 徽章
    document.querySelectorAll<HTMLElement>('.course-badge').forEach(el => {
        const id = el.dataset.badgeId;
        if (id) el.classList.toggle('is-earned', state.badges.includes(id));
    });

    // 继续学习
    const nextLesson = lessons.find(l => !state.lessons[l.id]?.done) || lessons[0];
    const continueBtn = document.querySelector<HTMLAnchorElement>('[data-course-continue]');
    if (continueBtn && nextLesson) {
        const anchor = document.querySelector<HTMLAnchorElement>(`.course-lesson[data-lesson-id="${nextLesson.id}"]`);
        if (anchor) continueBtn.href = anchor.href;
        const label = continueBtn.querySelector('span');
        if (label) label.textContent = done >= total ? '再复习一遍' : '继续学习';
    }

    // 重置
    document.querySelector<HTMLButtonElement>('[data-course-reset]')?.addEventListener('click', () => {
        if (!window.confirm('确定要清空本地学习进度吗？该操作不可恢复。')) return;
        saveState(emptyState());
        window.location.reload();
    });
}

/* ---------------- 关卡页 ---------------- */

function initLesson(cur: Curriculum) {
    const root = document.querySelector<HTMLElement>('[data-course-lesson]');
    if (!root) return;

    const state = loadState();
    const id = root.dataset.lessonId || '';
    const lesson = flattenLessons(cur).find(l => l.id === id);
    if (!lesson) return;

    const bonus = Number(root.dataset.quizBonus || QUIZ_BONUS_XP);
    const lessonState = () => (state.lessons[id] = state.lessons[id] || {});

    const completeBtn = root.querySelector<HTMLButtonElement>('[data-course-complete]');
    const finishHint = root.querySelector<HTMLElement>('[data-finish-hint]');
    const statusText = root.querySelector<HTMLElement>('[data-lesson-status]');

    const refreshLessonUi = () => {
        const st = state.lessons[id] || {};
        if (statusText) {
            statusText.textContent = st.done ? '已通关' : '未通关';
            statusText.classList.toggle('is-done', Boolean(st.done));
        }
        if (completeBtn) {
            if (st.done) {
                completeBtn.textContent = '✓ 已通关';
                completeBtn.disabled = true;
                completeBtn.classList.add('is-done');
            } else {
                completeBtn.textContent = `完成本关 · +${lesson.xp} XP`;
                completeBtn.disabled = false;
                completeBtn.classList.remove('is-done');
            }
        }
        if (finishHint) {
            if (st.done) {
                finishHint.textContent = st.quizBest === 100
                    ? `本关已拿满 ${lesson.xp + bonus} XP，去下一关吧！`
                    : `本关已获得 ${lesson.xp} XP；自测全对还能额外 +${bonus} XP。`;
            } else {
                finishHint.textContent = `完成本关即可获得 ${lesson.xp} XP；自测全对再额外 +${bonus} XP。`;
            }
        }
        const bestEl = root.querySelector<HTMLElement>('[data-quiz-best]');
        if (bestEl) {
            bestEl.textContent = st.quizBest !== undefined ? `历史最佳：${st.quizBest} 分` : '';
        }
    };

    // 完成本关
    completeBtn?.addEventListener('click', () => {
        const st = lessonState();
        if (st.done) return;
        st.done = true;
        st.day = todayKey();
        touchStreak(state);
        const newBadges = commit(cur, state);
        refreshLessonUi();
        showToast(`🎉 通关！+${lesson.xp} XP`);
        burstConfetti();
        celebrateNewBadges(newBadges);
    });

    // 自测
    const quizRoot = root.querySelector<HTMLElement>('[data-quiz]');
    if (quizRoot) {
        const questions = Array.from(quizRoot.querySelectorAll<HTMLElement>('.quiz-q'));
        const submitBtn = quizRoot.querySelector<HTMLButtonElement>('[data-quiz-submit]');
        const resultEl = quizRoot.querySelector<HTMLElement>('[data-quiz-result]');
        let graded = false;

        const resetQuizUi = () => {
            questions.forEach(q => {
                q.classList.remove('is-correct', 'is-wrong');
                q.querySelectorAll('.quiz-opt').forEach(o => {
                    o.classList.remove('is-answer', 'is-chosen-wrong');
                });
                q.querySelectorAll<HTMLInputElement>('input[type="radio"]').forEach(input => {
                    input.disabled = false;
                    input.checked = false;
                });
                const explain = q.querySelector<HTMLElement>('.quiz-explain');
                if (explain) explain.hidden = true;
            });
            if (resultEl) resultEl.textContent = '';
            if (submitBtn) submitBtn.textContent = '提交答案';
            graded = false;
        };

        const gradeQuiz = () => {
            let correct = 0;
            let answered = 0;

            questions.forEach(q => {
                const answer = Number(q.dataset.answer);
                const inputs = Array.from(q.querySelectorAll<HTMLInputElement>('input[type="radio"]'));
                const selected = inputs.find(input => input.checked);
                const explain = q.querySelector<HTMLElement>('.quiz-explain');

                if (selected) answered++;

                q.querySelectorAll<HTMLElement>('.quiz-opt').forEach(label => {
                    const input = label.querySelector<HTMLInputElement>('input');
                    if (!input) return;
                    if (Number(input.value) === answer) label.classList.add('is-answer');
                });

                if (selected) {
                    if (Number(selected.value) === answer) {
                        correct++;
                        q.classList.add('is-correct');
                    } else {
                        q.classList.add('is-wrong');
                        selected.closest('.quiz-opt')?.classList.add('is-chosen-wrong');
                    }
                }

                inputs.forEach(input => { input.disabled = true; });
                if (explain) explain.hidden = false;
            });

            const complete = answered === questions.length;
            const score = questions.length ? Math.round((correct / questions.length) * 100) : 0;
            const isPerfect = complete && correct === questions.length;

            let newBadges: Badge[] = [];

            if (complete) {
                const st = lessonState();
                const prevBest = st.quizBest ?? 0;
                if (score > prevBest) st.quizBest = score;
                if (isPerfect && prevBest < 100) {
                    st.quizBest = 100;
                    showToast(`🎯 满分通关！+${bonus} XP`);
                }
                newBadges = commit(cur, state);
                refreshLessonUi();
            }

            if (resultEl) {
                resultEl.textContent = complete
                    ? `得分 ${correct}/${questions.length} · ${score} 分${isPerfect ? '，全对！' : '，看看解析再试试'}`
                    : `还有 ${questions.length - answered} 题未作答，先选完再提交吧（本次不计成绩）。`;
                resultEl.classList.toggle('is-perfect', isPerfect);
            }

            if (submitBtn) submitBtn.textContent = '再测一次';
            graded = true;
            celebrateNewBadges(newBadges);
        };

        submitBtn?.addEventListener('click', () => {
            if (graded) {
                resetQuizUi();
                return;
            }
            gradeQuiz();
        });
    }

    refreshLessonUi();
}

/* ---------------- 入口 ---------------- */

export function initDockerCourse() {
    const cur = readCurriculum();
    if (!cur) return;

    if (document.querySelector('[data-course-home]')) {
        initHome(cur);
    } else if (document.querySelector('[data-course-lesson]')) {
        initLesson(cur);
    }
}

/**
 * 纯函数出口，便于自动化测试（不影响页面运行时）
 */
export const __courseInternals = {
    emptyState,
    loadState,
    todayKey,
    previousDayKey,
    flattenLessons,
    lessonXp,
    totalXp,
    currentRank,
    earnedBadges,
    touchStreak,
};
