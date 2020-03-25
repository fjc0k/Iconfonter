module.exports = {
  pages: {
    background: {
      entry: './src/background.ts',
    },
    ManageProject: {
      entry: './src/pages/Manage/Project.tsx',
    },
    CollectionDetail: {
      entry: './src/pages/Collection/Detail.tsx',
    },
  },
  outDir: './dist',
  filenameHash: false,
  sourceMap: false,
  filenames: {
    js: 'assets/[name].js',
    css: 'assets/[name].css',
    chunk: 'assets/Common.js',
  },
  css: {
    loaderOptions: {
      less: {
        javascriptEnabled: true,
        // https://github.com/ant-design/ant-design/blob/master/components/style/themes/default.less
        modifyVars: {
          'primary-color': 'red',
        },
      },
    },
  },
  babel: {
    transpileModules: ['mini-svg-data-uri', 'prettier'],
  },
  chainWebpack: config => {
    // fix: assets/Common.js 不是一个 UTF-8 文件
    // ref: https://stackoverflow.com/a/58528858/13027651
    if (config.plugins.has('uglifyjs')) {
      config.plugin('uglifyjs').tap(args => {
        args[0].uglifyOptions.output.ascii_only = true
        return args
      })
    }
    return config
  },
}
