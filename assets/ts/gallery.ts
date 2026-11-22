const wrap = (figures: HTMLElement[]) => {
    const galleryContainer = document.createElement('div');
    galleryContainer.className = 'gallery';

    const parentNode = figures[0].parentNode!,
        first = figures[0];

    parentNode.insertBefore(galleryContainer, first)

    for (const figure of figures) {
        galleryContainer.appendChild(figure);
    }
}

const unescapeHtml = (html: string) => {
    /// Replace special HTML entities with their corresponding characters
    return html.replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
}

/**
 * 站点定制版 gallery：
 * 支持 <picture> 包裹的响应式图片（AVIF/WebP srcset），
 * 避免把 <figure> 插入 <picture> 内部导致结构错误。
 */
export default (container: HTMLElement) => {
    const images = container.querySelectorAll('img.gallery-image') as NodeListOf<HTMLImageElement>;
    for (const img of Array.from(images)) {
        const paragraph = img.closest('p');
        if (!paragraph || !container.contains(paragraph)) continue;

        if (paragraph.textContent.trim() == '') {
            paragraph.classList.add('no-text');
        }

        let isNewLineImage = paragraph.classList.contains('no-text');
        if (!isNewLineImage) continue;

        const parent = img.parentElement!;
        const isPicture = parent.tagName === 'PICTURE';

        const figure = document.createElement('figure');
        figure.classList.add('gallery-image');
        figure.style.setProperty('flex-grow', img.getAttribute('data-flex-grow') || '1');
        figure.style.setProperty('flex-basis', img.getAttribute('data-flex-basis') || '0');

        let el: HTMLElement;

        if (parent.tagName === 'A') {
            /// 已有链接包裹
            el = parent;
            el.classList.add('image-link');
            el.setAttribute('data-pswp-width', img.getAttribute('width')!);
            el.setAttribute('data-pswp-height', img.getAttribute('height')!);
        } else {
            /// 没有链接：创建链接包裹图片（picture 场景下包裹整个 picture）
            const a = document.createElement('a');
            a.href = img.src;
            a.setAttribute('class', 'image-link');
            a.setAttribute('target', '_blank');
            a.setAttribute('data-pswp-width', img.getAttribute('width')!);
            a.setAttribute('data-pswp-height', img.getAttribute('height')!);

            if (isPicture) {
                parent.parentNode!.insertBefore(a, parent);
                a.appendChild(parent);
            } else {
                parent.insertBefore(a, img);
                a.appendChild(img);
            }
            el = a;
        }

        el.parentElement!.insertBefore(figure, el);
        figure.appendChild(el);

        let caption = img.getAttribute('alt');
        if (img.getAttribute('data-title-escaped')) {
            caption = unescapeHtml(img.getAttribute('data-title-escaped')!);
        }
        if (caption) {
            const figcaption = document.createElement('figcaption');
            figcaption.innerHTML = caption;
            figure.appendChild(figcaption);
        }
    }

    const figuresEl = container.querySelectorAll('figure.gallery-image') as NodeListOf<HTMLElement>;

    let currentGallery: HTMLElement[] = [];

    for (const figure of Array.from(figuresEl)) {
        if (!currentGallery.length) {
            currentGallery = [figure];
        }
        else if (figure.previousElementSibling === currentGallery[currentGallery.length - 1]) {
            currentGallery.push(figure);
        }
        else if (currentGallery.length) {
            wrap(currentGallery);
            currentGallery = [figure];
        }
    }

    if (currentGallery.length > 0) {
        wrap(currentGallery);
    }
};
