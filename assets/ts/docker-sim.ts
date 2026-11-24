/**
 * Docker 模拟器（纯逻辑，无 DOM）
 * - 解析 docker / shell 子集命令
 * - 维护镜像、容器、卷、网络的轻量状态机
 * - 用声明式 check 判定关卡任务是否完成
 *
 * 供 docker-lab.ts 做终端界面，也便于单独测试。
 */

export type SimKind = 'out' | 'err' | 'warn' | 'ok' | 'muted' | 'hint';

export interface SimLine {
    text: string;
    kind?: SimKind;
}

export interface SimPort {
    host: number;
    container: number;
}

export interface SimMount {
    type: 'volume' | 'bind';
    src: string;
    dst: string;
}

export interface SimContainer {
    id: string;
    name: string;
    image: string;
    status: 'running' | 'exited';
    ports: SimPort[];
    mounts: SimMount[];
    env: Record<string, string>;
    memory?: string;
    restart?: string;
    network: string[];
}

export interface ComposeService {
    name: string;
    image: string;
    ports?: string[];
    env?: Record<string, string>;
    volumes?: string[];
}

export interface ComposeSpec {
    project?: string;
    services: ComposeService[];
}

export interface LabCheck {
    type: string;
    name?: string;
    image?: string;
    host?: number;
    container?: number;
    dest?: string;
    network?: string;
    key?: string;
    value?: string;
    policy?: string;
    services?: string[];
}

export interface LabTask {
    label: string;
    check: LabCheck;
}

export interface LabInit {
    images?: string[];
    volumes?: string[];
    networks?: string[];
    /** false 表示初始没有 docker 组权限，需要 usermod + newgrp */
    sudo?: boolean;
    compose?: ComposeSpec;
}

export interface LabSpec {
    brief?: string;
    init?: LabInit;
    tasks: LabTask[];
    hints?: string[];
    referenceSteps?: number;
}

export interface SimState {
    images: string[];
    containers: SimContainer[];
    volumes: string[];
    networks: string[];
    sudoGranted: boolean;
    flags: {
        psAll: boolean;
        exec: boolean;
        logs: boolean;
        composeUp: boolean;
        ping: boolean;
        /** 显式执行过 pull 的镜像 */
        pulled: string[];
        /** 创建过的容器名 */
        run: string[];
    };
    compose?: {
        project: string;
        services: string[];
    };
    /** 已显示过的提示级别（1-3，0 表示没看提示） */
    hintsUsed: number;
}

const ADJECTIVES = ['brave', 'happy', 'sleepy', 'focused', 'gentle', 'eager', 'calm', 'vivid'];
const NOUNS = ['whale', 'otter', 'panda', 'koala', 'otter', 'falcon', 'tiger', 'dolphin'];

const IMAGE_SIZES: Record<string, string> = {
    mysql: '602MB',
    node: '134MB',
    nginx: '192MB',
    alpine: '7.8MB',
    'hello-world': '13.3kB',
};

function imageSize(image: string): string {
    const repo = image.split(':')[0];
    return IMAGE_SIZES[repo] || '142MB';
}

/** 给镜像补上默认标签 */
export function normalizeImage(ref: string): string {
    const value = (ref || '').trim();
    if (!value) return value;
    const slash = value.lastIndexOf('/');
    const colon = value.lastIndexOf(':');
    if (colon > slash) return value;
    return `${value}:latest`;
}

export function createSimState(lab: LabSpec): SimState {
    const init = lab.init || {};
    return {
        images: (init.images || []).map(normalizeImage),
        containers: [],
        volumes: [...(init.volumes || [])],
        networks: [...(init.networks || [])],
        sudoGranted: init.sudo !== false,
        flags: { psAll: false, exec: false, logs: false, composeUp: false, ping: false, pulled: [], run: [] },
        hintsUsed: 0,
    };
}

export function tokenize(line: string): string[] {
    const out: string[] = [];
    const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(line)) !== null) {
        out.push(match[1] !== undefined ? match[1] : match[2] !== undefined ? match[2] : match[3] || '');
    }
    return out;
}

function charWidth(char: string): number {
    const code = char.codePointAt(0) || 0;
    return code > 0x2e80 ? 2 : 1;
}

function textWidth(text: string): number {
    return [...text].reduce((sum, ch) => sum + charWidth(ch), 0);
}

function padEnd(text: string, width: number): string {
    return text + ' '.repeat(Math.max(0, width - textWidth(text)));
}

function table(headers: string[], rows: string[][]): SimLine[] {
    const widths = headers.map((h, i) => Math.max(textWidth(h), ...rows.map(r => textWidth(r[i] || ''))));
    const header = headers.map((h, i) => padEnd(h, widths[i])).join('   ').trimEnd();
    return [
        { text: header, kind: 'out' },
        ...rows.map(row => ({
            text: row.map((cell, i) => padEnd(cell || '', widths[i])).join('   ').trimEnd(),
            kind: 'out' as SimKind,
        })),
    ];
}

