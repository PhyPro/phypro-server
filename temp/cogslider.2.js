'use strict'


// Client side of the phypro
//let filename = 'phypro.Vibrio.pack.json'
//let filename = 'phypro.GammaPb.pack.json'
//let filename = 'phypro.T4SS.pack.json'
//let filename = 'phypro.T4Pdemo.pack.json'

const filename = 'phypro.th-ring4.config.json'

let width = 450,
	profileWidth = window.innerWidth - 300, // 1200,
	profileHeight = 2000,
	height = 450,
	numCategories = 19,
	color = d3.scale.ordinal()
		.domain(d3.range(numCategories))
		.range(['#E41A1C', '#377EB8', '#4DAF4A', '#984EA3', '#FF7F00', '#999999', '#A65628', '#F781BF', '#17BECF', '#8DD3C7', '#BEBADA', '#FB8072', '#80B1D3', '#B3DE69', '#FCCDE5', '#D9D9D9', '#BC80BD', '#CCEBC5', '#FFED6F'])

// let cb = new Clipboard('circle')

// Force related constants
let forceDist = 10,
	forceCharge = -50,
	forceGravity = 0.25

// Force
let force = d3.layout.force()
	.size([width, height])
	.distance(forceDist)
	.charge(forceCharge)
	.gravity(forceGravity)

function lowLimit(GroupFam) {
	console.log(document.getElementById('newLowLimitForm_' + GroupFam).value)
	let lowSpecLimit = document.getElementById('newLowLimitForm_' + GroupFam).value
	return false
}


