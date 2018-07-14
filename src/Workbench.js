'use strict'

const d3 = require('d3')

module.exports =
class Workbench {
    constructor(data) {
        this.data = data
    }

    start() {
        console.log('this should be starting phyPro')
        console.log(this.data)
        d3.selectAll('.splash')
            .transition()
            .style('display', 'none')

        d3.selectAll('.main')
            .transition()
            .style('display', 'block')

    }
}