/**
 * 內部用, 由點陣列建立判斷點是否位於凸包(convex hull)內之函數
 *
 * 凸包含邊界, 點至任一邊所在直線之外側距離不大於tol者視為在內;
 * 原始點不足3個相異點, 或全部共線(凸包寬度不大於tol, 無凸包面積)時, 無凸包面積可言, 所建立之函數恆回傳false;
 * x或y非有限數之原始點不參與凸包, 非有限數之查詢點恆為false, 運算結果非有限數時亦為false(不會誤判為在內)
 *
 * 凸包運算前先將座標平移並縮放至以最大範圍為1之內部座標, 故結果不受座標平移量與尺度(極小或極大)影響, 面積與外積亦不會下溢或溢位
 *
 * 不使用d3-delaunay之hullPolygon: 其遇共線點會加入約1e-8之擾動而回傳失真之窄凸包, 不能作為判準
 *
 * @param {Array} ps 輸入點物件陣列，為[{x:x1,y:y1},{x:x2,y:y2},...]
 * @param {Number} [tol=0] 輸入容許距離數值(與座標同單位)，須為大於等於0之有限數字，預設0
 * @returns {Function} 回傳判斷函數(x,y)，回傳布林值，點在凸包內(含邊界)為true
 */
function _makeHullTester(ps, tol = 0) {

    //tol
    if (typeof tol !== 'number' || !Number.isFinite(tol) || tol < 0) {
        tol = 0
    }

    //pts, 只取x與y皆為有限數之點
    let pts = []
    let xmin = Infinity
    let xmax = -Infinity
    let ymin = Infinity
    let ymax = -Infinity
    for (let i = 0; i < ps.length; i++) {
        let x = ps[i].x
        let y = ps[i].y
        if (typeof x === 'number' && typeof y === 'number' && Number.isFinite(x) && Number.isFinite(y)) {
            pts.push({ x, y })
            xmin = Math.min(xmin, x)
            xmax = Math.max(xmax, x)
            ymin = Math.min(ymin, y)
            ymax = Math.max(ymax, y)
        }
    }

    //不足3個點
    if (pts.length < 3) {
        return () => false
    }

    //s, 最大範圍; 範圍為0或溢位(非有限數)時無凸包面積可言
    let s = Math.max(xmax - xmin, ymax - ymin)
    if (!(s > 0) || !Number.isFinite(s)) {
        return () => false
    }

    //toU, 內部座標(平移至最小值並以最大範圍縮放, 值域為[0,1]); tolU, 內部座標之容許距離
    let toX = (x) => (x - xmin) / s
    let toY = (y) => (y - ymin) / s
    let tolU = tol / s

    //cross, o->a與o->b之外積, 正值代表b在o->a之左側
    let cross = (o, a, b) => {
        return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
    }

    //us, 內部座標點並依x再y排序
    let us = []
    for (let i = 0; i < pts.length; i++) {
        us.push({ x: toX(pts[i].x), y: toY(pts[i].y) })
    }
    us.sort((a, b) => {
        return (a.x - b.x) || (a.y - b.y)
    })

    //monotone chain(Andrew), 外積<=0即捨棄中間點, 故共線與重複點不會留在凸包頂點內
    let lower = []
    for (let i = 0; i < us.length; i++) {
        while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], us[i]) <= 0) {
            lower.pop()
        }
        lower.push(us[i])
    }
    let upper = []
    for (let i = us.length - 1; i >= 0; i--) {
        while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], us[i]) <= 0) {
            upper.pop()
        }
        upper.push(us[i])
    }
    lower.pop()
    upper.pop()
    let hull = lower.concat(upper) //逆時針

    //不足3個頂點, 無凸包面積
    let n = hull.length
    if (n < 3) {
        return () => false
    }

    //lens, 各邊長; perimeter, 周長; area2, 面積之2倍(以第1個頂點為基準, 避免座標平移量造成數值抵銷)
    let lens = []
    let perimeter = 0
    let area2 = 0
    for (let i = 0; i < n; i++) {
        let a = hull[i]
        let b = hull[(i + 1) % n]
        let len = Math.hypot(b.x - a.x, b.y - a.y)
        lens.push(len)
        perimeter += len
        if (i >= 1 && i < n - 1) {
            area2 += cross(hull[0], a, b)
        }
    }

    //狹長凸包之寬度約為4倍面積除以周長, 不大於tolU視為共線(無凸包面積); 非有限數亦視為無凸包面積
    let width = 2 * area2 / perimeter
    if (!(width > tolU)) {
        return () => false
    }

    return (x, y) => {
        if (typeof x !== 'number' || typeof y !== 'number' || !Number.isFinite(x) || !Number.isFinite(y)) {
            return false
        }
        let p = { x: toX(x), y: toY(y) }
        if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) {
            return false
        }
        for (let i = 0; i < n; i++) {
            let a = hull[i]
            let b = hull[(i + 1) % n]
            let c = cross(a, b, p)
            if (!(c >= -tolU * lens[i])) { //在邊之外側且距離大於tolU, 或運算結果非有限數(取反寫法使NaN亦為在外)
                return false
            }
        }
        return true
    }
}


export default _makeHullTester
