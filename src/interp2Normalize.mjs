import get from 'lodash-es/get.js'
import map from 'lodash-es/map.js'
import min from 'lodash-es/min.js'
import max from 'lodash-es/max.js'
import isNumber from 'lodash-es/isNumber.js'
import isnum from 'wsemi/src/isnum.mjs'
import isestr from 'wsemi/src/isestr.mjs'
import cdbl from 'wsemi/src/cdbl.mjs'
import normalizeArray from './normalizeArray.mjs'


/**
 * 內插用正規化數據
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/interp2Normalize.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} ps 輸入二維座標加觀測數據點陣列，為[{x:x1,y:y1,z:z1},{x:x2,y:y2,z:z2},...]點物件之陣列
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {String} [opt.keyX='x'] 輸入點物件之x欄位字串，為座標，預設'x'
 * @param {String} [opt.keyY='y'] 輸入點物件之y欄位字串，為座標，預設'y'
 * @param {String} [opt.keyZ='z'] 輸入點物件之z欄位字串，為觀測值，預設'z'
 * @param {String} [opt.keyInd='ind'] 輸入點物件之ind欄位字串，正規化後可反查原始數據之指標，預設'ind'
 * @param {Number} [opt.scale=1] 輸入正規化範圍數值，因處理多邊形時有數值容許誤差，故須通過縮放值域來減少問題，預設1是正規化0至1之間，使用scaleXY則是正規化為0至scaleXY之間，預設1
 * @returns {Object} 回傳正規化數據物件
 * @example
 *
 * let ps
 * let r
 *
 * ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
 * r = interp2Normalize(ps)
 * delete r.nv
 * delete r.inv
 * console.log(JSON.stringify(r))
 * // => {"ps":[{"x":0.19646017699115045,"y":0.5168141592920354,"z":0.32158590308370044,"ind":null},{"x":0.18761061946902655,"y":0.5336283185840708,"z":0.5462555066079295,"ind":null},{"x":0,"y":0.6221238938053097,"z":0,"ind":null},{"x":0.8247787610619469,"y":0.35929203539823007,"z":0.8854625550660793,"ind":null},{"x":0.947787610619469,"y":0.5911504424778761,"z":0.07488986784140969,"ind":null},{"x":0.6398230088495576,"y":0.511504424778761,"z":0.7444933920704846,"ind":null},{"x":0.13539823008849558,"y":0.33716814159292036,"z":0,"ind":null},{"x":0.45663716814159294,"y":0.6601769911504425,"z":1,"ind":null},{"x":1,"y":0.6628318584070797,"z":0.28193832599118945,"ind":null},{"x":0.7017699115044248,"y":0.5575221238938053,"z":0.45374449339207046,"ind":null}],"psMinMax":{"xmin":0,"xmax":1,"ymin":0.33716814159292036,"ymax":0.6628318584070797,"zmin":0,"zmax":1},"st":{"x":{"min":21,"max":1151,"range":1130},"y":{"min":-378,"max":752,"range":1130},"z":{"min":22,"max":249,"range":227}}}
 *
 * ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
 * r = interp2Normalize(ps, { scale: 100 })
 * delete r.nv
 * delete r.inv
 * console.log(JSON.stringify(r))
 * // => {"ps":[{"x":19.646017699115045,"y":51.681415929203546,"z":32.158590308370044,"ind":null},{"x":18.761061946902654,"y":53.36283185840708,"z":54.62555066079295,"ind":null},{"x":0,"y":62.21238938053097,"z":0,"ind":null},{"x":82.47787610619469,"y":35.92920353982301,"z":88.54625550660793,"ind":null},{"x":94.77876106194691,"y":59.11504424778761,"z":7.488986784140969,"ind":null},{"x":63.982300884955755,"y":51.1504424778761,"z":74.44933920704845,"ind":null},{"x":13.539823008849558,"y":33.716814159292035,"z":0,"ind":null},{"x":45.663716814159294,"y":66.01769911504425,"z":100,"ind":null},{"x":100,"y":66.28318584070797,"z":28.193832599118945,"ind":null},{"x":70.17699115044248,"y":55.75221238938053,"z":45.37444933920705,"ind":null}],"psMinMax":{"xmin":0,"xmax":100,"ymin":33.716814159292035,"ymax":66.28318584070797,"zmin":0,"zmax":100},"st":{"x":{"min":21,"max":1151,"range":1130},"y":{"min":-378,"max":752,"range":1130},"z":{"min":22,"max":249,"range":227}}}
 *
 * ps = [{ x: 243, y: 206, z: 95, ind: 101 }, { x: 233, y: 225, z: 146, ind: 102 }, { x: 21, y: 325, z: 22, ind: 103 }, { x: 953, y: 28, z: 223, ind: 104 }, { x: 1092, y: 290, z: 39, ind: 105 }, { x: 744, y: 200, z: 191, ind: 106 }, { x: 174, y: 3, z: 22, ind: 107 }, { x: 537, y: 368, z: 249, ind: 108 }, { x: 1151, y: 371, z: 86, ind: 109 }, { x: 814, y: 252, z: 125, ind: 110 }]
 * r = interp2Normalize(ps, { keyInd: 'ind' })
 * delete r.nv
 * delete r.inv
 * console.log(JSON.stringify(r))
 * // => {"ps":[{"x":0.19646017699115045,"y":0.5168141592920354,"z":0.32158590308370044,"ind":101},{"x":0.18761061946902655,"y":0.5336283185840708,"z":0.5462555066079295,"ind":102},{"x":0,"y":0.6221238938053097,"z":0,"ind":103},{"x":0.8247787610619469,"y":0.35929203539823007,"z":0.8854625550660793,"ind":104},{"x":0.947787610619469,"y":0.5911504424778761,"z":0.07488986784140969,"ind":105},{"x":0.6398230088495576,"y":0.511504424778761,"z":0.7444933920704846,"ind":106},{"x":0.13539823008849558,"y":0.33716814159292036,"z":0,"ind":107},{"x":0.45663716814159294,"y":0.6601769911504425,"z":1,"ind":108},{"x":1,"y":0.6628318584070797,"z":0.28193832599118945,"ind":109},{"x":0.7017699115044248,"y":0.5575221238938053,"z":0.45374449339207046,"ind":110}],"psMinMax":{"xmin":0,"xmax":1,"ymin":0.33716814159292036,"ymax":0.6628318584070797,"zmin":0,"zmax":1},"st":{"x":{"min":21,"max":1151,"range":1130},"y":{"min":-378,"max":752,"range":1130},"z":{"min":22,"max":249,"range":227}}}
 *
 */
