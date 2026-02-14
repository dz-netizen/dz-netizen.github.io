(function($){
  // Search
  var $searchWrap = $('#search-form-wrap'),
    isSearchAnim = false,
    searchAnimDuration = 200;

  var startSearchAnim = function(){
    isSearchAnim = true;
  };

  var stopSearchAnim = function(callback){
    setTimeout(function(){
      isSearchAnim = false;
      callback && callback();
    }, searchAnimDuration);
  };

  $('.nav-search-btn').on('click', function(){
    if (isSearchAnim) return;

    startSearchAnim();
    $searchWrap.addClass('on');
    stopSearchAnim(function(){
      $('.search-form-input').focus();
    });
  });

  $('.search-form-input').on('blur', function(){
    startSearchAnim();
    $searchWrap.removeClass('on');
    stopSearchAnim();
  });

  // Share
  $('body').on('click', function(){
    $('.article-share-box.on').removeClass('on');
  }).on('click', '.article-share-link', function(e){
    e.stopPropagation();

    var $this = $(this),
      url = $this.attr('data-url'),
      encodedUrl = encodeURIComponent(url),
      id = 'article-share-box-' + $this.attr('data-id'),
      title = $this.attr('data-title'),
      offset = $this.offset();

    if ($('#' + id).length){
      var box = $('#' + id);

      if (box.hasClass('on')){
        box.removeClass('on');
        return;
      }
    } else {
      var html = [
        '<div id="' + id + '" class="article-share-box">',
          '<input class="article-share-input" value="' + url + '">',
          '<div class="article-share-links">',
            '<a href="https://twitter.com/intent/tweet?text=' + encodeURIComponent(title) + '&url=' + encodedUrl + '" class="article-share-twitter" target="_blank" title="Twitter"><span class="fa fa-twitter"></span></a>',
            '<a href="https://www.facebook.com/sharer.php?u=' + encodedUrl + '" class="article-share-facebook" target="_blank" title="Facebook"><span class="fa fa-facebook"></span></a>',
            '<a href="http://pinterest.com/pin/create/button/?url=' + encodedUrl + '" class="article-share-pinterest" target="_blank" title="Pinterest"><span class="fa fa-pinterest"></span></a>',
            '<a href="https://www.linkedin.com/shareArticle?mini=true&url=' + encodedUrl + '" class="article-share-linkedin" target="_blank" title="LinkedIn"><span class="fa fa-linkedin"></span></a>',
          '</div>',
        '</div>'
      ].join('');

      var box = $(html);

      $('body').append(box);
    }

    $('.article-share-box.on').hide();

    box.css({
      top: offset.top + 25,
      left: offset.left
    }).addClass('on');
  }).on('click', '.article-share-box', function(e){
    e.stopPropagation();
  }).on('click', '.article-share-box-input', function(){
    $(this).select();
  }).on('click', '.article-share-box-link', function(e){
    e.preventDefault();
    e.stopPropagation();

    window.open(this.href, 'article-share-box-window-' + Date.now(), 'width=500,height=450');
  });

  // Caption
  $('.article-entry').each(function(i){
    $(this).find('img').each(function(){
      if ($(this).parent().hasClass('fancybox') || $(this).parent().is('a')) return;

      var alt = this.alt;

      if (alt) $(this).after('<span class="caption">' + alt + '</span>');

      $(this).wrap('<a href="' + this.src + '" data-fancybox=\"gallery\" data-caption="' + alt + '"></a>')
    });

    $(this).find('.fancybox').each(function(){
      $(this).attr('rel', 'article' + i);
    });
  });

  if ($.fancybox){
    $('.fancybox').fancybox();
  }

  // Mobile nav
  var $container = $('#container'),
    isMobileNavAnim = false,
    mobileNavAnimDuration = 200;

  var startMobileNavAnim = function(){
    isMobileNavAnim = true;
  };

  var stopMobileNavAnim = function(){
    setTimeout(function(){
      isMobileNavAnim = false;
    }, mobileNavAnimDuration);
  }

  $('#main-nav-toggle').on('click', function(){
    if (isMobileNavAnim) return;

    startMobileNavAnim();
    $container.toggleClass('mobile-nav-on');
    stopMobileNavAnim();
  });

  $('#wrap').on('click', function(){
    if (isMobileNavAnim || !$container.hasClass('mobile-nav-on')) return;

    $container.removeClass('mobile-nav-on');
  });

  // Logo typing effect (typewriter)
  var $logo = $('#logo[data-typing="true"]');
  if ($logo.length){
    var fullText = $logo.attr('data-text') || $logo.text();
    var index = 0;

    $logo.text('');

    var typeNext = function(){
      index++;
      $logo.text(fullText.slice(0, index));
      if (index < fullText.length) setTimeout(typeNext, 120);
    };

    setTimeout(typeNext, 200);
  }

  // Post TOC (left panel) - build from headings in article body
  var $postToc = $('#post-toc');
  if ($postToc.length){
    var $nav = $postToc.find('.post-toc-nav');
    var $article = $('.article-entry');
    var $headings = $article.find('h1, h2, h3, h4, h5, h6');

    if ($headings.length){
      // Build nested list structure by heading level
      var levels = [];
      $headings.each(function(){
        var level = parseInt(this.tagName.substring(1), 10);
        if (!isNaN(level)) levels.push(level);
      });

      var baseLevel = levels.length ? Math.min.apply(null, levels) : 2;
      var $root = $('<ul></ul>');
      // Stack of <ul> elements by normalized heading level.
      // normalizedLevel = headingLevel - baseLevel + 1 (so baseLevel becomes level 1)
      var ulStack = [$root];

      // Numbering counters by normalized heading level.
      // Example: [1,2] => "1.2".
      var numberStack = [];

      var ensureChildList = function($parentLi){
        if (!$parentLi || !$parentLi.length) return null;
        var $child = $parentLi.children('ul').first();
        if (!$child.length) $child = $('<ul></ul>').appendTo($parentLi);
        return $child;
      };

      $headings.each(function(){
        var $h = $(this);
        var id = $h.attr('id');
        if (!id) return;

        var level = parseInt(this.tagName.substring(1), 10);
        if (isNaN(level)) return;

        // If already numbered, ignore the prefix when building TOC.
        var $numberSpan = $h.children('.heading-number').first();
        var text = $h.clone().children('.heading-number').remove().end().text().trim();
        if (!text) return;

        var normalizedLevel = level - baseLevel + 1;
        if (normalizedLevel < 1) normalizedLevel = 1;

        // Move up to the correct list for this level
        while (ulStack.length > normalizedLevel){
          ulStack.pop();
        }

        // Move down (create nested lists) if needed
        while (ulStack.length < normalizedLevel){
          var $parentUl = ulStack[ulStack.length - 1];
          var $parentLi = $parentUl.children('li').last();
          if (!$parentLi.length) break;

          var $childUl = ensureChildList($parentLi);
          if (!$childUl) break;
          ulStack.push($childUl);
        }

        // Use the effective nesting level we actually have.
        var effectiveLevel = ulStack.length;
        numberStack = numberStack.slice(0, effectiveLevel);
        while (numberStack.length < effectiveLevel) numberStack.push(0);
        numberStack[effectiveLevel - 1] += 1;
        var numberText = numberStack.join('.');

        // Inject number prefix into the heading (once).
        if (!$numberSpan.length){
          $h.prepend($('<span class="heading-number"></span>').text(numberText + ' '));
        } else {
          $numberSpan.text(numberText + ' ');
        }

        var $li = $('<li></li>')
          .addClass('toc-item')
          .addClass('level-' + level)
          .attr('data-level', level);

        var $a = $('<a></a>').attr('href', '#' + id).text(numberText + ' ' + text);
        $li.append($a);
        ulStack[ulStack.length - 1].append($li);
      });

      // Add toggle buttons for items with children
      $root.find('li').each(function(){
        var $li = $(this);
        var $childUl = $li.children('ul');
        if (!$childUl.length) return;

        var $toggle = $('<button type="button" class="toc-toggle" aria-expanded="true" aria-label="Toggle section"></button>')
          .append('<span class="fa fa-chevron-right" aria-hidden="true"></span>');

        $li.prepend($toggle);
      });

      if ($root.children().length){
        $nav.empty().append($root);

        var getHeaderOffset = function(){
          // Landscape theme has a fixed top nav bar (#header-nav-wrap).
          // Using full #header height (banner included) makes TOC jumps land too low.
          var $fixedNav = $('#header-nav-wrap');
          if ($fixedNav.length){
            var pos = ($fixedNav.css('position') || '').toLowerCase();
            if (pos === 'fixed' || pos === 'sticky') return ($fixedNav.outerHeight() || 0);
          }

          // Fallback: body padding-top is set to header-nav-height.
          var paddingTop = parseInt(($('body').css('padding-top') || '0').replace('px', ''), 10);
          return isNaN(paddingTop) ? 0 : paddingTop;
        };

        var setBranchExpanded = function($li, expanded){
          if (!$li || !$li.length) return;
          var hasChildren = $li.children('ul').length > 0;
          if (!hasChildren) return;
          $li.toggleClass('is-collapsed', !expanded);
          $li.children('.toc-toggle').attr('aria-expanded', (!!expanded).toString());
        };

        var expandOnlyPath = function($activeLi){
          if (!$activeLi || !$activeLi.length) return;
          var $path = $activeLi.parents('li').addBack();

          // Collapse everything not on the active path
          $nav.find('li').each(function(){
            var $li = $(this);
            if ($li.children('ul').length === 0) return;
            if ($path.is($li)){
              setBranchExpanded($li, true);
            } else {
              setBranchExpanded($li, false);
            }
          });
        };

        var setActiveTocById = function(id){
          if (!id) return;
          var $link = $nav.find('a[href="#' + id + '"]').first();
          if (!$link.length) return;

          $nav.find('li.is-active').removeClass('is-active');
          var $li = $link.closest('li');
          $li.addClass('is-active');
          expandOnlyPath($li);
        };

        // Initialize collapsed state: keep only current branch open.
        $nav.find('li').each(function(){
          var $li = $(this);
          if ($li.children('ul').length) setBranchExpanded($li, false);
        });

        // Smooth scroll to heading with header offset.
        var smoothScrollToId = function(id){
          var el = document.getElementById(id);
          if (!el) return;
          var headerOffset = getHeaderOffset();
          var rect = el.getBoundingClientRect();
          var absoluteTop = rect.top + (window.pageYOffset || document.documentElement.scrollTop || 0);
          // Align the heading to the top of the visible content area.
          var targetTop = Math.max(0, absoluteTop - headerOffset);

          try {
            window.scrollTo({ top: targetTop, behavior: 'smooth' });
          } catch (e) {
            window.scrollTo(0, targetTop);
          }
        };

        // Accordion toggle: only one branch expanded at a time.
        $nav.off('click.tocToggle').on('click.tocToggle', '.toc-toggle', function(e){
          e.preventDefault();
          e.stopPropagation();
          var $btn = $(this);
          var $li = $btn.closest('li');
          var isCollapsed = $li.hasClass('is-collapsed');
          if (isCollapsed){
            // Expanding this branch collapses all others.
            expandOnlyPath($li);
          } else {
            setBranchExpanded($li, false);
          }
        });

        // TOC link click: expand branch + smooth scroll
        $nav.off('click.tocLink').on('click.tocLink', 'a[href^="#"]', function(e){
          var href = $(this).attr('href') || '';
          if (!href || href.charAt(0) !== '#') return;
          var id = href.slice(1);
          if (!id) return;
          e.preventDefault();

          var $li = $(this).closest('li');
          $nav.find('li.is-active').removeClass('is-active');
          $li.addClass('is-active');
          expandOnlyPath($li);
          smoothScrollToId(id);

          if (window.history && window.history.pushState){
            window.history.pushState(null, '', '#' + id);
          } else {
            window.location.hash = id;
          }
        });

        // Scroll spy: highlight the current heading and keep its branch open
        var headingPositions = [];
        var refreshHeadingPositions = function(){
          headingPositions = [];
          $headings.each(function(){
            var id = this.id;
            if (!id) return;
            headingPositions.push({
              id: id,
              top: $(this).offset().top
            });
          });
          headingPositions.sort(function(a, b){ return a.top - b.top; });
        };

        var rafPending = false;
        var lastActiveId = null;
        var updateActiveFromScroll = function(){
          rafPending = false;
          if (!headingPositions.length) return;
          var scrollTop = $(window).scrollTop();
          var offset = getHeaderOffset() + 4;
          var probe = scrollTop + offset;

          var activeId = headingPositions[0].id;
          for (var i = 0; i < headingPositions.length; i++){
            if (headingPositions[i].top <= probe){
              activeId = headingPositions[i].id;
            } else {
              break;
            }
          }

          if (activeId && activeId !== lastActiveId){
            lastActiveId = activeId;
            setActiveTocById(activeId);
          }
        };

        var requestUpdate = function(){
          if (rafPending) return;
          rafPending = true;
          window.requestAnimationFrame(updateActiveFromScroll);
        };

        var debounce = function(fn, wait){
          var t;
          return function(){
            clearTimeout(t);
            var args = arguments;
            var ctx = this;
            t = setTimeout(function(){ fn.apply(ctx, args); }, wait);
          };
        };

        refreshHeadingPositions();

        // Initial active state: hash > first heading
        var hash = (window.location.hash || '').replace('#', '');
        if (hash){
          setActiveTocById(hash);
        } else if (headingPositions.length){
          setActiveTocById(headingPositions[0].id);
        }

        $(window)
          .off('scroll.tocSpy')
          .on('scroll.tocSpy', requestUpdate)
          .off('resize.tocSpy')
          .on('resize.tocSpy', debounce(function(){
            refreshHeadingPositions();
            requestUpdate();
          }, 200));

        // Images and other late layout shifts can change offsets
        $(window).off('load.tocSpy').on('load.tocSpy', function(){
          refreshHeadingPositions();
          requestUpdate();
        });

        requestUpdate();
      } else {
        $postToc.hide();
      }
    } else {
      $postToc.hide();
    }
  }
})(jQuery);