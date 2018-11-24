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
    js: 'assets/[name].js',
    css: 'assets/[name].css',
    chunk: 'assets/Common.js',
  },
}
