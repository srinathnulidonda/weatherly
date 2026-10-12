// web/src/utils/nav.js
export function isNavActive(pathname, path) {
    const normalize = (value) => (value.length > 1 ? value.replace(/\/+$/, '') : value);
    const current = normalize(pathname);
    const target = normalize(path);
    if (target === '/') return current === '/';
    return current === target || current.startsWith(`${target}/`);
}