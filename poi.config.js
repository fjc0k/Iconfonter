module.exports = {
  pages: {
    ManageProject: {
      entry: './src/pages/Manage/Project.tsx',
    },
  },
  outDir: './dist',
  filenameHash: false,
  sourceMap: false,
  filenames: {
    chunk: 'assets/js/Common.js',
  },
  chainWebpack: () => {},
}