function norm(value: string | undefined): string {
    return (value || '').trim();
}

export function getContainer(state: SimState, ref: string): SimContainer | undefined {
    const target = norm(ref);
    if (!target) return undefined;
    return state.containers.find(c => c.name === target || c.id === target || (target.length >= 4 && c.id.startsWith(target)));
}

function getImage(state: SimState, ref: string): string | undefined {
    const target = normalizeImage(ref);
    return state.images.find(i => i === target);
}

function imageInUse(state: SimState, image: string): boolean {
    return state.containers.some(c => c.image === image);
}

function statusText(c: SimContainer): string {
    return c.status === 'running' ? 'Up 2 minutes' : 'Exited (0) 1 minute ago';
}

function portsText(c: SimContainer): string {
    if (!c.ports.length) return '';
    return c.ports.map(p => `0.0.0.0:${p.host}->${p.container}/tcp`).join(', ');
}

function mountsText(c: SimContainer): string {
    return c.mounts
        .map(m => `${m.src}:${m.dst}`)
        .join(', ');
}

function randomName(state: SimState): string {
    const n = state.containers.length;
    return `${ADJECTIVES[n % ADJECTIVES.length]}_${NOUNS[(n * 3) % NOUNS.length]}`;
}

function newId(state: SimState): string {
    const hex = (0x9f3c00 + (state.containers.length + 1) * 0x1a7).toString(16);
    return (hex + '4de8b2c1a7f0').padStart(12, '0').slice(0, 12);
}

function pullLines(image: string): SimLine[] {
    const [repo, tag] = splitImage(image);
    return [
        { text: `Unable to find image '${image}' locally`, kind: 'muted' },
        { text: `${tag}: Pulling from library/${repo}`, kind: 'muted' },
        { text: 'Status: Downloaded newer image for ' + image, kind: 'ok' },
    ];
}

function splitImage(image: string): [string, string] {
    const slash = image.lastIndexOf('/');
    const colon = image.lastIndexOf(':');
    if (colon > slash) return [image.slice(0, colon), image.slice(colon + 1)];
    return [image, 'latest'];
}

/** 确保镜像存在（不存在则模拟拉取），返回需要追加的输出 */
function ensureImage(state: SimState, ref: string): SimLine[] {
    const image = normalizeImage(ref);
    if (getImage(state, image)) return [];
    const lines = pullLines(image);
    state.images.push(image);
    return lines;
}

function parsePort(value: string): SimPort | null {
    const text = norm(value);
    if (!text) return null;
    const parts = text.split(':');
    if (parts.length === 2) {
        const host = Number(parts[0]);
        const container = Number(parts[1]);
        return Number.isFinite(host) && Number.isFinite(container) ? { host, container } : null;
    }
    if (parts.length === 3) {
        const host = Number(parts[1]);
        const container = Number(parts[2]);
        return Number.isFinite(host) && Number.isFinite(container) ? { host, container } : null;
    }
    return null;
}

function parseMount(value: string): SimMount | null {
    const text = norm(value);
    if (!text) return null;
    const parts = text.split(':');
    if (parts.length < 2) return null;
    const src = parts[0];
    const dst = parts[1];
    if (!src || !dst) return null;
    const type: SimMount['type'] = src.startsWith('/') || src.startsWith('.') ? 'bind' : 'volume';
    return { type, src, dst };
}

export function isSandboxCommand(line: string): boolean {
    const tokens = tokenize(line);
    const first = tokens[0] || '';
    return ['docker', 'docker-compose', 'sudo', 'usermod', 'newgrp', 'clear', 'help'].includes(first);
}

