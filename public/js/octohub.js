;(function () {
  'use strict';

  var showHelp = function () {
    console.log('Setting keymaster scope: shortcuts');
    key.setScope('shortcuts');
    $('#shortcuts').show().focus();
  };

  var withToken = function (fn) {
    fn(localStorage.authToken);
  };

  var GET = function (url, callback) {
    withToken(function (token) {
      $.ajax('https://api.github.com' + url, {
        type: 'GET',
        dataType: 'text',
        headers: { 'Authorization': 'Token ' + token },
        success: function (response) {
          callback.success(JSON.parse(response));
        },
        error: function (xhr, textStatus, errorThrown) {
          callback.failure(xhr, textStatus, errorThrown);
        }
      });
    });
  };

  var unlessError = function (success) {
    return {
      success: success,
      failure: function (xhr, textStatus, errorThrown) {
        console.error(errorThrown);
      }
    };
  };

  var github = {
    user: function (handlers) {
      GET('/user', handlers);
    },

    repos: function (user, handlers) {
      GET('/users/'+ user +'/repos', handlers);
    },

    organizations: function (user, handlers) {
      GET('/users/'+ user +'/orgs', handlers);
    },

    organization: function (org) {
      return {
        repos: function (handlers) {
          GET('/orgs/'+ org +'/repos', handlers);
        },
        eventsFor: function (user, handlers) {
          GET('/users/'+ user +'/events/orgs/'+ org, handlers);
        }
      };
    },

    commit: function (user, repo, sha, handlers) {
      GET('/repos/'+ user +'/'+ repo +'/commits/' + sha, handlers);
    },

    commits: function (user, repo, handlers) {
      GET('/repos/'+ user +'/'+ repo +'/commits', handlers);
    }
  };

  Handlebars.registerHelper('list', function (items, options) {
    var out = "<ul>";

    for (var i=0, l=items.length; i<l; i++) {
      out = out + "<li>" + options.fn(items[i]) + "</li>";
    }

    return out + "</ul>";
  });

  Handlebars.registerHelper('shortCommit', function (sha) {
    return sha.substring(0, 7);
  });

  Handlebars.registerHelper('externalLink', function (text, url) {
    text = Handlebars.Utils.escapeExpression(text);
    url  = Handlebars.Utils.escapeExpression(url);
    var result = '<a href="' + url + '" tabindex="-1" target="_blank">' + text + '</a>';
    return new Handlebars.SafeString(result);
  });

  Handlebars.registerHelper('colorizePatch', function (patch) {
    if (!patch) {
      console.warn('Patch was falsy', patch);
      return;
    }

    var out = "<ol>";
    var items = patch.split(/\n/);

    for (var i=0, l=items.length; i<l; i++) {
      var cssClass = '';
      if (items[i][0] === '+') {
        cssClass = 'addition';
      }
      if (items[i][0] === '-') {
        cssClass = 'deletion';
      }

      out = out + '<li class="' + cssClass + '"><pre>' + Handlebars.Utils.escapeExpression(items[i]) + '</pre></li>';
    }

    return new Handlebars.SafeString(out + '</ol>');
  });

  var byPushTimeDesc = function (a, b) {
    if (new Date(a.pushed_at) < new Date(b.pushed_at)) return 1;
    if (new Date(a.pushed_at) > new Date(b.pushed_at)) return -1;
    return 0;
  }

  jQuery(function ($) {
    // var eventsTemplate = Handlebars.compile( $('#event-list-template').html() );
    var reposTemplate = Handlebars.compile( $('#repos-list-template').html() );
    var orgsTemplate = Handlebars.compile( $('#orgs-list-template').html() );
    var commitsTemplate = Handlebars.compile( $('#commit-list-template').html() );
    var commitDetailsTemplate = Handlebars.compile( $('#commit-details-template').html() );

    var eventTemplates = {
      // push: Handlebars.compile($('#push-event-summary').html()),
      // commit: Handlebars.compile($('#commit-comment-event-summary').html()),
    }

    Handlebars.registerHelper('eventSummary', function (type, payload, repo) {
      if (type === 'PushEvent') {
        return new Handlebars.SafeString(
          eventTemplates.push({ payload: payload, repo: repo })
        );
      }

      if (type === 'CommitCommentEvent') {
        return new Handlebars.SafeString(
          eventTemplates.commit({ payload: payload, repo: repo })
        );
      }

      return type;
    });

    github.user(unlessError(function (user) {
      github.organizations(user.login, unlessError(function (orgs) {
        orgs.unshift({
          login: user.login,
          isUser: true
        });

        var context = { orgs: orgs };
        $('#orgs').append( orgsTemplate(context) );
      }));
    }));

    // Focusable elements
    $('.orgs, .repos, .commits, .events, .commit-details')
      .attr('tabindex', '0')
      .focus(function () {
        console.info('Setting keymaster scope: ' + this.id);
        key.setScope(this.id);
      })
      .blur(function () {
        console.info('Setting keymaster scope: all');
        key.setScope('all');
      });


    // Resizers
    (function () {
      var width = 0;

      $('.resizer').attr('tabindex', '0').each(function () {
        width += $(this).prev().width();
        $(this).css('left', width - 1);
      });

      var resize = function (resizer, left) {
        $(resizer).css({ left: left });

        var prev = $(resizer).prev();
        prev.css({
          width: left - prev.offset().left
        });

        var next = $(resizer).next();
        next.css({
          left: left + 1,
          width: next.width() + (next.offset().left - left - 1)
        });
      };

      var focusedResizer;

      $('.resizer')
        .focus(function () {
          console.info('Setting keymaster scope: resizer');
          focusedResizer = this;
          key.setScope('resizer');
        })
        .blur(function () {
          console.info('Setting keymaster scope: all');
          key.setScope('all');
        });

      key('left', 'resizer', function () {
        console.log(focusedResizer);
        resize(focusedResizer, parseFloat($(focusedResizer).css('left')) - 1);
      });

      key('right', 'resizer', function () {
        resize(focusedResizer, parseFloat($(focusedResizer).css('left')) + 1);
      });

      key('shift+left', 'resizer', function () {
        resize(focusedResizer, parseFloat($(focusedResizer).css('left')) - 10);
      });

      key('shift+right', 'resizer', function () {
        resize(focusedResizer, parseFloat($(focusedResizer).css('left')) + 10);
      });

      $('.resizer').drag(function (event, dd) {
        resize(this, dd.offsetX);
      });
    })();

    $('#shortcuts').blur(function () {
      $(this).hide();
    });

    key('shift+/', function () {
      showHelp();
    });

    key('esc', function () {
      console.log('Setting keymaster scope: all');
      document.activeElement.blur();
      key.setScope('all');
    });

    var navigationList = function (root, selector, onSelected) {
      root.on('click', selector, function () {
        root.find('.selected').removeClass('selected');
        $(this).addClass('selected');
        onSelected.call(this, this);
      });

      return {
        next: function () {
          var selected = root.find('.selected');

          if (selected.length === 0) {
            var elem = root.find(selector).eq(0).addClass('selected');
            onSelected.call(elem, elem);
            return;
          }

          var next = selected.next(selector);

          if (next.length > 0) {
            selected.removeClass('selected');
            next.addClass('selected');
            onSelected.call(next, next);
            next[0].scrollIntoViewIfNeeded(false);
          }
        },

        prev: function () {
          var selected = root.find('.selected');

          if (selected.length === 0) {
            var elem = root.find(selector + ':last').eq(0).addClass('selected');
            onSelected.call(elem, elem);
            return;
          }

          var prev = selected.prev(selector);

          if (prev.length > 0) {
            selected.removeClass('selected');
            prev.addClass('selected');
            onSelected.call(prev, prev);
            prev[0].scrollIntoViewIfNeeded(false);
          }
        },

        first: function () {
          root.find('.selected').removeClass('selected');
          var first = root.find(selector + ':first');
          first.addClass('selected');
          onSelected.call(first, first);
          first[0].scrollIntoViewIfNeeded(false);
        },

        last: function () {
          root.find('.selected').removeClass('selected');
          var last = root.find(selector + ':last');
          last.addClass('selected');
          onSelected.call(last, last);
          last[0].scrollIntoViewIfNeeded(false);
        }
      };
    };

    var navs = {
      orgs: navigationList($('#orgs'), 'li', function () {
        if ($(this).data('type') === 'user') {
          var user = $(this).text();

          github.repos(user, unlessError(function (repos) {
            var context = { repos: repos.sort(byPushTimeDesc) };

            $('#commits, #commit-details').hide();

            $('#repos')
              .find('ul').remove().end()
              .append( reposTemplate(context) )
              .show();
          }));
        } else {
          var org = $(this).text();

          github.organization(org).repos(unlessError(function (repos) {
            var context = { repos: repos.sort(byPushTimeDesc) };

            $('#commits, #commit-details').hide();

            $('#repos')
              .find('ul').remove().end()
              .append( reposTemplate(context) )
              .show();
          }));
        }
      }),
      repos: navigationList($('#repos'), 'li', _.debounce(function () {
        var org = $('#orgs .selected').text();
        var repo = $(this).text();

        // github.organization(org).eventsFor('igstan', unlessError(function (events) {
        //   var context = { events: events };
        //   // $('#commit-details').hide();
        //   $('#events')
        //     .find('ul').remove().end()
        //     .append( eventsTemplate(context) )
        //     .show();
        // }));

        github.commits(org, repo, unlessError(function (commits) {
          var context = { commits: commits };
          $('#commit-details').hide();
          $('#commits')
            .find('ul').remove().end()
            .append( commitsTemplate(context) )
            .show();
        }));
      }, 100)),
      commits: navigationList($('#commits'), 'li', function () {
        var org = $('#orgs .selected').text();
        var repo = $('#repos .selected').text();
        var sha = $(this).data('commit-sha');

        github.commit(org, repo, sha, unlessError(function (commit) {
          var context = { commit: commit };

          $('#commit-details')
            .find('.patch-info').remove().end()
            .append( commitDetailsTemplate(context) )
            .show();
        }));
      }),
      events: navigationList($('#events'), 'li.event', function () {

      }),
    };

    _.each(navs, function (nav, widget) {
      key('up', widget, function (event) {
        event.preventDefault();
        nav.prev();
      });

      key('down', widget, function (event) {
        event.preventDefault();
        nav.next();
      });

      key('alt+up', widget, function (event) {
        event.preventDefault();
        nav.first();
      });

      key('alt+down', widget, function (event) {
        event.preventDefault();
        nav.last();
      });
    });

    var focusables = [
      'orgs',
      'repos',
      'commits',
      'commit-details',
    ];

    // If there's content to scroll, first scroll, and then jump to other pane
    key('left', function (event) {
      var i = focusables.indexOf(document.activeElement.id);

      if (i > 0 && i < focusables.length && document.activeElement.scrollLeft === 0) {
        event.preventDefault();
        $('#' + focusables[i - 1]).focus();
      }
    });

    key('right', function (event) {
      var i = focusables.indexOf(document.activeElement.id);

      if (i >= 0 && i < focusables.length - 1) {
        event.preventDefault();
        $('#' + focusables[i + 1]).focus();
      }
    });
  });
})();
