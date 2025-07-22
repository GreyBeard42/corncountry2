let farmland, grass, lastgrowtick
let scale, w, h, edges
let farmers
let animations, animateid, rain
let clickinglastframe, hasClicked
let font, cropsprites, farmersprites
let game

// mode=0 gets assets localy while mode=1 fetches published assets from github
const mode = 1
let pre = "https://cdn.jsdelivr.net/gh/GreyBeard42/corncountry2@main/"
if(mode === 0) pre=""

function preload() {
    font = loadFont(pre+"corn.ttf")
    cropsprites = loadImage(pre+"images/crops.png")
    farmersprites = loadImage(pre+"images/farmer.png")
}

function setup() {
    createCanvas(windowWidth, windowHeight).parent("canvas")
    noSmooth()
    colorMode(RGBA)
    textAlign(CENTER, CENTER)
    angleMode(DEGREES)
    game = new Game()
    
    farmland = {}

    farmers = {}

    animations = {}
    animateid = 0
    clickinglastframe = false
    hasClicked = false
    lastgrowtick = 0

    rain = {}

    grass = {}
    for(let x=-50; x<50; x++) {
        for(let y=-50; y<50; y++) {
            grass[x+","+y] = 0
        }
    }

    edges = {}
    resize(0,0,0,0)
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight)
    noSmooth()
}

function draw() {
    scale = min(width/(w+4), (height-100)/(h+4))
    background("#81e681")
    textFont(font)
    translate(scale*1.5, scale*1.5)

    if(!game.loaded) return
    // grass
    for(let key in grass) {
        let x, y
        let temp = ""
        key.split("").forEach((char) => {
            if(char == ",") {
                x = parseInt(temp)
                temp = ""
            } else temp += char
        })
        y = parseInt(temp)
        image(cropsprites,x*scale,y*scale, scale+1,scale+1,(18*(grass[key]%4)),(18*Math.floor((grass[key]/4))),18,18)
        if(frameCount % 30 === 0) {
            if(game.weather === -1) {
                if(grass[key] < 3) grass[key] = 3
                if(grass[key] < 6) grass[key]++
            } else {
                grass[key]++
                if(grass[key] === 4) grass[key] = 0
                if(grass[key] > 3) grass[key] -= 2
            }
        }
    }

    noStroke()
    fill(75, 58, 49, 50)
    rect(1.9*scale+((width-(w+8)*scale)/2), 1.9*scale-scale*2, (w+1)*scale+scale/5, (h+1)*scale+scale/5)

    //farmland
    let now = millis()
    let delta = now - lastgrowtick
    for(let key in farmland) {
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
        image(cropsprites,imgx,y*scale, scale+1,scale+1,(18*(farmland[key].img%4)),(18*Math.floor((farmland[key].img/4))),18,18)
        if(delta >= 10) {
            crop.grow()
            lastgrowtick = now
        }

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
                    crop.harvest()
                    farmland[key] = new Crop(key,1,3)
                    hasClicked = true
                }
            }
        }
        
    }

    for(let key in farmers) {
        farmers[key].draw()
    }

    for(let a in animations) {
        animations[a].draw()
    }

    translate(-scale*1.5, -scale*1.5)
    if(localStorage.getItem("data")) hasClicked = true
    if(!hasClicked) {
        push()
        textAlign(CENTER)
        textSize(scale/3)
        fill(0,0,0,75)
        text("CLICK TO HARVEST", width/2+5, 15+scale/2)
        fill("white")
        text("CLICK TO HARVEST", width/2, 10+scale/2)
        //taking it quite litterally
        if(mouseIsPressed) if(mouseX > width/2-scale*1.5 && mouseX < width/2+scale*1.5) {
            if(mouseY > scale/3 && mouseY < scale*3/4) game.clickedtoharvest = true
        }
        pop()
    }

    if(game.weather === 1 && Math.random() > 0.75) {
        let id = round(random(0, 10000))
        rain[id] = new Raindrop(random(0,width), id)
    }
    for(let drop in rain) {
        rain[drop].draw()
    }

    colorMode(RGBA, 100)
    noStroke()
    if(game.lastweather === -1) fill(207, 197, 186, game.fogOpacity)
    else fill(136, 168, 179, game.fogOpacity)
    rect(0,0,width,height)
}

