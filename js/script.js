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

        // Toggle collapse/expand
        $nav.off('click.tocToggle').on('click.tocToggle', '.toc-toggle', function(e){
          e.preventDefault();
          e.stopPropagation();
          var $btn = $(this);
          var $li = $btn.closest('li');
          var isCollapsed = $li.toggleClass('is-collapsed').hasClass('is-collapsed');
          $btn.attr('aria-expanded', (!isCollapsed).toString());
        });
      } else {
        $postToc.hide();
      }
    } else {
      $postToc.hide();
    }
  }
})(jQuery);