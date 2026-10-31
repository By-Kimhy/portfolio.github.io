/*============= Content Protection JS ==============*/
(function () {
    // Form fields stay usable so visitors can still type and paste in the contact form
    function isEditable(el) {
        return el && el.closest && el.closest('input, textarea, select, [contenteditable="true"]');
    }

    // Disable text selection and image dragging with CSS
    var style = document.createElement('style');
    style.textContent =
        'body { -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none; -webkit-touch-callout: none; }' +
        'input, textarea, select, [contenteditable="true"] { -webkit-user-select: text; -moz-user-select: text; -ms-user-select: text; user-select: text; }' +
        'img { -webkit-user-drag: none; user-drag: none; pointer-events: auto; }' +
        '@media print { body { display: none !important; } }';
    document.head.appendChild(style);

    // Block right-click menu (Save image as..., Copy, Inspect)
    document.addEventListener('contextmenu', function (e) {
        if (!isEditable(e.target)) e.preventDefault();
    });

    // Block dragging images to the desktop
    document.addEventListener('dragstart', function (e) {
        if (e.target.tagName === 'IMG' || !isEditable(e.target)) e.preventDefault();
    });

    // Block selecting, copying and cutting text
    ['selectstart', 'copy', 'cut'].forEach(function (type) {
        document.addEventListener(type, function (e) {
            if (!isEditable(e.target)) e.preventDefault();
        });
    });

    // Clear the clipboard after Print Screen so the screenshot can't be pasted
    document.addEventListener('keyup', function (e) {
        if (e.key === 'PrintScreen' && navigator.clipboard) {
            navigator.clipboard.writeText('').catch(function () {});
        }
    });

    // Blur the page when it loses focus or a screenshot shortcut starts,
    // so screenshot tools (Snipping Tool, Win+Shift+S, Cmd+Shift+3/4/5) capture a blurred page
    var blurStyle = document.createElement('style');
    blurStyle.textContent =
        'html.protect-blur body { filter: blur(25px); }';
    document.head.appendChild(blurStyle);

    var unblurTimer;
    function blurPage() {
        clearTimeout(unblurTimer);
        document.documentElement.classList.add('protect-blur');
    }
    function unblurPage(delay) {
        clearTimeout(unblurTimer);
        unblurTimer = setTimeout(function () {
            if (document.hasFocus()) document.documentElement.classList.remove('protect-blur');
        }, delay || 0);
    }

    window.addEventListener('blur', function () {
        // Clicking into an embedded video or map also moves focus away; don't blur for that
        setTimeout(function () {
            if (!(document.activeElement && document.activeElement.tagName === 'IFRAME')) blurPage();
        }, 0);
    });
    window.addEventListener('focus', function () {
        unblurPage(300);
    });
    document.addEventListener('visibilitychange', function () {
        if (document.hidden) blurPage();
        else unblurPage(300);
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'PrintScreen' || (e.metaKey && e.shiftKey)) blurPage();
    });
    document.addEventListener('keyup', function (e) {
        if (e.key === 'PrintScreen' || e.key === 'Meta' || e.key === 'Shift') unblurPage(1500);
    });

    // Block printing and "Save as PDF"
    window.addEventListener('beforeprint', function () {
        document.body.style.display = 'none';
    });
    window.addEventListener('afterprint', function () {
        document.body.style.display = '';
    });

    // Block keyboard shortcuts: Ctrl/Cmd + C, X, A, S, U, P and F12 / DevTools
    document.addEventListener('keydown', function (e) {
        var key = (e.key || '').toLowerCase();
        var mod = e.ctrlKey || e.metaKey;

        if (key === 'f12') {
            e.preventDefault();
            return;
        }
        if (mod && e.shiftKey && ['i', 'j', 'c', 'k', 'e', 'm'].indexOf(key) !== -1) {
            e.preventDefault();
            return;
        }
        if (mod && ['s', 'u', 'p'].indexOf(key) !== -1) {
            e.preventDefault();
            return;
        }
        if (mod && ['c', 'x', 'a'].indexOf(key) !== -1 && !isEditable(e.target)) {
            e.preventDefault();
        }
    });
})();
