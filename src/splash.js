'use strict'

const demoData = require('../assets/phypro.th-ring4.config.json')

const startPhyPro = (dataJson) => {
    const xhttp = new XMLHttpRequest()
    xhttp.open('POST', '/app', true)
    xhttp.setRequestHeader('Content-type', 'application/json')
    xhttp.send(JSON.stringify(dataJson))
}

window.loadConfig = (file) => {
    if (file) {
        fileData = file[0]
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
