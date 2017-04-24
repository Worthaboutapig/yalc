const ignore = require('ignore')
import * as fs from 'fs-extra'
import * as path from 'path'
import {
  PackageManifest,
  getStorePackagesDir,
  values
} from '.'

const npmIgnoreDefaults = [
  '.*.swp',
  '._*',
  '.DS_Store',
  '.git',
  '.hg',
  '.npmrc',
  '.lock-wscript',
  '.svn',
  '.wafpickle-*',
  'config.gypi',
  'CVS',
  'npm-debug.log',
  'node_modules'
]

const getIngoreFilesContent = (): string => {
  let content: string = ''
  if (fs.existsSync('.npmignore')) {
    content += fs.readFileSync('.npmignore', 'utf-8') + '\n'
  }
  if (fs.existsSync('.yarnignore')) {
    content += fs.readFileSync('.npmignore', 'utf-8') + '\n'
  }
  if (content.length === 0 && fs.existsSync('.gitignore')) {
    content += fs.readFileSync('.gitignore', 'utf-8')
  }
  return content
}

export const copyWithIgnorePackageToStore = async (pkg: PackageManifest, options: {
  knit?: boolean
  workingDir: string
}) => {  
  const knitIgnore = ignore()
    .add(npmIgnoreDefaults)
    .add(values.locedPackagesFolder)
    .add(getIngoreFilesContent())  
  const copyFromDir = options.workingDir
  const locPackageStoreDir = path.join(getStorePackagesDir(), pkg.name, pkg.version)
  const filesToKnit: string[] = []
  const copyFilter: fs.CopyFilter = (f) => {
    f = path.relative(copyFromDir, f)    
    const ignores = knitIgnore.ignores(f)    
    if (options.knit && !ignores) {
      filesToKnit.push(f)
    }
    return !f || !ignores
  }  
  fs.removeSync(locPackageStoreDir)
  fs.copySync(copyFromDir, locPackageStoreDir, copyFilter)  
  if (options.knit) {    
    fs.removeSync(locPackageStoreDir)
    const ensureSymlinkSync = fs.ensureSymlinkSync as any
    filesToKnit.forEach(f => {      
      const source = path.join(copyFromDir, f)
      if (fs.statSync(source).isDirectory()) {
        return
      }
      ensureSymlinkSync(
        source,
        path.join(locPackageStoreDir, f)
      )
    })
  }
}
