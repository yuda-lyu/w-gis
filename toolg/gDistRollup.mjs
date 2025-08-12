import path from 'path'
import rollupFiles from 'w-package-tools/src/rollupFiles.mjs'
import rollupWorker from 'w-package-tools/src/rollupWorker.mjs'


let fdSrc = './src'
let fdTar = './dist'

async function core() {

    await rollupFiles({ //rollupFiles預設會clean folder故得要放第1個
        fns: 'WGis.mjs',
        fdSrc,
        fdTar,
        nameDistType: 'kebabCase',
        globals: {
            '@turf/turf': '@turf/turf', //編譯給前端用的@turf為官方打包後js檔(轉b64再於前端載入), 不使用node版故需剔除
        },
        external: [
            '@turf/turf',
        ],
    })
        .catch((err) => {
            console.log(err)
        })

    await rollupWorker({
        name: 'interp2', //原模組名稱, 將來會掛於winodw下或於node引入使用
        type: 'function', //原模組輸出為函數, 可傳入參數初始化
        // execFunctionByInstance: true, //default, 原模組為計算函數回傳結果
        fpSrc: path.resolve(fdSrc, 'interp2.mjs'), //原始檔案路徑
        fpTar: path.resolve(fdTar, 'interp2.wk.umd.js'), //檔案輸出路徑
        formatOut: 'es',
        bMinify: false, //因目前壓縮會導致編譯worker無法接收與回應, 故暫時關閉
    })
        .catch((err) => {
            console.log(err)
        })

}
core()
    .catch((err) => {
        console.log(err)
    })
