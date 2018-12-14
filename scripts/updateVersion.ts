import path from 'path'
import fs from 'fs-extra'
import pkg from '../package.json'
import manifest from '../public/manifest.json'

manifest.version = pkg.version

fs.writeJSONSync(
  path.resolve(__dirname, '../public/manifest.json'),
  manifest,
  {
    spaces: 2,
  }
)