/** 执行一条命令，返回终端输出；状态原地更新 */
export function execCommand(state: SimState, line: string, lab: LabSpec): SimLine[] {
    const raw = line.trim();
    if (!raw) return [];

    let tokens = tokenize(raw);

    // 允许 sudo 前缀
    if (tokens[0] === 'sudo') {
        const inner = tokens.slice(1);
        if (inner[0] === 'usermod') return handleUsermod(state, inner);
        if (inner[0] === 'docker') tokens = inner;
        else return [{ text: `sudo: ${inner[0] || ''}: command not found（模拟器只支持 docker 相关命令）`, kind: 'err' }];
    }

    const cmd = tokens[0];

    if (cmd === 'usermod') return handleUsermod(state, tokens);
    if (cmd === 'newgrp') return handleNewgrp(state, tokens);
    if (cmd === 'docker-compose') return handleCompose(state, lab, tokens.slice(1));
    if (cmd !== 'docker') {
        return [{ text: `command not found: ${cmd}（试试 docker --help）`, kind: 'err' }];
    }

    // 版本与帮助不需要 docker 组权限
    const sub = tokens[1] || 'help';
    if (sub === '--version' || sub === '-v' || sub === 'version') {
        return [{ text: 'Docker version 27.3.1, build ce12230（模拟器）', kind: 'out' }];
    }
    if (sub === '--help' || sub === '-h' || sub === 'help') {
        return [
            { text: '用法: docker <命令> [参数...]', kind: 'out' },
            { text: '本模拟器支持：images pull rmi tag build run ps stop start restart rm logs exec inspect volume network compose', kind: 'muted' },
            { text: '提示：输入 docker ps 查看容器，输入 newgrp docker 处理权限。', kind: 'muted' },
        ];
    }
    if (sub === 'info') {
        return [
            { text: 'Server Version: 27.3.1 (simulated)', kind: 'out' },
            { text: `Images: ${state.images.length}   Containers: ${state.containers.length}   Volumes: ${state.volumes.length}`, kind: 'out' },
        ];
    }

    if (!state.sudoGranted) {
        return [
            { text: 'permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock', kind: 'err' },
            { text: '本关教学点：把用户加入 docker 组并让组身份生效（usermod + newgrp）。', kind: 'hint' },
        ];
    }

    // 兼容 docker container ls / docker image ls 等别名
    if (sub === 'container' || sub === 'image') {
        const third = tokens[2] || '';
        if (third === 'ls' || third === 'list') {
            const mapped = sub === 'container' ? 'ps' : 'images';
            return execCommand(state, ['docker', mapped, ...tokens.slice(3)].join(' '), lab);
        }
        if (sub === 'container' && third === 'rm') {
            return handleRm(state, tokens.slice(3));
        }
        if (sub === 'image' && third === 'rm') {
            return handleRmi(state, tokens.slice(3));
        }
        return [{ text: `docker ${sub} ${third}: 模拟器暂不支持该子命令`, kind: 'err' }];
    }

    const args = tokens.slice(2);

    switch (sub) {
        case 'images':
            return handleImages(state);
        case 'pull':
            return handlePull(state, args);
        case 'rmi':
            return handleRmi(state, args);
        case 'tag':
            return handleTag(state, args);
        case 'build':
            return handleBuild(state, args);
        case 'run':
            return handleRun(state, args);
        case 'ps':
            return handlePs(state, args);
        case 'stop':
            return handleStop(state, args);
        case 'start':
            return handleStart(state, args);
        case 'restart':
            return handleRestart(state, args);
        case 'rm':
            return handleRm(state, args);
        case 'logs':
            return handleLogs(state, args);
        case 'exec':
            return handleExec(state, args);
        case 'inspect':
            return handleInspect(state, args);
        case 'volume':
            return handleVolume(state, args);
        case 'network':
            return handleNetwork(state, args);
        case 'compose':
            return handleCompose(state, lab, args);
        default:
            return [{ text: `docker ${sub}: 未知命令（试试 docker --help）`, kind: 'err' }];
    }
}

/* ---------------- 权限相关 ---------------- */

function handleUsermod(state: SimState, tokens: string[]): SimLine[] {
    const text = tokens.join(' ');
    if (!/docker/.test(text)) {
        return [{ text: '用法: sudo usermod -aG docker $USER', kind: 'err' }];
    }
    return [
        { text: '已将当前用户加入 docker 组。', kind: 'ok' },
        { text: '组身份在登录时注入会话，需要重新登录或执行 newgrp docker 才会生效。', kind: 'muted' },
    ];
}

function handleNewgrp(state: SimState, tokens: string[]): SimLine[] {
    const group = tokens[1];
    if (group && group !== 'docker') {
        return [{ text: `newgrp: 未知的组 ${group}`, kind: 'err' }];
    }
    state.sudoGranted = true;
    return [
        { text: '当前会话已切换到 docker 组，现在可以免 sudo 使用 docker 了。', kind: 'ok' },
    ];
}

/* ---------------- 镜像 ---------------- */

function handleImages(state: SimState): SimLine[] {
    if (!state.images.length) {
        return [{ text: 'REPOSITORY   TAG   IMAGE ID   CREATED   SIZE', kind: 'muted' }];
    }
    const rows = state.images.map((image, index) => {
        const [repo, tag] = splitImage(image);
        const id = (0x4f2a00 + index * 0x37).toString(16).slice(-12).padStart(12, '0');
        return [repo, tag, id, '2 days ago', imageSize(image)];
    });
    return table(['REPOSITORY', 'TAG', 'IMAGE ID', 'CREATED', 'SIZE'], rows);
}

function handlePull(state: SimState, args: string[]): SimLine[] {
    const ref = args.find(a => !a.startsWith('-'));
    if (!ref) return [{ text: 'docker pull: 需要指定镜像名，例如 docker pull nginx:latest', kind: 'err' }];
    const image = normalizeImage(ref);
    if (getImage(state, image)) return [{ text: `Image is up to date for ${image}`, kind: 'ok' }];
    state.images.push(image);
    state.flags.pulled.push(image);
    return [
        { text: `${splitImage(image)[1]}: Pulling from library/${splitImage(image)[0]}`, kind: 'muted' },
        { text: `Digest: sha256:${image.length}3f9a2c7b4e1d`, kind: 'muted' },
        { text: `Status: Downloaded newer image for ${image}`, kind: 'ok' },
    ];
}

