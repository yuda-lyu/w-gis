import { pathToFileURL, fileURLToPath } from 'url'
import { resolve, dirname } from 'path'
import { writeFileSync } from 'fs'
import { runCases } from './interp1Cases.mjs'


//子行程入口: 以interp1實作跑完案例集, 結果以JSON輸出
//用法: node [--import registerWsemiStrict.mjs] runInterp1Child.mjs [interp1.mjs路徑] [輸出json路徑]
//未給interp1路徑則用套件src/interp1.mjs; 未給輸出路徑則輸出至stdout, 前綴標記行供解析
const MARK = '@@interp1Child@@'

let dirTools = dirname(fileURLToPath(import.meta.url))
let modPath = process.argv[2] || resolve(dirTools, '../../src/interp1.mjs')
let outPath = process.argv[3]

console.log = console.error //interp1內catch會console.log, 避免污染stdout
let mod = await import(pathToFileURL(resolve(modPath)).href)
let rs = await runCases(mod.default)
let spy = globalThis.__interp1Spy || null
let s = JSON.stringify({ rs, spy })
if (outPath) {
    writeFileSync(resolve(outPath), s, 'utf8')
}
else {
    process.stdout.write(MARK + s + '\n')
}
