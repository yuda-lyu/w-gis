import map from 'lodash-es/map.js'
import get from 'lodash-es/get.js'
import isnum from 'wsemi/src/isnum.mjs'
import cdbl from 'wsemi/src/cdbl.mjs'
import turf from './importTurf.mjs'
import fixCloseMultiPolygon from './fixCloseMultiPolygon.mjs'


/**
 * 針對MultiPolygon進行BezierSpline處理
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/splineMultiPolygon.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} pgs 輸入MultiPolygon資料陣列，為[[ [[x11,y11],[x12,y12],...], [[x21,y21],[x22,y22],...] ]]構成之陣列
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {String} [opt.supposeType='polygons'] 輸入提取模式字串，當數據座標深度為2時，使用polygons代表每個其內多邊形為獨立polygon，若為ringStrings則表示其內多邊形為交錯的ringString(代表聯集與剔除)，預設'polygons'
 * @param {Number} [opt.resolution=10000] 輸入曲線解析度數字，代表每段曲線細分多少距離，預設10000
 * @param {Number} [opt.sharpness=0.05] 輸入曲線緊繃程度數字，0為平滑，代表取最小彎曲度，1為折線，代表切線指定很長會比較有彎度，預設0.05
 * @returns {Array} 回傳MultiPolygon陣列
 * @example

 */
function splineMultiPolygon(pgs, opt = {}) {

    //supposeType
    let supposeType = get(opt, 'supposeType')
    if (supposeType !== 'polygons' && supposeType !== 'ringStrings') {
        supposeType = 'polygons'
    }

    //resolution
    let resolution = get(opt, 'resolution')
    if (!isnum(resolution)) {
        resolution = 10000
    }
    resolution = cdbl(resolution)

    //sharpness
    let sharpness = get(opt, 'sharpness')
    if (!isnum(sharpness)) {
        sharpness = 0.05
    }
    sharpness = cdbl(sharpness)

    //fixCloseMultiPolygon裡面已有toMultiPolygon故不用另外呼叫處理

    //fixCloseMultiPolygon
    pgs = fixCloseMultiPolygon(pgs, { supposeType })
    // console.log('fixCloseMultiPolygon pgs', JSON.stringify(pgs))

    let core = (pg, opt = {}) => {

        //pgNew
        let pgNew = map(pg, (ps, k) => {
            // console.log('ps', ps)
            let line = turf.lineString(ps)
            // console.log('line', line)
            let r = turf.bezierSpline(line, { resolution, sharpness })
            let psNew = get(r, 'geometry.coordinates')
            return psNew
        })

        return pgNew
    }

    //core
    pgs = map(pgs, (pg) => {
        return core(pg, opt)
    })

    return pgs
}


export default splineMultiPolygon
