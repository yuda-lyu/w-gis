import fs from 'fs'
import path from 'path'
import { createRequire } from 'module'
import { fileURLToPath, pathToFileURL } from 'url'
import { isDeepStrictEqual } from 'util'


//產物核對之單一出處(帳本R-ENTRY-2、R-ENTRY-3): 發布閘門(gDistRollup)與測試(unit-entryDist)共用


let require = createRequire(import.meta.url)
let fdSrc = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src')


//worker產物抽測用資料, 取自src/interp2.mjs之JSDoc範例
let psSample = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
let pSample = { x: 243, y: 207 }


/**
 * 執行fn期間收集console.warn之訊息(rollup未給onwarn時以console.warn印出警告), 訊息仍照常印出
 *
 * @param {Function} fn 輸入非同步函數
 * @returns {Promise} 回傳Promise, resolve為{ result, warns }, warns為訊息字串陣列
 */
async function captureWarns(fn) {
    let warns = []
    let _warn = console.warn
    console.warn = (...args) => {
        warns.push(args.map((v) => String(v && v.message ? v.message : v)).join(' '))
        _warn(...args)
    }
    let result
    try {
        result = await fn()
    }
    finally {
        console.warn = _warn
    }
    return { result, warns }
}


/**
 * 取出不得出現之建置訊息: 無法解析之引用(UNRESOLVED_IMPORT)與未給全域名之外部模組(MISSING_GLOBAL_NAME)
 * 只比對特定訊息, 不比對警告總數(Browserslist過期等噪音會隨環境出現或消失)
 *
 * @param {Array} warns 輸入訊息字串陣列
 * @returns {Array} 回傳不得出現之訊息陣列
 */
function findBadWarns(warns) {
    return warns.filter((m) => /could not be resolved|No name was provided for external module/.test(m))
}


/**
 * 解析UMD產物檔頭CommonJS分支之外部引用清單(檔頭至AMD判斷define.amd之前之require)
 *
 * @param {String} code 輸入UMD產物程式碼
 * @returns {Array} 回傳外部模組名稱陣列
 */
function getUmdExternals(code) {
    let i = code.indexOf('define.amd')
    if (i < 0) {
        throw new Error('invalid umd code: define.amd not found')
    }
    let head = code.slice(0, i)
    return [...head.matchAll(/require\((["'])([^"']+)\1\)/g)].map((m) => m[2])
}


function diffNames(want, got) {
    let missing = want.filter((v) => !got.includes(v))
    let extra = got.filter((v) => !want.includes(v))
    return { missing, extra }
}


/**
 * 核對主產物: 外部清單等於宣告、可以CommonJS載入、匯出名單等於索引名單、型別(皆函數, 唯importTurf為物件)
 *
 * @param {Object} opt 輸入設定物件
 * @param {String} opt.fp 輸入主產物路徑字串
 * @param {Array} opt.names 輸入應匯出之名單
 * @param {Array} opt.externals 輸入應有之外部清單
 * @returns {Object} 回傳物件, 含externals、keys、mod(載入之模組)與problems(問題訊息陣列, 空陣列代表通過)
 */
function checkMain(opt) {
    let { fp, names, externals } = opt
    let problems = []

    //externals
    let ext = getUmdExternals(fs.readFileSync(fp, 'utf8'))
    let de = diffNames(externals, ext)
    if (de.missing.length > 0 || de.extra.length > 0) {
        problems.push(`main externals mismatch: got [${ext.join(', ')}], want [${externals.join(', ')}]`)
    }

    //load
    let mod = null
    try {
        mod = require(fp)
    }
    catch (err) {
        problems.push(`main load failed: ${err.message}`)
    }

    //names, types
    let keys = mod ? Object.keys(mod) : []
    if (mod) {
        let dn = diffNames(names, keys)
        if (dn.missing.length > 0) {
            problems.push(`main missing exports: ${dn.missing.join(', ')}`)
        }
        if (dn.extra.length > 0) {
            problems.push(`main extra exports: ${dn.extra.join(', ')}`)
        }
        for (let k of keys) {
            let want = k === 'importTurf' ? 'object' : 'function'
            let got = mod[k] === null ? 'null' : typeof mod[k]
            if (got !== want) {
                problems.push(`main export ${k} is ${got}, want ${want}`)
            }
        }
    }

    return { externals: ext, keys, mod, problems }
}


/**
 * 核對worker產物: 外部清單等於宣告、可以CommonJS載入、呼叫結果與src之interp2(同步模式)深等
 *
 * @param {Object} opt 輸入設定物件
 * @param {String} opt.fp 輸入worker產物路徑字串
 * @param {Array} opt.externals 輸入應有之外部清單
 * @returns {Promise} 回傳Promise, resolve為物件, 含externals、result、expected與problems(問題訊息陣列, 空陣列代表通過)
 */
async function checkWorker(opt) {
    let { fp, externals } = opt
    let problems = []

    //externals
    let ext = getUmdExternals(fs.readFileSync(fp, 'utf8'))
    let de = diffNames(externals, ext)
    if (de.missing.length > 0 || de.extra.length > 0) {
        problems.push(`worker externals mismatch: got [${ext.join(', ')}], want [${externals.join(', ')}]`)
    }

    //load
    let fun = null
    try {
        fun = require(fp)
    }
    catch (err) {
        problems.push(`worker load failed: ${err.message}`)
    }

    //call
    let result = null
    let expected = null
    if (typeof fun !== 'function') {
        problems.push(`worker export is ${typeof fun}, want function`)
    }
    else {
        let interp2 = (await import(pathToFileURL(path.resolve(fdSrc, 'interp2.mjs')).href)).default
        expected = interp2(psSample, pSample, { useSync: true })
        try {
            result = await fun(psSample, pSample)
        }
        catch (err) {
            problems.push(`worker call failed: ${err && err.message ? err.message : err}`)
        }
        if (!isDeepStrictEqual(result, expected)) {
            problems.push(`worker result ${JSON.stringify(result)} != src interp2 ${JSON.stringify(expected)}`)
        }
    }

    return { externals: ext, result, expected, problems }
}


/**
 * 發布閘門: 核對建置訊息、主產物與worker產物, 有任何問題即拋錯(node以非0結束, w-pksupdate隨即中止)
 *
 * @param {Object} opt 輸入設定物件
 * @param {Array} opt.warns 輸入建置期間收集之訊息陣列
 * @param {String} opt.fpMain 輸入主產物路徑字串
 * @param {String} opt.fpWorker 輸入worker產物路徑字串
 * @param {Array} opt.names 輸入應匯出之名單
 * @param {Array} opt.externalsMain 輸入主產物應有之外部清單
 * @param {Array} opt.externalsWorker 輸入worker產物應有之外部清單
 * @returns {Promise} 回傳Promise, resolve為'ok', reject為列出全部問題之Error
 */
async function assertDist(opt) {
    let { warns, fpMain, fpWorker, names, externalsMain, externalsWorker } = opt
    let problems = []
    for (let m of findBadWarns(warns || [])) {
        problems.push(`build warning: ${m}`)
    }
    problems.push(...checkMain({ fp: fpMain, names, externals: externalsMain }).problems)
    problems.push(...(await checkWorker({ fp: fpWorker, externals: externalsWorker })).problems)
    if (problems.length > 0) {
        throw new Error(`dist check failed:\n${problems.join('\n')}`)
    }
    return 'ok'
}


export {
    captureWarns,
    findBadWarns,
    getUmdExternals,
    checkMain,
    checkWorker,
    assertDist
}