function handleRmi(state: SimState, args: string[]): SimLine[] {
    const ref = args.find(a => !a.startsWith('-'));
    if (!ref) return [{ text: 'docker rmi: 需要指定镜像名', kind: 'err' }];
    const image = normalizeImage(ref);
    if (!getImage(state, image)) return [{ text: `Error response from daemon: No such image: ${ref}`, kind: 'err' }];
    if (imageInUse(state, image)) {
        return [{ text: `Error response from daemon: conflict: unable to remove repository reference "${ref}" (must force) - container is using its referenced image ${image}`, kind: 'err' }];
    }
    state.images = state.images.filter(i => i !== image);
    return [{ text: `Untagged: ${image}`, kind: 'ok' }];
}

function handleTag(state: SimState, args: string[]): SimLine[] {
    const [src, dst] = args.filter(a => !a.startsWith('-'));
    if (!src || !dst) return [{ text: 'docker tag: 用法 docker tag 源镜像 新镜像:标签', kind: 'err' }];
    if (!getImage(state, src)) return [{ text: `Error response from daemon: No such image: ${src}`, kind: 'err' }];
    const target = normalizeImage(dst);
    if (!getImage(state, target)) state.images.push(target);
    return [{ text: `已打标签 ${normalizeImage(src)} → ${target}`, kind: 'ok' }];
}

function handleBuild(state: SimState, args: string[]): SimLine[] {
    let tag = 'myapp:latest';
    for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (a === '-t' || a === '--tag') tag = normalizeImage(args[++i] || tag);
        else if (a.startsWith('--tag=')) tag = normalizeImage(a.slice(6));
        else if (a.startsWith('-t=')) tag = normalizeImage(a.slice(3));
    }
    if (!getImage(state, tag)) state.images.push(tag);
    return [
        { text: '[+] Building 0.4s (6/6) FINISHED', kind: 'muted' },
        { text: ' => [internal] load build definition from Dockerfile', kind: 'muted' },
        { text: ' => [1/3] FROM node:20-alpine', kind: 'muted' },
        { text: ' => [2/3] COPY . .', kind: 'muted' },
        { text: ' => [3/3] RUN npm ci --omit=dev', kind: 'muted' },
        { text: ' => => naming to docker.io/library/' + tag, kind: 'muted' },
        { text: `镜像 ${tag} 构建完成`, kind: 'ok' },
    ];
}

/* ---------------- 容器 ---------------- */

