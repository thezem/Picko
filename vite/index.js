const fs = require('fs');
const path = require('path');
const { build } = require('vite');
const express = require('express');

const nodeAdapter = (handler) => {
  return {
    name: 'node',

    rollupInput: {
      server: handler,
    },
  };
};
module.exports.nodeAdapter = nodeAdapter;

module.exports = ({ handler, adapter }) => {
  let root = process.cwd();
  let clientOutDir;

  const getHandlerFile = () => path.resolve(root, handler);

  return {
    name: 'mix',

    configResolved(config) {
      root = config.root;
      clientOutDir = path.resolve(root, config.build.outDir);
    },

    configureServer(devServer) {
      const handlerFile = getHandlerFile();
      devServer.middlewares.use(async (req, res, next) => {
        try {
          const { handler } = await devServer.ssrLoadModule(
            `/@fs/${handlerFile}`
          );
          const server = express();
          server.use((req, res, next) => {
            req.viteServer = devServer;
            next();
          });
          if (Array.isArray(handler.app)) {
            handler.app.forEach((handler) => server.use(handler));
          } else {
            server.use(handler.app);
          }
          server(req, res, next);
          server.use((err, req, res, next) => {
            devServer.ssrFixStacktrace(err);
            next(err);
          });
        } catch (error) {
          devServer.ssrFixStacktrace(error);
          process.exitCode = 1;
          next(error);
        }
      });
    },

    async writeBundle() {
      if (process.env.MIX_SSR_BUILD) return;

      process.env.MIX_SSR_BUILD = 'true';

      adapter = adapter || nodeAdapter(handler);

      const serverOutDir = path.join(root, 'build');

      const handlerFile = getHandlerFile();

      const buildOpts = { root, serverOutDir, clientOutDir: clientOutDir };

      if (adapter.buildStart) {
        await adapter.buildStart(buildOpts);
      }

      const indexHtmlPath = path.join(clientOutDir, 'index.html');
      const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
      fs.unlinkSync(indexHtmlPath);

      await build({
        root,
        resolve: {
          alias: {
            $handler_file: handlerFile,
          },
        },
        define: {
          'import.meta.env.MIX_CLIENT_DIR': JSON.stringify(
            path.relative(process.cwd(), clientOutDir)
          ),
          'import.meta.env.MIX_HTML': JSON.stringify(indexHtml),
          'import.meta.env.MODE': JSON.stringify('production'),
        },
        build: {
          outDir: serverOutDir,
          emptyOutDir: true,
          ssr: true,
          rollupOptions: {
            input: {
              handler: handlerFile,
              ...adapter.rollupInput,
            },
          },
        },
      });

      if (adapter.buildEnd) {
        await adapter.buildEnd(buildOpts);
      }
    },
  };
};
