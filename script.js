let images = []
let farmland, grass, animations, animateid, w, h, edges, clickinglastframe, font, hasClicked
let game

function preload() {
    for(let i=0; i<10; i++) images.push(loadImage(`images/0${i}.png`))
    for(let i=10; i<11; i++) images.push(loadImage(`images/${i}.png`))
    font = loadFont("corn.ttf")
}

function setup() {
    createCanvas(windowWidth, windowHeight).parent("canvas")
    noSmooth()
    colorMode(RGBA)
    textAlign(CENTER, CENTER)
    angleMode(DEGREES)

    game = new Game()
    
    farmland = {}

    animations = {}
    animateid = 0
    clickinglastframe = false
    hasClicked = false

    grass = {}
    for(let x=-50; x<50; x++) {
        for(let y=-50; y<50; y++) {
            grass[x+","+y] = new Crop((x+","+y),7,0)
        }
    }

    edges = {}
    resize(0,0,0,0)
}

function draw() {
    if(windowWidth !== width || windowHeight !== height) {
        createCanvas(windowWidth, windowHeight).parent("canvas")
        noSmooth()
    }

    background("#81e681")
    textFont(font)
    let scale = min(width/(w+4), (height-100)/(h+4))
    translate(scale*1.5, scale*1.5)

    // grass
    Object.keys(grass).forEach(key => {
        let x, y
        let temp = ""
        key.split("").forEach((char) => {
            if(char == ",") {
                x = parseInt(temp)
                temp = ""
            } else temp += char
        })
        y = parseInt(temp)
        image(images[grass[key].img], x*scale, y*scale, scale+1, scale+1)
        if(frameCount % 30 === 0) {
            grass[key].img++
            if(grass[key].img > 10) grass[key].img = 7
        }
    })

    noStroke()
    fill(75, 58, 49, 50)
    rect(1.9*scale+((width-(w+8)*scale)/2), 1.9*scale-scale*2, (w+1)*scale+scale/5, (h+1)*scale+scale/5)

    //farmland
    Object.keys(farmland).forEach(key => {
        let x, y
        let temp = ""
        key.split("").forEach((char) => {
            if(char == ",") {
                x = parseInt(temp)
                temp = ""
            } else temp += char
        })
        y = parseInt(temp)

        let crop = farmland[key]
        let imgx = x*scale+((width-(w+4)*scale)/2)
        image(images[crop.img], imgx, y*scale, scale+1, scale+1)
        crop.grow()

        if(crop.img === 0) return

        fill("black")
        rect(imgx+scale*0.1, (y+1)*scale-scale*0.1-5, scale*0.8, scale*0.1)
        if(crop.growth <= crop.time) {
            push()
            colorMode(HSL,100)
            fill((crop.growth/crop.time)*29, 100, 70)
            rect((imgx+scale*0.1), (y+1)*scale-scale*0.1-5, (crop.growth/crop.time)*scale*0.8, scale*0.1)
            pop()
        } else {
            fill("red")
            rect((imgx+scale*0.1), (y+1)*scale-scale*0.1-5, scale*0.8+0-((crop.growth-crop.time)/game.decaytime)*scale*0.8, scale*0.1)
        }

        if(mouseIsPressed && !clickinglastframe) {
            if(mouseX > imgx+scale*1.5 && mouseX < imgx+scale+scale*1.5) {
                if(mouseY > y*scale+scale*1.5 && mouseY < (y+1)*scale+scale*1.5) {
                    let increase = crop.harvest()
                    if(increase) animations[animateid] = new Animation("+"+increase, random(imgx, imgx+scale), random(y*scale, (y+0.5)*scale))
                    animateid++
                    farmland[key] = new Crop(key,1,5)
                    hasClicked = true
                }
            }
        }
    })
    
    if(!hasClicked) {
        translate(-scale*1.5, -scale*1,5)
        push()
        textAlign(CENTER)
        textSize(scale/3)
        fill(0,0,0,75)
        text("CLICK TO HARVEST", width/2+5, 15)
        fill("white")
        text("CLICK TO HARVEST", width/2, 10)
        pop()
    }

    Object.keys(animations).forEach((a) => {
        animations[a].draw()
    })
}

function resize(x1, x2, y1, y2) {
    edges.x1 = x1
    edges.x2 = x2
    edges.y1 = y1
    edges.y2 = y2
    w = x2-x1
    h = y2-y1
    for(let x=0; x<w+1; x++) {
        farmland[`${x},${Math.round(h)}`] = new Crop(`${x},${Math.round(h)}`,1,5)
    }
    for(let y=0; y<h+1; y++) {
        farmland[`${Math.round(w)},${y}`] = new Crop(`${Math.round(w)},${y}`,1,5)
    }
}

function increaseSize() {
    resize(0,edges.x2-edges.x1+1, 0,edges.y2-edges.y1+1)
}

function sprite(x,y,w=11,h=w) {
    return new Promise((resolve, reject) => {
        let sheet = document.createElement("img")
        sheet.src = "images/upgrades.png"
        sheet.style = "display: none;"
        document.body.appendChild(sheet)
        sheet.onload = () => {
            let canvas = document.createElement("canvas")
            canvas.width = w
            canvas.height = h
            document.body.appendChild(canvas)
            let ctx = canvas.getContext("2d")

            ctx.drawImage(
                sheet,
                x*w,
                y*h,
                w,h,
                0,0,
                w,h
            )

            let img = new Image()
            img.src = canvas.toDataURL()
            resolve(img)

            canvas.remove()
            sheet.remove()
        }
        sheet.onerror = reject
    })
}

