import interp2Kriging from './src/interp2Kriging.mjs'


let ps
let p
let r

ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
p = {
    x: 243,
    y: 205,
}
r = interp2Kriging(ps, p)
console.log(r)
// => { x: 243, y: 205, z: 94.88479948418721 }

ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
p = {
    x: 283,
    y: 205,
}
r = interp2Kriging(ps, p)
console.log(r)
// => { x: 283, y: 205, z: 116.32333499687805 }

ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
p = {
    x: 1160,
    y: 380,
}
r = interp2Kriging(ps, p)
console.log(r)
// => { x: 1160, y: 380, z: 87.27045807621836 }

ps = [{ a: 243, b: 206, c: 95 }, { a: 233, b: 225, c: 146 }, { a: 21, b: 325, c: 22 }, { a: 953, b: 28, c: 223 }, { a: 1092, b: 290, c: 39 }, { a: 744, b: 200, c: 191 }, { a: 174, b: 3, c: 22 }, { a: 537, b: 368, c: 249 }, { a: 1151, b: 371, c: 86 }, { a: 814, b: 252, c: 125 }]
p = {
    a: 243,
    b: 205,
}
r = interp2Kriging(ps, p, { keyX: 'a', keyY: 'b', keyZ: 'c' })
console.log(r)
// => { a: 243, b: 205, c: 94.88479948418721 }

ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
p = [
    {
        x: 243,
        y: 205,
    },
    {
        x: 283,
        y: 205,
    },
]
r = interp2Kriging(ps, p)
console.log(r)
// => [
//   { x: 243, y: 205, z: 94.88479948418721 },
//   { x: 283, y: 205, z: 116.32333499687805 }
// ]

ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
p = {
    x: 243,
    y: 205,
}
r = interp2Kriging(ps, p, { scale: 1000 })
console.log(r)
// => { x: 243, y: 205, z: 94.88479948418878 }

ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
p = {
    x: 243,
    y: 205,
}
r = interp2Kriging(ps, p, { model: 'gaussian' })
console.log(r)
// => { x: 243, y: 205, z: 92.39124139470005 }

ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
p = {
    x: 243,
    y: 205,
}
r = interp2Kriging(ps, p, { sigma2: 0.001, alpha: 70 })
console.log(r)
// => { x: 243, y: 205, z: 90.88702949276343 }

ps = [{ x: 243, y: 206, z: 95 }, { x: 233, y: 225, z: 146 }, { x: 21, y: 325, z: 22 }, { x: 953, y: 28, z: 223 }, { x: 1092, y: 290, z: 39 }, { x: 744, y: 200, z: 191 }, { x: 174, y: 3, z: 22 }, { x: 537, y: 368, z: 249 }, { x: 1151, y: 371, z: 86 }, { x: 814, y: 252, z: 125 }]
p = {
    x: 243,
    y: 205,
}
r = interp2Kriging(ps, p, { returnWithVariogram: true })
console.log(r)
// => {
//   result: { x: 243, y: 205, z: 94.88479948418721 },
//   variogram: {
//     t: [
//       0.32158590308370044,
//       0.5462555066079295,
//       0,
//       0.8854625550660793,
//       0.07488986784140969,
//       0.7444933920704846,
//       0,
//       1,
//       0.28193832599118945,
//       0.45374449339207046
//     ],
//     x: [
//       0.19646017699115045,
//       0.18761061946902655,
//       0,
//       0.8247787610619469,
//       0.947787610619469,
//       0.6398230088495576,
//       0.13539823008849558,
//       0.45663716814159294,
//       1,
//       0.7017699115044248
//     ],
//     y: [
//       0.5168141592920354,
//       0.5336283185840708,
//       0.6221238938053097,
//       0.35929203539823007,
//       0.5911504424778761,
//       0.511504424778761,
//       0.33716814159292036,
//       0.6601769911504425,
//       0.6628318584070797,
//       0.5575221238938053
//     ],
//     nugget: 0.33528534923428144,
//     range: 0.9818274204120488,
//     sill: 0.4584580333443075,
//     A: 0.3333333333333333,
//     n: 10,
//     model: [Function: kriging_variogram_exponential],
//     svpd: { data: [Array], bars: [Array] },
//     K: [
//          -75.8517004175245,       67.925722923484, -0.16335841036964677,
//        0.24131518978270877,  -0.04234246865048732,   0.8770518396328912,
//          5.616960362170279,     1.621659637440227, 0.027888001651894635,
//       -0.21415853416652803,     67.92572292348402,   -75.61786478824868,
//          5.413232079727064,   0.04906943438385958,  0.03679113229348465,
//       -0.11847139352698677,    0.3142012767297917,   1.9531078854430024,
//        0.14216377854055343, -0.026503104672525174,   -0.163358410369651,
//          5.413232079727067,   -10.341088741602475,    0.707690256415205,
//         0.2717259477481375,    -0.032751338327818,   2.4021510467734406,
//         1.1039529303204958,    0.9343241199626711,  0.17593910677199553,
//        0.24131518978268823,   0.04906943438388453,   0.7076902564152006,
//        -11.195895809332818,    3.6318326767168267,   3.0935386508887035,
//         1.0451553499568136,   0.07681115159025198,   0.5500520981253416,
//          2.176928207710048,  -0.04234246865049055,  0.03679113229348578,
//        0.27172594774813813,    3.6318326767168188,  -21.833991833397526,
//        -0.3703544567031784,    0.1631940797086814,   0.1478485285302121,
//         14.592661153646349,     3.529640759660949,    0.877051839632884,
//       -0.11847139352697111, -0.032751338327819686,   3.0935386508886986,
//       -0.37035445670318073,   -23.428385057803695,   0.8346909075984952,
//          3.683800415485778,  -0.07094528659968152,   15.630834782735722,
//          5.616960362170238,   0.31420127672983256,   2.4021510467734397,
//          1.045155349956815,   0.16319407970868527,   0.8346909075984923,
//         -11.15967643574728,   0.47980505727623907,   0.7525119639869473,
//        -0.0399020216261384,    1.6216596374402739,   1.9531078854429533,
//         1.1039529303204962,   0.07681115159024962,   0.1478485285302013,
//         3.6838004154857935,      0.47980505727624,  -11.594555930753835,
//         0.9237284214140226,    1.8947859772223308, 0.027888001651917377,
//        0.14216377854053472,    0.9343241199626732,   0.5500520981253476,
//         14.592661153646347,   -0.0709452865996735,   0.7525119639869486,
//         0.9237284214140111,   -18.251230245653318,    0.837959693391809,
//       -0.21415853416654693, -0.026503104672517874,   0.1759391067719989,
//          2.176928207710053,     3.529640759660952,   15.630834782735704,
//       -0.03990202162613744,     1.894785977222343,   0.8379596933918148,
//         -23.89204017145281
//     ],
//     M: [
//       15.107775528173802,
//       -17.52355316402437,
//       4.974279767668829,
//       -6.014370838628359,
//       7.175095294789402,
//       -3.7572657339807183,
//       4.210920521157788,
//       -6.064323143863013,
//       -2.2280724452952487,
//       5.035785385549117
//     ]
//   }
// }


//node --experimental-modules g-interp2Kriging.mjs
