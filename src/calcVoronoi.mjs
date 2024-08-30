import get from 'lodash-es/get.js'
import each from 'lodash-es/each.js'
import map from 'lodash-es/map.js'
import min from 'lodash-es/min.js'
import max from 'lodash-es/max.js'
import size from 'lodash-es/size.js'
import values from 'lodash-es/values.js'
import cloneDeep from 'lodash-es/cloneDeep.js'
import isestr from 'wsemi/src/isestr.mjs'
import isearr from 'wsemi/src/isearr.mjs'
import isbol from 'wsemi/src/isbol.mjs'
import iseobj from 'wsemi/src/iseobj.mjs'
import isnum from 'wsemi/src/isnum.mjs'
import cdbl from 'wsemi/src/cdbl.mjs'
import ptsXYtoArr from './ptsXYtoArr.mjs'
import { Delaunay } from 'd3-delaunay'


/**
 * 計算Voronoi多邊形網格
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/calcVoronoi.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} points 輸入二維座標加觀測數據點陣列，為[{x:x1,y:y1,z:z1},{x:x2,y:y2,z:z2},...]點物件之陣列
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {String} [opt.keyX='x'] 輸入點物件之x欄位字串，為座標，預設'x'
 * @param {String} [opt.keyY='y'] 輸入點物件之y欄位字串，為座標，預設'y'
 * @param {Number} [opt.scaleBox=1.1] 輸入自動計算外框邊界的x,y上下限放大比例，預設1.1
 * @param {Array} [opt.box=[]] 輸入外框邊界，為左上右下的2點座標，若有輸入則強制取消scaleBox，預設[]
 * @param {Boolean} [opt.withFinder=false] 輸入是否多回傳查詢x,y座標所在網格函數布林值，預設false
 * @param {Boolean} [opt.withInst=false] 輸入是否多回傳D3的Voronoi建構物件布林值，預設false
 * @returns {Object} 回傳多邊形網格資訊物件，nodes為多邊形網格之節點，polygons為多邊形網格之節點指標，其位置係基於points產生，故順序亦對應points，若發生錯誤則回傳錯誤訊息物件
 * @example
 *
 * let ps
 * let o
 * let r
 *
 * ps = [{ x: 243, y: 206 }, { x: 233, y: 225 }, { x: 21, y: 325 }, { x: 953, y: 283 }, { x: 1092, y: 290 }, { x: 744, y: 200 }, { x: 174, y: 3 }, { x: 537, y: 368 }, { x: 1151, y: 371, ext: 'abc' }, { x: 814, y: 252 }]
 * r = calcVoronoi(ps)
 * console.log(r)
 * // => {
 * //   nodes: [
 * //     { x: 492.28293900586067, y: 101.37540698936401 },
 * //     { x: 386.3692756036636, y: 293.58909242298085 },
 * //     { x: 98.28090392098173, y: 141.96363364262197 },
 * //     { x: 491.16970240018804, y: 8.420150415699638 },
 * //     { x: 341.3003289473684, y: 389.4 },
 * //     { x: 180.96226415094338, y: 389.4 },
 * //     { x: 68.03825239785515, y: 150.0010950834529 },
 * //     { x: -35.5, y: 389.4 },
 * //     { x: -35.5, y: 100.80434782608694 },
 * //     { x: 1207.5, y: 60.85114503816796 },
 * //     { x: 964.0722237025195, y: 189.99794238683128 },
 * //     { x: 855.7004539898726, y: 122.74938885978698 },
 * //     { x: 742.008133971292, y: -15.400000000000006 },
 * //     { x: 1207.5, y: -15.400000000000006 },
 * //     { x: 936.8158273381295, y: 389.4 },
 * //     { x: 1207.5, y: 267.858024691358 },
 * //     { x: 1040.6372881355933, y: 389.4 },
 * //     { x: 690.3167288225892, y: 345.381326584976 },
 * //     { x: 499.4022807017544, y: -15.400000000000006 },
 * //     { x: -35.5, y: -15.400000000000006 },
 * //     { x: 708.7505415162454, y: 389.4 },
 * //     { x: 1207.5, y: 389.4 }
 * //   ],
 * //   polygons: [
 * //     [ 0, 1, 2, 3, 0 ],
 * //     [ 1, 4, 5, 6, 2, 1 ],
 * //     [ 7, 8, 6, 5, 7 ],
 * //     [ 9, 10, 11, 12, 13, 9 ],
 * //     [ 14, 10, 9, 15, 16, 14 ],
 * //     [
 * //       12, 11, 17, 0,
 * //        3, 18, 12
 * //     ],
 * //     [
 * //       19, 18,  3, 2,
 * //        6,  8, 19
 * //     ],
 * //     [ 4, 1, 0, 17, 20, 4 ],
 * //     [ 16, 15, 21, 16 ],
 * //     [ 11, 10, 14, 20, 17, 11 ]
 * //   ]
 * // }
 *
 * ps = [{ x: 243, y: 206 }, { x: 233, y: 225 }, { x: 21, y: 325 }, { x: 953, y: 283 }, { x: 1092, y: 290 }, { x: 744, y: 200 }, { x: 174, y: 3 }, { x: 537, y: 368 }, { x: 1151, y: 371, ext: 'abc' }, { x: 814, y: 252 }]
 * r = calcVoronoi(ps, {
 *     box: {
 *         xb0: -100,
 *         yb0: -50,
 *         xb1: 1300,
 *         yb1: 400,
 *     }
 * })
 * // console.log(r)
 * // => {
 * //   nodes: [
 * //     { x: 492.28293900586067, y: 101.37540698936401 },
 * //     { x: 386.3692756036636, y: 293.58909242298085 },
 * //     { x: 98.28090392098173, y: 141.96363364262197 },
 * //     { x: 491.16970240018804, y: 8.420150415699638 },
 * //     { x: 336.3141447368421, y: 400 },
 * //     { x: 185.96226415094338, y: 400 },
 * //     { x: 68.03825239785515, y: 150.0010950834529 },
 * //     { x: -100, y: 400 },
 * //     { x: -100, y: 70.15683229813664 },
 * //     { x: 1300, y: 11.776717557251857 },
 * //     { x: 964.0722237025195, y: 189.99794238683128 },
 * //     { x: 855.7004539898726, y: 122.74938885978698 },
 * //     { x: 713.5334928229665, y: -50 },
 * //     { x: 1300, y: -50 },
 * //     { x: 935.3669064748201, y: 400 },
 * //     { x: 1300, y: 200.4814814814814 },
 * //     { x: 1026.0847457627117, y: 400 },
 * //     { x: 690.3167288225892, y: 345.381326584976 },
 * //     { x: 511.3605263157895, y: -50 },
 * //     { x: -100, y: -50 },
 * //     { x: 713.1895306859205, y: 400 },
 * //     { x: 1300, y: 400 }
 * //   ],
 * //   polygons: [
 * //     [ 0, 1, 2, 3, 0 ],
 * //     [ 1, 4, 5, 6, 2, 1 ],
 * //     [ 7, 8, 6, 5, 7 ],
 * //     [ 9, 10, 11, 12, 13, 9 ],
 * //     [ 14, 10, 9, 15, 16, 14 ],
 * //     [
 * //       12, 11, 17, 0,
 * //        3, 18, 12
 * //     ],
 * //     [
 * //       19, 18,  3, 2,
 * //        6,  8, 19
 * //     ],
 * //     [ 4, 1, 0, 17, 20, 4 ],
 * //     [ 21, 16, 15, 21 ],
 * //     [ 11, 10, 14, 20, 17, 11 ]
 * //   ]
 * // }
 *
 * ps = [{ x: 243, y: 206 }, { x: 233, y: 225 }, { x: 21, y: 325 }, { x: 953, y: 283 }, { x: 1092, y: 290 }, { x: 744, y: 200 }, { x: 174, y: 3 }, { x: 537, y: 368 }, { x: 1151, y: 371, ext: 'abc' }, { x: 814, y: 252 }]
 * o = calcVoronoi(ps, { withFinder: true })
 * r = o.funFindIn({ x: 1151, y: 371, ext: 'abc' })
 * console.log(r)
 * // => 8
 * r = o.funFindIn({ x: 1071, y: 371 }, { returnPoint: true })
 * console.log(r)
 * // => { x: 1151, y: 371, ext:'abc' }
 * r = o.funFindIn({ x: 1061, y: 371 })
 * console.log(r)
 * // => 4
 *
 */
