import get from 'lodash-es/get.js'
import isearr from 'wsemi/src/isearr.mjs'
import isestr from 'wsemi/src/isestr.mjs'
import turf from './importTurf.mjs'
import toMultiPolygon from './toMultiPolygon.mjs'
import fixCloseMultiPolygon from './fixCloseMultiPolygon.mjs'
import distilMultiPolygon from './distilMultiPolygon.mjs'


/**
 * 針對MultiPolygon進行Buffer處理
 *
 * Unit Test: {@link https://github.com/yuda-lyu/w-gis/blob/master/test/bufferMultiPolygon.test.mjs Github}
 * @memberOf w-gis
 * @param {Array} pgs 輸入Polygon資料陣列，為[ [[x11,y11],[x12,y12],...], [[x21,y21],[x22,y22],...] ]Polygon構成之陣列
 * @param {Number} w 輸入Buffer寬度數字
 * @param {Object} [opt={}] 輸入設定物件，預設{}
 * @param {String} [opt.units='degrees'] 輸入Buffer寬度單位，可選'degrees'、'radians'、'meters'、'kilometers'、'feet'、'miles'，預設'degrees'
 * @param {String} [opt.supposeType='polygons'] 輸入提取模式字串，當數據座標深度為2時，使用polygons代表每個其內多邊形為獨立polygon，若為ringStrings則表示其內多邊形為交錯的ringString(代表聯集與剔除)，預設'polygons'
 * @returns {Array} 回傳MultiPolygon陣列
 * @example
 *
 * let pgs
 * let r
 *
 * pgs = [ //ringString
 *     [0, 0],
 *     [100, 0],
 *     [100, 1],
 *     [0, 1],
 *     [0, 0], //閉合
 * ]
 * r = bufferMultiPolygon(pgs, 1)
 * console.log(JSON.stringify(r))
 * // => [[[[-1.001141328901417,0.0016753375821097873],[-0.9828471338128442,-0.16972115991069422],[-0.9267373199338761,-0.3346332604401984],[-0.8349336578934242,-0.48675182181191506],[-0.7109147085413277,-0.6202345462697216],[-0.559394180587721,-0.729923376805404],[-0.38615360668544263,-0.811541439833041],[-0.19783329290733154,-0.8618623554235615],[-0.0016872193065963293,-0.8788447694463676],[100.00168721930659,-0.8788447694463676],[100.19783329290733,-0.8618623554235615],[100.38615360668544,-0.811541439833041],[100.55939418058772,-0.7299233768054038],[100.71091470854132,-0.6202345462697216],[100.83493365789343,-0.48675182181191484],[100.92673731993388,-0.3346332604401984],[100.98284713381284,-0.16972115991069422],[101.00114132890143,0.0016753375821097873],[101.00130637437861,0.9962692468004231],[100.98342526263642,1.166068608930073],[100.92842740011626,1.3296521767917848],[100.8383471832878,1.4808799222131859],[100.71652842614444,1.614052695861241],[100.56751027969496,1.7241206065185686],[100.3968695299825,1.806872516804512],[100.21102286823793,1.859099826845344],[100.01699438082024,1.878727728773804],[-0.016994380820243554,1.878727728773804],[-0.21102286823793245,1.859099826845344],[-0.3968695299824859,1.806872516804512],[-0.5675102796949614,1.7241206065185688],[-0.7165284261444422,1.6140526958612413],[-0.8383471832878048,1.4808799222131859],[-0.9284274001162607,1.329652176791785],[-0.9834252626364106,1.166068608930073],[-1.00130637437862,0.9962692468004231],[-1.001141328901417,0.0016753375821097873]]]]
 *
 * pgs = [ //ringString
 *     [0, 0],
 *     [100, 0],
 *     [100, 1],
 *     [0, 1],
 * ]
 * r = bufferMultiPolygon(pgs, 1)
 * console.log(JSON.stringify(r))
 * // => [[[[-1.001141328901417,0.0016753375821097873],[-0.9828471338128442,-0.16972115991069422],[-0.9267373199338761,-0.3346332604401984],[-0.8349336578934242,-0.48675182181191506],[-0.7109147085413277,-0.6202345462697216],[-0.559394180587721,-0.729923376805404],[-0.38615360668544263,-0.811541439833041],[-0.19783329290733154,-0.8618623554235615],[-0.0016872193065963293,-0.8788447694463676],[100.00168721930659,-0.8788447694463676],[100.19783329290733,-0.8618623554235615],[100.38615360668544,-0.811541439833041],[100.55939418058772,-0.7299233768054038],[100.71091470854132,-0.6202345462697216],[100.83493365789343,-0.48675182181191484],[100.92673731993388,-0.3346332604401984],[100.98284713381284,-0.16972115991069422],[101.00114132890143,0.0016753375821097873],[101.00130637437861,0.9962692468004231],[100.98342526263642,1.166068608930073],[100.92842740011626,1.3296521767917848],[100.8383471832878,1.4808799222131859],[100.71652842614444,1.614052695861241],[100.56751027969496,1.7241206065185686],[100.3968695299825,1.806872516804512],[100.21102286823793,1.859099826845344],[100.01699438082024,1.878727728773804],[-0.016994380820243554,1.878727728773804],[-0.21102286823793245,1.859099826845344],[-0.3968695299824859,1.806872516804512],[-0.5675102796949614,1.7241206065185688],[-0.7165284261444422,1.6140526958612413],[-0.8383471832878048,1.4808799222131859],[-0.9284274001162607,1.329652176791785],[-0.9834252626364106,1.166068608930073],[-1.00130637437862,0.9962692468004231],[-1.001141328901417,0.0016753375821097873]]]]
 *
 * pgs = [ //polygon
 *     [
 *         [0, 0],
 *         [100, 0],
 *         [100, 1],
 *         [0, 1],
 *     ]
 * ]
 * r = bufferMultiPolygon(pgs, 1)
 * console.log(JSON.stringify(r))
 * // => [[[[-1.001141328901417,0.0016753375821097873],[-0.9828471338128442,-0.16972115991069422],[-0.9267373199338761,-0.3346332604401984],[-0.8349336578934242,-0.48675182181191506],[-0.7109147085413277,-0.6202345462697216],[-0.559394180587721,-0.729923376805404],[-0.38615360668544263,-0.811541439833041],[-0.19783329290733154,-0.8618623554235615],[-0.0016872193065963293,-0.8788447694463676],[100.00168721930659,-0.8788447694463676],[100.19783329290733,-0.8618623554235615],[100.38615360668544,-0.811541439833041],[100.55939418058772,-0.7299233768054038],[100.71091470854132,-0.6202345462697216],[100.83493365789343,-0.48675182181191484],[100.92673731993388,-0.3346332604401984],[100.98284713381284,-0.16972115991069422],[101.00114132890143,0.0016753375821097873],[101.00130637437861,0.9962692468004231],[100.98342526263642,1.166068608930073],[100.92842740011626,1.3296521767917848],[100.8383471832878,1.4808799222131859],[100.71652842614444,1.614052695861241],[100.56751027969496,1.7241206065185686],[100.3968695299825,1.806872516804512],[100.21102286823793,1.859099826845344],[100.01699438082024,1.878727728773804],[-0.016994380820243554,1.878727728773804],[-0.21102286823793245,1.859099826845344],[-0.3968695299824859,1.806872516804512],[-0.5675102796949614,1.7241206065185688],[-0.7165284261444422,1.6140526958612413],[-0.8383471832878048,1.4808799222131859],[-0.9284274001162607,1.329652176791785],[-0.9834252626364106,1.166068608930073],[-1.00130637437862,0.9962692468004231],[-1.001141328901417,0.0016753375821097873]]]]
 *
 * pgs = [ //polygon
 *     [
 *         [0, 0],
 *         [10, 0],
 *         [10, 1],
 *         [0, 1],
 *     ]
 * ]
 * r = bufferMultiPolygon(pgs, 1)
 * console.log(JSON.stringify(r))
 * // => [[[[-1.001155553386317,0.00020218490746980633],[-0.9820125492690016,-0.19485767359241968],[-0.9251387932224696,-0.38243348696414925],[-0.8327132969498687,-0.555321279824778],[-0.7082782159291466,-0.7068780908504364],[-0.5566054036321767,-0.8312763302163503],[-0.3835158174465588,-0.9237277892855092],[-0.19565803014640396,-0.9806686460552702],[-0.0002538669037234854,-0.9998981048986327],[10.000253866903723,-0.9998981048986327],[10.195658030146403,-0.9806686460552702],[10.38351581744656,-0.9237277892855092],[10.556605403632176,-0.8312763302163495],[10.708278215929147,-0.7068780908504364],[10.83271329694987,-0.5553212798247783],[10.925138793222468,-0.3824334869641492],[10.982012549269001,-0.1948576735924193],[11.001155553386317,0.00020218490746980633],[11.001308157005216,0.9996428211826395],[10.982257682211564,1.1945218799229023],[10.925533315715452,1.3819493209356362],[10.83329851355212,1.55473889694727],[10.709077513563999,1.7062614400017102],[10.557623401764781,1.8306986246098138],[10.384738788703551,1.9232666900056332],[10.197055258170192,1.9804014175926012],[10.001779585080351,1.9998969422657566],[-0.0017795850803521507,1.9998969422657566],[-0.19705525817019212,1.9804014175926012],[-0.3847387887035519,1.9232666900056334],[-0.5576234017647811,1.8306986246098143],[-0.7090775135639995,1.7062614400017102],[-0.8332985135521189,1.5547388969472695],[-0.9255333157154515,1.3819493209356362],[-0.9822576822115646,1.1945218799229025],[-1.0013081570052154,0.9996428211826395],[-1.001155553386317,0.00020218490746980633]]]]
 *
 * pgs = [ //polygon
 *     [
 *         [0, 0],
 *         [100, 0],
 *         [100, 1],
 *         [0, 1],
 *     ],
 *     [
 *         [0, 0],
 *         [10, 0],
 *         [10, 1],
 *         [0, 1],
 *     ]
 * ]
 * r = bufferMultiPolygon(pgs, 1)
 * console.log(JSON.stringify(r))
 * // => [[[[-1.001141328901417,0.0016753375821097873],[-0.9829652373939834,-0.1691864014690503],[-0.9828759068893769,-0.16944903103545159],[-0.9828471338128442,-0.16972115991069422],[-0.9642267691588657,-0.22433433005943731],[-0.9272069363899038,-0.3336248371138306],[-0.9269149700562374,-0.33410950396501116],[-0.9267373199338761,-0.3346332604401984],[-0.8903308935608486,-0.3948874359058604],[-0.835961623414144,-0.4853886073046619],[-0.8353702250141729,-0.4860270204908466],[-0.8349336578934242,-0.48675182181191506],[-0.7824274110195127,-0.5432159010460509],[-0.7126648789848471,-0.6186859299608387],[-0.7117015302688281,-0.6193864208225881],[-0.7109147085413277,-0.6202345462697216],[-0.6446160295572254,-0.668195147854552],[-0.5619732974171028,-0.7283987267469068],[-0.5605962119581879,-0.729052102669852],[-0.559394180587721,-0.729923376805404],[-0.48212743928754137,-0.7663024921222514],[-0.38960026351833515,-0.8102767443494782],[-0.3878031408082354,-0.8107634164195489],[-0.38615360668544263,-0.811541439833041],[-0.3011494349616489,-0.8342418049314271],[-0.20211072576851202,-0.8611046524848931],[-0.19992548149722325,-0.8613027037048243],[-0.19783329290733154,-0.8618623554235615],[-0.10860444692188248,-0.869583399882044],[-0.006680493376364686,-0.8788351261142445],[9.993416821174632,-0.9217879435862263],[10.188793002259466,-0.9049587543468377],[10.295194455828872,-0.8757829217517078],[100.00168721930659,-0.8788447694463676],[100.19783329290733,-0.8618623554235615],[100.38615360668544,-0.811541439833041],[100.55939418058772,-0.7299233768054038],[100.71091470854132,-0.6202345462697216],[100.83493365789343,-0.48675182181191484],[100.92673731993388,-0.3346332604401984],[100.98284713381284,-0.16972115991069422],[101.00114132890143,0.0016753375821097873],[101.00130637437861,0.9962692468004231],[100.98342526263642,1.166068608930073],[100.92842740011626,1.3296521767917848],[100.8383471832878,1.4808799222131859],[100.71652842614444,1.614052695861241],[100.56751027969496,1.7241206065185686],[100.3968695299825,1.806872516804512],[100.21102286823793,1.859099826845344],[100.01699438082024,1.878727728773804],[-0.016994380820243554,1.878727728773804],[-0.1157204876987387,1.8687373631615178],[-0.20220168724994378,1.8607327892917573],[-0.20650792922949912,1.8595562623618567],[-0.21102286823793245,1.859099826845344],[-0.30714947328128045,1.832073838565868],[-0.3897693406539745,1.8095331541523574],[-0.3931624216058025,1.807913350946488],[-0.3968695299824859,1.806872516804512],[-0.486882794767004,1.7631991356472565],[-0.5622020098330681,1.72730115650303],[-0.5646733033731067,1.7254949738678342],[-0.5675102796949614,1.7241206065185688],[-0.648108542369765,1.664556475139119],[-0.7129290018915503,1.6172692206642851],[-0.7145459093769313,1.6155153014865016],[-0.7165284261444422,1.6140526958612413],[-0.7847445548212969,1.5394316337665401],[-0.8362344707433637,1.4837039152301397],[-0.8371311983072628,1.4822073608091777],[-0.8383471832878048,1.4808799222131859],[-0.8916549506801756,1.3913170253111737],[-0.9274628819987873,1.331737619583264],[-0.9278275532110773,1.3306573138677165],[-0.9284274001162607,1.329652176791785],[-0.9648179595009568,1.221301519242358],[-0.9831829682906137,1.1671732571246638],[-0.9832418919046929,1.1666123607181955],[-0.9834252626364106,1.166068608930073],[-1.00130637437862,0.9962692468004231],[-1.001141328901417,0.0016753375821097873]]]]
 *
 * pgs = [ //polygon
 *     [
 *         [0, 0],
 *         [100, 0],
 *         [100, 1],
 *         [0, 1],
 *     ],
 *     [
 *         [0, 0],
 *         [10, 0],
 *         [10, 1],
 *         [0, 1],
 *     ]
 * ]
 * r = bufferMultiPolygon(pgs, 1, { supposeType: 'ringStrings' })
 * console.log(JSON.stringify(r))
 * // => [[[[-1.001141328901417,0.0016753375821097873],[-0.9828471338128442,-0.16972115991069422],[-0.9267373199338761,-0.3346332604401984],[-0.8349336578934242,-0.48675182181191506],[-0.7109147085413277,-0.6202345462697216],[-0.559394180587721,-0.729923376805404],[-0.38615360668544263,-0.811541439833041],[-0.19783329290733154,-0.8618623554235615],[-0.0016872193065963293,-0.8788447694463676],[100.00168721930659,-0.8788447694463676],[100.19783329290733,-0.8618623554235615],[100.38615360668544,-0.811541439833041],[100.55939418058772,-0.7299233768054038],[100.71091470854132,-0.6202345462697216],[100.83493365789343,-0.48675182181191484],[100.92673731993388,-0.3346332604401984],[100.98284713381284,-0.16972115991069422],[101.00114132890143,0.0016753375821097873],[101.00130637437861,0.9962692468004231],[100.98342526263642,1.166068608930073],[100.92842740011626,1.3296521767917848],[100.8383471832878,1.4808799222131859],[100.71652842614444,1.614052695861241],[100.56751027969496,1.7241206065185686],[100.3968695299825,1.806872516804512],[100.21102286823793,1.859099826845344],[100.01699438082024,1.878727728773804],[-0.016994380820243554,1.878727728773804],[-0.21102286823793245,1.859099826845344],[-0.3968695299824859,1.806872516804512],[-0.5675102796949614,1.7241206065185688],[-0.7165284261444422,1.6140526958612413],[-0.8383471832878048,1.4808799222131859],[-0.9284274001162607,1.329652176791785],[-0.9834252626364106,1.166068608930073],[-1.00130637437862,0.9962692468004231],[-1.001141328901417,0.0016753375821097873]]]]
 *
 * pgs = [ //multiPolygon
 *     [
 *         [
 *             [0, 0],
 *             [100, 0],
 *             [100, 1],
 *             [0, 1],
 *         ],
 *         [
 *             [0, 0],
 *             [10, 0],
 *             [10, 1],
 *             [0, 1],
 *         ],
 *         [
 *             [0, 0],
 *             [-10, 0],
 *             [-10, 123],
 *             [0, 1],
 *         ]
 *     ]
 * ]
 * r = bufferMultiPolygon(pgs, 1)
 * console.log(JSON.stringify(r))
 * // => [[[[-0.8012541837164568,-0.17340281498851945],[-0.7845905665553953,-0.36227885731056975],[-0.7362060966497698,-0.5362500018687244],[-0.6581257104469943,-0.688322784190506],[-0.5535304542476391,-0.8124108634048052],[-0.4266299774554017,-0.9035630726703152],[-0.2825015231454891,-0.958146676868447],[-0.12690006663656955,-0.9739812775086525],[0.03395545341221722,-0.9504200786900888],[0.19361433624631713,-0.8883763411426563],[0.34563851486033076,-0.7902939089966787],[1.5370514741011896,0.13454100276614617],[9.19064767617874,0.06717684053056396],[9.191364068615226,-0.13595424650179797],[9.20133965362993,-0.13421645399411475],[10.158988901190282,0.9701242544649328],[10.16096403486849,0.9822526475809891],[2.866804797833092,1.137647522096021],[99.68460366306947,-0.7778744465922519],[99.83402263305543,-0.8744779865054448],[99.98971255084359,-0.9368294391315382],[100.14560908372206,-0.9625601240475504],[100.29567676380367,-0.9507068041095973],[100.43412954295192,-0.9017417273394963],[100.55563852611013,-0.817553248360399],[100.65552164066368,-0.7013779275513093],[100.72991078940285,-0.5576858501436441],[100.77589259056286,-0.3920217971362746],[100.79161911635269,-0.21080593328834593],[100.79663729766196,0.7858468460411016],[100.78366780468126,0.9687873923303338],[100.74205919560113,1.1530813676567635],[100.67320841116904,1.331961262596526],[100.57951447407378,1.498814188916489],[100.46430988704897,1.6474303942232118],[100.33175495294144,1.7722428029343886],[-0.3611196144473517,1.784612946923815],[-0.48871675992881103,1.6636298723025738],[-0.5991787964146019,1.5197286583585954],[-0.6887538943585044,1.357969542007828],[-0.754444795325827,1.1840064755905042],[-0.7825727584436893,1.0562001800792606],[-0.784546778721443,1.0465932538060978],[-0.7846866456585744,1.0466026995606184],[-0.7940988404174638,1.003882122853538],[-0.7944829149075918,0.998255844884385],[-0.7957274513076762,0.9922035987885709],[-0.8064662133136347,0.8238140372657559],[-0.8012541837164568,-0.17340281498851945]]]]
 *
 */
function bufferMultiPolygon(pgs, w, opt = {}) {

    //check
    if (!isearr(pgs)) {
        return null
    }

    //units
    let units = get(opt, 'units', '')
    if (!isestr(units)) {
        units = 'degrees'
    }

    //toMultiPolygon
    pgs = toMultiPolygon(pgs, opt)
    // console.log('toMultiPolygon pgs', JSON.stringify(pgs))

    //fixCloseMultiPolygon
    pgs = fixCloseMultiPolygon(pgs)
    // console.log('fixCloseMultiPolygon pgs', JSON.stringify(pgs))

    //multiPolygon
    pgs = turf.helpers.multiPolygon(pgs)

    //buffer
    let r = turf.buffer(pgs, w, { units })

    return distilMultiPolygon(r)
}


export default bufferMultiPolygon
