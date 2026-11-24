/**
 * Docker 学习路径：页面逻辑
 * - 课程首页：进度、等级、星级、卡牌收集
 * - 关卡页：终端任务 + 自测 + 结算（XP / 星级 / 掉卡）
 * - 图鉴页：由 docker-cards.ts 接管
 */

import { initLab, type LabApi } from './docker-lab';
import { addCard, initCardsPage, lessonDrop, packsForStars, readCardsData, revealCard, type CardsData } from './docker-cards';
import {
    QUIZ_BONUS_XP,
    commit,
    currentRank,
    flattenLessons,
    lessonXp,
    loadState,
    readCurriculum,
    saveState,
    todayKey,
    totalXp,
    touchStreak,
    type Badge,
    type Curriculum,
    type Lesson,
} from './docker-state';
import { burstConfetti, celebrateBadges, setText as setTextSafe, showToast } from './docker-ui';
import type { LabSpec } from './docker-sim';

function readLabs(): Record<string, LabSpec> {
    const el = document.getElementById('docker-labs-data');
    if (!el) return {};
    try {
        return JSON.parse(el.textContent || '{}') as Record<string, LabSpec>;
    } catch {
        return {};
    }
}

function starText(stars: number): string {
    if (!stars) return '';
    return '★'.repeat(stars) + '☆'.repeat(3 - stars);
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

    setTextSafe('[data-course-percent]', `${percent}%`);
    setTextSafe('[data-course-xp]', String(xp));
    setTextSafe('[data-course-done]', `${done}/${total}`);
    setTextSafe('[data-course-rank]', `${rank.icon || ''} ${rank.name}`.trim());
    setTextSafe('[data-course-streak]', `🔥 连续 ${state.streak.count} 天`);

    const cardsData = readCardsData();
    const ownedCount = Object.keys(state.cards.owned).length;
    if (cardsData) {
        setTextSafe('[data-course-cards]', `${ownedCount}/${cardsData.items.length}`);
    }
    setTextSafe('[data-course-packs]', String(state.cards.packs));

    if (next) {
        setTextSafe('[data-course-next-rank]', `距离「${next.icon || ''} ${next.name}」还差 ${next.xp - xp} XP`);
    } else {
        setTextSafe('[data-course-next-rank]', '已达成最高等级，继续巩固吧 🚢');
    }

    // 关卡状态
    document.querySelectorAll<HTMLElement>('.course-lesson').forEach(item => {
        const id = item.dataset.lessonId;
        if (!id) return;
        const st = state.lessons[id];
        item.classList.toggle('is-done', Boolean(st?.done));
        const status = item.querySelector<HTMLElement>('.lesson-status');
        if (status) status.textContent = st?.done ? '✓' : '';
        const stars = item.querySelector<HTMLElement>('.lesson-stars');
        if (stars && st?.stars) stars.textContent = starText(st.stars);
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
        if (!window.confirm('确定要清空本地学习进度（含卡牌与星级）吗？该操作不可恢复。')) return;
        saveState({
            lessons: {},
            streak: { count: 0, last: '' },
            badges: [],
            cards: { owned: {}, packs: 0, pity: 0, fragments: 0 },
        });
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
    const starsEl = root.querySelector<HTMLElement>('[data-lesson-stars]');

    const labs = readLabs();
    const labSpec = labs[id];
    const cardsData: CardsData | null = readCardsData();

    let labApi: LabApi | null = null;

    const labResult = () => (labApi ? labApi.getResult() : { passed: true, stars: 0, steps: 0, hints: 0, referenceSteps: 0 });

    const refreshLessonUi = () => {
        const st = state.lessons[id] || {};
        const result = labResult();
        const quizFast = st.quizBest === 100;
        const ready = result.passed || quizFast;

        if (statusText) {
            statusText.textContent = st.done ? '已通关' : '未通关';
            statusText.classList.toggle('is-done', Boolean(st.done));
        }
        if (starsEl) {
            const stars = st.stars || 0;
            starsEl.textContent = stars ? starText(stars) : '';
            starsEl.classList.toggle('is-empty', !stars);
        }
        if (completeBtn) {
            completeBtn.classList.remove('is-done');
            if (st.done) {
                if (result.passed && result.stars > (st.stars || 0)) {
                    completeBtn.textContent = `刷新星级 · ${starText(result.stars)}`;
                    completeBtn.disabled = false;
                } else {
                    completeBtn.textContent = `✓ 已通关${st.stars ? ` · ${starText(st.stars)}` : ''}`;
                    completeBtn.disabled = true;
                    completeBtn.classList.add('is-done');
                }
            } else if (result.passed) {
                completeBtn.textContent = `结算本关 · +${lesson.xp} XP${result.stars ? ` · ${starText(result.stars)}` : ''}`;
                completeBtn.disabled = false;
            } else if (quizFast) {
                completeBtn.textContent = `自测速通 · +${lesson.xp} XP`;
                completeBtn.disabled = false;
            } else {
                completeBtn.textContent = '完成终端任务或自测满分后结算';
                completeBtn.disabled = true;
            }
        }
        if (finishHint) {
            if (st.done) {
                finishHint.textContent = st.stars
                    ? `本关 ${starText(st.stars)} 通关，获得 ${lesson.xp} XP${st.quizBest === 100 ? ` + ${bonus} XP 自测奖励` : ''}。`
                    : `本关已通关；重玩终端并达成三星可以刷新星级。`;
            } else if (result.passed) {
                finishHint.textContent = `任务完成！结算可得 ${lesson.xp} XP；提示越少、步数越少，星级越高。`;
            } else if (quizFast) {
                finishHint.textContent = `自测满分，可以直接速通结算；想拿星级和卡包就去完成终端任务。`;
            } else {
                finishHint.textContent = `完成左侧终端任务，或把自测做到满分，即可结算。自测全对额外 +${bonus} XP。`;
            }
        }
        const bestEl = root.querySelector<HTMLElement>('[data-quiz-best]');
        if (bestEl) {
            bestEl.textContent = st.quizBest !== undefined ? `历史最佳：${st.quizBest} 分` : '';
        }
    };

    if (labSpec) {
        labApi = initLab({
            lab: labSpec,
            onChange: () => refreshLessonUi(),
        });
    }

    const grantRewards = (stars: number) => {
        if (!cardsData) return;
        const theme = lessonDrop(cardsData, id, state);
        let packs = packsForStars(stars);
        if (state.lessons[id]?.quizBest === 100) packs += 1;

        if (theme) addCard(state, cardsData, theme);
        state.cards.packs += packs;
        saveState(state);

        const bits: string[] = [];
        if (theme) bits.push(`获得卡牌「${theme.name}」`);
        if (packs) bits.push(`卡包 +${packs}`);
        if (bits.length) showToast(bits.join(' · '));

        if (theme) {
            void revealCard(theme, { subtitle: '首次通关掉落' });
        }
    };

    // 结算
    completeBtn?.addEventListener('click', () => {
        const st = lessonState();
        const result = labResult();
        const newBadges: Badge[] = [];

        if (st.done) {
            if (result.passed && result.stars > (st.stars || 0)) {
                st.stars = result.stars;
                saveState(state);
                showToast(`星级刷新为 ${starText(result.stars)} ✨`);
                refreshLessonUi();
            }
            return;
        }

        st.done = true;
        st.day = todayKey();
        if (result.passed && result.stars) st.stars = result.stars;
        touchStreak(state);
        newBadges.push(...commit(cur, state));

        const stars = st.stars || 0;
        grantRewards(stars);
        refreshLessonUi();
        showToast(`🎉 通关！+${lesson.xp} XP${stars ? ` · ${starText(stars)}` : ''}`);
        burstConfetti();
        celebrateBadges(newBadges);
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
                    showToast(`🎯 自测满分！+${bonus} XP`);
                    if (cardsData) {
                        state.cards.packs += 1;
                        saveState(state);
                    }
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
            celebrateBadges(newBadges);
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
    if (initCardsPage()) return;

    const cur = readCurriculum();
    if (!cur) return;

    if (document.querySelector('[data-course-home]')) {
        initHome(cur);
    } else if (document.querySelector('[data-course-lesson]')) {
        initLesson(cur);
    }
}

export const __courseInternals = {
    loadState,
    flattenLessons,
    totalXp,
    currentRank,
    lessonXp,
    starText,
};
