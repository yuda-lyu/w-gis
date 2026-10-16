import rollupFiles from 'w-package-tools/src/rollupFiles.mjs'
import rollupWorker from 'w-package-tools/src/rollupWorker.mjs'
import getDistOpts from './distConfig.mjs'
import getIndexNames from './getIndexNames.mjs'
import { captureWarns, assertDist } from './checkDist.mjs'


//建置選項之單一出處為distConfig(帳本R-ENTRY-2), 測試亦引用之
let { optMain, optWorker, fpMain, fpWorker, externalsMain, externalsWorker } = getDistOpts()

let { warns } = await captureWarns(async () => {
    await rollupFiles(optMain) //rollupFiles預設會clean folder故得要放第1個
    await rollupWorker(optWorker)
})

//發布閘門(帳本R-ENTRY-2、R-ENTRY-3): 建置訊息、主產物與worker產物不符即拋錯, node以非0結束, w-pksupdate隨即中止(早於git add)
await assertDist({
    warns,
    fpMain,
    fpWorker,
    names: getIndexNames('./src/'),
    externalsMain,
    externalsWorker,
})
console.log('\x1b[32m%s\x1b[0m', 'dist check: ok')
