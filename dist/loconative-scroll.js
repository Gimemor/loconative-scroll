/* loconative-scroll v1.0.3 | MIT License | https://github.com/quentinhocde/loconative-scroll */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.LoconativeScroll = factory());
})(this, (function () { 'use strict';

    const defaults = {
      el: document.querySelector('body'),
      wrapper: window,
      name: 'scroll',
      offset: [0, 0],
      repeat: false,
      smooth: true,
      initPosition: {
        x: 0,
        y: 0
      },
      direction: 'vertical',
      gestureDirection: 'vertical',
      reloadOnContextChange: true,
      class: 'is-inview',
      scrollingClass: 'has-scroll-scrolling',
      smoothClass: 'has-scroll-smooth',
      initClass: 'has-scroll-init',
      duration: 1.2,
      easing: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
      // https://easings.net,
      scrollToEasing: t => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
      // https://easings.net
      scrollFromAnywhere: false,
      touchMultiplier: 3,
      resetNativeScroll: true,
      tablet: {
        smooth: false,
        direction: 'vertical',
        gestureDirection: 'horizontal',
        breakpoint: 1024
      },
      smartphone: {
        smooth: false,
        direction: 'vertical',
        gestureDirection: 'vertical'
      }
    };

    class Core {
      constructor() {
        let options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        Object.assign(this, defaults, options);
        this.smartphone = defaults.smartphone;
        if (options.smartphone) Object.assign(this.smartphone, options.smartphone);
        this.tablet = defaults.tablet;
        if (options.tablet) Object.assign(this.tablet, options.tablet);
        this.isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1 || this.windowWidth < this.tablet.breakpoint;
        this.isTablet = this.isMobile && window.innerWidth >= this.tablet.breakpoint;
        if (this.isMobile) {
          this.smooth = this.smartphone.smooth;
        }
        if (this.isTablet) {
          this.smooth = this.tablet.smooth;
        }
        this.namespace = 'locomotive';
        this.html = document.documentElement;
        this.windowHeight = window.innerHeight;
        this.windowWidth = window.innerWidth;
        this.windowMiddle = {
          x: this.windowWidth / 2,
          y: this.windowHeight / 2
        };
        this.els = {};
        this.currentElements = {};
        this.listeners = {};
        this.hasScrollTicking = false;
        this.hasCallEventSet = false;
        this.onScroll = this.onScroll.bind(this);
        this.checkResize = this.checkResize.bind(this);
        this.checkEvent = this.checkEvent.bind(this);
        this.instance = {
          scroll: {
            x: 0,
            y: 0
          },
          delta: {
            x: 0,
            y: 0
          },
          limit: {
            x: this.html.offsetWidth,
            y: this.html.offsetHeight
          },
          currentElements: this.currentElements
        };
        if (this.isMobile) {
          if (this.isTablet) {
            this.context = 'tablet';
          } else {
            this.context = 'smartphone';
          }
        } else {
          this.context = 'desktop';
        }
        if (this.isMobile) this.direction = this[this.context].direction;
        if (this.isMobile) this.gestureDirection = this[this.context].gestureDirection;
        if (this.direction === 'horizontal') {
          this.directionAxis = 'x';
        } else {
          this.directionAxis = 'y';
        }
        this.instance.direction = null;
        this.instance.speed = 0;
        this.html.classList.add(this.initClass);
        window.addEventListener('resize', this.checkResize, false);
      }
      init() {
        this.initEvents();
      }
      onScroll() {
        this.dispatchScroll();
      }
      checkResize() {
        if (!this.resizeTick) {
          this.resizeTick = true;
          requestAnimationFrame(() => {
            this.resize();
            this.resizeTick = false;
          });
        }
      }
      resize() {}
      checkContext() {
        if (!this.reloadOnContextChange) return;
        this.isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1 || this.windowWidth < this.tablet.breakpoint;
        this.isTablet = this.isMobile && this.windowWidth >= this.tablet.breakpoint;
        let oldContext = this.context;
        if (this.isMobile) {
          if (this.isTablet) {
            this.context = 'tablet';
          } else {
            this.context = 'smartphone';
          }
        } else {
          this.context = 'desktop';
        }
        if (oldContext != this.context) {
          let oldSmooth = oldContext == 'desktop' ? this.smooth : this[oldContext].smooth;
          let newSmooth = this.context == 'desktop' ? this.smooth : this[this.context].smooth;
          if (oldSmooth != newSmooth) window.location.reload();
        }
      }
      initEvents() {
        this.scrollToEls = this.el.querySelectorAll(`[data-${this.name}-to]`);
        this.setScrollTo = this.setScrollTo.bind(this);
        this.scrollToEls.forEach(el => {
          el.addEventListener('click', this.setScrollTo, false);
        });
      }
      setScrollTo(event) {
        event.preventDefault();
        this.scrollTo(event.currentTarget.getAttribute(`data-${this.name}-href`) || event.currentTarget.getAttribute('href'), {
          offset: event.currentTarget.getAttribute(`data-${this.name}-offset`)
        });
      }
      addElements() {}
      detectElements(hasCallEventSet) {
        const scrollTop = this.instance.scroll.y;
        const scrollBottom = scrollTop + this.windowHeight;
        const scrollLeft = this.instance.scroll.x;
        const scrollRight = scrollLeft + this.windowWidth;
        Object.entries(this.els).forEach(_ref => {
          let [i, el] = _ref;
          if (el && (!el.inView || hasCallEventSet)) {
            if (this.direction === 'horizontal') {
              if (scrollRight >= el.left && scrollLeft < el.right) {
                this.setInView(el, i);
              }
            } else {
              if (scrollBottom >= el.top && scrollTop < el.bottom) {
                this.setInView(el, i);
              }
            }
          }
          if (el && el.inView) {
            if (this.direction === 'horizontal') {
              let width = el.right - el.left;
              el.progress = (this.instance.scroll.x - (el.left - this.windowWidth)) / (width + this.windowWidth);
              if (scrollRight < el.left || scrollLeft > el.right) {
                this.setOutOfView(el, i);
              }
            } else {
              let height = el.bottom - el.top;
              el.progress = (this.instance.scroll.y - (el.top - this.windowHeight)) / (height + this.windowHeight);
              if (scrollBottom < el.top || scrollTop > el.bottom) {
                this.setOutOfView(el, i);
              }
            }
          }
        });

        // this.els = this.els.filter((current, i) => {
        //     return current !== null;
        // });

        this.hasScrollTicking = false;
      }
      setInView(current, i) {
        this.els[i].inView = true;
        current.el.classList.add(current.class);
        this.currentElements[i] = current;
        if (current.call && this.hasCallEventSet) {
          this.dispatchCall(current, 'enter');
          if (!current.repeat) {
            this.els[i].call = false;
          }
        }

        // if (!current.repeat && !current.speed && !current.sticky) {
        //     if (!current.call || current.call && this.hasCallEventSet) {
        //        this.els[i] = null
        //     }
        // }
      }
      setOutOfView(current, i) {
        // if (current.repeat || current.speed !== undefined) {
        this.els[i].inView = false;
        // }

        Object.keys(this.currentElements).forEach(el => {
          el === i && delete this.currentElements[el];
        });
        if (current.call && this.hasCallEventSet) {
          this.dispatchCall(current, 'exit');
        }
        if (current.repeat) {
          current.el.classList.remove(current.class);
        }
      }
      dispatchCall(current, way) {
        this.callWay = way;
        this.callValue = current.call.split(',').map(item => item.trim());
        this.callObj = current;
        if (this.callValue.length == 1) this.callValue = this.callValue[0];
        const callEvent = new Event(this.namespace + 'call');
        this.el.dispatchEvent(callEvent);
      }
      dispatchScroll() {
        const scrollEvent = new Event(this.namespace + 'scroll');
        this.el.dispatchEvent(scrollEvent);
      }
      setEvents(event, func) {
        if (!this.listeners[event]) {
          this.listeners[event] = [];
        }
        const list = this.listeners[event];
        list.push(func);
        if (list.length === 1) {
          this.el.addEventListener(this.namespace + event, this.checkEvent, false);
        }
        if (event === 'call') {
          this.hasCallEventSet = true;
          this.detectElements(true);
        }
      }
      unsetEvents(event, func) {
        if (!this.listeners[event]) return;
        const list = this.listeners[event];
        const index = list.indexOf(func);
        if (index < 0) return;
        list.splice(index, 1);
        if (list.index === 0) {
          this.el.removeEventListener(this.namespace + event, this.checkEvent, false);
        }
      }
      checkEvent(event) {
        const name = event.type.replace(this.namespace, '');
        const list = this.listeners[name];
        if (!list || list.length === 0) return;
        list.forEach(func => {
          switch (name) {
            case 'scroll':
              return func(this.instance);
            case 'call':
              return func(this.callValue, this.callWay, this.callObj);
            default:
              return func();
          }
        });
      }
      startScroll() {
        this.stop = false;
      }
      stopScroll() {
        this.stop = true;
      }
      setScroll(x, y) {
        this.instance.scroll = {
          x: 0,
          y: 0
        };
      }
      destroy() {
        window.removeEventListener('resize', this.checkResize, false);
        Object.keys(this.listeners).forEach(event => {
          this.el.removeEventListener(this.namespace + event, this.checkEvent, false);
        });
        this.listeners = {};
        this.scrollToEls.forEach(el => {
          el.removeEventListener('click', this.setScrollTo, false);
        });
        this.html.classList.remove(this.initClass);
      }
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var smoothscroll = createCommonjsModule(function (module, exports) {
    /* smoothscroll v0.4.4 - 2019 - Dustan Kasten, Jeremias Menichelli - MIT License */
    (function () {

      // polyfill
      function polyfill() {
        // aliases
        var w = window;
        var d = document;

        // return if scroll behavior is supported and polyfill is not forced
        if (
          'scrollBehavior' in d.documentElement.style &&
          w.__forceSmoothScrollPolyfill__ !== true
        ) {
          return;
        }

        // globals
        var Element = w.HTMLElement || w.Element;
        var SCROLL_TIME = 468;

        // object gathering original scroll methods
        var original = {
          scroll: w.scroll || w.scrollTo,
          scrollBy: w.scrollBy,
          elementScroll: Element.prototype.scroll || scrollElement,
          scrollIntoView: Element.prototype.scrollIntoView
        };

        // define timing method
        var now =
          w.performance && w.performance.now
            ? w.performance.now.bind(w.performance)
            : Date.now;

        /**
         * indicates if a the current browser is made by Microsoft
         * @method isMicrosoftBrowser
         * @param {String} userAgent
         * @returns {Boolean}
         */
        function isMicrosoftBrowser(userAgent) {
          var userAgentPatterns = ['MSIE ', 'Trident/', 'Edge/'];

          return new RegExp(userAgentPatterns.join('|')).test(userAgent);
        }

        /*
         * IE has rounding bug rounding down clientHeight and clientWidth and
         * rounding up scrollHeight and scrollWidth causing false positives
         * on hasScrollableSpace
         */
        var ROUNDING_TOLERANCE = isMicrosoftBrowser(w.navigator.userAgent) ? 1 : 0;

        /**
         * changes scroll position inside an element
         * @method scrollElement
         * @param {Number} x
         * @param {Number} y
         * @returns {undefined}
         */
        function scrollElement(x, y) {
          this.scrollLeft = x;
          this.scrollTop = y;
        }

        /**
         * returns result of applying ease math function to a number
         * @method ease
         * @param {Number} k
         * @returns {Number}
         */
        function ease(k) {
          return 0.5 * (1 - Math.cos(Math.PI * k));
        }

        /**
         * indicates if a smooth behavior should be applied
         * @method shouldBailOut
         * @param {Number|Object} firstArg
         * @returns {Boolean}
         */
        function shouldBailOut(firstArg) {
          if (
            firstArg === null ||
            typeof firstArg !== 'object' ||
            firstArg.behavior === undefined ||
            firstArg.behavior === 'auto' ||
            firstArg.behavior === 'instant'
          ) {
            // first argument is not an object/null
            // or behavior is auto, instant or undefined
            return true;
          }

          if (typeof firstArg === 'object' && firstArg.behavior === 'smooth') {
            // first argument is an object and behavior is smooth
            return false;
          }

          // throw error when behavior is not supported
          throw new TypeError(
            'behavior member of ScrollOptions ' +
              firstArg.behavior +
              ' is not a valid value for enumeration ScrollBehavior.'
          );
        }

        /**
         * indicates if an element has scrollable space in the provided axis
         * @method hasScrollableSpace
         * @param {Node} el
         * @param {String} axis
         * @returns {Boolean}
         */
        function hasScrollableSpace(el, axis) {
          if (axis === 'Y') {
            return el.clientHeight + ROUNDING_TOLERANCE < el.scrollHeight;
          }

          if (axis === 'X') {
            return el.clientWidth + ROUNDING_TOLERANCE < el.scrollWidth;
          }
        }

        /**
         * indicates if an element has a scrollable overflow property in the axis
         * @method canOverflow
         * @param {Node} el
         * @param {String} axis
         * @returns {Boolean}
         */
        function canOverflow(el, axis) {
          var overflowValue = w.getComputedStyle(el, null)['overflow' + axis];

          return overflowValue === 'auto' || overflowValue === 'scroll';
        }

        /**
         * indicates if an element can be scrolled in either axis
         * @method isScrollable
         * @param {Node} el
         * @param {String} axis
         * @returns {Boolean}
         */
        function isScrollable(el) {
          var isScrollableY = hasScrollableSpace(el, 'Y') && canOverflow(el, 'Y');
          var isScrollableX = hasScrollableSpace(el, 'X') && canOverflow(el, 'X');

          return isScrollableY || isScrollableX;
        }

        /**
         * finds scrollable parent of an element
         * @method findScrollableParent
         * @param {Node} el
         * @returns {Node} el
         */
        function findScrollableParent(el) {
          while (el !== d.body && isScrollable(el) === false) {
            el = el.parentNode || el.host;
          }

          return el;
        }

        /**
         * self invoked function that, given a context, steps through scrolling
         * @method step
         * @param {Object} context
         * @returns {undefined}
         */
        function step(context) {
          var time = now();
          var value;
          var currentX;
          var currentY;
          var elapsed = (time - context.startTime) / SCROLL_TIME;

          // avoid elapsed times higher than one
          elapsed = elapsed > 1 ? 1 : elapsed;

          // apply easing to elapsed time
          value = ease(elapsed);

          currentX = context.startX + (context.x - context.startX) * value;
          currentY = context.startY + (context.y - context.startY) * value;

          context.method.call(context.scrollable, currentX, currentY);

          // scroll more if we have not reached our destination
          if (currentX !== context.x || currentY !== context.y) {
            w.requestAnimationFrame(step.bind(w, context));
          }
        }

        /**
         * scrolls window or element with a smooth behavior
         * @method smoothScroll
         * @param {Object|Node} el
         * @param {Number} x
         * @param {Number} y
         * @returns {undefined}
         */
        function smoothScroll(el, x, y) {
          var scrollable;
          var startX;
          var startY;
          var method;
          var startTime = now();

          // define scroll context
          if (el === d.body) {
            scrollable = w;
            startX = w.scrollX || w.pageXOffset;
            startY = w.scrollY || w.pageYOffset;
            method = original.scroll;
          } else {
            scrollable = el;
            startX = el.scrollLeft;
            startY = el.scrollTop;
            method = scrollElement;
          }

          // scroll looping over a frame
          step({
            scrollable: scrollable,
            method: method,
            startTime: startTime,
            startX: startX,
            startY: startY,
            x: x,
            y: y
          });
        }

        // ORIGINAL METHODS OVERRIDES
        // w.scroll and w.scrollTo
        w.scroll = w.scrollTo = function() {
          // avoid action when no arguments are passed
          if (arguments[0] === undefined) {
            return;
          }

          // avoid smooth behavior if not required
          if (shouldBailOut(arguments[0]) === true) {
            original.scroll.call(
              w,
              arguments[0].left !== undefined
                ? arguments[0].left
                : typeof arguments[0] !== 'object'
                  ? arguments[0]
                  : w.scrollX || w.pageXOffset,
              // use top prop, second argument if present or fallback to scrollY
              arguments[0].top !== undefined
                ? arguments[0].top
                : arguments[1] !== undefined
                  ? arguments[1]
                  : w.scrollY || w.pageYOffset
            );

            return;
          }

          // LET THE SMOOTHNESS BEGIN!
          smoothScroll.call(
            w,
            d.body,
            arguments[0].left !== undefined
              ? ~~arguments[0].left
              : w.scrollX || w.pageXOffset,
            arguments[0].top !== undefined
              ? ~~arguments[0].top
              : w.scrollY || w.pageYOffset
          );
        };

        // w.scrollBy
        w.scrollBy = function() {
          // avoid action when no arguments are passed
          if (arguments[0] === undefined) {
            return;
          }

          // avoid smooth behavior if not required
          if (shouldBailOut(arguments[0])) {
            original.scrollBy.call(
              w,
              arguments[0].left !== undefined
                ? arguments[0].left
                : typeof arguments[0] !== 'object' ? arguments[0] : 0,
              arguments[0].top !== undefined
                ? arguments[0].top
                : arguments[1] !== undefined ? arguments[1] : 0
            );

            return;
          }

          // LET THE SMOOTHNESS BEGIN!
          smoothScroll.call(
            w,
            d.body,
            ~~arguments[0].left + (w.scrollX || w.pageXOffset),
            ~~arguments[0].top + (w.scrollY || w.pageYOffset)
          );
        };

        // Element.prototype.scroll and Element.prototype.scrollTo
        Element.prototype.scroll = Element.prototype.scrollTo = function() {
          // avoid action when no arguments are passed
          if (arguments[0] === undefined) {
            return;
          }

          // avoid smooth behavior if not required
          if (shouldBailOut(arguments[0]) === true) {
            // if one number is passed, throw error to match Firefox implementation
            if (typeof arguments[0] === 'number' && arguments[1] === undefined) {
              throw new SyntaxError('Value could not be converted');
            }

            original.elementScroll.call(
              this,
              // use left prop, first number argument or fallback to scrollLeft
              arguments[0].left !== undefined
                ? ~~arguments[0].left
                : typeof arguments[0] !== 'object' ? ~~arguments[0] : this.scrollLeft,
              // use top prop, second argument or fallback to scrollTop
              arguments[0].top !== undefined
                ? ~~arguments[0].top
                : arguments[1] !== undefined ? ~~arguments[1] : this.scrollTop
            );

            return;
          }

          var left = arguments[0].left;
          var top = arguments[0].top;

          // LET THE SMOOTHNESS BEGIN!
          smoothScroll.call(
            this,
            this,
            typeof left === 'undefined' ? this.scrollLeft : ~~left,
            typeof top === 'undefined' ? this.scrollTop : ~~top
          );
        };

        // Element.prototype.scrollBy
        Element.prototype.scrollBy = function() {
          // avoid action when no arguments are passed
          if (arguments[0] === undefined) {
            return;
          }

          // avoid smooth behavior if not required
          if (shouldBailOut(arguments[0]) === true) {
            original.elementScroll.call(
              this,
              arguments[0].left !== undefined
                ? ~~arguments[0].left + this.scrollLeft
                : ~~arguments[0] + this.scrollLeft,
              arguments[0].top !== undefined
                ? ~~arguments[0].top + this.scrollTop
                : ~~arguments[1] + this.scrollTop
            );

            return;
          }

          this.scroll({
            left: ~~arguments[0].left + this.scrollLeft,
            top: ~~arguments[0].top + this.scrollTop,
            behavior: arguments[0].behavior
          });
        };

        // Element.prototype.scrollIntoView
        Element.prototype.scrollIntoView = function() {
          // avoid smooth behavior if not required
          if (shouldBailOut(arguments[0]) === true) {
            original.scrollIntoView.call(
              this,
              arguments[0] === undefined ? true : arguments[0]
            );

            return;
          }

          // LET THE SMOOTHNESS BEGIN!
          var scrollableParent = findScrollableParent(this);
          var parentRects = scrollableParent.getBoundingClientRect();
          var clientRects = this.getBoundingClientRect();

          if (scrollableParent !== d.body) {
            // reveal element inside parent
            smoothScroll.call(
              this,
              scrollableParent,
              scrollableParent.scrollLeft + clientRects.left - parentRects.left,
              scrollableParent.scrollTop + clientRects.top - parentRects.top
            );

            // reveal parent in viewport unless is fixed
            if (w.getComputedStyle(scrollableParent).position !== 'fixed') {
              w.scrollBy({
                left: parentRects.left,
                top: parentRects.top,
                behavior: 'smooth'
              });
            }
          } else {
            // reveal element in viewport
            w.scrollBy({
              left: clientRects.left,
              top: clientRects.top,
              behavior: 'smooth'
            });
          }
        };
      }

      {
        // commonjs
        module.exports = { polyfill: polyfill };
      }

    }());
    });
    smoothscroll.polyfill;

    function getTranslate(el) {
      const translate = {};
      if (!window.getComputedStyle) return;
      const style = getComputedStyle(el);
      const transform = style.transform || style.webkitTransform || style.mozTransform;
      let mat = transform.match(/^matrix3d\((.+)\)$/);
      if (mat) {
        translate.x = mat ? parseFloat(mat[1].split(', ')[12]) : 0;
        translate.y = mat ? parseFloat(mat[1].split(', ')[13]) : 0;
      } else {
        mat = transform.match(/^matrix\((.+)\)$/);
        translate.x = mat ? parseFloat(mat[1].split(', ')[4]) : 0;
        translate.y = mat ? parseFloat(mat[1].split(', ')[5]) : 0;
      }
      return translate;
    }

    function lerp(start, end, amt) {
      return (1 - amt) * start + amt * end;
    }

    function E () {
      // Keep this empty so it's easier to inherit from
      // (via https://github.com/lipsmack from https://github.com/scottcorgan/tiny-emitter/issues/3)
    }

    E.prototype = {
      on: function (name, callback, ctx) {
        var e = this.e || (this.e = {});

        (e[name] || (e[name] = [])).push({
          fn: callback,
          ctx: ctx
        });

        return this;
      },

      once: function (name, callback, ctx) {
        var self = this;
        function listener () {
          self.off(name, listener);
          callback.apply(ctx, arguments);
        }
        listener._ = callback;
        return this.on(name, listener, ctx);
      },

      emit: function (name) {
        var data = [].slice.call(arguments, 1);
        var evtArr = ((this.e || (this.e = {}))[name] || []).slice();
        var i = 0;
        var len = evtArr.length;

        for (i; i < len; i++) {
          evtArr[i].fn.apply(evtArr[i].ctx, data);
        }

        return this;
      },

      off: function (name, callback) {
        var e = this.e || (this.e = {});
        var evts = e[name];
        var liveEvents = [];

        if (evts && callback) {
          for (var i = 0, len = evts.length; i < len; i++) {
            if (evts[i].fn !== callback && evts[i].fn._ !== callback)
              liveEvents.push(evts[i]);
          }
        }

        // Remove event from queue to prevent memory leak
        // Suggested by https://github.com/lazd
        // Ref: https://github.com/scottcorgan/tiny-emitter/commit/c6ebfaa9bc973b33d110a84a307742b7cf94c953#commitcomment-5024910

        (liveEvents.length)
          ? e[name] = liveEvents
          : delete e[name];

        return this;
      }
    };

    var tinyEmitter = E;
    var TinyEmitter = E;
    tinyEmitter.TinyEmitter = TinyEmitter;

    var virtualscroll = createCommonjsModule(function (module, exports) {
    !function(e,t){module.exports=t();}(commonjsGlobal,function(){var e=0;function t(t){return "__private_"+e+++"_"+t}function i(e,t){if(!Object.prototype.hasOwnProperty.call(e,t))throw new TypeError("attempted to use private field on non-instance");return e}function n(){}n.prototype={on:function(e,t,i){var n=this.e||(this.e={});return (n[e]||(n[e]=[])).push({fn:t,ctx:i}),this},once:function(e,t,i){var n=this;function o(){n.off(e,o),t.apply(i,arguments);}return o._=t,this.on(e,o,i)},emit:function(e){for(var t=[].slice.call(arguments,1),i=((this.e||(this.e={}))[e]||[]).slice(),n=0,o=i.length;n<o;n++)i[n].fn.apply(i[n].ctx,t);return this},off:function(e,t){var i=this.e||(this.e={}),n=i[e],o=[];if(n&&t)for(var s=0,h=n.length;s<h;s++)n[s].fn!==t&&n[s].fn._!==t&&o.push(n[s]);return o.length?i[e]=o:delete i[e],this}};var o=n;o.TinyEmitter=n;var s,h="virtualscroll",r=t("options"),a=t("el"),l=t("emitter"),u=t("event"),c=t("touchStart"),d=t("bodyTouchAction");return function(){function e(e){var t=this;Object.defineProperty(this,r,{writable:!0,value:void 0}),Object.defineProperty(this,a,{writable:!0,value:void 0}),Object.defineProperty(this,l,{writable:!0,value:void 0}),Object.defineProperty(this,u,{writable:!0,value:void 0}),Object.defineProperty(this,c,{writable:!0,value:void 0}),Object.defineProperty(this,d,{writable:!0,value:void 0}),this._onWheel=function(e){var n=i(t,r)[r],o=i(t,u)[u];o.deltaX=e.wheelDeltaX||-1*e.deltaX,o.deltaY=e.wheelDeltaY||-1*e.deltaY,s.isFirefox&&1===e.deltaMode&&(o.deltaX*=n.firefoxMultiplier,o.deltaY*=n.firefoxMultiplier),o.deltaX*=n.mouseMultiplier,o.deltaY*=n.mouseMultiplier,t._notify(e);},this._onMouseWheel=function(e){var n=i(t,u)[u];n.deltaX=e.wheelDeltaX?e.wheelDeltaX:0,n.deltaY=e.wheelDeltaY?e.wheelDeltaY:e.wheelDelta,t._notify(e);},this._onTouchStart=function(e){var n=e.targetTouches?e.targetTouches[0]:e;i(t,c)[c].x=n.pageX,i(t,c)[c].y=n.pageY;},this._onTouchMove=function(e){var n=i(t,r)[r];n.preventTouch&&!e.target.classList.contains(n.unpreventTouchClass)&&e.preventDefault();var o=i(t,u)[u],s=e.targetTouches?e.targetTouches[0]:e;o.deltaX=(s.pageX-i(t,c)[c].x)*n.touchMultiplier,o.deltaY=(s.pageY-i(t,c)[c].y)*n.touchMultiplier,i(t,c)[c].x=s.pageX,i(t,c)[c].y=s.pageY,t._notify(e);},this._onKeyDown=function(e){var n=i(t,u)[u];n.deltaX=n.deltaY=0;var o=window.innerHeight-40;switch(e.keyCode){case 37:case 38:n.deltaY=i(t,r)[r].keyStep;break;case 39:case 40:n.deltaY=-i(t,r)[r].keyStep;break;case 32:n.deltaY=o*(e.shiftKey?1:-1);break;default:return}t._notify(e);},i(this,a)[a]=window,e&&e.el&&(i(this,a)[a]=e.el,delete e.el),s||(s={hasWheelEvent:"onwheel"in document,hasMouseWheelEvent:"onmousewheel"in document,hasTouch:"ontouchstart"in document,hasTouchWin:navigator.msMaxTouchPoints&&navigator.msMaxTouchPoints>1,hasPointer:!!window.navigator.msPointerEnabled,hasKeyDown:"onkeydown"in document,isFirefox:navigator.userAgent.indexOf("Firefox")>-1}),i(this,r)[r]=Object.assign({mouseMultiplier:1,touchMultiplier:2,firefoxMultiplier:15,keyStep:120,preventTouch:!1,unpreventTouchClass:"vs-touchmove-allowed",useKeyboard:!0,useTouch:!0},e),i(this,l)[l]=new o,i(this,u)[u]={y:0,x:0,deltaX:0,deltaY:0},i(this,c)[c]={x:null,y:null},i(this,d)[d]=null,void 0!==i(this,r)[r].passive&&(this.listenerOptions={passive:i(this,r)[r].passive});}var t=e.prototype;return t._notify=function(e){var t=i(this,u)[u];t.x+=t.deltaX,t.y+=t.deltaY,i(this,l)[l].emit(h,{x:t.x,y:t.y,deltaX:t.deltaX,deltaY:t.deltaY,originalEvent:e});},t._bind=function(){s.hasWheelEvent&&i(this,a)[a].addEventListener("wheel",this._onWheel,this.listenerOptions),s.hasMouseWheelEvent&&i(this,a)[a].addEventListener("mousewheel",this._onMouseWheel,this.listenerOptions),s.hasTouch&&i(this,r)[r].useTouch&&(i(this,a)[a].addEventListener("touchstart",this._onTouchStart,this.listenerOptions),i(this,a)[a].addEventListener("touchmove",this._onTouchMove,this.listenerOptions)),s.hasPointer&&s.hasTouchWin&&(i(this,d)[d]=document.body.style.msTouchAction,document.body.style.msTouchAction="none",i(this,a)[a].addEventListener("MSPointerDown",this._onTouchStart,!0),i(this,a)[a].addEventListener("MSPointerMove",this._onTouchMove,!0)),s.hasKeyDown&&i(this,r)[r].useKeyboard&&document.addEventListener("keydown",this._onKeyDown);},t._unbind=function(){s.hasWheelEvent&&i(this,a)[a].removeEventListener("wheel",this._onWheel),s.hasMouseWheelEvent&&i(this,a)[a].removeEventListener("mousewheel",this._onMouseWheel),s.hasTouch&&(i(this,a)[a].removeEventListener("touchstart",this._onTouchStart),i(this,a)[a].removeEventListener("touchmove",this._onTouchMove)),s.hasPointer&&s.hasTouchWin&&(document.body.style.msTouchAction=i(this,d)[d],i(this,a)[a].removeEventListener("MSPointerDown",this._onTouchStart,!0),i(this,a)[a].removeEventListener("MSPointerMove",this._onTouchMove,!0)),s.hasKeyDown&&i(this,r)[r].useKeyboard&&document.removeEventListener("keydown",this._onKeyDown);},t.on=function(e,t){i(this,l)[l].on(h,e,t);var n=i(this,l)[l].e;n&&n[h]&&1===n[h].length&&this._bind();},t.off=function(e,t){i(this,l)[l].off(h,e,t);var n=i(this,l)[l].e;(!n[h]||n[h].length<=0)&&this._unbind();},t.destroy=function(){i(this,l)[l].off(),this._unbind();},e}()});
    });

    function i(t,e){for(var i=0;i<e.length;i++){var o=e[i];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(t,o.key,o);}}function o(t,e,o){return e&&i(t.prototype,e),o&&i(t,o),Object.defineProperty(t,"prototype",{writable:!1}),t}function r(){return r=Object.assign?Object.assign.bind():function(t){for(var e=1;e<arguments.length;e++){var i=arguments[e];for(var o in i)Object.prototype.hasOwnProperty.call(i,o)&&(t[o]=i[o]);}return t},r.apply(this,arguments)}function n(t,e){return n=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(t,e){return t.__proto__=e,t},n(t,e)}function s(t,e){var i=t%e;return (e>0&&i<0||e<0&&i>0)&&(i+=e),i}var l=["duration","easing"],a=/*#__PURE__*/function(){function t(){}var e=t.prototype;return e.to=function(t,e){var i=this,o=void 0===e?{}:e,n=o.duration,s=void 0===n?1:n,a=o.easing,c=void 0===a?function(t){return t}:a,h=function(t,e){if(null==t)return {};var i,o,r={},n=Object.keys(t);for(o=0;o<n.length;o++)e.indexOf(i=n[o])>=0||(r[i]=t[i]);return r}(o,l);this.target=t,this.fromKeys=r({},h),this.toKeys=r({},h),this.keys=Object.keys(r({},h)),this.keys.forEach(function(e){i.fromKeys[e]=t[e];}),this.duration=s,this.easing=c,this.currentTime=0,this.isRunning=!0;},e.stop=function(){this.isRunning=!1;},e.raf=function(t){var e=this;if(this.isRunning){this.currentTime=Math.min(this.currentTime+t,this.duration);var i=this.progress>=1?1:this.easing(this.progress);this.keys.forEach(function(t){var o=e.fromKeys[t];e.target[t]=o+(e.toKeys[t]-o)*i;}),1===i&&this.stop();}},o(t,[{key:"progress",get:function(){return this.currentTime/this.duration}}]),t}(),c=/*#__PURE__*/function(t){var i,r;function l(i){var o,r,n,s,l=void 0===i?{}:i,c=l.duration,h=void 0===c?1.2:c,p=l.easing,u=void 0===p?function(t){return Math.min(1,1.001-Math.pow(2,-10*t))}:p,d=l.smooth,f=void 0===d||d,v=l.mouseMultiplier,w=void 0===v?1:v,g=l.smoothTouch,m=void 0!==g&&g,y=l.touchMultiplier,b=void 0===y?2:y,S=l.direction,N=void 0===S?"vertical":S,O=l.gestureDirection,z=void 0===O?"vertical":O,R=l.infinite,W=void 0!==R&&R,M=l.wrapper,T=void 0===M?window:M,k=l.content,j=void 0===k?document.body:k;(s=t.call(this)||this).onWindowResize=function(){s.wrapperWidth=window.innerWidth,s.wrapperHeight=window.innerHeight;},s.onWrapperResize=function(t){var e=t[0];if(e){var i=e.contentRect;s.wrapperWidth=i.width,s.wrapperHeight=i.height;}},s.onContentResize=function(t){var e=t[0];if(e){var i=e.contentRect;s.contentWidth=i.width,s.contentHeight=i.height;}},s.onVirtualScroll=function(t){var e=t.deltaY,i=t.deltaX,o=t.originalEvent;if(!("vertical"===s.gestureDirection&&0===e||"horizontal"===s.gestureDirection&&0===i)){var r=!!o.composedPath().find(function(t){return t.hasAttribute&&t.hasAttribute("data-lenis-prevent")});o.ctrlKey||r||(s.smooth=o.changedTouches?s.smoothTouch:s.options.smooth,s.stopped?o.preventDefault():s.smooth&&4!==o.buttons&&(s.smooth&&o.preventDefault(),s.targetScroll-="both"===s.gestureDirection?i+e:"horizontal"===s.gestureDirection?i:e,s.scrollTo(s.targetScroll)));}},s.onScroll=function(t){s.isScrolling&&s.smooth||(s.targetScroll=s.scroll=s.lastScroll=s.wrapperNode[s.scrollProperty],s.notify());},window.lenisVersion="0.2.28",s.options={duration:h,easing:u,smooth:f,mouseMultiplier:w,smoothTouch:m,touchMultiplier:b,direction:N,gestureDirection:z,infinite:W,wrapper:T,content:j},s.duration=h,s.easing=u,s.smooth=f,s.mouseMultiplier=w,s.smoothTouch=m,s.touchMultiplier=b,s.direction=N,s.gestureDirection=z,s.infinite=W,s.wrapperNode=T,s.contentNode=j,s.wrapperNode.addEventListener("scroll",s.onScroll),s.wrapperNode===window?(s.wrapperNode.addEventListener("resize",s.onWindowResize),s.onWindowResize()):(s.wrapperHeight=s.wrapperNode.offsetHeight,s.wrapperWidth=s.wrapperNode.offsetWidth,s.wrapperObserver=new ResizeObserver(s.onWrapperResize),s.wrapperObserver.observe(s.wrapperNode)),s.contentHeight=s.contentNode.offsetHeight,s.contentWidth=s.contentNode.offsetWidth,s.contentObserver=new ResizeObserver(s.onContentResize),s.contentObserver.observe(s.contentNode),s.targetScroll=s.scroll=s.lastScroll=s.wrapperNode[s.scrollProperty],s.animate=new a;var D=(null==(o=navigator)||null==(r=o.userAgentData)?void 0:r.platform)||(null==(n=navigator)?void 0:n.platform)||"unknown";return s.virtualScroll=new virtualscroll({el:s.wrapperNode,firefoxMultiplier:50,mouseMultiplier:s.mouseMultiplier*(D.includes("Win")||D.includes("Linux")?.84:.4),touchMultiplier:s.touchMultiplier,passive:!1,useKeyboard:!1,useTouch:!0}),s.virtualScroll.on(s.onVirtualScroll),s}r=t,(i=l).prototype=Object.create(r.prototype),i.prototype.constructor=i,n(i,r);var c=l.prototype;return c.start=function(){var t=this.wrapperNode;this.wrapperNode===window&&(t=document.documentElement),t.classList.remove("lenis-stopped"),this.stopped=!1;},c.stop=function(){var t=this.wrapperNode;this.wrapperNode===window&&(t=document.documentElement),t.classList.add("lenis-stopped"),this.stopped=!0,this.animate.stop();},c.destroy=function(){var t;this.wrapperNode===window&&this.wrapperNode.removeEventListener("resize",this.onWindowResize),this.wrapperNode.removeEventListener("scroll",this.onScroll),this.virtualScroll.destroy(),null==(t=this.wrapperObserver)||t.disconnect(),this.contentObserver.disconnect();},c.raf=function(t){var e=t-(this.now||0);this.now=t,!this.stopped&&this.smooth&&(this.lastScroll=this.scroll,this.animate.raf(.001*e),this.scroll===this.targetScroll&&(this.lastScroll=this.scroll),this.isScrolling&&(this.setScroll(this.scroll),this.notify()),this.isScrolling=this.scroll!==this.targetScroll);},c.setScroll=function(t){var e=this.infinite?s(t,this.limit):t;"horizontal"===this.direction?this.wrapperNode.scrollTo(e,0):this.wrapperNode.scrollTo(0,e);},c.notify=function(){var t=this.infinite?s(this.scroll,this.limit):this.scroll;this.emit("scroll",{scroll:t,limit:this.limit,velocity:this.velocity,direction:0===this.velocity?0:this.velocity>0?1:-1,progress:t/this.limit});},c.scrollTo=function(t,e){var i=void 0===e?{}:e,o=i.offset,r=void 0===o?0:o,n=i.immediate,s=void 0!==n&&n,l=i.duration,a=void 0===l?this.duration:l,c=i.easing,h=void 0===c?this.easing:c;if(null!=t&&!this.stopped){var p;if("number"==typeof t)p=t;else if("top"===t||"#top"===t)p=0;else if("bottom"===t)p=this.limit;else {var u;if("string"==typeof t)u=document.querySelector(t);else {if(null==t||!t.nodeType)return;u=t;}if(!u)return;var d=0;if(this.wrapperNode!==window){var f=this.wrapperNode.getBoundingClientRect();d="horizontal"===this.direction?f.left:f.top;}var v=u.getBoundingClientRect();p=("horizontal"===this.direction?v.left:v.top)+this.scroll-d;}p+=r,this.targetScroll=this.infinite?p:Math.max(0,Math.min(p,this.limit)),!this.smooth||s?(this.animate.stop(),this.scroll=this.lastScroll=this.targetScroll,this.setScroll(this.targetScroll)):this.animate.to(this,{duration:a,easing:h,scroll:this.targetScroll});}},o(l,[{key:"scrollProperty",get:function(){return this.wrapperNode===window?"horizontal"===this.direction?"scrollX":"scrollY":"horizontal"===this.direction?"scrollLeft":"scrollTop"}},{key:"limit",get:function(){return "horizontal"===this.direction?this.contentWidth-this.wrapperWidth:this.contentHeight-this.wrapperHeight}},{key:"velocity",get:function(){return this.scroll-this.lastScroll}}]),l}(TinyEmitter);

    class Scroll extends Core {
      constructor() {
        let options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        super(options);
        if (this.resetNativeScroll) {
          if (history.scrollRestoration) {
            history.scrollRestoration = 'manual';
          }
          window.scrollTo(0, 0);
        }
        if (window.smoothscrollPolyfill === undefined) {
          window.smoothscrollPolyfill = smoothscroll;
          window.smoothscrollPolyfill.polyfill();
        }
      }
      init() {
        if (this.smooth) {
          this.html.classList.add(this.smoothClass);
          this.html.setAttribute(`data-${this.name}-direction`, this.direction);
        }
        this.addElements();
        this.detectElements();
        this.transformElements(true, true);
        this.initContainerSize();
        this.lenis = new c({
          wrapper: this.wrapper,
          content: this.el,
          duration: this.duration,
          easing: this.easing,
          direction: this.direction,
          gestureDirection: this.gestureDirection,
          smooth: this.smooth,
          smoothTouch: this.smooth,
          touchMultiplier: this.touchMultiplier
        });
        this.bindOnScroll = this.onScroll.bind(this);
        this.lenis.on('scroll', this.bindOnScroll);

        //get scroll value
        /*this.lenis.on('scroll', ({ scroll, limit, velocity, direction, progress }) => {
            console.log({ scroll, limit, velocity, direction, progress });
            console.log(this.lenis);
        });*/

        this.raf(0);
        super.init();
      }
      raf(time) {
        this.lenis.raf(time);
        this.rafInstance = requestAnimationFrame(() => this.raf(Date.now()));
      }
      onScroll(_ref) {
        let {
          scroll,
          velocity
        } = _ref;
        console.log(scroll, velocity);
        if (scroll > this.instance.scroll[this.directionAxis]) {
          if (this.instance.direction !== 'down') {
            this.instance.direction = 'down';
          }
        } else if (scroll < this.instance.scroll[this.directionAxis]) {
          if (this.instance.direction !== 'up') {
            this.instance.direction = 'up';
          }
        }
        this.instance.scroll[this.directionAxis] = scroll;
        this.instance.speed = velocity;
        if (Object.entries(this.els).length) {
          if (!this.hasScrollTicking) {
            requestAnimationFrame(() => {
              this.detectElements();
            });
            this.hasScrollTicking = true;
          }
        }
        super.onScroll();
        this.transformElements();
      }
      resize() {
        this.windowHeight = window.innerHeight;
        this.windowWidth = window.innerWidth;
        this.windowMiddle = {
          x: this.windowWidth / 2,
          y: this.windowHeight / 2
        };
        this.checkContext();
        this.initContainerSize();
        if (Object.entries(this.els).length) {
          this.update();
        }
      }
      initContainerSize() {
        if (this.direction === 'horizontal') {
          let elWidth = 0;
          for (let childIndex = 0; childIndex < this.el.children.length; childIndex++) {
            const child = this.el.children[childIndex];
            elWidth += child.getBoundingClientRect().width;
          }
          this.el.style.setProperty('--scrollContainerWidth', elWidth + 'px');
        }
      }
      addElements() {
        this.els = {};
        this.parallaxElements = {};
        const els = this.el.querySelectorAll('[data-' + this.name + ']');
        els.forEach((el, index) => {
          el.getBoundingClientRect();
          let cl = el.dataset[this.name + 'Class'] || this.class;
          let id = typeof el.dataset[this.name + 'Id'] === 'string' ? el.dataset[this.name + 'Id'] : index;
          let top;
          let left;
          let offset = typeof el.dataset[this.name + 'Offset'] === 'string' ? el.dataset[this.name + 'Offset'].split(',') : this.offset;
          let repeat = el.dataset[this.name + 'Repeat'];
          let call = el.dataset[this.name + 'Call'];
          let position = el.dataset[this.name + 'Position'];
          let delay = el.dataset[this.name + 'Delay'];
          let direction = el.dataset[this.name + 'Direction'];
          let sticky = typeof el.dataset[this.name + 'Sticky'] === 'string';
          if (sticky) {
            console.warn("You use data-scroll-sticky, it's not recommended for performances. Please adapt your code and play with position:sticky.");
          }
          let target = el.dataset[this.name + 'Target'];
          let targetEl;
          if (target !== undefined) {
            targetEl = document.querySelector(`${target}`);
          } else {
            targetEl = el;
          }
          const targetElBCR = targetEl.getBoundingClientRect();
          top = targetElBCR.top + this.instance.scroll.y - getTranslate(targetEl).y;
          left = targetElBCR.left + this.instance.scroll.x - getTranslate(targetEl).x;
          let bottom = top + targetEl.offsetHeight;
          let right = left + targetEl.offsetWidth;
          let middle = {
            x: (right - left) / 2 + left,
            y: (bottom - top) / 2 + top
          };
          if (sticky) {
            const elBCR = el.getBoundingClientRect();
            const elTop = elBCR.top;
            const elLeft = elBCR.left;
            const elDistance = {
              x: elLeft - left,
              y: elTop - top
            };
            top += window.innerHeight;
            left += window.innerWidth;
            bottom = elTop + targetEl.offsetHeight - el.offsetHeight - elDistance[this.directionAxis];
            right = elLeft + targetEl.offsetWidth - el.offsetWidth - elDistance[this.directionAxis];
            middle = {
              x: (right - left) / 2 + left,
              y: (bottom - top) / 2 + top
            };
          }
          if (repeat == 'false') {
            repeat = false;
          } else if (repeat != undefined) {
            repeat = true;
          } else {
            repeat = this.repeat;
          }
          let speed = el.dataset[this.name + 'Speed'] ? parseFloat(el.dataset[this.name + 'Speed']) / 10 : false;
          if (speed) {
            offset = 0;
          }
          let relativeOffset = [0, 0];
          if (offset) {
            if (this.direction === 'horizontal') {
              for (var i = 0; i < offset.length; i++) {
                if (typeof offset[i] == 'string') {
                  if (offset[i].includes('%')) {
                    relativeOffset[i] = parseInt(offset[i].replace('%', '') * this.windowWidth / 100);
                  } else {
                    relativeOffset[i] = parseInt(offset[i]);
                  }
                } else {
                  relativeOffset[i] = offset[i];
                }
              }
              left = left + relativeOffset[0];
              right = right - relativeOffset[1];
            } else {
              for (var i = 0; i < offset.length; i++) {
                if (typeof offset[i] == 'string') {
                  if (offset[i].includes('%')) {
                    relativeOffset[i] = parseInt(offset[i].replace('%', '') * this.windowHeight / 100);
                  } else {
                    relativeOffset[i] = parseInt(offset[i]);
                  }
                } else {
                  relativeOffset[i] = offset[i];
                }
              }
              top = top + relativeOffset[0];
              bottom = bottom - relativeOffset[1];
            }
          }
          const mappedEl = {
            el: el,
            targetEl: targetEl,
            id,
            class: cl,
            top: top,
            bottom: bottom,
            middle,
            left,
            right,
            position,
            delay,
            direction,
            offset,
            progress: 0,
            repeat,
            inView: false,
            call,
            speed,
            sticky
          };
          this.els[id] = mappedEl;
          if (el.classList.contains(cl)) {
            this.setInView(this.els[id], id);
          }
          if (speed !== false || sticky) {
            this.parallaxElements[id] = mappedEl;
          }
        });
      }
      updateElements() {
        Object.entries(this.els).forEach(_ref2 => {
          let [i, el] = _ref2;
          const top = el.targetEl.getBoundingClientRect().top + this.instance.scroll.y;
          const bottom = top + el.targetEl.offsetHeight;
          const relativeOffset = this.getRelativeOffset(el.offset);
          this.els[i].top = top + relativeOffset[0];
          this.els[i].bottom = bottom - relativeOffset[1];
        });
        this.hasScrollTicking = false;
      }
      transform(element, x, y, delay) {
        let transform;
        if (!delay) {
          transform = `matrix3d(1,0,0.00,0,0.00,1,0.00,0,0,0,1,0,${x},${y},0,1)`;
        } else {
          let start = getTranslate(element);
          let lerpX = lerp(start.x, x, delay);
          let lerpY = lerp(start.y, y, delay);
          transform = `matrix3d(1,0,0.00,0,0.00,1,0.00,0,0,0,1,0,${lerpX},${lerpY},0,1)`;
        }
        element.style.webkitTransform = transform;
        element.style.msTransform = transform;
        element.style.transform = transform;
      }
      transformElements(isForced) {
        let setAllElements = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
        if (!this.smooth) return;
        const scrollRight = this.instance.scroll.x + this.windowWidth;
        const scrollBottom = this.instance.scroll.y + this.windowHeight;
        const scrollMiddle = {
          x: this.instance.scroll.x + this.windowMiddle.x,
          y: this.instance.scroll.y + this.windowMiddle.y
        };
        Object.entries(this.parallaxElements).forEach(_ref3 => {
          let [i, current] = _ref3;
          let transformDistance = false;
          if (isForced) {
            transformDistance = 0;
          }
          if (current.inView || setAllElements) {
            switch (current.position) {
              case 'top':
                transformDistance = this.instance.scroll[this.directionAxis] * -current.speed;
                break;
              case 'elementTop':
                transformDistance = (scrollBottom - current.top) * -current.speed;
                break;
              case 'bottom':
                transformDistance = (this.instance.limit[this.directionAxis] - scrollBottom + this.windowHeight) * current.speed;
                break;
              case 'left':
                transformDistance = this.instance.scroll[this.directionAxis] * -current.speed;
                break;
              case 'elementLeft':
                transformDistance = (scrollRight - current.left) * -current.speed;
                break;
              case 'right':
                transformDistance = (this.instance.limit[this.directionAxis] - scrollRight + this.windowHeight) * current.speed;
                break;
              default:
                transformDistance = (scrollMiddle[this.directionAxis] - current.middle[this.directionAxis]) * -current.speed;
                break;
            }
          }
          if (current.sticky) {
            if (current.inView) {
              if (this.direction === 'horizontal') {
                transformDistance = this.instance.scroll.x - current.left + this.windowWidth;
              } else {
                transformDistance = this.instance.scroll.y - current.top + this.windowHeight;
              }
            } else {
              if (this.direction === 'horizontal') {
                if (this.instance.scroll.x < current.left - this.windowWidth && this.instance.scroll.x < current.left - this.windowWidth / 2) {
                  transformDistance = 0;
                } else if (this.instance.scroll.x > current.right && this.instance.scroll.x > current.right + 100) {
                  transformDistance = current.right - current.left + this.windowWidth;
                } else {
                  transformDistance = false;
                }
              } else {
                if (this.instance.scroll.y < current.top - this.windowHeight && this.instance.scroll.y < current.top - this.windowHeight / 2) {
                  transformDistance = 0;
                } else if (this.instance.scroll.y > current.bottom && this.instance.scroll.y > current.bottom + 100) {
                  transformDistance = current.bottom - current.top + this.windowHeight;
                } else {
                  transformDistance = false;
                }
              }
            }
          }
          if (transformDistance !== false) {
            if (current.direction === 'horizontal' || this.direction === 'horizontal' && current.direction !== 'vertical') {
              this.transform(current.el, transformDistance, 0, isForced ? false : current.delay);
            } else {
              this.transform(current.el, 0, transformDistance, isForced ? false : current.delay);
            }
          }
        });
      }
      getRelativeOffset(offset) {
        let relativeOffset = [0, 0];
        if (offset) {
          for (var i = 0; i < offset.length; i++) {
            if (typeof offset[i] == 'string') {
              if (offset[i].includes('%')) {
                relativeOffset[i] = parseInt(offset[i].replace('%', '') * this.windowHeight / 100);
              } else {
                relativeOffset[i] = parseInt(offset[i]);
              }
            } else {
              relativeOffset[i] = offset[i];
            }
          }
        }
        return relativeOffset;
      }

      /**
       * Scroll to a desired target.
       *
       * @param  Available options :
       *          target - node, string, "top", "bottom", int - The DOM element we want to scroll to
       *          options {object} - Options object for additional settings.
       * @return {void}
       */
      scrollTo(target) {
        let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        // Parse options
        let offset = parseInt(options.offset) || 0; // An offset to apply on top of given `target` or `sourceElem`'s target
        let duration = options.duration || 1;
        let easing = this.scrollToEasing;
        this.lenis.scrollTo(target, {
          offset,
          immediate: options.immediate,
          duration: duration,
          easing: easing
        });
      }
      update() {
        this.addElements();
        this.detectElements();
        this.transformElements(true);
      }
      startScroll() {
        if (this.lenis != undefined) {
          this.lenis.start();
        }
      }
      stopScroll() {
        if (this.lenis != undefined) {
          this.lenis.stop();
        }
      }
      destroy() {
        super.destroy();
        cancelAnimationFrame(this.rafInstance);
      }
    }

    class Main {
      constructor() {
        let options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        this.options = options;

        // Override default options with given ones
        Object.assign(this, defaults, options);
        this.smartphone = defaults.smartphone;
        if (options.smartphone) Object.assign(this.smartphone, options.smartphone);
        this.tablet = defaults.tablet;
        if (options.tablet) Object.assign(this.tablet, options.tablet);
        if (!this.smooth && this.direction == 'horizontal') console.warn('🚨 `smooth:false` & `horizontal` direction are not yet compatible');
        if (!this.tablet.smooth && this.tablet.direction == 'horizontal') console.warn('🚨 `smooth:false` & `horizontal` direction are not yet compatible (tablet)');
        if (!this.smartphone.smooth && this.smartphone.direction == 'horizontal') console.warn('🚨 `smooth:false` & `horizontal` direction are not yet compatible (smartphone)');
        this.init();
      }
      init() {
        this.options.isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1 || window.innerWidth < this.tablet.breakpoint;
        this.options.isTablet = this.options.isMobile && window.innerWidth >= this.tablet.breakpoint;
        if (this.smooth && !this.options.isMobile || this.tablet.smooth && this.options.isTablet || this.smartphone.smooth && this.options.isMobile && !this.options.isTablet) {
          this.smooth = true;
        } else {
          this.smooth = false;
        }
        this.scroll = new Scroll(this.options);
        this.scroll.init();
        if (window.location.hash) {
          // Get the hash without the '#' and find the matching element
          const id = window.location.hash.slice(1, window.location.hash.length);
          let target = document.getElementById(id);

          // If found, scroll to the element
          if (target) this.scroll.scrollTo(target);
        }
      }
      update() {
        this.scroll.update();
      }
      start() {
        this.scroll.startScroll();
      }
      stop() {
        this.scroll.stopScroll();
      }
      scrollTo(target, options) {
        this.scroll.scrollTo(target, options);
      }
      setScroll(x, y) {
        this.scroll.setScroll(x, y);
      }
      on(event, func) {
        this.scroll.setEvents(event, func);
      }
      off(event, func) {
        this.scroll.unsetEvents(event, func);
      }
      destroy() {
        this.scroll.destroy();
      }
    }

    return Main;

}));