function calcVoronoi(points, opt = {}) {

    //check points
    if (!isearr(points)) {
        return {
            err: 'points is not an effective array'
        }
    }

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

    //scaleBox
    let scaleBox = get(opt, 'scaleBox')
    if (!isnum(scaleBox)) {
        scaleBox = 1.1
    }
    scaleBox = cdbl(scaleBox)

    //box
    let box = get(opt, 'box', {})
    let xb0 = get(box, 'xb0', '')
    let yb0 = get(box, 'yb0', '')
    let xb1 = get(box, 'xb1', '')
    let yb1 = get(box, 'yb1', '')
    if (iseobj(box)) {
        if (!isnum(xb0)) {
            throw new Error(`xb0[${xb0}] is not a number`)
        }
        if (!isnum(yb0)) {
            throw new Error(`yb0[${yb0}] is not a number`)
        }
        if (!isnum(xb1)) {
            throw new Error(`xb1[${xb1}] is not a number`)
        }
        if (!isnum(yb1)) {
            throw new Error(`yb1[${yb1}] is not a number`)
        }
    }

    //withFinder
    let withFinder = get(opt, 'withFinder')
    if (!isbol(withFinder)) {
        withFinder = false
    }

    //withInst
    let withInst = get(opt, 'withInst')
    if (!isbol(withInst)) {
        withInst = false
    }

    //pointsOri
    let pointsOri = cloneDeep(points)

    //keyInd
    let keyInd = 'ind'

    //ptsXYtoArr
    points = ptsXYtoArr(points, { keyX, keyY, keyInd })

    //check points
    if (size(points) === 0) {
        return {
            err: 'points has no effective data'
        }
    }
    // console.log('ptsXYtoArr points', points)

    //gtlim
    let gtlim = (key) => {
        let vs = map(points, key)
        let _min = min(vs)
        let _max = max(vs)
        return {
            min: _min,
            max: _max,
        }
    }

    //xmin
    let _x = gtlim('x')
    let xmin = _x.min
    let xmax = _x.max
    let xcenter = (xmin + xmax) / 2
    let xrange = xmax - xmin

    //ymin
    let _y = gtlim('y')
    let ymin = _y.min
    let ymax = _y.max
    let ycenter = (ymin + ymax) / 2
    let yrange = ymax - ymin

    //xb0,yb0,xb1,yb1 by scaleBox
    if (!iseobj(box)) {
        xb0 = xcenter - xrange / 2 * scaleBox
        xb1 = xcenter + xrange / 2 * scaleBox
        yb0 = ycenter - yrange / 2 * scaleBox
        yb1 = ycenter + yrange / 2 * scaleBox
    }

    //intDny
    let intDny = Delaunay.from(points, d => d.x, d => d.y)
    // console.log('intDny', intDny)

    //vbox
    let vbox = [xb0, yb0, xb1, yb1]
    // console.log('vbox', vbox)

    //iniVor
    let iniVor = intDny.voronoi(vbox)
    // console.log('iniVor', iniVor)

    //pps
    let pps = []
    if (true) {
        let i = -1
        while (true) {
            i++
            let ps = iniVor.cellPolygon(i)
            if (!isnum(get(ps, `0.0`))) {
                break
            }
            pps.push(ps)
        }
    }

    //vpoints
    let vpoints = []
    if (true) {
        let kp = {}
        each(pps, (ps) => {
            each(ps, (p) => {
                let x = p[0]
                let y = p[1]
                let key = `${x}:${y}`
                kp[key] = { x, y }
            })
        })
        vpoints = values(kp)
    }
    // console.log('vpoints', vpoints)

    //kpVpoints
    let kpVpoints = {}
    each(vpoints, (v, ind) => {
        let key = `${v.x}:${v.y}`
        kpVpoints[key] = ind
    })
    // console.log('kpVpoints', kpVpoints)

    //vpolygons
    let vpolygons = []
    let _vpolygons = []
    if (true) {
        each(pps, (ps) => {
            let inds = []
            let _ps = []
            each(ps, (p) => {
                let x = p[0]
                let y = p[1]
                let key = `${x}:${y}`
                let ind = kpVpoints[key]
                inds.push(ind)
                _ps.push({ x, y })
            })
            vpolygons.push(inds)
            _vpolygons.push(_ps)
        })
    }
    // console.log('vpolygons', vpolygons)

    // each(points, (p, i) => {
    //     // let _p = get(_vpolygons, i)
    //     let b = iniVor.contains(i, p.x, p.y)
    //     console.log(i, p, b, _p)
    // })

    //funFindIn
    let funFindIn = (p, opt = {}) => {
        if (!iseobj(p)) {
            throw new Error(`p[${p}] is not an effective object`)
        }
        let x = get(p, 'x')
        if (!isnum(x)) {
            throw new Error(`x[${x}] is not a number`)
        }
        let y = get(p, 'y')
        if (!isnum(y)) {
            throw new Error(`y[${y}] is not a number`)
        }
        let returnPoint = get(opt, 'returnPoint')
        if (!isbol(returnPoint)) {
            returnPoint = false
        }
        let r = intDny.find(x, y) //基於Delaunay查找最近點
        if (returnPoint) {
            r = get(pointsOri, r)
        }
        return r
    }

    //r
    let r = {
        nodes: vpoints,
        polygons: vpolygons,
    }

    if (withFinder) {
        r.funFindIn = funFindIn
    }
    if (withInst) {
        r.inst = iniVor
    }

    return r
}


export default calcVoronoi
