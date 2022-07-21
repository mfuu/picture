
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail, { cancelable = false } = {}) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail, { cancelable });
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
                return !event.defaultPrevented;
            }
            return true;
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.48.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function userAgent(pattern) {
        if (typeof window !== 'undefined' && window.navigator) {
            return !!navigator.userAgent.match(pattern);
        }
    }
    const IE11OrLess = userAgent(/(?:Trident.*rv[ :]?11\.|msie|iemobile|Windows Phone)/i);
    userAgent(/Edge/i);
    userAgent(/firefox/i);
    userAgent(/safari/i) && !userAgent(/chrome/i) && !userAgent(/android/i);
    userAgent(/iP(ad|od|hone)/i);
    userAgent(/chrome/i) && userAgent(/android/i);
    function isBase64(str) {
        const RegExp = /^\s*data:([a-z]+\/[a-z0-9-+.]+(;[a-z-]+=[a-z0-9-]+)?)?(;base64)?,([a-z0-9!$&',()*+;=\-._~:@\/?%\s]*?)\s*$/i;
        return RegExp.test(str);
    }
    function isUrl(str) {
        const reg = new RegExp('^(?!mailto:)(?:(?:http|https|ftp)://|//)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$', 'i');
        return reg.test(str);
    }
    function blobToUrl(Blob) {
        var _a;
        if (window.createObjectURL !== undefined) {
            // basic
            return window.createObjectURL(Blob);
        }
        else if (window.URL.createObjectURL !== undefined) {
            // mozilla(firefox)
            return window.URL.createObjectURL(Blob);
        }
        else if (((_a = window.webkitURL) === null || _a === void 0 ? void 0 : _a.createObjectURL) !== undefined) {
            // webkit or chrome
            return window.webkitURL.createObjectURL(Blob);
        }
    }
    function base64ToBlob(str) {
        let arr = str.split(',');
        let mime = arr[0].match(/:(.*?);/)[1];
        let bstr = atob(arr[1]);
        let n = bstr.length;
        let u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    }
    function base64ToUrl(str) {
        return blobToUrl(base64ToBlob(str));
    }
    function getImageUrl(img) {
        if (img instanceof Blob) {
            return blobToUrl(img);
        }
        else if (typeof img === 'string') {
            if (isUrl(img))
                return img;
            else if (isBase64(img))
                return base64ToUrl(img);
            else
                throw new TypeError('Type Error: is not a valid image format');
        }
        else {
            throw new TypeError('Type Error: is not a valid image format');
        }
    }
    const captureMode = { capture: false, passive: false };
    /**
    * add specified event listener
    */
    function on(el, event, fn) {
        if (window.addEventListener) {
            el.addEventListener(event, fn, !IE11OrLess && captureMode);
        }
        else if (window.attachEvent) {
            el.addEventListener('on' + event, fn);
        }
    }
    /**
    * remove specified event listener
    */
    function off(el, event, fn) {
        if (window.removeEventListener) {
            el.removeEventListener(event, fn, !IE11OrLess && captureMode);
        }
        else if (window.detachEvent) {
            el.detachEvent('on' + event, fn);
        }
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const storeToolbarClick = writable(null); // 当前点击的 toolbar
    const storeImageUrl = writable(''); // 选中的文件
    const storeCurrentImage = writable(null); // 与显示的图片信息保持一致

    function createDefaultToolbarItemInfo(type) {
        let info;
        switch (type) {
            case 'undo':
                info = {
                    name: 'undo',
                    className: 'undo',
                    command: 'undo',
                    tooltip: 'undo',
                };
                break;
            case 'redo':
                info = {
                    name: 'redo',
                    className: 'redo',
                    command: 'redo',
                    tooltip: 'redo',
                };
                break;
            case 'text':
                info = {
                    name: 'text',
                    className: 'text',
                    tooltip: '添加文字',
                };
                break;
            case 'mosaic':
                info = {
                    name: 'mosaic',
                    className: 'mosaic',
                    command: 'mosaic',
                    tooltip: '马赛克',
                };
                break;
            case 'clip':
                info = {
                    name: 'clip',
                    className: 'clip',
                    tooltip: '裁剪',
                    command: 'clip'
                };
            // do nothing
        }
        return info;
    }

    /* src\components\Toolbar\index.svelte generated by Svelte v3.48.0 */

    const { Object: Object_1 } = globals;
    const file$5 = "src\\components\\Toolbar\\index.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    // (5:6) {#each toolbar as item }
    function create_each_block_1(ctx) {
    	let button;
    	let span;
    	let span_class_value;
    	let button_tooltip_value;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[5](/*item*/ ctx[12]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			span = element("span");
    			attr_dev(span, "class", span_class_value = "" + (null_to_empty(`mu-picture__toolbar-icons mu-picture__toolbar-${/*item*/ ctx[12].className}`) + " svelte-1usyhim"));
    			add_location(span, file$5, 6, 10, 262);
    			attr_dev(button, "tooltip", button_tooltip_value = /*item*/ ctx[12].tooltip);
    			add_location(button, file$5, 5, 8, 172);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, span);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*toolbars*/ 1 && span_class_value !== (span_class_value = "" + (null_to_empty(`mu-picture__toolbar-icons mu-picture__toolbar-${/*item*/ ctx[12].className}`) + " svelte-1usyhim"))) {
    				attr_dev(span, "class", span_class_value);
    			}

    			if (dirty & /*toolbars*/ 1 && button_tooltip_value !== (button_tooltip_value = /*item*/ ctx[12].tooltip)) {
    				attr_dev(button, "tooltip", button_tooltip_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(5:6) {#each toolbar as item }",
    		ctx
    	});

    	return block;
    }

    // (3:2) {#each toolbars as toolbar }
    function create_each_block(ctx) {
    	let div;
    	let t;
    	let each_value_1 = /*toolbar*/ ctx[9];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			attr_dev(div, "class", "mu-picture__toolbar-group svelte-1usyhim");
    			add_location(div, file$5, 3, 4, 91);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*toolbars, handleToolbarClick*/ 17) {
    				each_value_1 = /*toolbar*/ ctx[9];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(3:2) {#each toolbars as toolbar }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div1;
    	let t0;
    	let div0;
    	let input;
    	let t1;
    	let button;
    	let span;
    	let mounted;
    	let dispose;
    	let each_value = /*toolbars*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			div0 = element("div");
    			input = element("input");
    			t1 = space();
    			button = element("button");
    			span = element("span");
    			attr_dev(input, "type", "file");
    			set_style(input, "display", "none");
    			add_location(input, file$5, 13, 4, 472);
    			attr_dev(span, "class", "mu-picture__toolbar-icons mu-picture__toolbar-local");
    			add_location(span, file$5, 20, 6, 675);
    			attr_dev(button, "tooltip", '选择文件');
    			add_location(button, file$5, 19, 4, 609);
    			attr_dev(div0, "class", "mu-picture__picker");
    			add_location(div0, file$5, 12, 2, 434);
    			attr_dev(div1, "class", "mu-picture__toolbar svelte-1usyhim");
    			add_location(div1, file$5, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}

    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, input);
    			/*input_binding*/ ctx[6](input);
    			append_dev(div0, t1);
    			append_dev(div0, button);
    			append_dev(button, span);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*handleFileChange*/ ctx[2], false, false, false),
    					listen_dev(button, "click", /*handleButtonClick*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*toolbars, handleToolbarClick*/ 17) {
    				each_value = /*toolbars*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, t0);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    			/*input_binding*/ ctx[6](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Toolbar', slots, []);
    	let toolbars = [];
    	let inputRef;
    	const dispatch = createEventDispatcher();
    	const defaults = [['undo', 'redo'], ['text', 'mosaic', 'clip']];

    	function handleFileChange(e) {
    		const blob = e.target.files[0];
    		if (blob) storeImageUrl.set(getImageUrl(blob));
    		dispatch('change', e.target.files);
    	}

    	function handleButtonClick(e) {
    		inputRef.click();
    		e.preventDefault();
    	}

    	function handleToolbarClick(item) {
    		storeToolbarClick.set(item);
    	}

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Toolbar> was created with unknown prop '${key}'`);
    	});

    	const click_handler = item => handleToolbarClick(item);

    	function input_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			inputRef = $$value;
    			$$invalidate(1, inputRef);
    		});
    	}

    	$$self.$capture_state = () => ({
    		getImageUrl,
    		createEventDispatcher,
    		storeImageUrl,
    		createDefaultToolbarItemInfo,
    		storeToolbarClick,
    		toolbars,
    		inputRef,
    		dispatch,
    		defaults,
    		handleFileChange,
    		handleButtonClick,
    		handleToolbarClick
    	});

    	$$self.$inject_state = $$props => {
    		if ('toolbars' in $$props) $$invalidate(0, toolbars = $$props.toolbars);
    		if ('inputRef' in $$props) $$invalidate(1, inputRef = $$props.inputRef);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*toolbars*/ 1) {
    			{
    				defaults.forEach((group, index) => {
    					group.forEach(item => {
    						if (!toolbars[index]) $$invalidate(0, toolbars[index] = [], toolbars);
    						toolbars[index].push(Object.assign({}, createDefaultToolbarItemInfo(item)));
    					});
    				});
    			}
    		}
    	};

    	return [
    		toolbars,
    		inputRef,
    		handleFileChange,
    		handleButtonClick,
    		handleToolbarClick,
    		click_handler,
    		input_binding
    	];
    }

    class Toolbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Toolbar",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    class UndoRedo {
        constructor() {
            this.stack = [];
            this.index = -1;
        }
        current(image) {
            if (image)
                this.stack[this.index] = image;
            return this.stack[this.index];
        }
        insert(canvas) {
            const url = canvas.toDataURL();
            const image = new Image();
            image.src = url;
            if (this.index < this.stack.length - 1)
                this.stack.length = this.index + 1;
            this.stack.push(image);
            this.index += 1;
        }
        revert(canvas, context) {
            if (this.index > 0) {
                this.index = 0;
                this.draw(canvas, context);
            }
        }
        undo(canvas, context) {
            if (this.index > 0) {
                this.index -= 1;
                this.draw(canvas, context);
            }
        }
        redo(canvas, context) {
            if (this.index < this.stack.length - 1) {
                this.index += 1;
                this.draw(canvas, context);
            }
        }
        draw(canvas, context) {
            const image = this.stack[this.index];
            if (!image)
                return;
            this.clear(canvas, context);
            context.drawImage(image, 0, 0);
        }
        clear(canvas, context) {
            context.clearRect(0, 0, canvas.width, canvas.height);
        }
    }

    /**
     * Add mosaic in canvas
     */
    function Mosaic(params) {
        const { top, right, bottom, left } = params.rect;
        const { size, degree } = params.mosaic;
        const x = params.event.clientX;
        const y = params.event.clientY;
        if (x < left || x > right || y < top || y > bottom)
            return;
        if (params.position.x - x > size / 2 || x - params.position.x > size / 2 || params.position.y - y > size / 2 || y - params.position.y > size / 2) {
            const image = params.context.getImageData(x - left, y - top, size, size);
            const { width, height } = image;
            // 等分画布
            const stepW = width / degree;
            const stepH = height / degree;
            // 这里是循环画布的像素点
            for (let i = 0; i < stepH; i++) {
                for (let j = 0; j < stepW; j++) {
                    // 获取一个小方格的随机颜色，这是小方格的随机位置获取的
                    const color = getXY(image, j * degree + Math.floor(Math.random() * degree), i * degree + Math.floor(Math.random() * degree));
                    // 这里是循环小方格的像素点，
                    for (let k = 0; k < degree; k++) {
                        for (let l = 0; l < degree; l++) {
                            // 设置小方格的颜色
                            setXY(image, j * degree + l, i * degree + k, color);
                        }
                    }
                }
            }
            params.callback({ image, x, y, left, top });
        }
    }
    function getXY(obj, x, y) {
        const w = obj.width;
        obj.height;
        const d = obj.data;
        const color = [];
        color[0] = d[4 * (y * w + x)];
        color[1] = d[4 * (y * w + x) + 1];
        color[2] = d[4 * (y * w + x) + 2];
        color[3] = d[4 * (y * w + x) + 3];
        return color;
    }
    function setXY(obj, x, y, color) {
        const w = obj.width;
        obj.height;
        const d = obj.data;
        d[4 * (y * w + x)] = color[0];
        d[4 * (y * w + x) + 1] = color[1];
        d[4 * (y * w + x) + 2] = color[2];
        d[4 * (y * w + x) + 3] = color[3];
    }

    /* src\components\Edit\index.svelte generated by Svelte v3.48.0 */

    const file$4 = "src\\components\\Edit\\index.svelte";

    function create_fragment$4(ctx) {
    	let canvas_1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			canvas_1 = element("canvas");
    			attr_dev(canvas_1, "width", /*canvasWidth*/ ctx[1]);
    			attr_dev(canvas_1, "height", /*canvasHeight*/ ctx[2]);
    			add_location(canvas_1, file$4, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, canvas_1, anchor);
    			/*canvas_1_binding*/ ctx[6](canvas_1);

    			if (!mounted) {
    				dispose = listen_dev(canvas_1, "pointerdown", /*onDown*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(canvas_1);
    			/*canvas_1_binding*/ ctx[6](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const KEYZ = 'KeyZ';
    const KEYY = 'KeyY';

    function instance$4($$self, $$props, $$invalidate) {
    	let $storeToolbarClick;
    	let $storeImageUrl;
    	validate_store(storeToolbarClick, 'storeToolbarClick');
    	component_subscribe($$self, storeToolbarClick, $$value => $$invalidate(4, $storeToolbarClick = $$value));
    	validate_store(storeImageUrl, 'storeImageUrl');
    	component_subscribe($$self, storeImageUrl, $$value => $$invalidate(5, $storeImageUrl = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Edit', slots, []);
    	let undoRedo = new UndoRedo();
    	let canvas;
    	let context;
    	let image = new Image();
    	let position = { x: 0, y: 0 };
    	let mosaic = { size: 20, degree: 5 };
    	let canvasWidth = 1000;
    	let canvasHeight = 500;

    	onMount(() => {
    		context = canvas.getContext('2d');
    		on(document, 'keydown', onKeyDown);
    	});

    	onDestroy(() => {
    		off(document, 'keydown', onKeyDown);
    	});

    	function handleImgChange(url) {
    		if (!url) return;
    		context.clearRect(0, 0, canvas.width, canvas.height);
    		image.src = url;

    		image.onload = () => {
    			let dx, dy, dw, dh;
    			const { width, height } = image;
    			const imageRate = width / height;
    			const canvasRate = canvasWidth / canvasHeight;

    			// 如果宽高都比画布小，直接取图片大小，否则等比缩放
    			if (width < canvasWidth && height < canvasHeight) {
    				dw = width;
    				dh = height;
    			} else if (imageRate > canvasRate) {
    				dw = canvasWidth;
    				dh = canvasWidth / imageRate;
    			} else {
    				dh = canvasHeight;
    				dw = canvasHeight * imageRate;
    			}

    			dx = (canvasWidth - dw) / 2;
    			dy = (canvasHeight - dh) / 2;
    			context.drawImage(image, dx, dy, dw, dh);
    			undoRedo.insert(canvas);
    			updateStore();
    		};
    	}

    	function handleToolbarClick(info) {
    		if (!info) return;
    		if (info.command === 'undo') undoRedo.undo(canvas, context);
    		if (info.command === 'redo') undoRedo.redo(canvas, context);
    	}

    	function updateStore() {
    		storeCurrentImage.set(undoRedo.current());
    	}

    	// ctrl + z and ctrl + y
    	function onKeyDown(e) {
    		e.preventDefault();
    		e.stopPropagation();

    		if (e.ctrlKey || e.metaKey) {
    			if (e.code === KEYZ) {
    				undoRedo.undo(canvas, context);
    			} else if (e.code === KEYY) {
    				undoRedo.redo(canvas, context);
    			}

    			updateStore();
    		}
    	}

    	function onDown(event) {
    		event.preventDefault();
    		event.stopPropagation();

    		if ($storeToolbarClick && $storeToolbarClick.command === 'mosaic') {
    			document.onpointermove = e => {
    				event.preventDefault();
    				event.stopPropagation();
    				const rect = canvas.getBoundingClientRect();

    				Mosaic({
    					event: e,
    					rect,
    					position,
    					mosaic,
    					context,
    					callback: params => {
    						const { image, x, y, left, top } = params;
    						context.putImageData(image, x - left, y - top);
    						position = { x, y };
    					}
    				});
    			};
    		}

    		document.onpointerup = onUp;
    		document.onpointercancel = onUp;
    	}

    	function onUp() {
    		document.onpointermove = null;
    		document.onpointerup = null;
    		document.onpointercancel = null;
    		undoRedo.insert(canvas);
    		updateStore();
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Edit> was created with unknown prop '${key}'`);
    	});

    	function canvas_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			canvas = $$value;
    			$$invalidate(0, canvas);
    		});
    	}

    	$$self.$capture_state = () => ({
    		on,
    		off,
    		UndoRedo,
    		onDestroy,
    		onMount,
    		Mosaic,
    		storeImageUrl,
    		storeCurrentImage,
    		storeToolbarClick,
    		KEYZ,
    		KEYY,
    		undoRedo,
    		canvas,
    		context,
    		image,
    		position,
    		mosaic,
    		canvasWidth,
    		canvasHeight,
    		handleImgChange,
    		handleToolbarClick,
    		updateStore,
    		onKeyDown,
    		onDown,
    		onUp,
    		$storeToolbarClick,
    		$storeImageUrl
    	});

    	$$self.$inject_state = $$props => {
    		if ('undoRedo' in $$props) undoRedo = $$props.undoRedo;
    		if ('canvas' in $$props) $$invalidate(0, canvas = $$props.canvas);
    		if ('context' in $$props) context = $$props.context;
    		if ('image' in $$props) image = $$props.image;
    		if ('position' in $$props) position = $$props.position;
    		if ('mosaic' in $$props) mosaic = $$props.mosaic;
    		if ('canvasWidth' in $$props) $$invalidate(1, canvasWidth = $$props.canvasWidth);
    		if ('canvasHeight' in $$props) $$invalidate(2, canvasHeight = $$props.canvasHeight);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$storeImageUrl*/ 32) {
    			// Executed when the selected image changes
    			(handleImgChange($storeImageUrl));
    		}

    		if ($$self.$$.dirty & /*$storeToolbarClick*/ 16) {
    			(handleToolbarClick($storeToolbarClick));
    		}
    	};

    	return [
    		canvas,
    		canvasWidth,
    		canvasHeight,
    		onDown,
    		$storeToolbarClick,
    		$storeImageUrl,
    		canvas_1_binding
    	];
    }

    class Edit extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Edit",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\components\Clip\Mask.svelte generated by Svelte v3.48.0 */
    const file$3 = "src\\components\\Clip\\Mask.svelte";

    function create_fragment$3(ctx) {
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div2;
    	let t2;
    	let div3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = space();
    			div1 = element("div");
    			t1 = space();
    			div2 = element("div");
    			t2 = space();
    			div3 = element("div");
    			attr_dev(div0, "class", "mu-picture__clip-mask top");
    			set_style(div0, "height", formatNum(/*style*/ ctx[0].top) + 'px', false);
    			add_location(div0, file$3, 1, 0, 14);
    			attr_dev(div1, "class", "mu-picture__clip-mask right");
    			set_style(div1, "top", /*style*/ ctx[0].top + 'px', false);
    			set_style(div1, "left", /*style*/ ctx[0].left + /*style*/ ctx[0].width + 'px', false);
    			set_style(div1, "height", /*style*/ ctx[0].height + 'px', false);
    			add_location(div1, file$3, 7, 0, 170);
    			attr_dev(div2, "class", "mu-picture__clip-mask bottom");
    			set_style(div2, "top", /*style*/ ctx[0].top + /*style*/ ctx[0].height + 'px', false);
    			add_location(div2, file$3, 15, 0, 405);
    			attr_dev(div3, "class", "mu-picture__clip-mask left");
    			set_style(div3, "top", /*style*/ ctx[0].top + 'px', false);
    			set_style(div3, "width", formatNum(/*style*/ ctx[0].left) + 'px', false);
    			set_style(div3, "height", /*style*/ ctx[0].height + 'px', false);
    			add_location(div3, file$3, 21, 0, 564);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div2, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div3, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "pointerdown", /*handlePointerDown*/ ctx[1], false, false, false),
    					listen_dev(div1, "pointerdown", /*handlePointerDown*/ ctx[1], false, false, false),
    					listen_dev(div2, "pointerdown", /*handlePointerDown*/ ctx[1], false, false, false),
    					listen_dev(div3, "pointerdown", /*handlePointerDown*/ ctx[1], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*style*/ 1) {
    				set_style(div0, "height", formatNum(/*style*/ ctx[0].top) + 'px', false);
    			}

    			if (dirty & /*style*/ 1) {
    				set_style(div1, "top", /*style*/ ctx[0].top + 'px', false);
    			}

    			if (dirty & /*style*/ 1) {
    				set_style(div1, "left", /*style*/ ctx[0].left + /*style*/ ctx[0].width + 'px', false);
    			}

    			if (dirty & /*style*/ 1) {
    				set_style(div1, "height", /*style*/ ctx[0].height + 'px', false);
    			}

    			if (dirty & /*style*/ 1) {
    				set_style(div2, "top", /*style*/ ctx[0].top + /*style*/ ctx[0].height + 'px', false);
    			}

    			if (dirty & /*style*/ 1) {
    				set_style(div3, "top", /*style*/ ctx[0].top + 'px', false);
    			}

    			if (dirty & /*style*/ 1) {
    				set_style(div3, "width", formatNum(/*style*/ ctx[0].left) + 'px', false);
    			}

    			if (dirty & /*style*/ 1) {
    				set_style(div3, "height", /*style*/ ctx[0].height + 'px', false);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div2);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div3);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function formatNum(num) {
    	return num <= 0 ? 0 : num;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Mask', slots, []);
    	let { style } = $$props;
    	let { container } = $$props;
    	const dispatch = createEventDispatcher();
    	let clipStyle = { left: 0, top: 0, width: 0, height: 0 };

    	function handlePointerDown(event) {
    		event.preventDefault();
    		event.stopPropagation();
    		const rect = container.getBoundingClientRect();
    		clipStyle.left = event.clientX - rect.left;
    		clipStyle.top = event.clientY - rect.top;
    		let started = false;

    		document.onpointermove = e => {
    			if (!started) {
    				started = true;
    				dispatch('start');
    			}

    			const disX = e.clientX - event.clientX;
    			const disY = e.clientY - event.clientY;
    			clipStyle.width = Math.abs(disX);
    			clipStyle.height = Math.abs(disY);

    			// 向上/向左拖拽
    			if (disX < 0) clipStyle.left = e.clientX - rect.left;

    			if (disY < 0) clipStyle.top = e.clientY - rect.top;
    			dispatch('move', clipStyle);
    		};

    		document.onpointerup = onUp;
    		document.onpointercancel = onUp;
    	}

    	function onUp() {
    		document.onpointermove = null;
    		document.onpointerup = null;
    		document.onpointercancel = null;
    		dispatch('end');
    	}

    	const writable_props = ['style', 'container'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Mask> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('style' in $$props) $$invalidate(0, style = $$props.style);
    		if ('container' in $$props) $$invalidate(2, container = $$props.container);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		style,
    		container,
    		dispatch,
    		clipStyle,
    		formatNum,
    		handlePointerDown,
    		onUp
    	});

    	$$self.$inject_state = $$props => {
    		if ('style' in $$props) $$invalidate(0, style = $$props.style);
    		if ('container' in $$props) $$invalidate(2, container = $$props.container);
    		if ('clipStyle' in $$props) clipStyle = $$props.clipStyle;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [style, handlePointerDown, container];
    }

    class Mask extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { style: 0, container: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Mask",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*style*/ ctx[0] === undefined && !('style' in props)) {
    			console.warn("<Mask> was created without expected prop 'style'");
    		}

    		if (/*container*/ ctx[2] === undefined && !('container' in props)) {
    			console.warn("<Mask> was created without expected prop 'container'");
    		}
    	}

    	get style() {
    		throw new Error("<Mask>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<Mask>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get container() {
    		throw new Error("<Mask>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set container(value) {
    		throw new Error("<Mask>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Clip\Oprate.svelte generated by Svelte v3.48.0 */
    const file$2 = "src\\components\\Clip\\Oprate.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let button0;
    	let span0;
    	let t;
    	let button1;
    	let span1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button0 = element("button");
    			span0 = element("span");
    			t = space();
    			button1 = element("button");
    			span1 = element("span");
    			attr_dev(span0, "class", "mu-picture__toolbar-icons mu-picture__toolbar-cancel");
    			add_location(span0, file$2, 2, 4, 139);
    			add_location(button0, file$2, 1, 2, 99);
    			attr_dev(span1, "class", "mu-picture__toolbar-icons mu-picture__toolbar-ok");
    			add_location(span1, file$2, 5, 4, 266);
    			add_location(button1, file$2, 4, 2, 230);
    			attr_dev(div, "class", "mu-picture__clip-oprate");
    			set_style(div, "top", /*opStyle*/ ctx[0].top, false);
    			set_style(div, "bottom", /*opStyle*/ ctx[0].bottom, false);
    			add_location(div, file$2, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button0);
    			append_dev(button0, span0);
    			append_dev(div, t);
    			append_dev(div, button1);
    			append_dev(button1, span1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*handleCancel*/ ctx[1], false, false, false),
    					listen_dev(button1, "click", handleOk, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*opStyle*/ 1) {
    				set_style(div, "top", /*opStyle*/ ctx[0].top, false);
    			}

    			if (dirty & /*opStyle*/ 1) {
    				set_style(div, "bottom", /*opStyle*/ ctx[0].bottom, false);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function handleOk() {
    	
    } // 

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Oprate', slots, []);
    	let { opStyle } = $$props;

    	function handleCancel() {
    		storeToolbarClick.set({ name: 'clip' });
    	}

    	const writable_props = ['opStyle'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Oprate> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('opStyle' in $$props) $$invalidate(0, opStyle = $$props.opStyle);
    	};

    	$$self.$capture_state = () => ({
    		storeToolbarClick,
    		opStyle,
    		handleOk,
    		handleCancel
    	});

    	$$self.$inject_state = $$props => {
    		if ('opStyle' in $$props) $$invalidate(0, opStyle = $$props.opStyle);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [opStyle, handleCancel];
    }

    class Oprate extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { opStyle: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Oprate",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*opStyle*/ ctx[0] === undefined && !('opStyle' in props)) {
    			console.warn("<Oprate> was created without expected prop 'opStyle'");
    		}
    	}

    	get opStyle() {
    		throw new Error("<Oprate>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set opStyle(value) {
    		throw new Error("<Oprate>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Clip\index.svelte generated by Svelte v3.48.0 */
    const file$1 = "src\\components\\Clip\\index.svelte";

    // (11:2) {#if maskVisible}
    function create_if_block$1(ctx) {
    	let span0;
    	let t0;
    	let span1;
    	let t1;
    	let span2;
    	let t2;
    	let span3;
    	let t3;
    	let span4;
    	let t4;
    	let span5;
    	let t5;
    	let span6;
    	let t6;
    	let span7;
    	let t7;
    	let oprate;
    	let current;
    	let mounted;
    	let dispose;

    	oprate = new Oprate({
    			props: { opStyle: /*opStyle*/ ctx[6] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			span0 = element("span");
    			t0 = space();
    			span1 = element("span");
    			t1 = space();
    			span2 = element("span");
    			t2 = space();
    			span3 = element("span");
    			t3 = space();
    			span4 = element("span");
    			t4 = space();
    			span5 = element("span");
    			t5 = space();
    			span6 = element("span");
    			t6 = space();
    			span7 = element("span");
    			t7 = space();
    			create_component(oprate.$$.fragment);
    			attr_dev(span0, "class", "mu-picture__clip-dot left-top");
    			add_location(span0, file$1, 11, 4, 338);
    			attr_dev(span1, "class", "mu-picture__clip-dot top");
    			add_location(span1, file$1, 12, 4, 448);
    			attr_dev(span2, "class", "mu-picture__clip-dot right-top");
    			add_location(span2, file$1, 13, 4, 552);
    			attr_dev(span3, "class", "mu-picture__clip-dot right");
    			add_location(span3, file$1, 14, 4, 663);
    			attr_dev(span4, "class", "mu-picture__clip-dot right-down");
    			add_location(span4, file$1, 15, 4, 769);
    			attr_dev(span5, "class", "mu-picture__clip-dot down");
    			add_location(span5, file$1, 16, 4, 881);
    			attr_dev(span6, "class", "mu-picture__clip-dot left-down");
    			add_location(span6, file$1, 17, 4, 986);
    			attr_dev(span7, "class", "mu-picture__clip-dot left");
    			add_location(span7, file$1, 18, 4, 1097);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, span1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, span2, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, span3, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, span4, anchor);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, span5, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, span6, anchor);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, span7, anchor);
    			insert_dev(target, t7, anchor);
    			mount_component(oprate, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(span0, "pointerdown", /*pointerdown_handler*/ ctx[11], false, false, false),
    					listen_dev(span1, "pointerdown", /*pointerdown_handler_1*/ ctx[12], false, false, false),
    					listen_dev(span2, "pointerdown", /*pointerdown_handler_2*/ ctx[13], false, false, false),
    					listen_dev(span3, "pointerdown", /*pointerdown_handler_3*/ ctx[14], false, false, false),
    					listen_dev(span4, "pointerdown", /*pointerdown_handler_4*/ ctx[15], false, false, false),
    					listen_dev(span5, "pointerdown", /*pointerdown_handler_5*/ ctx[16], false, false, false),
    					listen_dev(span6, "pointerdown", /*pointerdown_handler_6*/ ctx[17], false, false, false),
    					listen_dev(span7, "pointerdown", /*pointerdown_handler_7*/ ctx[18], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const oprate_changes = {};
    			if (dirty & /*opStyle*/ 64) oprate_changes.opStyle = /*opStyle*/ ctx[6];
    			oprate.$set(oprate_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(oprate.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(oprate.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(span1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(span2);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(span3);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(span4);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(span5);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(span6);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(span7);
    			if (detaching) detach_dev(t7);
    			destroy_component(oprate, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(11:2) {#if maskVisible}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div0;
    	let t0;
    	let mask;
    	let t1;
    	let div1;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*maskVisible*/ ctx[4] && create_if_block$1(ctx);

    	mask = new Mask({
    			props: {
    				style: /*clipStyle*/ ctx[5],
    				container: /*container*/ ctx[0]
    			},
    			$$inline: true
    		});

    	mask.$on("start", /*handleStartClip*/ ctx[7]);
    	mask.$on("move", /*handleInitClip*/ ctx[8]);
    	mask.$on("end", /*handleFinishedClip*/ ctx[9]);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			if (if_block) if_block.c();
    			t0 = space();
    			create_component(mask.$$.fragment);
    			t1 = space();
    			div1 = element("div");
    			attr_dev(div0, "class", "mu-picture__clip");
    			set_style(div0, "display", /*clipVisible*/ ctx[3] ? '' : 'none', false);
    			set_style(div0, "width", /*clipStyle*/ ctx[5].width + 'px', false);
    			set_style(div0, "height", /*clipStyle*/ ctx[5].height + 'px', false);
    			set_style(div0, "left", /*clipStyle*/ ctx[5].left + 'px', false);
    			set_style(div0, "top", /*clipStyle*/ ctx[5].top + 'px', false);
    			add_location(div0, file$1, 0, 0, 0);
    			attr_dev(div1, "class", "mu-picture__clip-hiddenfull");
    			add_location(div1, file$1, 32, 0, 1413);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			if (if_block) if_block.m(div0, null);
    			/*div0_binding*/ ctx[19](div0);
    			insert_dev(target, t0, anchor);
    			mount_component(mask, target, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);
    			/*div1_binding*/ ctx[20](div1);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div0, "pointerdown", /*handlePointerDown*/ ctx[10], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*maskVisible*/ ctx[4]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*maskVisible*/ 16) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div0, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*clipVisible*/ 8) {
    				set_style(div0, "display", /*clipVisible*/ ctx[3] ? '' : 'none', false);
    			}

    			if (dirty & /*clipStyle*/ 32) {
    				set_style(div0, "width", /*clipStyle*/ ctx[5].width + 'px', false);
    			}

    			if (dirty & /*clipStyle*/ 32) {
    				set_style(div0, "height", /*clipStyle*/ ctx[5].height + 'px', false);
    			}

    			if (dirty & /*clipStyle*/ 32) {
    				set_style(div0, "left", /*clipStyle*/ ctx[5].left + 'px', false);
    			}

    			if (dirty & /*clipStyle*/ 32) {
    				set_style(div0, "top", /*clipStyle*/ ctx[5].top + 'px', false);
    			}

    			const mask_changes = {};
    			if (dirty & /*clipStyle*/ 32) mask_changes.style = /*clipStyle*/ ctx[5];
    			if (dirty & /*container*/ 1) mask_changes.container = /*container*/ ctx[0];
    			mask.$set(mask_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(mask.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(mask.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (if_block) if_block.d();
    			/*div0_binding*/ ctx[19](null);
    			if (detaching) detach_dev(t0);
    			destroy_component(mask, detaching);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			/*div1_binding*/ ctx[20](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const opOffset = 35;

    function instance$1($$self, $$props, $$invalidate) {
    	let containerRect;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Clip', slots, []);
    	let { container } = $$props;
    	let clipRef;
    	let cipFull;
    	let minSize = 50;
    	let clipVisible = false;
    	let maskVisible = false;
    	const clipStyle = { left: 0, top: 0, width: 0, height: 0 };
    	const lastPostion = { x: 0, y: 0 };
    	const opStyle = { bottom: `-${opOffset}px`, top: '' };

    	onMount(() => {
    		const { clientWidth, clientHeight } = cipFull;
    		$$invalidate(5, clipStyle.left = clientWidth / 2 - clipStyle.width / 2, clipStyle);
    		$$invalidate(5, clipStyle.top = clientHeight / 2 - clipStyle.height / 2, clipStyle);
    	});

    	function handleStartClip() {
    		$$invalidate(3, clipVisible = true);
    		$$invalidate(4, maskVisible = false);
    	}

    	function handleInitClip(e) {
    		const { top, left, height, width } = e.detail;
    		$$invalidate(5, clipStyle.height = height, clipStyle);
    		$$invalidate(5, clipStyle.width = width, clipStyle);
    		$$invalidate(5, clipStyle.top = top, clipStyle);
    		$$invalidate(5, clipStyle.left = left, clipStyle);
    	}

    	function handleFinishedClip() {
    		$$invalidate(4, maskVisible = true);
    	}

    	function handlePointerDown(event, dir) {
    		event.preventDefault();
    		event.stopPropagation();
    		lastPostion.x = event.clientX;
    		lastPostion.y = event.clientY;
    		$$invalidate(1, clipRef.style['will-change'] = 'top, left, width, height', clipRef);

    		document.onpointermove = evt => {
    			event.preventDefault();
    			event.stopPropagation();

    			// 边界值检测
    			// 获取鼠标位置，和元素初始offset进行对比，
    			const chaX = evt.clientX - clipStyle.left;

    			const chaY = evt.clientY - clipStyle.top;

    			// 计算鼠标两次移动的差值
    			const disX = evt.clientX - lastPostion.x;

    			const disY = evt.clientY - lastPostion.y;

    			switch (dir) {
    				case 'lt':
    					// 向左上方拉伸，改变 width, height, left, top
    					if (chaX >= clipStyle.width - minSize || chaY >= clipStyle.height - minSize) return;
    					$$invalidate(5, clipStyle.width += disX * -1, clipStyle);
    					$$invalidate(5, clipStyle.height += disY * -1, clipStyle);
    					$$invalidate(5, clipStyle.left += disX, clipStyle);
    					$$invalidate(5, clipStyle.top += disY, clipStyle);
    					break;
    				case 't':
    					// 向上拉伸，改变 height, top
    					if (chaY >= clipStyle.height - minSize) return;
    					$$invalidate(5, clipStyle.height += disY * -1, clipStyle);
    					$$invalidate(5, clipStyle.top += disY, clipStyle);
    					break;
    				case 'rt':
    					// 向右上方拉伸，改变 width, height, top
    					if (chaX <= minSize || chaY >= clipStyle.height - minSize) return;
    					$$invalidate(5, clipStyle.width += disX, clipStyle);
    					$$invalidate(5, clipStyle.height += disY * -1, clipStyle);
    					$$invalidate(5, clipStyle.top += disY, clipStyle);
    					break;
    				case 'r':
    					// 向右拉伸，只改变 width
    					if (chaX <= minSize) return;
    					$$invalidate(5, clipStyle.width += disX, clipStyle);
    					break;
    				case 'rd':
    					// 向右下方拉伸，改变 height, width
    					if (chaX <= minSize || chaY <= minSize) return;
    					$$invalidate(5, clipStyle.width += disX, clipStyle);
    					$$invalidate(5, clipStyle.height += disY, clipStyle);
    					break;
    				case 'd':
    					// 向下拉伸，只改变 height
    					if (chaY <= minSize) return;
    					$$invalidate(5, clipStyle.height += disY, clipStyle);
    					break;
    				case 'ld':
    					// 向左下方拉伸，改变 width, height, left
    					if (chaX >= clipStyle.width - minSize || chaY <= minSize) return;
    					$$invalidate(5, clipStyle.width += disX * -1, clipStyle);
    					$$invalidate(5, clipStyle.height += disY, clipStyle);
    					$$invalidate(5, clipStyle.left += disX, clipStyle);
    					break;
    				case 'l':
    					// 向左拉伸，改变 width 和 left 值
    					if (chaX >= clipStyle.width - minSize) return;
    					$$invalidate(5, clipStyle.width += disX * -1, clipStyle);
    					$$invalidate(5, clipStyle.left += disX, clipStyle);
    					break;
    				default:
    					// 如果按下位置不在点上，整体移动
    					$$invalidate(5, clipStyle.left += disX, clipStyle);
    					$$invalidate(5, clipStyle.top += disY, clipStyle);
    					break;
    			}

    			// reset position
    			lastPostion.x = evt.clientX;

    			lastPostion.y = evt.clientY;

    			// check clip oprate position
    			if (clipStyle.top + clipStyle.height + 50 > containerRect.height) {
    				$$invalidate(6, opStyle.bottom = '', opStyle);
    				$$invalidate(6, opStyle.top = `-${opOffset}px`, opStyle);
    			} else if (clipStyle.top < 50) {
    				$$invalidate(6, opStyle.bottom = `-${opOffset}px`, opStyle);
    				$$invalidate(6, opStyle.top = '', opStyle);
    			}
    		};

    		document.onpointerup = onUp;
    		document.onpointercancel = onUp;
    	}

    	function onUp() {
    		$$invalidate(1, clipRef.style['will-change'] = 'auto', clipRef);
    		document.onpointermove = null;
    		document.onpointerup = null;
    		document.onpointercancel = null;
    	}

    	const writable_props = ['container'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Clip> was created with unknown prop '${key}'`);
    	});

    	const pointerdown_handler = e => handlePointerDown(e, 'lt');
    	const pointerdown_handler_1 = e => handlePointerDown(e, 't');
    	const pointerdown_handler_2 = e => handlePointerDown(e, 'rt');
    	const pointerdown_handler_3 = e => handlePointerDown(e, 'r');
    	const pointerdown_handler_4 = e => handlePointerDown(e, 'rd');
    	const pointerdown_handler_5 = e => handlePointerDown(e, 'd');
    	const pointerdown_handler_6 = e => handlePointerDown(e, 'ld');
    	const pointerdown_handler_7 = e => handlePointerDown(e, 'l');

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			clipRef = $$value;
    			$$invalidate(1, clipRef);
    		});
    	}

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			cipFull = $$value;
    			$$invalidate(2, cipFull);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('container' in $$props) $$invalidate(0, container = $$props.container);
    	};

    	$$self.$capture_state = () => ({
    		Mask,
    		Oprate,
    		onMount,
    		container,
    		clipRef,
    		cipFull,
    		minSize,
    		clipVisible,
    		maskVisible,
    		clipStyle,
    		lastPostion,
    		opOffset,
    		opStyle,
    		handleStartClip,
    		handleInitClip,
    		handleFinishedClip,
    		handlePointerDown,
    		onUp,
    		containerRect
    	});

    	$$self.$inject_state = $$props => {
    		if ('container' in $$props) $$invalidate(0, container = $$props.container);
    		if ('clipRef' in $$props) $$invalidate(1, clipRef = $$props.clipRef);
    		if ('cipFull' in $$props) $$invalidate(2, cipFull = $$props.cipFull);
    		if ('minSize' in $$props) minSize = $$props.minSize;
    		if ('clipVisible' in $$props) $$invalidate(3, clipVisible = $$props.clipVisible);
    		if ('maskVisible' in $$props) $$invalidate(4, maskVisible = $$props.maskVisible);
    		if ('containerRect' in $$props) containerRect = $$props.containerRect;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*container*/ 1) {
    			containerRect = container.getBoundingClientRect();
    		}
    	};

    	return [
    		container,
    		clipRef,
    		cipFull,
    		clipVisible,
    		maskVisible,
    		clipStyle,
    		opStyle,
    		handleStartClip,
    		handleInitClip,
    		handleFinishedClip,
    		handlePointerDown,
    		pointerdown_handler,
    		pointerdown_handler_1,
    		pointerdown_handler_2,
    		pointerdown_handler_3,
    		pointerdown_handler_4,
    		pointerdown_handler_5,
    		pointerdown_handler_6,
    		pointerdown_handler_7,
    		div0_binding,
    		div1_binding
    	];
    }

    class Clip extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { container: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Clip",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*container*/ ctx[0] === undefined && !('container' in props)) {
    			console.warn("<Clip> was created without expected prop 'container'");
    		}
    	}

    	get container() {
    		throw new Error("<Clip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set container(value) {
    		throw new Error("<Clip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.48.0 */
    const file = "src\\App.svelte";

    // (7:6) {#if clipVisible }
    function create_if_block(ctx) {
    	let clip;
    	let current;

    	clip = new Clip({
    			props: { container: /*container*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(clip.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(clip, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const clip_changes = {};
    			if (dirty & /*container*/ 1) clip_changes.container = /*container*/ ctx[0];
    			clip.$set(clip_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(clip.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(clip.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(clip, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(7:6) {#if clipVisible }",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div3;
    	let toolbar;
    	let t0;
    	let div2;
    	let div0;
    	let edit;
    	let t1;
    	let t2;
    	let div1;
    	let current;
    	toolbar = new Toolbar({ $$inline: true });
    	edit = new Edit({ $$inline: true });
    	let if_block = /*clipVisible*/ ctx[1] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			create_component(toolbar.$$.fragment);
    			t0 = space();
    			div2 = element("div");
    			div0 = element("div");
    			create_component(edit.$$.fragment);
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			div1 = element("div");
    			attr_dev(div0, "class", "mu-picture__content-edit");
    			add_location(div0, file, 3, 4, 79);
    			attr_dev(div1, "class", "mu-picture__content-preview");
    			add_location(div1, file, 10, 4, 264);
    			attr_dev(div2, "class", "mu-picture__content");
    			add_location(div2, file, 2, 2, 41);
    			attr_dev(div3, "class", "mu-picture");
    			add_location(div3, file, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			mount_component(toolbar, div3, null);
    			append_dev(div3, t0);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			mount_component(edit, div0, null);
    			append_dev(div0, t1);
    			if (if_block) if_block.m(div0, null);
    			/*div0_binding*/ ctx[2](div0);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*clipVisible*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*clipVisible*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div0, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(toolbar.$$.fragment, local);
    			transition_in(edit.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(toolbar.$$.fragment, local);
    			transition_out(edit.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_component(toolbar);
    			destroy_component(edit);
    			if (if_block) if_block.d();
    			/*div0_binding*/ ctx[2](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let container;
    	let clipVisible = false;

    	storeToolbarClick.subscribe(value => {
    		if (!value) return;

    		if (value.name === 'clip') {
    			$$invalidate(1, clipVisible = !clipVisible);
    		}
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			container = $$value;
    			$$invalidate(0, container);
    		});
    	}

    	$$self.$capture_state = () => ({
    		Toolbar,
    		Edit,
    		Clip,
    		storeToolbarClick,
    		container,
    		clipVisible
    	});

    	$$self.$inject_state = $$props => {
    		if ('container' in $$props) $$invalidate(0, container = $$props.container);
    		if ('clipVisible' in $$props) $$invalidate(1, clipVisible = $$props.clipVisible);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [container, clipVisible, div0_binding];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body,
        props: {}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