class Crop {
    constructor(id, img=0, time=0) {
        this.img = img
        this.lastimg = img+5
        this.growth = 0
        this.time = max(time*60+game.growthtimeoffset, 10)
        this.id = id
    }
    grow() {
        this.growth++
        this.img = ceil(this.growth/this.time*5)
        if(this.img > this.lastimg) this.img = this.lastimg
        if(this.growth > this.time+game.decaytime && this.img !== 0) this.reset()
    }
    harvest() {
        if(this.img > 0)
        if(this.growth > this.time) {
            game.addScore(3)
            this.reset()
            return 3
        }else if(this.growth >= this.time*(this.lastimg-this.img-2)/(this.lastimg-this.img)) {
            game.addScore(1)
            this.reset()
            return 1
        }
    }
    reset() {
        farmland[this.id] = new Crop(this.id,1,5)
    }
}

class Animation {
    constructor(text, x, y) {
        this.text = text
        this.x = x
        this.y = y
        this.speed = random(1, 2)
        this.opacity = 100
    }
    draw() {
        colorMode(RGBA)
        textSize(30)
        fill(255,255,255,this.opacity)
        text(this.text, this.x, this.y)
        this.y -= this.speed
        this.opacity -= 0.1
    }
}

class Upgrade {
    constructor(name, cost, cords, desc, func=() => {console.log("MISSING FUNCTION")}) {
        this.name = name
        this.cost = cost
        this.desc = desc
        this.cords = cords
        this.func = func
        this.built = false
    }
    async build() {
        this.built = true
        this.element = document.createElement("div")
        this.element.classList.add("upgradeOuter")
        this.element.addEventListener("click", () => {
            if(game.score < this.cost) return
            game.score -= this.cost
            this.func()
            game.boughtUpgrade(this.name)
        })
        let flex = document.createElement('div')
        flex.classList.add("upgrade")
        
        await sprite(this.cords[0], this.cords[1]).then(img => {
            flex.appendChild(img)
        })

        let yap = document.createElement("div")
        let ename = document.createElement("a")
        ename.innerText = this.name
        yap.appendChild(ename)
        let ecost = document.createElement("a")
        ecost.innerText = this.cost+" corn"
        ecost.style = "float: right;"
        yap.appendChild(ecost)
        let edesc = document.createElement('p')
        edesc.classList.add("storeDesc")
        edesc.innerHTML = this.desc
        yap.appendChild(edesc)
        flex.appendChild(yap)

        this.element.appendChild(flex)
        let progress = document.createElement("div")
        progress.classList.add("upgradeProgress")
        let innerprogress = document.createElement('div')
        setInterval(() => {
            let percent = Math.min((game.score/this.cost)*100, 100)
            innerprogress.style.width = (percent)+"%"
            innerprogress.style.backgroundColor = `hsl(${Math.round(percent)},100%,50%)`
        }, 100)
        progress.appendChild(innerprogress)
        this.element.appendChild(progress)
        document.getElementById("storeinner").appendChild(this.element)
    }
}

class Game {
    constructor() {
        this.score = 0
        this.decaytime = 3*60
        this.growthtimeoffset = 0

        this.store = document.getElementById("store")
        this.store.style = "display: none;"
        this.openStore = document.getElementById("openStore")
        this.openStore.addEventListener("click", () => {
            if(this.store.style.cssText === "display: none;") this.store.style = "display: block;"
            else this.store.style = "display: none;"
        })
        this.closeStore = document.getElementById("closeStore")
        this.closeStore.addEventListener("click", () => {
            this.store.style = "display: none;"
        })
        this.hiddenUpgrade = document.getElementById("hiddenUpgrade")

        this.bestUpgrade = 0
        this.upgrades = []
        this.upgrades.push(new Upgrade("Speed Up", 10, [0,0], "Speed up crop growth", () => {game.growthtimeoffset -= 30}))
        this.upgrades.push(new Upgrade("Resilliant Crops", 50, [0,1], "Decrease decay time", () => {game.decaytime += 30}))
        this.upgrades.push(new Upgrade("Resize", 500, [1,0], "Increase farmland dimensions by 1.<br><i>\"Why not (x+1)+(y+1)-1 more corn?\"</i>", increaseSize))
        this.upgrades.push(new Upgrade("Blue Corn", 500, [1,1], "Unlock Blue Corn.<br><i>\"Wait blue food exists?<br>Can we finnally eat Blue goldfish??\"</i>"))

        this.upgrades[0].build()
    }
    addScore(num) {
        this.score += num
        document.getElementById("score").innerText = this.score

        let i = 0
        this.upgrades.forEach((up) => {
            if(this.score >= up.cost*0.7 && !up.built) {
                up.build()
            } else if(i-1 <= this.bestUpgrade && !up.built) {
                //Build it with ???? for title desc and image 
                up.build()
            }
            i++
        })
    }
    boughtUpgrade(name) {
        let i = 0
        this.upgrades.forEach((up) => {
            if(up.name === name) {
                this.bestUpgrade = i
            }
            i++
        })
    }
}