function interp2Normalize(ps, opt = {}) {

    //keyX
    let keyX = get(opt, 'keyX')
    if (!isestr(keyX)) {
        keyX = 'x'
    }

    //keyY
    let keyY = get(opt, 'keyY')
    if (!isestr(keyY)) {
        keyY = 'y'
    }

    //keyZ
    let keyZ = get(opt, 'keyZ', '')
    if (!isestr(keyZ)) {
        keyZ = 'z'
    }

    //keyInd
    let keyInd = get(opt, 'keyInd', '')
    if (!isestr(keyInd)) {
        keyInd = 'ind'
    }

    //scale
    let scale = get(opt, 'scale')
    if (!isnum(scale)) {
        scale = 1
    }
    scale = cdbl(scale)
    if (scale <= 0) {
        throw new Error(`scale need >= 0`)
    }
    // console.log('scale', scale)

    //nx, ny, nz
    let nx = normalizeArray(map(ps, keyX))
    let ny = normalizeArray(map(ps, keyY))
    let nz = normalizeArray(map(ps, keyZ))
    // console.log('nx', nx)
    // console.log('ny', ny)
    // console.log('nz', nz)

    //rangeXY
    let rangeXY = Math.max(nx.range, ny.range)

    //rangeXYHalf
    let rangeXYHalf = rangeXY / 2

    //st, x,y使用同網格尺寸縮放
    let st = {
        x: {
            min: nx.mid - rangeXYHalf,
            max: nx.mid + rangeXYHalf,
            range: rangeXY,
        },
        y: {
            min: ny.mid - rangeXYHalf,
            max: ny.mid + rangeXYHalf,
            range: rangeXY,
        },
        z: {
            min: nz.min,
            max: nz.max,
            range: nz.range,
        },
    }
    // console.log('st', st)

    //nv
    let nv = (v, dir) => {
        if (!isNumber(v)) {
            return null
        }
        if (st[dir].range <= 0) {
            return v
        }
        return (v - st[dir].min) / st[dir].range * scale
    }

    //inv
    let inv = (iv, dir) => {
        if (!isNumber(iv)) {
            return null
        }
        if (scale <= 0) {
            return iv
        }
        return iv / scale * st[dir].range + st[dir].min
    }

    //normalize ps
    ps = map(ps, (v) => {
        let x = nv(v[keyX], 'x')
        let y = nv(v[keyY], 'y')
        let z = nv(v[keyZ], 'z')
        let ind = get(v, keyInd, null)
        return {
            [keyX]: x,
            [keyY]: y,
            [keyZ]: z,
            [keyInd]: ind,
        }
    })
    // console.log('normalize ps', ps)

    //psMinMax
    let psx = map(ps, keyX)
    let psxMin = min(psx)
    let psxMax = max(psx)
    let psy = map(ps, keyY)
    let psyMin = min(psy)
    let psyMax = max(psy)
    let psz = map(ps, keyZ)
    let pszMin = min(psz)
    let pszMax = max(psz)
    let psMinMax = {
        xmin: psxMin,
        xmax: psxMax,
        ymin: psyMin,
        ymax: psyMax,
        zmin: pszMin,
        zmax: pszMax,
    }

    return {
        ps,
        psMinMax,
        st,
        nv,
        inv,
    }
}


export default interp2Normalize
