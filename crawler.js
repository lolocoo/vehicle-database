// crawler
const http = require('https')
const fs = require('fs')
const cheerio = require('cheerio')
const iconv = require('iconv-lite')
const _ = require('lodash')

function getSerieById(id) {
    let url = `https://car.autohome.com.cn/AsLeftMenu/As_LeftListNew.ashx?typeId=2&brandId=${id}&fctId=0&seriesId=0`
    console.log(`begin crawler brand id ${id}`)
    
    http.get(url, res => {
        let html = []
        res.on('data', d=> {
            html.push(iconv.decode(d, 'gb2312'))
        })
        res.on('end', () => {
            let re = new RegExp(`<li  id=\'b${id}\' class=\'current\'>((\s|.)*?)<\/li>`, 'g')
            let contents = {}
            
            try {
                html = html.join('').match(re)[0]
                let $ = cheerio.load(html, {decodeEntities: false})
                $('i').remove()
                contents.total = $('h3').find('em').html() == null ? 0 : $('h3').find('em').html().replace(/[\(|\)]/g, '')

                $('h3').find('em').remove()
                contents.name = $('h3 a').html()
                contents.url = $('h3 a').attr('href')
                $('h3').remove()
                
                contents.models = []
    
                let $all = $('dl').children()
    
                $all.each((index, item) => {
                    if (item.name === 'dt') {
                        contents.models.push({
                            id: $(item).find('a').attr('id').split('_')[1],
                            type: $(item).find('i').remove().end().find('a').html(),
                            url: $(item).find('a').attr('href'),
                            model: []
                        })
                    } else {
                        contents.models[contents.models.length - 1].model.push({
                            id: $(item).find('a').attr('id').split('_')[1],
                            total: $(item).find('em').html().match(/\d+/g)[0],
                            status: $(item).find('em').html().split(' ').length > 1 ? '停售' : '在售',
                            name: $(item).find('em').remove().end().find('a').html(),
                            url: $(item).find('a').attr('href')
                        })
                    }
                })
                fs.writeFileSync(`brand-${id}.json`, JSON.stringify(contents))
            } catch (e) {
                console.log(e.message)
            }
        })
    })
}

function getBrandSeries() {
    var json = JSON.parse(fs.readFileSync('./db/car.json', 'utf-8'))
    _.mapValues(json, data => {
        _.each(data, item => {
            getSerieById(item.id)
        })
    })
}

getBrandSeries()