function handleRun(state: SimState, args: string[]): SimLine[] {
    const opts = {
        detach: false,
        name: '',
        ports: [] as SimPort[],
        mounts: [] as SimMount[],
        env: {} as Record<string, string>,
        memory: '',
        restart: '',
        networks: [] as string[],
        autoRemove: false,
    };
    let image = '';
    const command: string[] = [];

    for (let i = 0; i < args.length; i++) {
        const token = args[i];
        if (image) {
            command.push(token);
            continue;
        }
        if (token === '-d' || token === '--detach') { opts.detach = true; continue; }
        if (token === '-it' || token === '-i' || token === '-t') { opts.detach = opts.detach; continue; }
        if (token === '--rm') { opts.autoRemove = true; continue; }
        if (token === '-p' || token === '--publish') {
            const port = parsePort(args[++i] || '');
            if (port) opts.ports.push(port);
            continue;
        }
        if (token.startsWith('--publish=')) {
            const port = parsePort(token.slice(10));
            if (port) opts.ports.push(port);
            continue;
        }
        if (token === '-v' || token === '--volume') {
            const mount = parseMount(args[++i] || '');
            if (mount) opts.mounts.push(mount);
            continue;
        }
        if (token.startsWith('--volume=')) {
            const mount = parseMount(token.slice(9));
            if (mount) opts.mounts.push(mount);
            continue;
        }
        if (token === '-e' || token === '--env') {
            const pair = args[++i] || '';
            const eq = pair.indexOf('=');
            if (eq > 0) opts.env[pair.slice(0, eq)] = pair.slice(eq + 1);
            continue;
        }
        if (token.startsWith('--env=')) {
            const pair = token.slice(6);
            const eq = pair.indexOf('=');
            if (eq > 0) opts.env[pair.slice(0, eq)] = pair.slice(eq + 1);
            continue;
        }
        if (token === '--name') { opts.name = args[++i] || ''; continue; }
        if (token.startsWith('--name=')) { opts.name = token.slice(7); continue; }
        if (token === '--restart') { opts.restart = args[++i] || ''; continue; }
        if (token.startsWith('--restart=')) { opts.restart = token.slice(10); continue; }
        if (token === '-m' || token === '--memory') { opts.memory = args[++i] || ''; continue; }
        if (token.startsWith('--memory=')) { opts.memory = token.slice(9); continue; }
        if (token === '--network' || token === '--net') { opts.networks.push(args[++i] || ''); continue; }
        if (token.startsWith('--network=')) { opts.networks.push(token.slice(10)); continue; }
        if (['-w', '--workdir', '--entrypoint', '-u', '--user'].includes(token)) { i++; continue; }
        if (token.startsWith('-')) continue;
        image = token;
    }

    if (!image) {
        return [{ text: 'docker run: 至少需要指定一个镜像，例如 docker run -d nginx', kind: 'err' }];
    }

    const lines: SimLine[] = [];
    lines.push(...ensureImage(state, image));
    const finalImage = normalizeImage(image);

    const name = opts.name || randomName(state);
    if (state.containers.some(c => c.name === name)) {
        return [{ text: `Error response from daemon: Conflict. The container name "/${name}" is already in use.`, kind: 'err' }];
    }

    for (const net of opts.networks) {
        if (net && !state.networks.includes(net)) {
            lines.push({ text: `Error response from daemon: network ${net} not found`, kind: 'err' });
            return lines;
        }
    }

    for (const mount of opts.mounts) {
        if (mount.type === 'volume' && !state.volumes.includes(mount.src)) {
            state.volumes.push(mount.src);
            lines.push({ text: `（模拟）命名卷 ${mount.src} 不存在，已自动创建`, kind: 'muted' });
        }
    }

    const container: SimContainer = {
        id: newId(state),
        name,
        image: finalImage,
        status: 'running',
        ports: opts.ports,
        mounts: opts.mounts,
        env: opts.env,
        memory: opts.memory || undefined,
        restart: opts.restart || undefined,
        network: opts.networks.filter(Boolean),
    };

    const [repo] = splitImage(finalImage);

    if (repo === 'hello-world') {
        container.status = 'exited';
        lines.push(
            { text: '', kind: 'out' },
            { text: 'Hello from Docker!', kind: 'out' },
            { text: 'This message shows that your installation appears to be working correctly.', kind: 'out' },
        );
        if (opts.autoRemove) {
            lines.push({ text: '（--rm）容器已退出并自动删除', kind: 'muted' });
            return lines;
        }
        state.containers.push(container);
        state.flags.run.push(name);
        lines.push({ text: container.id, kind: 'muted' });
        lines.push({ text: '容器已退出，用 docker ps -a 可以看到它。', kind: 'hint' });
        return lines;
    }

    state.containers.push(container);
    state.flags.run.push(name);

    if (command.length && !opts.detach) {
        lines.push({ text: `（模拟）容器执行 ${command.join(' ')} 后保持运行`, kind: 'muted' });
    }
    lines.push({ text: container.id, kind: 'muted' });
    if (!opts.detach) {
        lines.push({ text: `（模拟）已附着到容器 ${name}，按 Ctrl+C 不会停止（教学模拟）`, kind: 'muted' });
    }
    return lines;
}

function handlePs(state: SimState, args: string[]): SimLine[] {
    const showAll = args.includes('-a') || args.includes('--all') || args.includes('-aq');
    if (showAll) state.flags.psAll = true;
    const list = showAll ? state.containers : state.containers.filter(c => c.status === 'running');
    const rows = list.map(c => [c.id, c.image, c.status === 'running' ? 'Up 2 minutes' : 'Exited (0)', portsText(c) || '-', c.name]);
    const lines = table(['CONTAINER ID', 'IMAGE', 'STATUS', 'PORTS', 'NAMES'], rows);
    if (!list.length) lines.push({ text: showAll ? '没有容器，先 docker run 一个吧。' : '没有运行中的容器，加 -a 看看已退出的容器。', kind: 'muted' });
    return lines;
}

function handleStop(state: SimState, args: string[]): SimLine[] {
    const ref = args.find(a => !a.startsWith('-'));
    const container = ref ? getContainer(state, ref) : undefined;
    if (!container) return [{ text: `Error response from daemon: No such container: ${ref || ''}`, kind: 'err' }];
    container.status = 'exited';
    return [{ text: container.name, kind: 'ok' }];
}

function handleStart(state: SimState, args: string[]): SimLine[] {
    const ref = args.find(a => !a.startsWith('-'));
    const container = ref ? getContainer(state, ref) : undefined;
    if (!container) return [{ text: `Error response from daemon: No such container: ${ref || ''}`, kind: 'err' }];
    container.status = 'running';
    return [{ text: container.name, kind: 'ok' }];
}

function handleRestart(state: SimState, args: string[]): SimLine[] {
    const ref = args.find(a => !a.startsWith('-'));
    const container = ref ? getContainer(state, ref) : undefined;
    if (!container) return [{ text: `Error response from daemon: No such container: ${ref || ''}`, kind: 'err' }];
    container.status = 'running';
    return [{ text: container.name, kind: 'ok' }];
}

