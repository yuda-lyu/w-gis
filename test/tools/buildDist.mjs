// 測試用建置(子行程): 以與發布相同之選項(toolg/distConfig.mjs)由指定src建出主產物與worker產物至cwd之./dist, 並收集建置訊息
// 用法: node test/tools/buildDist.mjs <src資料夾絕對路徑>
// cwd須為測試專用之暫存資料夾(例如test/_tmp/unit-entryDist/), 其內須有package.json副本(rollupFile自cwd讀版號作banner);
// rollupWorker之暫存檔temp-*.js亦落於cwd, 故不可以repo根為cwd執行
import fs from 'fs'
import rollupFiles from 'w-package-tools/src/rollupFiles.mjs'
import rollupWorker from 'w-package-tools/src/rollupWorker.mjs'
import getDistOpts from '../../toolg/distConfig.mjs'
import { captureWarns } from '../../toolg/checkDist.mjs'


let fdSrc = process.argv[2]
if (!fdSrc || !fs.existsSync(fdSrc)) {
    throw new Error(`invalid src folder: ${fdSrc}`)
}
if (!fs.existsSync('./package.json')) {
    throw new Error('package.json not found in cwd')
}

let { optMain, optWorker, fpMain, fpWorker } = getDistOpts({ fdSrc, fdTar: './dist' })
let { warns } = await captureWarns(async () => {
    await rollupFiles({ ...optMain, bLog: false })
    await rollupWorker({ ...optWorker, bLog: false })
})

fs.writeFileSync('./build-result.json', JSON.stringify({ fpMain, fpWorker, warns }, null, 2), 'utf8')
