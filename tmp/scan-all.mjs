// Exhaustive 誤差掃描: friedrich Exp(各ls) vs _kriging, 跨 分布×z函數×N×seed
import { mkRand, genPs, genTars, evalErrors } from './krig-eval-lib.mjs'

let dists = ['uniform', 'cluster', 'grid']
let zfuns = ['smooth', 'ridge', 'random'] // smooth/ridge 為真實空間場; random 為白噪音對照
let Ns = [20, 50, 100, 200]
let seeds = [1, 2, 3]
let lsList = [0.3, 0.4, 0.5, 0.6, 0.7]

let agg = {}
for (let zf of zfuns) {
    agg[zf] = {}
    for (let ls of lsList) agg[zf][ls] = { sumMean: 0, maxMax: 0, cnt: 0 }
}

for (let dist of dists) {
    for (let zf of zfuns) {
        for (let n of Ns) {
            for (let sd of seeds) {
                let rand = mkRand(sd * 100000 + n * 31 + dist.length * 7 + zf.length)
                let ps = genPs(n, rand, dist, zf)
                let tars = genTars(300, rand)
                let res = evalErrors(ps, tars, lsList)
                for (let ls of lsList) {
                    let a = agg[zf][ls]
                    a.sumMean += res[ls].mean
                    a.maxMax = Math.max(a.maxMax, res[ls].max)
                    a.cnt++
                }
            }
        }
    }
}

for (let zf of zfuns) {
    console.log(`\n===== z函數=${zf} (跨 ${dists.length}分布 × ${Ns.length}N × ${seeds.length}seed = ${agg[zf][lsList[0]].cnt}組) =====`)
    console.log('ls'.padStart(6), 'avg(meanRelErr%)'.padStart(18), 'worst(maxRelErr%)'.padStart(20))
    console.log('-'.repeat(46))
    for (let ls of lsList) {
        let a = agg[zf][ls]
        console.log(
            String(ls).padStart(6),
            (a.sumMean / a.cnt).toFixed(3).padStart(18),
            a.maxMax.toFixed(2).padStart(20),
        )
    }
}
console.log('\n註: smooth/ridge 為有空間相關性的真實場景(kriging 適用); random 為白噪音(無空間結構, 參考用)')
