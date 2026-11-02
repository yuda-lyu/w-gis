/* eslint-disable no-new-wrappers */ //案例刻意以new Number(...)作為無效輸入(包裝物件)
import { inspect } from 'util'


//標準資料點(未排序), 與interp1.test.mjs相同
const PS_A = () => [{ x: 243, y: 206 }, { x: 233, y: 225 }, { x: 21, y: 325 }, { x: 953, y: 28 }, { x: 1092, y: 290 }, { x: 744, y: 200 }, { x: 174, y: 3 }, { x: 537, y: 368 }, { x: 1151, y: 371 }, { x: 814, y: 252 }]


/**
 * interp1之輸入案例集, 供測試與前後差分共用
 *
 * 每案: { name, group, ps, p, opt }
 * group: 'valid'為有效輸入(修前修後結果須逐字相同), 'invalid'為含無效值之輸入(處置見src/interp1.mjs之JSDoc)
 *
 * @returns {Array} 回傳案例陣列, 每次呼叫皆重新建構(含包裝物件, 避免案例間共用狀態)
 */
function getCases() {
    let cs = []
    let add = (group, name, ps, p, opt = {}) => {
        cs.push({ group, name, ps, p, opt })
    }

    //資料點形式
    let psArr = [[243, 206], [233, 225], [21, 325], [953, 28], [1092, 290], [744, 200], [174, 3], [537, 368], [1151, 371], [814, 252]]
    let psStr = [{ x: '21', y: '325' }, { x: ' 174 ', y: '3' }, { x: '233', y: ' 225' }, { x: '243', y: '206' }, { x: '537.0', y: '3.68e2' }, { x: '+744', y: '200' }, { x: '814', y: '252' }, { x: '953', y: '28' }, { x: '1092', y: '290' }, { x: '1151', y: '371' }]
    let psSmall = [{ x: 0.000243, y: 0.000206 }, { x: 0.000233, y: 0.000225 }, { x: 0.000021, y: 0.000325 }, { x: 0.000953, y: 0.000028 }, { x: 0.001092, y: 0.00029 }, { x: 0.000744, y: 0.000200 }, { x: 0.000174, y: 0.000003 }, { x: 0.000537, y: 0.000368 }, { x: 0.001151, y: 0.000371 }, { x: 0.000814, y: 0.000252 }]
    let psKey = [{ a: 243, b: 206 }, { a: 233, b: 225 }, { a: 21, b: 325 }, { a: 953, b: 28 }, { a: 1092, b: 290 }, { a: 744, b: 200 }, { a: 174, b: 3 }, { a: 537, b: 368 }, { a: 1151, b: 371 }, { a: 814, b: 252 }]
    let psDesc = [{ x: 4, y: 2 }, { x: 3, y: 1.2 }, { x: 1, y: 0.2 }]
    let psNeg = [{ x: -10, y: -5 }, { x: 0, y: 0 }, { x: 10, y: 5 }]

    //資料點含無效點(非數字/缺值/Infinity等), 有效點與PS_A相同
    let psBadPts = [{ x: 243, y: 206 }, null, { x: 'abc', y: 1 }, { x: 233, y: 225 }, { x: 21, y: 325 }, { x: 953 }, { y: 7 }, { x: 953, y: 28 }, [1], { x: 1092, y: 290 }, { x: 744, y: 200 }, { x: 174, y: 3 }, { x: 537, y: 368 }, { x: 1151, y: 371 }, 'xyz', { x: 814, y: 252 }, { x: null, y: 3 }, { x: 5, y: undefined }, { x: {}, y: 1 }]
    //資料點含Infinity/'0x10'/包裝物件/超界字串等(isnum收、isenum不收), 有效點與PS_A相同
    let psBadNum = () => [{ x: 243, y: 206 }, { x: Infinity, y: 1 }, { x: 233, y: 225 }, { x: 21, y: 325 }, { x: 1, y: -Infinity }, { x: 953, y: 28 }, { x: '0x10', y: 5 }, { x: 1092, y: 290 }, { x: 744, y: 200 }, { x: 174, y: 3 }, { x: '9', y: 'Infinity' }, { x: 537, y: 368 }, { x: 1151, y: 371 }, { x: new Number(77), y: 4 }, { x: 814, y: 252 }, { x: '1e400', y: 1 }, { x: '1e-400', y: 1 }, { x: '0b11', y: 1 }, { x: NaN, y: 1 }, { x: 55, y: new Number(3) }]

    //一般目標
    add('valid', 'known x', PS_A(), { x: 243 })
    add('valid', 'interpolate', PS_A(), { x: 283 })
    add('valid', 'out of range high', PS_A(), { x: 1160 })
    add('valid', 'out of range low', PS_A(), { x: 20 })
    add('valid', 'lower bound', PS_A(), { x: 21 })
    add('valid', 'upper bound', PS_A(), { x: 1151 })
    add('valid', 'zero', PS_A(), { x: 0 })
    add('valid', 'negative', PS_A(), { x: -1 })
    add('valid', 'custom keys', psKey, { a: 243 }, { keyX: 'a', keyY: 'b' })
    add('valid', 'custom keys array', psKey, [{ a: 243 }, { a: 283 }, { a: 5000 }], { keyX: 'a', keyY: 'b' })
    add('valid', 'custom keys missing in target', psKey, { x: 243 }, { keyX: 'a', keyY: 'b' })
    add('valid', 'custom keyX only', psKey, { a: 283 }, { keyX: 'a' })
    add('valid', 'bad keys fallback', PS_A(), { x: 283 }, { keyX: '', keyY: 5 })
    add('valid', 'array targets', PS_A(), [{ x: 243 }, { x: 283 }])
    add('valid', 'array targets mix range', PS_A(), [{ x: 0 }, { x: 21 }, { x: 243 }, { x: 283 }, { x: 1151 }, { x: 1160 }])
    add('valid', 'array targets unsorted dup', PS_A(), [{ x: 800 }, { x: 283 }, { x: 800 }, { x: 22 }])
    add('valid', 'array of arrays', PS_A(), [[243], [283, 99], [1160]])
    add('valid', 'array of numbers', PS_A(), [243, 283, 1160, 21])
    add('valid', 'array of numeric strings', PS_A(), ['243', ' 283 ', '+300', '2.83e2', '.5e3', '5.'])
    add('valid', 'array of mixed forms', PS_A(), [243, '283', { x: 300 }, [400], { x: '500' }, [' 600 ']])
    add('valid', 'small coordinates', psSmall, { x: 0.000243 })
    add('valid', 'small coordinates interpolate', psSmall, [{ x: 0.0003 }, { x: 0.0005 }, { x: 0.001 }])
    add('valid', 'array points', psArr, [{ x: 243 }, { x: 283 }, { x: 1160 }])
    add('valid', 'string points', psStr, [{ x: 243 }, { x: 283 }, { x: 600 }, { x: 1160 }])
    add('valid', 'desc points', psDesc, [{ x: 0 }, { x: 1 }, { x: 2 }, { x: 2.6 }, { x: 3.5 }, { x: 4 }, { x: 5 }])
    add('valid', 'negative points', psNeg, [{ x: -10 }, { x: -3.5 }, { x: 0 }, { x: 7 }, { x: 11 }])
    add('valid', 'one point only', [{ x: 1, y: 2 }], { x: 1 })
    add('valid', 'two points', [{ x: 1, y: 2 }, { x: 3, y: 6 }], [{ x: 1 }, { x: 2 }, { x: 3 }, { x: 4 }])
    add('valid', 'duplicate x points', [{ x: 1, y: 2 }, { x: 1, y: 3 }, { x: 5, y: 7 }], [{ x: 1 }, { x: 3 }])
    add('valid', 'invalid points filtered', psBadPts, [{ x: 243 }, { x: 283 }, { x: 1160 }])
    add('valid', 'no effective points', [null, 'a', { x: 'a', y: 1 }], { x: 1 })
    add('valid', 'psSrc not array', 'abc', { x: 1 })
    add('valid', 'psSrc empty', [], { x: 1 })
    add('valid', 'psSrc undefined', undefined, { x: 1 })
    add('valid', 'psTar undefined', PS_A(), undefined)
    add('valid', 'psTar null', PS_A(), null)
    add('valid', 'psTar string', PS_A(), 'abc')
    add('valid', 'psTar empty array', PS_A(), [])
    add('valid', 'psTar empty object', PS_A(), {})
    add('valid', 'psTar boolean', PS_A(), true)

    //純量目標
    add('valid', 'scalar number', PS_A(), 283)
    add('valid', 'scalar number out of range', PS_A(), 5000)
    add('valid', 'scalar zero', PS_A(), 0)
    add('valid', 'scalar numeric string', PS_A(), '283')
    add('valid', 'scalar padded string', PS_A(), ' 283 ')
    add('valid', 'scalar exponent string', PS_A(), '2.83e2')
    add('valid', 'scalar plus string', PS_A(), '+283')
    add('valid', 'scalar float', PS_A(), 283.5)
    add('valid', 'scalar custom key opt', psKey, 283, { keyX: 'a', keyY: 'b' })

    //內插方法
    for (let method of ['linear', 'stairs', 'blocks']) {
        add('valid', `${method} array`, psDesc, [{ x: 0 }, { x: 1 }, { x: 1.9 }, { x: 2 }, { x: 2.1 }, { x: 3 }, { x: 3.5 }, { x: 3.51 }, { x: 4 }, { x: 5 }], { method })
        add('valid', `${method} scalar`, PS_A(), 600, { method })
    }
    add('valid', 'method invalid fallback', psDesc, [{ x: 2 }, { x: 3.5 }], { method: 'cubic' })
    add('valid', 'method non-string', psDesc, [{ x: 2 }, { x: 3.5 }], { method: 5 })
    add('valid', 'opt undefined', psDesc, [{ x: 2 }])
    add('valid', 'opt null', psDesc, [{ x: 2 }], null)

    //stairs之xMin/xMax(有限數)
    let sx = [{ x: -1 }, { x: 0 }, { x: 0.49 }, { x: 0.5 }, { x: 0.51 }, { x: 1 }, { x: 1.9 }, { x: 2 }, { x: 2.1 }, { x: 3 }, { x: 3.5 }, { x: 3.51 }, { x: 4 }, { x: 4.49 }, { x: 4.5 }, { x: 4.51 }]
    add('valid', 'stairs xMin xMax', psDesc, sx, { method: 'stairs', xMin: 0, xMax: 4.5 })
    add('valid', 'stairs xMin only', psDesc, sx, { method: 'stairs', xMin: 0 })
    add('valid', 'stairs xMax only', psDesc, sx, { method: 'stairs', xMax: 4.5 })
    add('valid', 'stairs xMin equal first', psDesc, sx, { method: 'stairs', xMin: 1, xMax: 4 })
    add('valid', 'stairs xMin greater than first', psDesc, sx, { method: 'stairs', xMin: 2 })
    add('valid', 'stairs xMax less than last', psDesc, sx, { method: 'stairs', xMax: 3 })
    add('valid', 'stairs xMin negative', psDesc, sx, { method: 'stairs', xMin: -5, xMax: 9 })
    add('valid', 'stairs xMin numeric string ignored', psDesc, sx, { method: 'stairs', xMin: '0', xMax: '4.5' })
    add('valid', 'linear ignores xMin xMax', psDesc, sx, { method: 'linear', xMin: 0, xMax: 4.5 })
    add('valid', 'stairs xMin null undefined', psDesc, sx, { method: 'stairs', xMin: null, xMax: undefined })
    add('valid', 'stairs xMin boolean', psDesc, sx, { method: 'stairs', xMin: true, xMax: false })

    //useSync旗標不影響結果
    add('valid', 'useSync true', PS_A(), [{ x: 243 }, { x: 283 }], { useSync: true })
    add('valid', 'useSync non-boolean', PS_A(), [{ x: 243 }, { x: 283 }], { useSync: 'yes' })

    //含無效目標(非數字/缺值等): 既有行為為略過
    add('invalid', 'target non-numeric dropped', PS_A(), [{ x: 243 }, { x: 'abc' }, { x: 283 }])
    add('invalid', 'target null/undefined/empty dropped', PS_A(), [null, { x: 243 }, undefined, {}, { x: null }, { x: 283 }, [], 'x', true])
    add('invalid', 'targets all non-numeric', PS_A(), [{ x: 'abc' }, null, 'z'])
    add('invalid', 'target nested array dropped', PS_A(), [[[1]], { x: 283 }, { x: [283] }, { x: {} }])

    //含無效目標(isnum收、isenum不收): 改後略過
    add('invalid', 'target Infinity in array', PS_A(), [{ x: 243 }, { x: Infinity }, { x: 283 }])
    add('invalid', 'target -Infinity in array', PS_A(), [{ x: -Infinity }, { x: 283 }])
    add('invalid', 'target Infinity string in array', PS_A(), [{ x: 243 }, { x: 'Infinity' }, { x: '-Infinity' }, { x: 283 }])
    add('invalid', 'target hex string in array', PS_A(), [{ x: 243 }, { x: '0x10' }, { x: '0x1e3' }, { x: 283 }])
    add('invalid', 'target binary octal string in array', PS_A(), [{ x: '0b11' }, { x: '0o7' }, { x: 283 }])
    add('invalid', 'target overflow underflow string in array', PS_A(), [{ x: '1e400' }, { x: '1e-400' }, { x: 283 }])
    add('invalid', 'target NaN in array', PS_A(), [{ x: NaN }, { x: 283 }])
    add('invalid', 'target wrapper in array', PS_A(), [{ x: new Number(243) }, new Number(283), { x: 300 }])
    add('invalid', 'target numbers Infinity array', PS_A(), [243, Infinity, -Infinity, NaN, 283, 'Infinity', '0x10'])
    add('invalid', 'target arrays Infinity', PS_A(), [[Infinity], ['0x10'], [243]])
    add('invalid', 'targets all isnum-only', PS_A(), [{ x: Infinity }, { x: '0x10' }, { x: new Number(5) }])
    add('invalid', 'target Infinity with custom key', psKey, [{ a: Infinity }, { a: 283 }], { keyX: 'a', keyY: 'b' })
    add('invalid', 'scalar Infinity', PS_A(), Infinity)
    add('invalid', 'scalar -Infinity', PS_A(), -Infinity)
    add('invalid', 'scalar Infinity string', PS_A(), 'Infinity')
    add('invalid', 'scalar hex string', PS_A(), '0x10')
    add('invalid', 'scalar binary string', PS_A(), '0b11')
    add('invalid', 'scalar overflow string', PS_A(), '1e400')
    add('invalid', 'scalar underflow string', PS_A(), '1e-400')
    add('invalid', 'scalar NaN', PS_A(), NaN)
    add('invalid', 'scalar wrapper', PS_A(), new Number(283))
    add('invalid', 'object target Infinity', PS_A(), { x: Infinity })
    add('invalid', 'object target hex', PS_A(), { x: '0x10' })

    //含無效資料點(isnum收、isenum不收): 改後略過
    add('invalid', 'points Infinity hex wrapper filtered', psBadNum(), [{ x: 243 }, { x: 283 }, { x: 1160 }])
    add('invalid', 'points Infinity hex wrapper filtered scalar', psBadNum(), 283)
    add('invalid', 'points all isnum-only', [{ x: Infinity, y: 1 }, { x: '0x10', y: 2 }, { x: 5, y: 'Infinity' }], { x: 5 })
    add('invalid', 'points hex string value', [{ x: 1, y: '0x10' }, { x: 3, y: 4 }], [{ x: 1 }, { x: 2 }, { x: 3 }])
    add('invalid', 'points array form Infinity', [[1, 2], [Infinity, 3], [3, 4], [5, '0x10'], [7, 8]], [{ x: 2 }, { x: 5 }, { x: 7 }])

    //stairs之xMin/xMax含Infinity/NaN/包裝物件: 本輪不屬wsemi更動之契約(僅px與資料點), 本套件原樣交給wsemi, 結果與修前相同(Infinity表該側無界, 後續輪次是否收緊另議)
    add('valid', 'stairs xMax Infinity passes through', psDesc, sx, { method: 'stairs', xMax: Infinity })
    add('valid', 'stairs xMin -Infinity passes through', psDesc, sx, { method: 'stairs', xMin: -Infinity })
    add('valid', 'stairs xMin xMax Infinity both passes through', psDesc, sx, { method: 'stairs', xMin: -Infinity, xMax: Infinity })
    add('valid', 'stairs xMin NaN passes through', psDesc, sx, { method: 'stairs', xMin: NaN })
    add('valid', 'stairs xMax wrapper passes through', psDesc, sx, { method: 'stairs', xMax: new Number(4.5) })

    return cs
}


/**
 * 以指定interp1實作跑完案例集, 結果以util.inspect轉為字串(可保留Infinity/NaN/undefined/鍵序)
 *
 * @param {Function} interp1 輸入interp1函數
 * @param {Array} [cases=getCases()] 輸入案例陣列
 * @returns {Promise<Array>} 回傳結果陣列, 每案為{ name, group, sync, async }, sync為useSync=true之結果, async為不給useSync之結果({ ok }或{ rej })
 */
async function runCases(interp1, cases = getCases()) {
    let fmt = (v) => inspect(v, { depth: null, breakLength: Infinity, maxArrayLength: null, maxStringLength: null })
    let rs = []
    for (let c of cases) {
        let sync
        try {
            sync = fmt(interp1(c.ps, c.p, { ...c.opt, useSync: true }))
        }
        catch (err) {
            sync = 'THROW ' + fmt(String(err))
        }
        let asy
        try {
            let r = await interp1(c.ps, c.p, c.opt)
            asy = 'ok ' + fmt(r)
        }
        catch (err) {
            asy = 'rej ' + fmt(err)
        }
        rs.push({ name: c.name, group: c.group, sync, async: asy })
    }
    return rs
}


export { getCases, runCases }