function handleRm(state: SimState, args: string[]): SimLine[] {
    const force = args.includes('-f') || args.includes('--force');
    const refs = args.filter(a => !a.startsWith('-'));
    if (!refs.length) return [{ text: 'docker rm: 需要指定容器名', kind: 'err' }];
    const lines: SimLine[] = [];
    for (const ref of refs) {
        const container = getContainer(state, ref);
        if (!container) {
            lines.push({ text: `Error response from daemon: No such container: ${ref}`, kind: 'err' });
            continue;
        }
        if (container.status === 'running' && !force) {
            lines.push({ text: `Error response from daemon: You cannot remove a running container ${container.id}. Stop the container before attempting removal or force remove`, kind: 'err' });
            continue;
        }
        state.containers = state.containers.filter(c => c !== container);
        lines.push({ text: container.name, kind: 'ok' });
    }
    return lines;
}

function handleLogs(state: SimState, args: string[]): SimLine[] {
    const ref = args.find(a => !a.startsWith('-'));
    const container = ref ? getContainer(state, ref) : undefined;
    if (!container) return [{ text: `Error response from daemon: No such container: ${ref || ''}`, kind: 'err' }];
    state.flags.logs = true;
    const repo = splitImage(container.image)[0];
    if (repo === 'hello-world') {
        return [
            { text: 'Hello from Docker!', kind: 'out' },
            { text: 'This message shows that your installation appears to be working correctly.', kind: 'out' },
        ];
    }
    if (repo === 'mysql') {
        return [
            { text: '[System] [MY-010116] [Server] /usr/sbin/mysqld (mysqld 8.0.40) starting as process 1', kind: 'muted' },
            { text: '[System] [MY-010931] [Server] ready for connections. Version: "8.0.40"', kind: 'ok' },
        ];
    }
    return [
        { text: '/docker-entrypoint.sh: Configuration complete; ready for start up', kind: 'muted' },
        { text: `${container.name} 已就绪，监听容器内端口`, kind: 'muted' },
    ];
}

function handleExec(state: SimState, args: string[]): SimLine[] {
    const flags = args.filter(a => a.startsWith('-'));
    const rest = args.filter(a => !a.startsWith('-'));
    const ref = rest.shift() || '';
    const container = getContainer(state, ref);
    if (!container) return [{ text: `Error response from daemon: No such container: ${ref}`, kind: 'err' }];
    if (container.status !== 'running') {
        return [{ text: `Error response from daemon: Container ${container.id} is not running`, kind: 'err' }];
    }
    state.flags.exec = true;

    const command = rest[0] || '';
    const repo = splitImage(container.image)[0];

    if (['sh', 'bash', '/bin/sh', '/bin/bash', 'ash'].includes(command)) {
        return [{ text: `（模拟）已进入容器 ${container.name}，这里是它的 shell，输入 exit 退出`, kind: 'muted' }];
    }

    if (command === 'ping') {
        const target = rest[1] || '';
        const other = getContainer(state, target);
        if (!other) {
            return [{ text: `ping: bad address '${target}'`, kind: 'err' }];
        }
        if (!other.network.some(n => container.network.includes(n))) {
            return [
                { text: `ping: bad address '${target}'`, kind: 'err' },
                { text: '提示：两个容器需要接入同一个自定义网络才能用名字互访。', kind: 'hint' },
            ];
        }
        state.flags.ping = true;
        return [
            { text: `PING ${target} (172.18.0.3): 56 data bytes`, kind: 'out' },
            { text: `64 bytes from 172.18.0.3: seq=0 ttl=64 time=0.081 ms`, kind: 'out' },
            { text: `64 bytes from 172.18.0.3: seq=1 ttl=64 time=0.069 ms`, kind: 'out' },
            { text: `--- ${target} ping statistics ---`, kind: 'out' },
            { text: '2 packets transmitted, 2 packets received, 0% packet loss', kind: 'ok' },
        ];
    }

    if (command === 'env') {
        const env = Object.entries(container.env);
        if (!env.length) return [{ text: '（容器没有设置额外环境变量）', kind: 'muted' }];
        return env.map(([k, v]) => ({ text: `${k}=${v}`, kind: 'out' as SimKind }));
    }

    if (command === 'mysql') {
        return [
            { text: `Welcome to the MySQL monitor.  Commands end with ; or \\g.`, kind: 'out' },
            { text: `Your MySQL connection id is 8  Server version: 8.0.40`, kind: 'out' },
            { text: '（模拟）已用 root 登录成功', kind: 'ok' },
        ];
    }

    if (command === 'ls') {
        return [{ text: 'bin  dev  etc  home  lib  media  mnt  opt  proc  root  run  sbin  srv  sys  tmp  usr  var', kind: 'out' }];
    }

    if (command === 'cat') {
        return [{ text: `（模拟）${rest[1] || '文件'} 的内容`, kind: 'muted' }];
    }

    if (command === 'curl' || command === 'wget') {
        return [{ text: 'HTTP/1.1 200 OK', kind: 'ok' }];
    }

    if (command === 'mem' || command === 'free') {
        return [{ text: `Mem: ${container.memory || '不限' }`, kind: 'out' }];
    }

    if (repo === 'alpine' && command === 'sleep') {
        return [];
    }

    return [{ text: `（模拟）命令 ${rest.join(' ') || 'shell'} 执行成功`, kind: 'muted' }];
}

