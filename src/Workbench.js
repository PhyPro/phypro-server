'use strict'

const d3 = require('d3')

const colorWheel = ['#E41A1C', '#377EB8', '#4DAF4A', '#984EA3', '#FF7F00', '#999999', '#A65628', '#F781BF', '#17BECF', '#8DD3C7', '#BEBADA', '#FB8072', '#80B1D3', '#B3DE69', '#FCCDE5', '#D9D9D9', '#BC80BD', '#CCEBC5', '#FFED6F']

const color = d3.scaleOrdinal()
	.domain(d3.range(colorWheel.length))
	.range(colorWheel)

module.exports =
class Workbench {
	constructor(config) {
		this.config = config
		this.kDefaults = {
			slider: {
				maxEvalue: 0,
				minEvalue: 1000,
				fontSize: 4,
				min: 1,
				max: 200
			},
			force: {
				dist: 100,
				charge: -5,
				gravity: 0.25
			},
			graph: {
				width: 450,
				height: 450,
				nodeSize: 3
			}
		}
		this.data = {
			nodes: [],
			links: []
		}
		this.simulations = {}
		this.variables = {
			evalueCutOff: {},
			lowLimitDisplayPerGenome: {},
			aux: {}
		}
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

		return this.parseConfig()
			.then(() => {
				this.buildEnvironment()
			})
	}

	parseData(protFam, i) {
		this.data.nodes = this.data.nodes.concat(
			this.config.phyloProfile.data.nodes[i].map((node) => {
				return {id: node, pf: i}
			})
		)

		this.data.links = this.data.links.concat(
			this.config.phyloProfile.data.links[i].map((link, j) => {
				return {
					source: link.s,
					target: link.t,
					evalue: link.e,
					pf: i,
					index: j
				}
			})
		)
	}

	parseConfig() {
		const proteinFamilies = []
		return new Promise((resolve, reject) => {
			this.config.phyloProfile.proteinFamilyDefinitions.forEach((protFamObj, i) => {
				proteinFamilies.push(protFamObj.name)
				this.variables.lowLimitDisplayPerGenome[protFamObj.name] = 1
				this.variables.evalueCutOff[protFamObj.name] = 1
				this.parseData(protFamObj.name, i)
			})
			console.log(this.data)
			this.variables.aux.proteinFamilies = proteinFamilies
			resolve()
		})
	}

	makeButton(items) {
		const self = this

		const buttons = d3.select('#main-controls')
			.insert('div')
			.attr('class', 'btn-group')

		buttons.insert('button')
			.attr('class','btn dropdown-toggle control')
			.attr('type', 'button')
			.attr('data-toggle', 'dropdown')
			.text(items.protFam)
			.style('color', color(this.variables.aux.proteinFamilies.indexOf(items.protFam)))
			.insert('span')
			.attr('class', 'caret')

		const dropdown = buttons.insert('div')
			.attr('class', 'dropdown-menu')
			.style('background-color', 'blue')
			.style('width', window.innerWidth/2 + 'px')
			.style('background-color', 'rgba(0,0,0,0.7)')

		const sliderControl = dropdown.insert('div')
			.attr('id', 'controls')
			.attr('class', 'col-sm-4 centered')
			.style('width', '100px')

		const insiderSlider = sliderControl.insert('div')
			.attr('class', 'sliderControl')

		insiderSlider.insert('div')
			.attr('id', items.protFam + 'Slider')
			.attr('class', 'slider centered')

		insiderSlider.insert('div')
			.attr('id', items.protFam + 'SliderText')
			.attr('class', 'slider centered')

		let cogBox = dropdown.insert('div')
			.attr('class', 'col-sm-10 box')
			.style('width', '250px')
			.style('background', 'none')

		cogBox.insert('div')
			.attr('id', items.protFam + 'Box')

		d3.select(items.containerName)
			.append('form')
			.attr('name', 'lowLimitForm_' + items.protFam)
			.attr('onSubmit', 'return false')
			.append('input')
			.attr('type', 'text')
			.attr('id','newLowLimitForm_' + items.protFam)
			.attr('placeholder', '1')

		d3.select('#newLowLimitForm_' + items.protFam).on('change', function() {
			self.variables.lowLimitDisplayPerGenome[items.protFam] = Number(this.value)
			// update(matrix, evalueCutOff, graph, GroupIndex, correlation, oldState, lowLimitDisplayPerGenome)
			console.log(self.variables.lowLimitDisplayPerGenome)
			return false
		})
	}

	getValidLinks(protFam) {
		const famIndex = this.variables.aux.proteinFamilies.indexOf(protFam)
		return this.data.links.filter((link) => {
			return link.evalue > this.variables.evalueCutOff[protFam] && (link.source !== link.target) && link.pf === famIndex
		})
	}

	makeGraph(items) {
		const svg = d3.select(items.containerName).append('svg')
			.attr('width', this.kDefaults.graph.width)
			.attr('height', this.kDefaults.graph.height)

		// svg.append('g').attr('class', '.links')
		// svg.append('g').attr('class', '.nodes')

		const links = this.setLinks(items)
		const nodes = this.setNodes(items)
		const simulation = this.makeSimulation(items, nodes, links)
		this.simulations[items.protFam] = simulation
	}

