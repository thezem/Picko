function parseRoute(path) {
  const levels = path.split('/').length - 1; // calculate the depth of the path
  const params = path.split('/').filter((part) => part.startsWith(':')); // extract the parameter names
  const regex = new RegExp(
    `^${path.replace(/:[^/]+/g, '([^/]+)').replace('*', '.*')}$`
  ); // build a regex to match the path

  const func = (route) => {
    const matches = regex.exec(route);
    const paramsValues = {};

    if (matches) {
      params.forEach((param, i) => {
        paramsValues[param.substr(1)] = matches[i + 1];
      });

      const query = route.split('?')[1];
      const queryParams = query
        ? Object.fromEntries(new URLSearchParams(query).entries())
        : {};

      console.log(paramsValues, queryParams); // do something with the parsed params and queries
    } else {
      console.log('Route not found');
    }
  };
  const parts = path.split('/');
  const levis = parts.filter(
    (part) => part.startsWith(':') || part === '*'
  ).length;
  const paths = parts.slice(0, parts.length - levis).join('/');

  return {
    path: paths,
    levels,
    func,
  };
}
module.exports = parseRoute;

// Usage:
const route1 = parseRoute('/users/:id');
console.log(route1); // { path: '/users', levels: 1, func: [Function: func] }
route1.func('/users/123?name=John'); // { id: '123' } { name: 'John' }
const route2 = parseRoute('/users/*');
console.log(route2);
route2.func('/users/123/abc/xyz?name=John&age=25');
