;(function (global) {
  'use strict';

  global.octohub = global.octohub || {};

  global.octohub.parseLinks = function parseLinks(header) {
    var rels = {};

    if (!header) {
      return rels;
    }

    _.map(header.split(','), function (part) {
      var parts = part.trim().split(';');
      var rel = /^rel="([^"]+)"$/.exec(parts[1].trim())[1];
      var url = /^<([^>]+)>$/.exec(parts[0].trim())[1];
      rels[rel] = url;
    });

    return rels;
  };

})(this);
