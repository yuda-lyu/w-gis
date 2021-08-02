import rollupFiles from 'w-package-tools/src/rollupFiles.mjs'


let fdSrc = './src'
let fdTar = './dist'

rollupFiles({ //rollupFiles預設會clean folder
    fns: 'WGis.mjs',
    fdSrc,
    fdTar,
    nameDistType: 'kebabCase',
    globals: {
        '@turf/turf': '@turf/turf', //編譯給前端用的@turf為官方打包後js檔(轉b64再於前端載入), 不使用node安裝的@turf故需剔除
    },
    external: [
        '@turf/turf',
    ],
})
    .catch((err) => {
        console.log(err)
    })