d3.json(filename, function(error, phyproData) {
	console.log(phyproData)

	let columnSelected = []

	function _isNormalInteger(str) {
		return /^\+?(0|[1-9]\d*)$/.test(str);
	}
	function getNewickNodesNames(treeNode, listNodes, j) {
		if (treeNode.name !== '' && !(_isNormalInteger(treeNode.name))) {
			listNodes.push({phy_ord: j, name: treeNode.name})
			j += 1
		}
		// listNodes.push(treeNode)
		if (treeNode.branchset) for (let i = 0; i < treeNode.branchset.length; i++) getNewickNodesNames(treeNode.branchset[i], listNodes, j)
		return listNodes
	}

	function getGenomeVersion(name) {
		return name.split('|')[1].split('-')[0]
		// return (name.split('|').length !== 0 ) ? name.split('|')[0] : name
	}

	function getOrgId(name) {
		return name.split('|')[0].split('_')[2]
		// return (name.split('|').length !== 0 ) ? name.split('|')[0] : name
	}

	function getOrgId(name) {
		return parseInt(name.split('|')[0].split('_')[2])
		// return (name.split('|').length !== 0 ) ? name.split('|')[0] : name
	}

	function getLocus(name) {
		return name.split('|')[1]
		// return (name.split('|').length !== 0 ) ? name.split('|')[0] : name
	}

	function makeOriginalMatrix(phyproData) {
		const nodeList = phyproData.phyloProfile.data.nodes
		let newMatrix = [],
			baseCount = 0

		nodeLists.forEach(function(nodes, i) {
			nodes.forEach(function(node) {
				let rowIndex = getGenomeVersion(node)
				let colIndex = i
				newMatrix.push({x: colIndex, y: rowIndex, z: 1, g: n.pF, a: n.aseq, gr: i, cog: n.cog, name: [n.id], show: true, id: n.id, sel: false})
			})
			baseCount += cogLists[i].length
		})
		return {m : newMatrix}
	}

	function makeProfMatrix(matrix2update, nodeLists, cogLists, refGenomes, GrIndex, orgLimits, specInfo) {
		let rowIndex = 0,
			colIndex = 0,
			elementIndex = [],
			element = [],
			maxColIndex = 0,
			orgsInCol = {}

		if (matrix2update.length === 0) {
			let baseCount = 0,
				gid = 0,
				locus = ''

			nodeLists.forEach(function(nodes, i) {
				let j = 0
				nodes.forEach(function(n) {
					rowIndex = specInfo.posTax[getGenomeVersion(n.id)] // This will be converted in the real y position later
					colIndex = baseCount + n.cog - 1 // cogLists[i].indexOf(n.cog)			
					element = rowIndex + ':::' + colIndex
					if (elementIndex.indexOf(element) === -1) {
						matrix2update.push({x: colIndex, y: rowIndex, z: 1, g: n.pF, a: n.aseq, gr: i, cog: n.cog, name: [n.id]})
						elementIndex.push(element)
					}
					else {
						matrix2update[elementIndex.indexOf(element)].z += 1
						matrix2update[elementIndex.indexOf(element)].name.push(n.id)
					}
					gid = getOrgId(n.id)
					if (refGenomes.indexOf(gid) !== -1) {
						locus = getLocus(n.id)
						if (refColIndex.indexOf(colIndex) === -1) {
							refNodes.push({x: colIndex, l: locus})
							refColIndex.push(colIndex)
						}
						else {
							refNodes[refColIndex.indexOf(colIndex)].l += ', ' + locus
						}
					}
					if (colIndex > maxColIndex) maxColIndex = colIndex
				})
				baseCount += cogLists[i].length
				// console.log(baseCount)
			})
		}
		else {
			let baseCount = 0,
				gid = 0,
				locus = '',
				elements = [],
				matrix2updateMap = {}, // to find where is the node with the same row and index
				groupUpdated = 0,
				updateCogStartingIndex = 1,
				updateCogEndingIndex = 0,
				selected = []
		
			if (GrIndex !== -1) {
				updateCogStartingIndex = nodeLists.map(function(a) { return a.length }).slice(0, GrIndex)
					.reduce((a, b) => a + b, 0)
				updateCogEndingIndex = updateCogStartingIndex + nodeLists[GrIndex].length
			}
			console.log("updating matrix2update profile")
			let j = 0
			matrix2update.forEach(function(node, i) {
				if (i >= updateCogStartingIndex && i < updateCogEndingIndex) {
					node.cog = nodeLists[GrIndex][j].cog
					j++
				}

				if (groupUpdated !== node.gr) {
					baseCount += cogLists[node.gr - 1].length
					groupUpdated = node.gr
				}
				rowIndex = specInfo.posTax[getGenomeVersion(node.id)]
				colIndex = baseCount + node.cog - 1
				element = rowIndex + ':::' + colIndex
				node.i = i
				gid = getOrgId(node.id)
				node.gid = gid
				node.x = colIndex
				node.y = rowIndex
				if (elements.indexOf(element) === -1) {
					node.z = 1
					node.base = baseCount
					node.show = true
					node.name = [node.id]
					elements.push(element)
					matrix2updateMap[element] = i
				}
				else {
					node.show = false
					matrix2update[matrix2updateMap[element]].name.push(node.id)
					matrix2update[matrix2updateMap[element]].z += 1
				}

				if (!(colIndex in orgsInCol)) {
					orgsInCol[colIndex] = {orgs: [rowIndex], lim: orgLimits[node.gr], numOrgs: 1, ind: colIndex, jnd: colIndex, l: [], gr: node.gr }
				}
				else if (orgsInCol[colIndex].orgs.indexOf(rowIndex) === -1) {
					orgsInCol[colIndex].numOrgs++
					orgsInCol[colIndex].orgs.push(rowIndex)
				}

				if (refGenomes.indexOf(gid) !== -1) {
					locus = getLocus(node.id)
					orgsInCol[colIndex].l.push(locus)
				}

				if (colIndex > maxColIndex) maxColIndex = colIndex
			})
		}

		let orgsInColArr = []

		for (let colInd in orgsInCol)
			orgsInColArr.push(orgsInCol[colInd])

		orgsInColArr.sort((a, b) => {
			if (a.gr === b.gr) {
				if (b.numOrgs === a.numOrgs) {
					let minb = Math.min.apply(null, b.orgs)
					let mina = Math.min.apply(null, a.orgs)
					if (mina === minb) {
						let maxb = Math.max.apply(null, b.orgs)
						let maxa = Math.max.apply(null, a.orgs)
						if (maxa === maxb) {
							return a.ind - b.ind
						}
						return maxa - maxb
					}
					return mina - minb
				}
				return b.numOrgs - a.numOrgs
			}
			return a.gr - b.gr
		})

		let j = 0

		orgsInColArr.forEach(function(s) {
			if (s.numOrgs >= s.lim) {
				s.jnd = j
				j++
			}
			else {
				s.jnd = -1
			}
		})

		matrix2update.forEach(function(item) {
			//console.log(orgsInCol)
			if (orgsInCol[item.x].numOrgs < orgLimits[item.gr]) {
				item.show = false
			}
			item.x = orgsInCol[item.x].jnd
		})

		return {m: matrix2update, len: orgsInColArr.filter((item) => { return item.jnd !== -1 }).length, colInfo: orgsInColArr }
	}

	function makeCorrelOrder(matrix, genomes) {
		let result = [],
			correlMatrix = [],
			numRows = genomes.length,
			numCols = matrix.len + 1

		for (let i = 0; i < numCols; i++) {
			let tmpCol = []
			for (let j = 0; j < numRows; j++) tmpCol.push(0)
			correlMatrix.push(tmpCol)
		}
		matrix.m.filter(function(node) {
				return node.show === true// && numOrgs[node.x] > lowLimitDisplayPerGenome[node.gr]
			}).forEach(function(item) {
			correlMatrix[item.x][genomes.indexOf(item.gid)] = 1
		})

		// clusterfck is borking on complete columns so we need to take the first ones out
/*		console.log('debjdakadsas')
		console.log('Original CorrelMatrix')
		console.log(JSON.stringify(correlMatrix))
		console.log(correlMatrix.length)*/
		let numOfcompleteColum = 0,
			completeColArray = []
		for (let j = 0; j < numRows; j++) completeColArray.push(1)
		let completeCol = JSON.stringify(completeColArray)

		let howManyCompleteColumns = []
		for (let i = 0; i < correlMatrix.length; i++) {
			if (completeCol === JSON.stringify(correlMatrix[i])) howManyCompleteColumns.push(i)
		}
/*
		console.log('How many complete columns : ' + howManyCompleteColumns.length)
		console.log(howManyCompleteColumns)*/

		howManyCompleteColumns.reverse()
		for (let i = 0; i < howManyCompleteColumns.length; i++) correlMatrix.splice(howManyCompleteColumns[i], 1)

		howManyCompleteColumns.reverse()
/*		console.log('Spliced CorrelMatrix')
		console.log(JSON.stringify(correlMatrix))*/

		let cl = clusterfck.hcluster(correlMatrix, function(a, b) {
			return (1 - correl(a, b)) / 2
		})

		let orderedMatrix = []
		orderedMatrix = getOrder(orderedMatrix, 'ini', cl)

/*		console.log('cluster')
		console.log(JSON.stringify(cl))

		console.log('orderedMatrix')
		console.log(JSON.stringify(orderedMatrix))
		// Inserting the complete columns in the correlMatrix (right spot) and orderedMatrix (begining)

		// howManyCompleteColumns.reverse()
		console.log('How many complete columns : ' + howManyCompleteColumns.length)
		console.log(howManyCompleteColumns)

*/
		howManyCompleteColumns.forEach(function(i) {
			correlMatrix.splice(i, 0, completeColArray)
			orderedMatrix.splice(0, 0, completeColArray)

/*			console.log('Fixing : ' + i)
			console.log(JSON.stringify(correlMatrix))
			*/
		})
/*
		console.log('Re-spliced CorrelMatrix')
		console.log(JSON.stringify(correlMatrix))

		console.log('spliced orderedMatrix')
		console.log(JSON.stringify(orderedMatrix))*/

		orderedMatrix.forEach(function(row) {
			for (let i = 0; i < correlMatrix.length; i++) {
				if (JSON.stringify(row) === JSON.stringify(correlMatrix[i]) && result.indexOf(i) === -1) {
					result.push(i)
					break
				}
			}
		})
/*
		console.log('New order of array')
		console.log(JSON.stringify(result))
*/
		return result
	}

	function getOrder(result, leftRightIni, clu) {
		if ('left' in clu) {
			result = getOrder(result, 'left', clu.left)
		} 
		if ('right' in clu) {
			result = getOrder(result, 'right', clu.right)
		}
		if ('value' in clu) {
			if (leftRightIni === 'left' && result.length !== 0) {
				//result.splice(result.length - 1, 0, clu.value)
				result.push(clu.value)
			}
			else {
				result.push(clu.value)
			}
		}
		return result
	}

	function correl(a, b) {
		let N = a.length,
			productStd = d3.deviation(a) * d3.deviation(b),
			productMean = d3.mean(a) * d3.mean(b),
			results = 0
		for ( let i = 0; i < N; i++) {
			results += a[i] * b[i]
		}
		return (results - N * productMean) / ((N - 1) * productStd)
	}

	function defFrozen(matrix) {
		let frozen = {li: [], gr: []}
		matrix.forEach((item) => {
			if (item.sel === true) {
				frozen.li.push(item.id)
				frozen.gr.push(item.cog)
			}
		})
		let frozenGrps = new Set(frozen.gr)
		console.log('Number of frozen groups: ' + frozenGrps.size)
		//console.log(JSON.stringify(frozen))
		return frozen
	}

	function makeGroupsNLinks(cutOff, links, nodes, frozen) {
		let groups = [],
			listLinks = [],
			frozenGroups = []

		links.forEach(function(value) {
			let targetID = nodes[value.target].id,
				sourceID = nodes[value.source].id
			if (frozen.li.indexOf(sourceID) === -1 && frozen.li.indexOf(targetID) === -1) {
				if (value.evalue >= cutOff) {
					listLinks.push({source: value.source, target: value.target, evalue: value.evalue, id: value.id})
					let tobeMerged = []
					groups.forEach(function(group, i) {
						if (group.has(value.source) || group.has(value.target))
							tobeMerged.push(i)
					})
					if (tobeMerged.length === 0) {
						groups.push(new Set([value.source, value.target]))
					}
					else if (tobeMerged.length === 1) {
						groups[tobeMerged[0]].add(value.source)
						groups[tobeMerged[0]].add(value.target)
					}
					else {
						tobeMerged.sort(function(a, b) {
							return b - a
						})
						let newGroup = []
						tobeMerged.forEach(function(i) {
							let toAdd = Array.from(groups[i])
							newGroup = newGroup.concat(toAdd)
						})
						newGroup.push(value.source)
						newGroup.push(value.target)
						newGroup = new Set(newGroup)
						for (let i = 0; i < tobeMerged.length; i++)
							groups.splice(tobeMerged[i], 1)
						groups.push(newGroup)
					}
				}
			}
			else if (frozen.li.indexOf(sourceID) !== -1 && frozen.li.indexOf(targetID) !== -1 && frozen.gr[frozen.li.indexOf(targetID)] === frozen.gr[frozen.li.indexOf(sourceID)]) {
				let tobeMerged = []
				frozenGroups.forEach((group, i) => {
					if (group.has(value.source) || group.has(value.target)) tobeMerged.push(i)
				})
				if (tobeMerged.length === 0) {
					frozenGroups.push(new Set([value.source, value.target]))
				}
				else if (tobeMerged.length === 1) {
					frozenGroups[tobeMerged[0]].add(value.source)
					frozenGroups[tobeMerged[0]].add(value.target)
				}
				else {
					tobeMerged.sort(function(a, b) {
						return b - a
					})
					let newGroup = []
					tobeMerged.forEach(function(i) {
						let toAdd = Array.from(frozenGroups[i])
						newGroup = newGroup.concat(toAdd)
					})
					newGroup.push(value.source)
					newGroup.push(value.target)
					newGroup = new Set(newGroup)
					for (let i = 0; i < tobeMerged.length; i++)
						frozenGroups.splice(tobeMerged[i], 1)
					frozenGroups.push(newGroup)
				}
			}
		})
		groups = groups.concat(frozenGroups)
		groups.sort(function(a, b) {
			return b.size - a.size
		})
		return {gr: groups, links: listLinks}
	}

	function updateNodes(nodes, gr) {
		//console.log('updateNotes')
		//console.log(nodes)
		//console.log(gr.length)
		let indexOfSingleCOGs = gr.length
		for (let i = 0; i < nodes.length; i++) {
			/* if (nodes[i].id === 'Ps_aer_479|PA1251|NP_249942.1' ) {
				console.log(nodes[i])
				console.log(nodes[i].cog)
			}*/
			// console.log(nodes[i])
			let oldGroup = 0
			for (let j = 0; j < gr.length; j++) {
				if (gr[j].has(i) === true) {
					// console.log('changing' + nodes[i])
					nodes[i].cog = j + 1
					oldGroup = 1
					break
				}
			}
			if (oldGroup === 0) {
				indexOfSingleCOGs++
				nodes[i].cog = indexOfSingleCOGs
			}
			/* if (nodes[i].id === 'Ps_aer_479|PA1251|NP_249942.1' ) {
				console.log(nodes[i])
				console.log(nodes[i].cog)
			}*/
		}
		// console.log('here')
		return nodes
	}

	function update(matrix, evalue, bundledInfo, GrIndex, correlation, oldState, lowLimitDisplayPerGenome) {
		if (correlation === false) {
			GrIndex = oldState.gr
			evalue = oldState.ev
		}
		let graphLinks = bundledInfo.links[GrIndex],
			graphNodes = bundledInfo.nodes[GrIndex],
			containerName = '#' + bundledInfo.listOfGroups[GrIndex] + 'Box',
			genomes = bundledInfo.config.main.genomes,
			refGenomes = bundledInfo.config.main.refGenomes,
			GroupsNlinks = [],
			listOfLinks = [],
			groups = []

		let frozen = defFrozen(matrix.m)

		if (GrIndex !== -1) {
			GroupsNlinks = makeGroupsNLinks(evalue, graphLinks, graphNodes, frozen)
			listOfLinks = GroupsNlinks.links,
			groups = GroupsNlinks.gr

			graphNodes = updateNodes(graphNodes, groups)
			bundledInfo.nodes[GrIndex] = graphNodes

			let cogList = []
			graphNodes.forEach(function(d) {
				if (cogList.indexOf(d.cog) === -1) cogList.push(parseInt(d.cog))
			})

			bundledInfo.cogList[GrIndex] = cogList

			d3.select(containerName).selectAll('.numCogs')
				.text(' Number of COGs : ' + cogList.length)
				.style('fill', 'white')

			d3.select(containerName).selectAll('circle')
				.select('title')
				.text(function(d, i) {
					return 'COG ' + (d.cog) + ' - ' + d.pF + ' - ' + d.id
				})
		}

		matrix = makeProfMatrix(matrix.m, bundledInfo.nodes, bundledInfo.cogList, refGenomes, GrIndex, lowLimitDisplayPerGenome, newSpecs)

		let matrixDisplay = matrix.m.filter(function(d) {
			return d.show === true
		})

		if (correlation === true) {
			let newOrder = makeCorrelOrder(matrix, genomes)
			// console.log(JSON.stringify(newOrder))
			matrix.m.forEach(function(item) {
				item.x = newOrder.indexOf(item.x)
			})
			matrix.colInfo.forEach(function(item) {
				item.jnd = newOrder.indexOf(item.jnd)
			})
		}

		let matrixWidth = ((newSpecs.distBetweenTaxa * matrix.len < profileWidth) ? newSpecs.distBetweenTaxa * matrix.len : profileWidth )

		let x = d3.scale.ordinal().rangeBands([0, matrixWidth - 5])
		x.domain(d3.range(matrix.len + 1))

		let radCogCircle = newSpecs.distBetweenTaxa / 3 > x.rangeBand() / 3 ? x.rangeBand() / 3 : newSpecs.distBetweenTaxa / 3

		let cells = profileMatrix.selectAll('circle')
			.data(matrix.m.filter(function(node) {
				return node.show === true// && numOrgs[node.x] > lowLimitDisplayPerGenome[node.gr]
			}))

		cells.transition().delay(function(n) {return n.x * 3 })
			.attr('cx', function(n) {
				return x(n.x)
			})
			.attr('cy', function(n) {
				return n.y - radCogCircle / 2
			})
			.attr('r', radCogCircle)
			.attr('data-clipboard-text', function(d) {
				return bundledInfo.nodes[d.gr].filter(function(n) {
					return d.cog === n.cog
				}).map(function(item) {
					return item.id.toString()
				}).sort().join('\n')
			})
			.attr('transform', 'translate(' + radCogCircle + ',' + newSpecs.verticalShift + ')')
			.style('fill', function(n) {
				return color(n.gr)
			})
			.style('stroke', function(n) {
				return (n.sel === true) ? 'white' : 'none'
			})

		cells.enter()
			.append('circle')
			.attr('class', 'profileNode')
			.attr('r', radCogCircle)
			.attr('cx', function(n) {
				return x(n.x)
			})
			.attr('cy', function(n) {
				return n.y - radCogCircle / 2
			})
			.style('fill', function(n) {
				return color(n.gr)
			})
			.style('stroke', function(n) {
				return (n.sel === true) ? 'white' : 'none'
			})
			.attr('transform', 'translate(' + radCogCircle + ',' + newSpecs.verticalShift + ')')
			.attr('data-clipboard-text', function(d) {
				let data2clip = bundledInfo.nodes[d.gr].filter(function(n) {
					return d.cog === n.cog
				}).map(function(item) {
					return item.id
				}).sort().join('\n')
				return data2clip
			})
			.on('mouseover', function(d) {
				let data2clip = bundledInfo.nodes[d.gr].filter(function(n) {
					return d.cog === n.cog
				}).map(function(item) {
					return item.id
				}).sort().join('\n')
				console.log(data2clip)
				let tempCells = profileMatrix.selectAll('circle')
					.filter(function(i) {
						return i.cog + '_' + i.gr !== d.cog + '_' + d.gr && i.y !== d.y
					})
					.transition()
					.style('opacity', 0.3)
				newSpecs.vis.selectAll('g.node').select('text')
					.filter(function(i) {
						return getOrgId(i.name) === d.gid
					})
					.transition()
					.style('fill', 'red')
				divtip.transition()
					.duration(200)
					.style('opacity', 0.9)
				divtip.html('<h>' + d.g + '<br/><img src="http://seqdepot.net/api/v1/aseqs/' + d.a + '.png"></br>' + d.name.join('<br/></h>') + '<br/>' + JSON.stringify(d).split(', ').join('<br/></h>'))
					.style('left', (d3.event.pageX + 30) + 'px')     
					.style('top', (d3.event.pageY + 30) + 'px')
					.style('font-size', '15px')   
				})                  
			.on('mouseout', function(d) {
				let tempCells = profileMatrix.selectAll('circle')
					.filter(function(i) {
						return i.cog + '_' + i.gr !== d.cog + '_' + d.gr && i.y !== d.y
					})
					.transition()
					.style('opacity', 1)
				newSpecs.vis.selectAll('g.node').select('text')
					.filter(function(i) {
						return getOrgId(i.name) === d.gid
					})
					.transition()
					.style('fill', 'white')
				divtip.transition().style('opacity', 0)
			})
			.on('dblclick', function(d) {
				console.log(JSON.stringify(d))
				let codeColumn = d.cog + '_' + d.gr
				if (d.sel === false) {
					matrix.m.forEach((i) => {
						if (i.cog + '_' + i.gr === d.cog + '_' + d.gr) {
							i.sel = true
						}
					})
				}
				else {
					matrix.m.forEach((i) => {
						if (i.cog + '_' + i.gr === d.cog + '_' + d.gr) {
							i.sel = false
						}
					})
				}
				profileMatrix.selectAll('circle')
					.style('stroke', function(n) {
						return (n.sel === true) ? 'white' : 'none'
					})
			})

		cells.exit().remove()

		// console.log(matrix.tags)

		let tags = profileTags.selectAll('text')
			.data(matrix.colInfo.filter((item) => {
				return item.jnd !== -1
			}))

		tags.transition().delay(function(n) {return n.jnd * 3 })
			.attr('y', function(d) {
				return x(d.jnd) + 3 * radCogCircle/2
			})
			.attr('font-size', 2 * radCogCircle + 'px')
			.text(function(d) { return d.l.join(', ') })

		tags.enter()
			.append('text')
			.attr('y', function(d) {
				return x(d.jnd) + 3 * radCogCircle/2
			})
			.attr("x", '-50px' )
			.attr("text-anchor", "start")
			.attr('font-size', 2 * radCogCircle + 'px')
			.style('fill', 'white')
			.style('stroke', 'none')
			.text(function(d) { return d.l.join(', ') })
			.attr('transform', function(d) { return 'rotate(-90)' })
			.on('mouseover', function(d) {
				infoLocus.style('display', 'inline')
					.text(d.l.join(', '))
			})
			.on('mouseout', function(d) {
				infoLocus.style('display', 'none')
			})

		tags.exit().remove()


		if (GrIndex !== -1 && listOfLinks.length < 1000) {
			let node = d3.select(containerName).selectAll('.node')
			let links = d3.select(containerName).select('svg').selectAll('.link')

			links.data(listOfLinks)
				.enter()
				.append('line')
				.attr('class', 'link')
			links.data(listOfLinks)
				.exit()
				.remove()

			force.nodes(graphNodes)
				.links(listOfLinks)
				.start()

			force.on('tick', function() {
				links.attr('x1', function(d) { return d.source.x })
					.attr('y1', function(d) { return d.source.y })
					.attr('x2', function(d) { return d.target.x })
					.attr('y2', function(d) { return d.target.y })
				node.attr('transform', function(d) {
					return 'translate(' + d.x + ',' + d.y + ')'
				})
			})
		}
		else {
			force.stop()
		}
	}

	let treeString = phyproData.refTree.tree,
		newick = Newick.parse(treeString),
		phyOrdIndex = 0,
		initNodes = [],
		correlation = false,
		oldState = { gr: -1, ev: 0}

	let matrix = makeOriginalMatrix(phyproData.phyloProfile.data.nodes, phyproData.cogList, phyproData.header.genomes.reference)

	let lowLimitDisplayPerGenome = []

	let newickNodes = getNewickNodesNames(newick, initNodes, phyOrdIndex)

	profileHeight = 20 * newickNodes.length

	let newSpecs = d3.phylogramPhyPro.buildProfile('#profile', newick, newickNodes.length, {
		width: 100,
		height: profileHeight,
		skipTicks: true
	})

	newSpecs.vis.selectAll("g.node")
		.on('mouseover', function(d) {
			console.log(d)
			let tempCells = profileMatrix.selectAll('circle')
				.filter(function(i) {
					return i.gid !== getOrgId(d.name)
				})
				.transition()
				.style('opacity', 0.3)
		})
		.on('mouseout', function(d) {
			let tempCells = profileMatrix.selectAll('circle')
				.filter(function(i) {
					return i.y !== d.name
				})
				.transition()
				.style('opacity', 1)
		})



	let shift4tags = 200

	let profile = d3.select('#profile')
		.append('svg')
		.attr('class', 'profileMatrix')
		.attr('width', profileWidth)
		.attr('height', profileHeight + shift4tags)

	let profileMatrix = profile.append('g')
		.attr('class', 'matrix')
		.attr('transform', 'translate(0,' + shift4tags + ')')

	let profileTags = profile.append('g')
		.attr('class', 'tags')
		.attr('transform', 'translate(0,150)')


	let tools = d3.select('#main-tools')

	let toolbutton = tools.insert('div')
			.attr('class', 'btn-group')


	toolbutton.insert('button')
		.attr('class', 'btn')
		.attr('type', 'button')
		.text('Correlation')
		.on('click', function() {
			if (correlation === false) {
				correlation = true
				d3.select(this).attr('class', 'btn active')
				update(matrix, 0, graph, -1, correlation, oldState, lowLimitDisplayPerGenome)
			}
			else {
				correlation = false
				d3.select(this).attr('class', 'btn')
				update(matrix, 0, graph, -1, correlation, oldState, lowLimitDisplayPerGenome)
			}
		})
	
	let spName = false

	toolbutton.insert('button')
		.attr('class', 'btn')
		.attr('type', 'button')
		.text('Species Name')
		.on('click', function() {
			if (spName === false) {
				spName = true
				let spNamesSvg = newSpecs.vis.selectAll('g.leaf.node').selectAll("text")
					.attr("x", function (d) { return 8 + newSpecs.yMax - d.y } ) // xMax )
					.attr("y", 3 )
					.attr("text-anchor", "start")
					.attr('font-size', '12px')
					.style('fill', 'white')
					.style('stroke', 'none')
					.style('font-style', 'italic')
					.text(function(d) { return phyproData.code2sp[d.name] })

				let maxNameLen = 0
				spNamesSvg.each(function() {
					if (this.getBBox().width > maxNameLen) maxNameLen = this.getBBox().width
				})

				let newTreeWidth = 100 + 3 + maxNameLen + 2
				profileWidth = window.innerWidth - newTreeWidth - 100
				profile.attr('width', profileWidth )

				d3.select('#profile').select('svg').attr('width', newTreeWidth)

				d3.select(this).text('CodeName')
				update(matrix, 0, graph, -1, correlation, oldState, lowLimitDisplayPerGenome)
			}
			else {
				spName = false
				d3.select(this).text('Species Name')

				let spNamesSvg = newSpecs.vis.selectAll('g.leaf.node').selectAll("text")
					.attr("x", function (d) { return 8 + newSpecs.yMax - d.y } ) // xMax )
					.attr("y", 3 )
					.attr("text-anchor", "start")
					.attr('font-size', '15px')
					.style('fill', 'white')
					.style('stroke', 'none')
					.style('font-style', 'normal')
					.text(function(d) { return d.name })

				let maxNameLen = 0
				spNamesSvg.each(function() {
					if (this.getBBox().width > maxNameLen) maxNameLen = this.getBBox().width
				})

				let newTreeWidth = 100 + 3 + maxNameLen + 2
				profileWidth = window.innerWidth - newTreeWidth - 100
				profile.attr('width', profileWidth)

				d3.select('#profile').select('svg').attr('width', newTreeWidth)

				update(matrix, 0, graph, -1, correlation, oldState, lowLimitDisplayPerGenome)
			}
		})

	toolbutton.insert('button')
		.attr('class', 'btn')
		.attr('type', 'button')
		.text('Reset selection')
		.on('click', function() {
			matrix.m.forEach((item) => {
				if (item.sel === true) {
					item.sel = false
				}
			})
		update(matrix, 0, graph, -1, correlation, oldState, lowLimitDisplayPerGenome)
		})

	let infoLocus = d3.select('body').insert('div')
		.attr('class', 'tooltipy')
		.style('display', 'none')

	let divtip = d3.select("body").append("div")   
		.attr("class", "tooltip")               
		.style("opacity", 0);
		

	phyproData.listOfGroups.forEach(function(GroupFam, GroupIndex) {
		let containerName = '#' + GroupFam + 'Box',
			sliderContainer = '#' + GroupFam + 'Slider',
			sliderContainerText = '#' + GroupFam + 'SliderText'

		lowLimitDisplayPerGenome.push(1)

		let controls = d3.select('#main-controls')

		let button = controls.insert('div')
				.attr('class', 'btn-group')

		button.insert('button')
			.attr('class','btn dropdown-toggle')
			.attr('type', 'button')
			.attr('data-toggle', 'dropdown')
			.text(GroupFam)
			.style('color', color(GroupIndex))
			.insert('span')
			.attr('class', 'caret')

		let dropdown = button.insert('div')
			.attr('class', 'dropdown-menu')
			.style('background-color', 'black')
			.style('width', window.innerWidth/2 + 'px')
			.style('background-color', 'rgba(0,0,0,0.7)')

		let sliderControl = dropdown.insert('div')
			.attr('id', 'controls')
			.attr('class', 'col-sm-4 centered')
			.style('width', '100px')

		let insiderSlider = sliderControl.insert('div')
			.attr('class', 'sliderControl')

		insiderSlider.insert('div')
			.attr('id', GroupFam + 'Slider')
			.attr('class', 'slider centered')

		insiderSlider.insert('div')
			.attr('id', GroupFam + 'SliderText')
			.attr('class', 'slider centered')

		let cogBox = dropdown.insert('div')
			.attr('class', 'col-sm-10 box')
			.style('width', '250px')
			.style('background', 'none')

		cogBox.insert('div')
			.attr('id', GroupFam + 'Box')

		console.log(containerName)

		let graphLinks = phyproData.links[GroupIndex]
		let graphNodes = phyproData.nodes[GroupIndex]

		let maxEvalue = 0,
			minEvalue = 1000,
			evalueCutOff = 0,
			listOfLinks = []

		graphLinks.forEach(function(d) {
			if (d.evalue > evalueCutOff) listOfLinks.push({source: d.source, target: d.target, evalue: d.evalue, id: d.id})
			if (d.evalue > maxEvalue) maxEvalue = d.evalue
			if (d.evalue < minEvalue) minEvalue = d.evalue
		})

		let cogList = [],
			pfList = []

		graphNodes.forEach(function(d) {
			if (pfList.indexOf(d.pF) === -1) pfList.push(d.pF)
			if (cogList.indexOf(d.orig) === -1) cogList.push(parseInt(d.orig))
		})

		let toleranceEvalue = 1
		evalueCutOff = maxEvalue
		minEvalue -= toleranceEvalue
		maxEvalue += toleranceEvalue


		let nodeSize = 3
		let form = d3.select(containerName)
			.append('form')
			.attr('name', 'lowLimitForm_' + GroupFam)
			.attr('onSubmit', 'return false')
			.append('input')
				.attr('type', 'text')
				.attr('id','newLowLimitForm_' + GroupFam)
				.attr('placeholder', '1')

		d3.select('#newLowLimitForm_' + GroupFam).on('change', function() {
			console.log(this.value)
			lowLimitDisplayPerGenome[GroupIndex] = this.value
			update(matrix, evalueCutOff, graph, GroupIndex, correlation, oldState, lowLimitDisplayPerGenome)
			return false
		})

		let svg = d3.select(containerName).append('svg')
			.attr('width', width)
			.attr('height', height)

		let link = svg.selectAll('.link')
				.data(listOfLinks)
				.enter()
				.append('line')
				.attr('class', 'link'),
			node = svg.selectAll('.node')
				.data(graphNodes)
				.enter()
				.append('circle')
				.attr('class', 'node')
				.attr('r', nodeSize)
				.style('fill', function(n) {
					return color(n.gr)
				})
				.call(force.drag)

		node.append('title')
			.text(function(d) {
				return 'COG ' + (d.cog) + ' - ' + d.id
			})

		let yDisplForText = 15
		svg.append('text')
			.attr('class', 'numNodes')
			.attr('dy', yDisplForText)
			.text(' Number of nodes : ' + graphNodes.length)
			.style('fill', 'white')

		svg.append('text')
			.attr('class', 'numCogs')
			.attr('dy', 35)
			.text(' Number of COGs : ' + cogList.length)
			.style('fill', 'white')

		force.nodes(graphNodes)
			.links(listOfLinks)
			.start()

		let lowSpecLimit = 0

		//d3.select(sliderContainerText).text(d3.format('.2f')(evalueCutOff))

		d3.select(sliderContainerText)
		.append('form')
			.attr('name', 'EvalueForm_' + GroupFam)
			.attr('onSubmit', 'return false')
			.append('input')
				.attr('type', 'text')
				.attr('size', 4)
				.attr('id','newEvalueForm_' + GroupFam)
				.attr('placeholder', d3.format('.2f')(evalueCutOff))
				.style('background-color', 'black')

				//.text(d3.format('.2f')(evalueCutOff))

		d3.select('#newEvalueForm_' + GroupFam).on('change', function() {
			console.log(this.value)
			evalueCutOff = this.value
			oldState = {gr: GroupIndex, ev: evalueCutOff}
			//d3.select(sliderContainerText).selectAll('input').attr('placeholder', d3.format('.2f')(evalueCutOff))
			update(matrix, evalueCutOff, graph, GroupIndex, correlation, oldState, lowLimitDisplayPerGenome)
			return false
		})

		d3.select(sliderContainer)
			.call(d3.slider().max(maxEvalue)
				.min(minEvalue)
				.value(evalueCutOff)
				.on('slide', function(evt, value) {
					//d3.select(sliderContainerText).text(d3.format('.2f')(value))
					d3.select(sliderContainerText).selectAll('input').attr('placeholder', d3.format('.2f')(value))
					evalueCutOff = value
					oldState = {gr: GroupIndex, ev: evalueCutOff}
					update(matrix, evalueCutOff, graph, GroupIndex, correlation, oldState, lowLimitDisplayPerGenome)
				})
			)
		oldState = {gr: GroupIndex, ev: evalueCutOff, specLim : lowSpecLimit }
		update(matrix, evalueCutOff, graph, GroupIndex, correlation, oldState, lowLimitDisplayPerGenome)

	})
})