	setNodes(items) {
		const famIndex = this.variables.aux.proteinFamilies.indexOf(items.protFam)
		const graphNodes = this.data.nodes.filter((node) => {
			return node.pf === famIndex
		})

		const nodes = d3.select(items.containerName)
			.select('svg')
			.append('g')
			.attr('class', '.nodes')
			.selectAll('.node')

		nodes
			.data(graphNodes)
			.enter()
			.append('circle')
			.attr('class', 'node')
			.attr('r', this.kDefaults.graph.nodeSize)
			.style('fill', function(node) {
				return color(famIndex)
			})
		return graphNodes
	}

	setLinks(items) {
		const validLinks = this.getValidLinks(items.protFam)
		const links = d3.select(items.containerName)
			.select('svg')
			.append('g')
			.attr('class', '.links')
			.selectAll('.link')

		links.data(validLinks)
			.enter()
			.append('line')
			.attr('class', 'link')

		return validLinks
	}

	updateLinks(items) {
		const validLinks = this.getValidLinks(items.protFam)
		const linkItems = d3.select(items.containerName)
			.selectAll('svg')
			.select('g')
			.selectAll('.link')
			.data(validLinks)

		linkItems.exit().remove()

		linkItems.enter()
			.append('line')
			.attr('class', 'link')

		const nodeItems = d3.select(items.containerName)
			.selectAll('svg')
			.selectAll('.node')

		this.simulations[items.protFam]
			.force('links', d3.forceLink(validLinks))
			.on('tick', () => {
				linkItems
					.attr('x1', (d) => {
						return d.source.x
					})
					.attr('y1', (d) => {
						return d.source.y
					})
					.attr('x2', (d) => {
						return d.target.x
					})
					.attr('y2', (d) => {
						return d.target.y		
					})
				nodeItems
					.attr('cx', (d) => {
						return d.x
					})
					.attr('cy', (d) => {
						return d.y
					})
			})
	}

	makeSimulation(items, nodes, links) {
		const nodeItems = d3.select(items.containerName).selectAll('.node')
		const linkItems = d3.select(items.containerName).selectAll('.link')

		const simulation = d3.forceSimulation(nodes)
			.force('link', d3.forceLink(links)
				.distance(this.kDefaults.force.dist))
			.force('charge', d3.forceManyBody().strength(this.kDefaults.force.charge))
			.force('center', d3.forceCenter(this.kDefaults.graph.width / 2, this.kDefaults.graph.height / 2))
			.on('tick', () => {
				linkItems
					.attr('x1', (d) => {
						return d.source.x
					})
					.attr('y1', (d) => {
						return d.source.y
					})
					.attr('x2', (d) => {
						return d.target.x
					})
					.attr('y2', (d) => {
						return d.target.y		
					})
				nodeItems
					.attr('cx', (d) => {
						return d.x
					})
					.attr('cy', (d) => {
						return d.y
					})
			})
		return simulation
	}

	makeSlider(items) {
		const sliderDiv = `#${items.protFam}Slider`
		const self = this
		d3.select(sliderDiv)
			.append('input')
			.attr('type', 'range')
			.attr('min', this.kDefaults.slider.min)
			.attr('max', this.kDefaults.slider.max)
			.attr('value', this.variables.evalueCutOff[items.protFam])
			.attr('id', `#newEvalueForm_${items.protFam}`)
			.on('input', function() {
				self.variables.evalueCutOff[items.protFam] = Number(this.value)
				// oldState = {gr: GroupIndex, ev: evalueCutOff}
				d3.select(items.sliderContainerText)
					.selectAll('input')
					.attr('placeholder', d3.format('.2f')(self.variables.evalueCutOff[items.protFam]))
				self.updateLinks(items)
				self.simulations[items.protFam].alphaTarget(1).restart()
				// update(matrix, evalueCutOff, graph, GroupIndex, correlation, oldState, lowLimitDisplayPerGenome)
				return false
			})

		d3.select(items.sliderContainerText)
			.append('form')
			.attr('name', `EvalueForm_${items.protFam}`)
			.attr('onSubmit', 'return false')
			.append('input')
			.attr('type', 'text')
			.attr('size', this.kDefaults.slider.fontSize)
			.attr('id', `newEvalueForm_${items.protFam}`)
			.attr('placeholder', d3.format('.2f')(self.variables.evalueCutOff[items.protFam]))
			.style('background-color', 'black')
	}

	makeControls(protFam) {
		const items = {
			protFam,
			containerName: '#' + protFam + 'Box',
			sliderContainer: '#' + protFam + 'Slider',
			sliderContainerText: '#' + protFam + 'SliderText'
		}
		this.makeButton(items)
		this.makeGraph(items)
		this.makeSlider(items)
	}

	buildEnvironment() {
		this.variables.aux.proteinFamilies.forEach((protFam, famIndex) => {
			this.makeControls(protFam)
		})
	}

	updateGraph(protFam) {

	}

	updateInfo() {
		this.updateGraphs()
	}

}