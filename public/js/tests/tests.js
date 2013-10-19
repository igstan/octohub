;(function (global) {

  test('parse Link headers containing "next" and "last" rels', function () {
    var links = octohub.parseLinks('<https://api.github.com/user/49002/repos?page=2>; rel="next", <https://api.github.com/user/49002/repos?page=2>; rel="last"')

    deepEqual(links, {
      "next": "https://api.github.com/user/49002/repos?page=2",
      "last": "https://api.github.com/user/49002/repos?page=2",
    });
  });

  test('parse Link headers containing "first" and "prev" rels', function () {
    var links = octohub.parseLinks('<https://api.github.com/user/49002/repos?page=1>; rel="first", <https://api.github.com/user/49002/repos?page=1>; rel="prev"')

    deepEqual(links, {
      "first": "https://api.github.com/user/49002/repos?page=1",
      "prev": "https://api.github.com/user/49002/repos?page=1",
    });
  });

})(this);
