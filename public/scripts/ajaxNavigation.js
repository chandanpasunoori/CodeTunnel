(function ($) {
  $(function () {

    var $content = $('#content'),
      $loading = $('<div>')
      .css({
        marginLeft: '45%',
        padding: '10px',
        textAlign: 'left',
        fontStyle: 'italic',
        display: 'none'
      })
      .text('Loading')
      .insertAfter($content);

    window.addEventListener('popstate', function (e) {
      if (e.state)
        getPageContent(e.state.url);
      else
        history.replaceState({
          url: document.location.href
        }, document.title, document.location.href);
    });

    function getPageContent(url) {
      if ($(document).data('loading'))
        return;

      $(document)
        .unbind('initialize')
        .data('loading', true);
      $loading.fadeIn('fast');
      $content.slideUp('fast', function () {
        $content.data('intervalId', loadingAnimation($loading));
        $.get(url).done(displayPageContent).error(function (data) {
            displayPageContent(JSON.parse(data.responseText));
        });
      });
    }

    function displayPageContent(data) {
      $loading.fadeOut('fast', function () {
        $(document).data('loading', false);
        clearInterval($content.data('intervalId'));
        document.title = data.title;
        $('#banner a').text(data.bannerText);
        $content.html(data.view);

        var colorIndex = $(document).data('colorIndex'),
          items = $(document).data('colorItems');
        items.forEach(function (item) {
          $content.find(item.element).addClass(item.cssClass + colorIndex);
        });

        $content.slideDown('fast', function () {
          $(document).trigger('initialize');
        });
      });
    }

    $(document).on('click', 'a.hijax', function (e) {
      e.preventDefault();
      var url = $(this).attr('href');
      if (url.split('/').pop() !== document.location.href.split('/').pop()) {
        history.pushState({ url: url }, url, url);
        getPageContent(url);
      }
    });
  });

  function loadingAnimation($elem) {
    var count = 0;
    return setInterval(function () {
      $elem.text('Loading');
      for (var index = 0; index <= count; index++) {
        $elem.append('.');
      }
      count++;
      if (count >= 10) count = 0;
    }, 350);
  }

})(jQuery);