module.exports = {
  pages: {
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
}
