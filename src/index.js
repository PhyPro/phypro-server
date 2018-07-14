'use strict'

const demoData = require('../assets/phypro.th-ring4.config.json')
const Workbench = require('./Workbench')

window.loadConfig = (file) => {
    if (file) {
        const fileData = file.files[0]
        const reader = new FileReader()
        reader.onloadend = (event) => {
            if(event.target.readyState === FileReader.DONE)
                startPhyPro(event.target.result)
        }
        reader.readAsText(fileData)
    }
    else {
        startPhyPro(demoData)
    }
}

const startPhyPro = (demoData) => {
    const wb = new Workbench(demoData)
    wb.start()
}