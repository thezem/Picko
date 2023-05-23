class Router {
  constructor() {
    this.routes = [];
  }

  add(path) {
    const levels = path.split('/').length - 1;
    const params = path.split('/').filter((part) => part.startsWith(':'));
    const regex = new RegExp(
      `^${path.replace(/:[^/]+/g, '([^/]+)').replace('*', '.*')}$`
    );

    const route = {
      originalPath: path.split('*')[0].replace(/\/$/, ''),
      levels,
      regex,
      params,
    };

    this.routes.push(route);
  }

  find(route) {
    for (const routeObj of this.routes) {
      const matches = routeObj.regex.exec(route);
      const paramsValues = {};

      if (matches) {
        routeObj.params.forEach((param, i) => {
          paramsValues[param.substr(1)] = matches[i + 1];
        });

        const query = route.split('?')[1];
        const queryParams = query
          ? Object.fromEntries(new URLSearchParams(query).entries())
          : null;

        return {
          originalPath: routeObj.originalPath,
          params: paramsValues,
          query: queryParams,
        };
      }
    }

    return null;
  }
}

// // Usage:
// const router = new Router();
// router.add('/users/:id');
// router.add('/users/*');

// const result1 = router.find('/users/123?name=John');
// console.log(result1);

// const result2 = router.find('/users/john');
// console.log(result2);

module.exports = Router;