function handleInspect(state: SimState, args: string[]): SimLine[] {
    const ref = args.find(a => !a.startsWith('-'));
    const container = ref ? getContainer(state, ref) : undefined;
    if (!container) return [{ text: `Error: No such object: ${ref || ''}`, kind: 'err' }];
    const data = {
        Id: container.id,
        Name: `/${container.name}`,
        Image: container.image,
        State: { Status: container.status, Running: container.status === 'running' },
        HostConfig: { Memory: container.memory || 0, RestartPolicy: { Name: container.restart || 'no' } },
        Mounts: container.mounts.map(m => ({ Type: m.type, Source: m.src, Destination: m.dst })),
        NetworkSettings: { Networks: Object.fromEntries(container.network.map(n => [n, {}])) },
        Config: { Env: Object.entries(container.env).map(([k, v]) => `${k}=${v}`) },
        Ports: container.ports,
    };
    return [{ text: JSON.stringify(data, null, 2), kind: 'out' }];
}

/* ---------------- 卷与网络 ---------------- */

function handleVolume(state: SimState, args: string[]): SimLine[] {
    const sub = args[0] || '';
    if (sub === 'ls' || sub === 'list') {
        return table(['DRIVER', 'VOLUME NAME'], state.volumes.map(v => ['local', v]));
    }
    if (sub === 'create') {
        const name = args[1] || '';
        if (!name) return [{ text: 'docker volume create: 需要卷名', kind: 'err' }];
        if (!state.volumes.includes(name)) state.volumes.push(name);
        return [{ text: name, kind: 'ok' }];
    }
    if (sub === 'rm' || sub === 'remove') {
        const name = args[1] || '';
        if (!state.volumes.includes(name)) return [{ text: `Error response from daemon: get ${name}: no such volume`, kind: 'err' }];
        const used = state.containers.some(c => c.mounts.some(m => m.type === 'volume' && m.src === name));
        if (used) return [{ text: `Error response from daemon: remove ${name}: volume is in use`, kind: 'err' }];
        state.volumes = state.volumes.filter(v => v !== name);
        return [{ text: name, kind: 'ok' }];
    }
    return [{ text: `docker volume ${sub}: 模拟器支持 ls / create / rm`, kind: 'err' }];
}

function handleNetwork(state: SimState, args: string[]): SimLine[] {
    const sub = args[0] || '';
    if (sub === 'ls' || sub === 'list') {
        const nets = ['bridge', 'host', 'none', ...state.networks];
        return table(['NETWORK ID', 'NAME', 'DRIVER'], nets.map((n, i) => [(0x1a2b00 + i * 13).toString(16).slice(-6), n, n === 'host' ? 'host' : 'bridge']));
    }
    if (sub === 'create') {
        const name = args[1] || '';
        if (!name) return [{ text: 'docker network create: 需要网络名', kind: 'err' }];
        if (!state.networks.includes(name)) state.networks.push(name);
        return [{ text: (0x77ab00 + state.networks.length * 7).toString(16).slice(-12), kind: 'ok' }];
    }
    if (sub === 'connect') {
        const [net, ref] = args.slice(1);
        if (!state.networks.includes(net || '')) return [{ text: `Error response from daemon: network ${net} not found`, kind: 'err' }];
        const container = ref ? getContainer(state, ref) : undefined;
        if (!container) return [{ text: `Error response from daemon: No such container: ${ref || ''}`, kind: 'err' }];
        if (!container.network.includes(net)) container.network.push(net);
        return [{ text: '', kind: 'muted' }];
    }
    return [{ text: `docker network ${sub}: 模拟器支持 ls / create / connect`, kind: 'err' }];
}

/* ---------------- Compose ---------------- */

