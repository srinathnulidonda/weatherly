// web/src/components/common/ScrollToTop.jsx
import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
    const { pathname } = useLocation();

    useLayoutEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}

export { ScrollToTop };
export default ScrollToTop;