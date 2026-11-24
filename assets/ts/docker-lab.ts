/**
 * 关卡终端界面
 * - 把 docker-sim 的输出渲染到页面
 * - 任务清单自动打勾、提示、步数统计、历史命令
 */

import { allDone, createSimState, evalTasks, execCommand, type LabSpec, type SimLine, type SimState } from './docker-sim';

export interface LabResult {
    passed: boolean;
    steps: number;
    hints: number;
    stars: number;
    referenceSteps: number;
}

export interface LabApi {
    getResult(): LabResult;
    reset(): void;
}

export interface LabOptions {
    lab: LabSpec;
    onChange?: (passed: boolean, result: LabResult) => void;
}

const WELCOME: SimLine[] = [
    { text: 'Docker 模拟终端 v1 —— 这里敲的命令不会影响你的真实机器。', kind: 'muted' },
    { text: '输入 docker --help 查看支持的命令；点击「提示」可以获得三级帮助。', kind: 'muted' },
];

function computeStars(lab: LabSpec, passed: boolean, steps: number, hints: number): number {
    if (!passed) return 0;
    const reference = lab.referenceSteps || Math.max(1, lab.tasks.length);
    if (hints === 0 && steps <= reference) return 3;
    if (hints <= 1 && steps <= reference * 2) return 2;
    return 1;
}

export function initLab(options: LabOptions): LabApi | null {
    const root = document.querySelector<HTMLElement>('[data-lab]');
    if (!root) return null;

    const output = root.querySelector<HTMLElement>('[data-lab-output]');
    const form = root.querySelector<HTMLFormElement>('[data-lab-form]');
    const input = root.querySelector<HTMLInputElement>('[data-lab-input]');
    const stepsEl = root.querySelector<HTMLElement>('[data-lab-steps]');
    const statusEl = root.querySelector<HTMLElement>('[data-lab-status]');
    const hintBtn = root.querySelector<HTMLButtonElement>('[data-lab-hint]');
    const clearBtn = root.querySelector<HTMLButtonElement>('[data-lab-clear]');
    const resetBtn = root.querySelector<HTMLButtonElement>('[data-lab-reset]');
    const taskEls = Array.from(root.querySelectorAll<HTMLElement>('[data-lab-task]'));

    if (!output || !form || !input) return null;

    let state: SimState = createSimState(options.lab);
    let steps = 0;
    let hintsShown = 0;
    let passed = false;
    const history: string[] = [];
    let historyIndex = 0;

    const currentResult = (): LabResult => ({
        passed,
        steps,
        hints: hintsShown,
        stars: computeStars(options.lab, passed, steps, hintsShown),
        referenceSteps: options.lab.referenceSteps || options.lab.tasks.length,
    });

    const append = (line: SimLine) => {
        const el = document.createElement('div');
        el.className = `lab-line${line.kind ? ` is-${line.kind}` : ''}`;
        el.textContent = line.text;
        output.appendChild(el);
    };

    const appendAll = (lines: SimLine[]) => {
        lines.forEach(append);
        output.scrollTop = output.scrollHeight;
    };

    const appendCommand = (line: string) => {
        const el = document.createElement('div');
        el.className = 'lab-line is-cmd';
        el.textContent = `$ ${line}`;
        output.appendChild(el);
    };

    const updateSteps = () => {
        if (stepsEl) stepsEl.textContent = `步数 ${steps}`;
    };

    const updateTasks = () => {
        const results = evalTasks(state, options.lab);
        taskEls.forEach((el, index) => {
            const ok = Boolean(results[index]);
            el.classList.toggle('is-checked', ok);
            const mark = el.querySelector<HTMLElement>('.lab-task-mark');
            if (mark) mark.textContent = ok ? '✓' : '○';
        });
        return results.every(Boolean);
    };

    const updateStatus = (done: boolean) => {
        if (!statusEl) return;
        if (done) {
            statusEl.textContent = '✅ 任务全部完成，可以结算本关了';
            statusEl.classList.add('is-passed');
        } else if (!passed) {
            statusEl.textContent = '⏳ 完成左侧任务即可结算';
            statusEl.classList.remove('is-passed');
        }
    };

    const evaluate = (notify = true) => {
        const done = updateTasks();
        if (done && !passed) {
            passed = true;
            updateStatus(true);
        } else if (!done) {
            updateStatus(false);
        }
        if (notify) options.onChange?.(passed, currentResult());
        return done;
    };

    const run = (line: string) => {
        const trimmed = line.trim();
        if (!trimmed) return;

        if (trimmed === 'clear') {
            output.innerHTML = '';
            return;
        }
        if (trimmed === 'help') {
            appendCommand(trimmed);
            appendAll([
                { text: '模拟器支持 docker images / pull / rmi / tag / build / run / ps / stop / start / rm / logs / exec / inspect / volume / network / compose', kind: 'muted' },
                { text: '输入 docker --help 也可以。', kind: 'muted' },
            ]);
            return;
        }

        history.push(trimmed);
        historyIndex = history.length;
        steps++;
        appendCommand(trimmed);
        appendAll(execCommand(state, trimmed, options.lab));
        updateSteps();
        evaluate();
        input.value = '';
    };

    form.addEventListener('submit', event => {
        event.preventDefault();
        run(input.value);
    });

    input.addEventListener('keydown', event => {
        if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (history.length) {
                historyIndex = Math.max(0, historyIndex - 1);
                input.value = history[historyIndex] || '';
            }
        } else if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (history.length) {
                historyIndex = Math.min(history.length, historyIndex + 1);
                input.value = history[historyIndex] || '';
            }
        } else if (event.key === 'Tab') {
            event.preventDefault();
            const commands = [
                'docker run -d ',
                'docker ps',
                'docker ps -a',
                'docker images',
                'docker pull ',
                'docker build -t ',
                'docker stop ',
                'docker start ',
                'docker rm ',
                'docker logs ',
                'docker exec -it ',
                'docker volume create ',
                'docker volume ls',
                'docker network create ',
                'docker network ls',
                'docker compose up -d',
                'docker compose ps',
                'docker compose down',
            ];
            const value = input.value;
            const match = commands.find(c => c.startsWith(value) && value.length > 0);
            if (match) input.value = match;
        }
    });

    hintBtn?.addEventListener('click', () => {
        const hints = options.lab.hints || [];
        if (hintsShown >= hints.length) {
            appendAll([{ text: '没有更多提示了，试着自己完成吧 💪', kind: 'muted' }]);
            return;
        }
        const text = hints[hintsShown];
        hintsShown++;
        appendAll([
            { text: `💡 提示 ${hintsShown}/${hints.length}：${text}`, kind: 'hint' },
        ]);
        options.onChange?.(passed, currentResult());
    });

    clearBtn?.addEventListener('click', () => {
        output.innerHTML = '';
        appendAll(WELCOME);
    });

    resetBtn?.addEventListener('click', () => {
        state = createSimState(options.lab);
        steps = 0;
        hintsShown = 0;
        passed = false;
        history.length = 0;
        historyIndex = 0;
        output.innerHTML = '';
        appendAll(WELCOME);
        updateSteps();
        updateTasks();
        updateStatus(false);
        options.onChange?.(false, currentResult());
        input.focus();
    });

    output.addEventListener('click', () => input.focus());

    appendAll(WELCOME);
    updateSteps();
    updateTasks();
    evaluate(false);

    return {
        getResult: currentResult,
        reset: () => resetBtn?.click(),
    };
}

export const __labInternals = { computeStars, allDone };