function handleCompose(state: SimState, lab: LabSpec, args: string[]): SimLine[] {
    const sub = args.find(a => !a.startsWith('-')) || '';
    const spec = lab.init?.compose;

    if (!spec) {
        return [{ text: 'no configuration file provided: compose.yaml', kind: 'err' }];
    }

    const project = spec.project || 'project';
    const networkName = `${project}_default`;

    if (sub === 'up') {
        state.flags.composeUp = true;
        if (!state.networks.includes(networkName)) state.networks.push(networkName);
        const lines: SimLine[] = [];
        for (const service of spec.services) {
            lines.push(...ensureImage(state, service.image));
            const exists = state.containers.find(c => c.name === service.name);
            if (exists) {
                exists.status = 'running';
                lines.push({ text: `✔ Container ${project}-${service.name}-1  Started`, kind: 'ok' });
                continue;
            }
            const ports: SimPort[] = (service.ports || [])
                .map(p => parsePort(p))
                .filter((p): p is SimPort => Boolean(p));
            const mounts: SimMount[] = [];
            for (const volume of service.volumes || []) {
                const mount = parseMount(volume);
                if (mount) {
                    if (mount.type === 'volume' && !state.volumes.includes(mount.src)) state.volumes.push(mount.src);
                    mounts.push(mount);
                }
            }
            state.containers.push({
                id: newId(state),
                name: service.name,
                image: normalizeImage(service.image),
                status: 'running',
                ports,
                mounts,
                env: service.env || {},
                network: [networkName],
            });
            lines.push({ text: `✔ Container ${project}-${service.name}-1  Started`, kind: 'ok' });
        }
        state.compose = { project, services: spec.services.map(s => s.name) };
        return lines;
    }

    if (sub === 'down') {
        const names = spec.services.map(s => s.name);
        state.containers = state.containers.filter(c => !names.includes(c.name));
        state.networks = state.networks.filter(n => n !== networkName);
        state.compose = undefined;
        return [
            { text: `✔ Container ${project}-web-1  Removed`, kind: 'muted' },
            { text: `✔ Network ${networkName}  Removed`, kind: 'muted' },
        ];
    }

    if (sub === 'ps' || sub === 'list') {
        const rows = state.containers
            .filter(c => spec.services.some(s => s.name === c.name))
            .map(c => [c.name, c.image, 'Up', portsText(c) || '-']);
        return table(['NAME', 'IMAGE', 'STATUS', 'PORTS'], rows);
    }

    if (sub === 'logs') {
        return spec.services.flatMap(s => [
            { text: `[${s.name}] 服务已就绪`, kind: 'muted' as SimKind },
        ]);
    }

    return [{ text: `docker compose ${sub}: 模拟器支持 up / down / ps / logs`, kind: 'err' }];
}

/* ---------------- 验收 ---------------- */

export function evalCheck(state: SimState, check: LabCheck): boolean {
    switch (check.type) {
        case 'image-exists':
            return Boolean(getImage(state, check.name || ''));
        case 'image-missing':
            return !getImage(state, check.name || '');
        case 'container-exists': {
            const c = getContainer(state, check.name || '');
            return Boolean(c);
        }
        case 'container-running': {
            const c = getContainer(state, check.name || '');
            return Boolean(c && c.status === 'running');
        }
        case 'container-stopped': {
            const c = getContainer(state, check.name || '');
            return Boolean(c && c.status === 'exited');
        }
        case 'container-removed':
            return !getContainer(state, check.name || '');
        case 'container-image':
            return state.containers.some(c => c.image === normalizeImage(check.image || ''));
        case 'port-mapped': {
            const c = getContainer(state, check.name || '');
            return Boolean(c && c.ports.some(p => p.host === check.host && p.container === check.container));
        }
        case 'volume-exists':
            return state.volumes.includes(check.name || '');
        case 'volume-mounted': {
            const c = getContainer(state, check.name || '');
            return Boolean(c && c.mounts.some(m => m.dst === check.dest));
        }
        case 'network-exists':
            return state.networks.includes(check.network || check.name || '');
        case 'container-network': {
            const c = getContainer(state, check.name || '');
            return Boolean(c && c.network.includes(check.network || ''));
        }
        case 'env-set': {
            const c = getContainer(state, check.name || '');
            if (!c) return false;
            const key = check.key || '';
            if (!(key in c.env)) return false;
            return check.value === undefined || c.env[key] === check.value;
        }
        case 'memory-limit': {
            const c = getContainer(state, check.name || '');
            if (!c || !c.memory) return false;
            return c.memory.toLowerCase() === (check.value || '').toLowerCase();
        }
        case 'restart-policy': {
            const c = getContainer(state, check.name || '');
            return Boolean(c && c.restart === check.policy);
        }
        case 'compose-services': {
            const services = check.services || [];
            return services.length > 0 && services.every(name => {
                const c = getContainer(state, name);
                return Boolean(c && c.status === 'running');
            });
        }
        case 'used-ps-a':
            return state.flags.psAll;
        case 'used-exec':
            return state.flags.exec;
        case 'used-logs':
            return state.flags.logs;
        case 'used-ping':
            return state.flags.ping;
        case 'pulled-image':
            return state.flags.pulled.includes(normalizeImage(check.name || ''));
        case 'used-run':
            return state.flags.run.includes(check.name || '');
        case 'sudo-granted':
            return state.sudoGranted;
        default:
            return false;
    }
}

export function evalTasks(state: SimState, lab: LabSpec): boolean[] {
    return lab.tasks.map(task => evalCheck(state, task.check));
}

export function allDone(state: SimState, lab: LabSpec): boolean {
    return evalTasks(state, lab).every(Boolean);
}

/** 终端提示文案（输入框上方） */
export function labTagline(lab: LabSpec): string {
    return lab.brief || '在终端里输入 docker 命令，完成左侧任务清单。';
}

export const __simInternals = {
    normalizeImage,
    tokenize,
    splitImage,
    parsePort,
    parseMount,
    getContainer,
    getImage,
    table,
};