function resize(x1, x2, y1, y2) {
    edges.x1 = x1
    edges.x2 = x2
    edges.y1 = y1
    edges.y2 = y2
    w = x2-x1
    h = y2-y1
    for(let x=0; x<w+1; x++) {
        farmland[`${x},${Math.round(h)}`] = new Crop(`${x},${Math.round(h)}`,1,3)
    }
    for(let y=0; y<h+1; y++) {
        farmland[`${Math.round(w)},${y}`] = new Crop(`${Math.round(w)},${y}`,1,3)
    }
}

function increaseSize() {
    resize(0,edges.x2-edges.x1+1, 0,edges.y2-edges.y1+1)
    for(let key in farmers) {
        farmers[key].x = 0
        farmers[key].y = 0
    }
}

function sprite(x,y,w=11,h=w) {
    return new Promise((resolve, reject) => {
        let sheet = document.createElement("img")
        sheet.crossOrigin = 'anonymous'
        if(mode === 0) sheet.src = "images/icons.png"
        else sheet.src = "https://cdn.statically.io/gh/greybeard42/corncountry2/main/"+"images/icons.png"
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
    constructor(id) {
        this.img = game.crop*6+8
        this.lastimg = this.img+5
        this.growth = 0
        this.time = game.growthtime
        this.id = id
    }
    grow() {
        this.time = game.growthtime
        this.growth++
        this.img = floor(this.growth/this.time*5)+this.lastimg-5
        if(this.growth > this.time) this.img = this.lastimg
        if(this.growth > this.time+game.decaytime) this.reset()
    }
    harvest(x=mouseX,y=mouseY,multi=1) {
        if(this.growth >= this.time-10) {
            if(game.weather === -1) multi = multi*0.65
            else if(game.weather === 1) multi = multi*1.25
            game.addScore(game.cropValue*multi)
            this.reset()
            animations[animateid] = new Animation("+"+Math.ceil(game.cropValue*multi), random(x-scale*2, x-scale), y-scale*1.5)
            animateid++
        }
    }
    reset() {
        farmland[this.id] = new Crop(this.id,1,3)
    }
}

class Farmer {
    constructor() {
        this.img = 0
        this.x = 0
        this.y = 0
        this.farming = false
        this.cooldown = 0
    }
    draw() {
        image(farmersprites,((width-(w+4)*scale)/2)+this.x,this.y, scale*0.45,scale, (12*(this.img%7)+12),0, 12,26)
        
        if(this.farming || this.cooldown > 0) {
            this.img = 0
            this.farming = false
            this.cooldown--
            return
        }

        if(frameCount%3==0) this.img++
        this.img %= 7

        this.x += scale/50
        if(this.x > scale*(w+0.5)) {
            this.y += scale
            this.x = 0
            if(this.y/scale > h) this.y = 0
        }
        
        for(let key in farmland) {
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
            if(crop.growth > crop.time) if((this.x+scale*0.2>x*scale && this.x+scale*0.2<(x+1)*scale) && (this.y+scale/2>y*scale && this.y+scale/2<(y+1)*scale)) {
                this.farming = true
                this.cooldown = 10
                farmland[key].harvest(this.x+width/2.5, this.y+scale*1.5, 3)
            }
        }
    }
}

class Animation {
    constructor(text, x, y) {
        this.text = text
        this.x = x
        this.y = y
        this.speed = random(1, 2)
        this.opacity = 200
        this.id = animateid
    }
    draw() {
        colorMode(RGBA)
        textSize(30)
        fill(255,255,255,this.opacity)
        text(this.text, this.x, this.y)
        this.y -= this.speed
        this.opacity -= 0.5
        if(this.opacity<10) delete animations[this.id]
    }
}

class Raindrop {
    constructor(x, id) {
        this.x = x
        this.y = -50
        this.id = id
    }
    draw() {
        push()
        rectMode(CENTER)
        fill("#8abdcf")
        rect(this.x, this.y, 5, 30)
        pop()
        this.y += 3
        if(this.y > height+50) delete animations[this.id]
    }
}

class Upgrade {
    constructor(name, cost, cords, desc, func=() => {console.log("MISSING FUNCTION")}, maxamount=-1, multiplier=1) {
        this.name = name
        this.cost = cost
        this.desc = desc
        this.cords = cords
        this.func = func
        this.built = false
        this.amountowned = 0
        this.maxamount = maxamount
        this.multiplier = multiplier
    }
    buy() {
        if(this.amountowned >= this.maxamount && this.maxamount>0) return
        if(game.score < this.cost) return
        game.addScore(-this.cost)
        this.func()
        this.cost *= this.multiplier
        this.cost = round(this.cost)
        this.ecost.innerText = this.cost+" corn"
        game.boughtUpgrade(this.name)
        this.amountowned++
        if(this.amountowned >= this.maxamount && this.maxamount>0) {
            this.element.style.display = "none"
        }
    }
    async build() {
        this.built = true
        this.element = document.createElement("div")
        this.element.classList.add("upgradeOuter")
        this.element.addEventListener("click", () => {
            this.buy()
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
        this.ecost = document.createElement("a")
        this.ecost.innerText = this.cost+" corn"
        this.ecost.style = "float: right;"
        yap.appendChild(this.ecost)
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

class Achievement {
    constructor(name, desc, img, unlockFunc=()=>{}) {
        this.name = name
        this.img = img
        this.desc = desc
        this.unlockFunc = unlockFunc
        this.unlocked = false
    }
    async addToAchievesPage() {
        let outer = document.createElement('div')
        outer.classList.add("achievementIcon")
        this.lockedimg = await sprite(5, 3)
        outer.appendChild(this.lockedimg)
        this.achievepageimg = await sprite(this.img[0], this.img[1])
        this.achievepageimg.style.display = "none"
        outer.appendChild(this.achievepageimg)

        let explain = document.createElement("div")
        explain.classList.add("tooltip")
        explain.appendChild(await sprite(this.img[0], this.img[1]))
        let info = document.createElement("div")
        let title = document.createElement("a")
        title.innerText = this.name
        info.appendChild(title)
        let desc = document.createElement("a")
        desc.innerText = this.desc
        desc.style = "font-size: 10px;"
        info.appendChild(desc)
        explain.style.display = "none"
        outer.addEventListener("mouseenter", () => {if(this.unlocked) explain.style.display = "flex"})
        outer.addEventListener("mouseleave", () => {explain.style.display = "none"})
        explain.appendChild(info)
        outer.appendChild(explain)

        document.getElementById("achieveinner").appendChild(outer)
        
        requestAnimationFrame(() => {
            explain.style.display = "flex"
            let rect = explain.getBoundingClientRect()
            if(rect.right > window.innerWidth) explain.style.left = "-220px"
            explain.style.display = "none"
        })
    }
    async build(popup=true) {
        this.unlocked = true
        this.lockedimg.style.display = "none"
        this.achievepageimg.style.display = "inline"
        this.unlockFunc = () => {return false}
        if(!popup) return
        this.outer = document.createElement("div")
        this.outer.classList.add("achievement")
        this.outer.appendChild(await sprite(this.img[0], this.img[1]))

        let textdiv = document.createElement("div")
        let title = document.createElement("a")
        title.innerHTML = "Achievement Unlocked:<br>"+this.name
        textdiv.appendChild(title)
        this.outer.appendChild(textdiv)

        document.getElementById("achieveouter").appendChild(this.outer)

        setTimeout(() => {this.outer.remove()}, 7000)
    }
}

//really want to do hard reset?
function hardreset() {
    if(confirm("Are you sure you want to Hard Reset your Game?")) {
        if(confirm("really..?")) {
            if(confirm("You'll lose all of your progress!")) {
                if(confirm("Welp Ok.\nIf really do press ok this time...\nYou'll be starting from the beginning.\nDon't say I didn't warn you!")) {
                    game.HARDRESET()
                }
            }
        }
    }
}

class Game {
    constructor() {
        this.loaded = false

        this.score = 0
        this.lifetimescore = 0
        this.decaytime = 1.5*60
        this.growthtime = 3*60
        this.cropValue = 3
        this.crop = 0

        this.weather = 0
        this.fogOpacity = 0
        this.lastweather = 0

        this.openedgithub = false
        this.openedoldgame = false
        this.clickedtoharvest = false

        if(!localStorage.getItem("data")) document.getElementById("loading").remove()

        //store
        this.store = document.getElementById("store")
        this.openStore = document.getElementById("openStore")
        this.openStore.addEventListener("click", () => {
            if(this.store.style.cssText === "display: none;") this.store.style = "display: block;"
            else this.store.style = "display: none;"
        })
        this.closeStore = document.getElementById("closeStore")
        this.closeStore.addEventListener("click", () => {
            this.store.style = "display: none;"
        })

        //achievement tab
        this.achieveTab = document.getElementById("achievements")
        document.getElementById("openAchieves").addEventListener("click", () => {
            if(this.achieveTab.style.cssText == "display: none;") this.achieveTab.style = "display: block;"
            else this.achieveTab.style = "display: none;"
        })

        //settings
        this.settings = document.getElementById("settings")
        document.getElementById("openSettings").addEventListener("click", () => {
            if(this.settings.style.cssText == "display: none;") this.settings.style = "display: block;"
            else this.settings.style = "display: none;"
        })

        //upgrades
        this.bestUpgrade = 0
        this.upgrades = []
        this.upgrades.push(new Upgrade("Speed Up", 9, [0,0], "Speed up crop growth<br><i>\"3 seconds is just wayyy too slow for my farm...\"</i>", () => {game.growthtime = max(game.growthtime-30, 30)}, 5, 1.1))
        this.upgrades.push(new Upgrade("Resize", 50, [2,1], "Increase farmland dimensions by 1.<br><i>\"Why not (w+1)+(h+1)-1 more corn?\"</i>", increaseSize, 25, 2))
        this.upgrades.push(new Upgrade("Resilliant Crops", 750, [2,3], "Increase decay time", () => {game.decaytime = floor(game.decaytime*1.25)}, -1, 1.2))
        this.upgrades.push(new Upgrade("Farmer", 2500, [0,4], "Hire a Farmer to harvest crops for you.<br><i>\"A lifetime supply of corn for forever harvesting!\"<i>", () => {
            farmers[random(0, 1000000)] = new Farmer()
        }, -1, 1.2))
        this.upgrades.push(new Upgrade("Blue Corn", 7777, [6,0], "Unlock Blue Corn.<br><i>\"Can we finnally eat Blue goldfish??\"</i>", () => {
            game.crop = 1
            for(let key in farmland) {
                farmland[key] = new Crop(key)
            }
            game.cropValue = 5
            game.growthtime = (6*60+game.growthtime)/2
        }, 1))
        this.upgrades.push(new Upgrade("Blue Speed Up", 777, [1,0], "Speed up Blue Corn growth<br><i>\"Super Sonic Speed\"</i>", () => {game.growthtime = max(game.growthtime-30, 30)}, 6, 1.1))

        //Speed Up Upgrade Rules
        this.upgrades[0].build()
        setInterval(() => {
            if(this.crop != 0) this.upgrades[0].element.style.display = "none"
        }, 500)

        //achievements
        this.achievements = []
        //corn types
        this.achievements.push(new Achievement("First Harvest", "Successfully harvest your first crop.", [5,0], () => {return (game.score > 0)}))
        this.achievements.push(new Achievement("I'm Blue", "Unlock Blue Corn.", [6,0], () => {return (game.crop === 1)}))
        //lifetime score
        this.achievements.push(new Achievement("It's Corn", "Harvest 9 Corn.", [0, 2], () => {return (game.lifetimescore >= 9)}))
        this.achievements.push(new Achievement("Music to my Ears", "Harvest 100 Corn.", [1, 2], () => {return (game.lifetimescore >= 100)}))
        this.achievements.push(new Achievement("A-maize-ing!", "Harvest 1,000 Corn.", [2, 2], () => {return (game.lifetimescore >= 1000)}))
        this.achievements.push(new Achievement("7s across the Field", "Harvest 7,777 Corn.", [3, 2], () => {return (game.lifetimescore >= 7777)}))
        this.achievements.push(new Achievement("Corn Tycoon", "Harvest 50,000 Corn.", [4, 2], () => {return (game.lifetimescore >= 50000)}))
        //Speed up
        this.achievements.push(new Achievement("Faster and Faster", "Buy a Speed Up Upgrade.", [0,0], () => {return (game.upgrades[0].amountowned > 0)}))
        this.achievements.push(new Achievement("Instantaneous", "Reach maximum crop growth speed.", [2,0], () => {return (game.growthtime == 30)}))
        this.achievements.push(new Achievement("Instant Blue Corn", "Reach maximum crop growth speed for Blue Corn.", [1,0], () => {return (game.growthtime == 30 && game.crop === 1)}))
        //Resize
        this.achievements.push(new Achievement("Resize", "Buy a Resize Upgrade.", [0,1], () => {return (game.upgrades[1].amountowned > 0)}))
        this.achievements.push(new Achievement("4x4 Award", "Have a field width of 4.", [1,1], () => {return (game.upgrades[1].amountowned >= 3)}))
        this.achievements.push(new Achievement("Count Corn not Sheep", "Have a field width of 7.", [2,1], () => {return (game.upgrades[1].amountowned >= 6)}))
        //Resilliant Crops
        this.achievements.push(new Achievement("Hit the Gym", "Buy a Resilliant Crops Upgrade.", [0,3], () => {return (game.upgrades[2].amountowned >= 1)}))
        this.achievements.push(new Achievement("Yes, Buff Plants", "Have a decay time of 3 seconds", [1,3], () => {return (game.decaytime >= 180)}))
        this.achievements.push(new Achievement("Super-Plant Strength", "Have a decay time of 10 seconds", [2,3], () => {return (game.decaytime >= 600)}))
        this.achievements.push(new Achievement("High Protein", "Have a decay time of 30 seconds", [3,3], () => {return (game.decaytime >= 1800)}))
        this.achievements.push(new Achievement("Invincible Corn", "Have a 1 minute decay time.", [4,3], () => {return (game.decaytime >= 3600)}))
        //special
        this.achievements.push(new Achievement("What a Nerd", "View the source code on Github.", [5,2], () => {return (game.openedgithub)}))
        this.achievements.push(new Achievement("Ancient Version", "View the original Corn Country.", [6,2], () => {return (game.openedoldgame)}))
        this.achievements.push(new Achievement("Clicked \"To Harvest\"", "Follow Simple Instructions.", [6,3], () => {return (game.clickedtoharvest)}))
        
        //check to unlock upgrades and achievements
        setTimeout(() => {
            setInterval(() => {
                let i = 0
                this.upgrades.forEach((up) => {
                    if(i-1 <= this.bestUpgrade && !up.built) {
                        up.build()
                    }
                    i++
                })

                this.achievements.forEach((a) => {
                    if(a.unlockFunc()) a.build()
                })
            }, 500)
        }, 1000)

        game = this
        this.initAchieves()
        setInterval(() => {
            this.save()
        }, 30000)

        document.addEventListener('keydown', function (e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault()
                game.save()
            }
        })

        setTimeout(this.weatherTick, 180000+Math.random()*180000)
    }
    async initAchieves() {
        for(let a in this.achievements) {
            await this.achievements[a].addToAchievesPage()
        }
        if(localStorage.getItem("data")) {
            await this.load()
            document.getElementById("loading").remove()
        }
        this.store.style = "display: block;"
        this.loaded = true
    }
    addScore(num) {
        num = ceil(num)
        this.score += num
        this.lifetimescore += num
        document.getElementById("score").innerText = this.score

        document.title = this.score + " corn - Corn Country 2 - GreyBeard42's Homepage"
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
    setWeather(weather) {
        console.log("Weather set to "+weather)
        this.weather = weather
        let int
        if(weather === 0) {
            int = setInterval(() => {
                this.fogOpacity--
                if(this.fogOpacity <= 0) clearInterval(int)
            }, 10)
        } else {
            int = setInterval(() => {
                this.fogOpacity++
                if(this.fogOpacity >= 150) clearInterval(int)
            }, 10)
            this.lastweather = weather
        }
        setTimeout(() => {
            this.setWeather(0)
        }, 45000+Math.random()*60000)
    }
    weatherTick() {
        console.log("Weather Tick")
        if(Math.random() > 0.5) game.setWeather(-1)
        else game.setWeather(1)
        setTimeout(game.weatherTick, 180000+Math.random()*180000)
    }
    save() {
        let obj = {
            score: this.score,
            lifetimescore: this.lifetimescore,
            openedgithub: this.openedgithub,
            openedoldgame: this.openedoldgame,
            clickedtoharvest: this.clickedtoharvest,
        }
        obj.upgrades = []
        let i = 0
        this.upgrades.forEach((u) => {
            obj.upgrades[i] = u.amountowned
            i++
        })
        obj.achievements = []
        i = 0
        this.achievements.forEach((a) => {
            obj.achievements[i] = a.unlocked
            i++
        })
        localStorage.setItem("data", JSON.stringify(obj))

        this.announceSaved()
    }
    async announceSaved() {
        let outer = document.createElement("div")
        outer.classList.add("achievement")
        outer.appendChild(await sprite(5, 0))

        let textdiv = document.createElement("div")
        let title = document.createElement("a")
        title.innerHTML = "Game Saved<br>You're Welcome"
        textdiv.appendChild(title)
        outer.appendChild(textdiv)

        document.getElementById("achieveouter").appendChild(outer)

        setTimeout(() => {outer.remove()}, 7000)
    }
    async load() {
        let obj = JSON.parse(localStorage.getItem("data"))
        if(!localStorage.getItem("data")) return
        //achivements
        let i = 0
        obj.achievements.forEach((a) => {
            if(a) game.achievements[i].build(false)
            i++
        })
        this.score = obj.score
        this.lifetimescore = obj.lifetimescore
        this.openedoldgame = obj.openedoldgame
        this.openedgithub = obj.openedgithub
        this.clickedtoharvest = obj.clickedtoharvest
        //upgrades
        for(let i in obj.upgrades) {
            let upgrade = this.upgrades[i]
            let u = obj.upgrades[i]
            if(u > 0 && !upgrade.built) await upgrade.build()
            for(let n=0; n<u; n++) {
                game.score += upgrade.cost
                upgrade.buy()
            }

            /* if(upgrade.amountowned >= upgrade.maxamount && upgrade.maxamount>0) {
                upgrade.element.remove()
            } */
        }
    }
    HARDRESET() {
        localStorage.removeItem("data")
        location.reload()
    }
}