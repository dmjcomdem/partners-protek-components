// prettier-ignore
(function() {
    if (window._observerScriptloaded) {
        return;
    }

    /**
     * Создадим класс-обертку с блочным отображением.
     * @type {HTMLStyleElement}
     */
    const style = document.createElement('style');
    style.textContent = `
        .iae-tag-wrapper {
            display: block;
        }
    `;
    document.head.append(style);


    window.addEventListener('load', function() {

        /**
         * Добавление скрипта для инициализации тегов
         */
        function appendTagScript() {
            window.iaeTagReady();
            const script = document.createElement('script');
            script.setAttribute('src', 'https://cdn.iae.one/js/show.js');
            document.body.append(script);
        }

        /**
         * @param {HTMLElement} node
         * @param callback
         * @param options
         * @return {Function}
         */
        function mutationObserver(
            node,
            callback,
            options = {
                childList: true,
                subtree: true,
                attributes: true,
                attributeOldValue: false,
                characterDataOldValue: false
            }
        ) {
            if (!node) {
                console.warn('mutationObserver is not invoke');
                return;
            }

            const observer = new MutationObserver(function(mutations) {
                callback(mutations[0]);
            });
            observer.observe(node, options);
            return observer.disconnect;
        }


        /**
         * @param {HTMLIFrameElement} iframe
         * @return {Element}
         */
        function getFirstElementInIframe(iframe) {
            return iframe.contentDocument.body.firstElementChild;
        }

        /**
         * @param {HTMLIFrameElement} iframe
         * @return {boolean}
         */
        function hasContent(iframe) {
            return Boolean(getFirstElementInIframe(iframe));
        }

        /**
         * Функция, которая проверяет ширину и высоту контента
         *
         * Формируется 4 варианта отображения:
         * 1. iframe > body > null — нет данных
         * 2. iframe > body > img — заглушка
         * 3. iframe > body > a > img — баннер
         * 4. iframe > body > customHTML — наша разметка
         *
         * @param {HTMLIFrameElement} iframe
         */
        function resizeHandler(iframe) {
            const element = getFirstElementInIframe(iframe);
            if (!element) return;

            if (element.tagName === 'IMG') {
                element.style.width = '100%';
            }

            if (element.tagName === 'A') {
                const img = element.firstElementChild
                element.style.display = 'block';
                element.style.width = '100%';
                img.style.width = '100%';
                img.style.height = 'auto';
            }

            const height = element.offsetHeight;
            iframe.parentNode.style.width = '100%';
            iframe.parentNode.style.height = height + 'px';
        }

        /**
         * @param {HTMLIFrameElement} iframe
         */
        function autoResizeIframe(iframe) {
            if (!iframe) return;

            /**
             * Минимально-возможный способ проверять изменения размеров iframe-блоков
             */
            setInterval(function() {
                resizeHandler(iframe);
            }, 100);
        }

        /**
         * @param {HTMLIFrameElement} iframe
         */
        window.addEventListener('message', function(e) {
            if (typeof e.data === 'string' && e.data.startsWith('adserver::message')) {
                const data = JSON.parse(e.data.replace(/^adserver::message/g, ''));
                console.log(data);

                if (data.event === 'addToBasket') {
                    const result = { event: 'addToBasket', message: 'Отправленно в Iframe' };
                    e.source.postMessage('adserver::message' + JSON.stringify(result), '*');
                }
            }
        });

        mutationObserver(document.body, function(mutation) {
            if (mutation.target.tagName === 'IAE-TAG') {
                const node = mutation.addedNodes[0];
                const tag = mutation.target;

                if (node instanceof HTMLIFrameElement) {
                    node.addEventListener('load', function(event) {
                        const iframe = event.target;

                        if (iframe instanceof HTMLIFrameElement) {
                            if (hasContent(iframe)) {
                                autoResizeIframe(iframe);
                            } else {
                                tag.style.display = 'none';
                            }
                        }
                    });
                }
            }
        });

        appendTagScript();

        window._observerScriptloaded = true;
    });
})()
