import { Container, Graphics, Text } from "pixi.js"
import type { StageType } from "@/lib/engine/overdrive"

export const V = {
  bg:0x0a0e14, panel:0x111623, panel2:0x1a2030, line:0x232b3d,
  text:0xe8ecf4, mid:0x9aa3b5, dim:0x4e576b,
  green:0x3bf562, pink:0xff4d9d, violet:0x9d6bff,
  yellow:0xffc93b, red:0xff3b3b, cyan:0x35d6e8,
} as const

export type BaseArt = {
  root:Container; cannon:Container; barrel:Graphics; core:Graphics;
  ring:Graphics; integrity:Graphics; antennaLights:Graphics[]
}
export type EnemyArt = {
  root:Container; body:Container; hitLayer:Graphics; eye:Graphics;
  thrusters:Graphics[]; ringA?:Graphics; ringB?:Graphics; word:Text; hp:Graphics
}

export function createBase():BaseArt {
  const root=new Container()
  const shadow=new Graphics().ellipse(0,54,90,18).fill({color:0x000000,alpha:.45})
  const bunker=new Graphics()
    .moveTo(-72,42).lineTo(-58,-38).lineTo(-24,-58).lineTo(34,-58).lineTo(66,-28).lineTo(78,42).closePath()
    .fill({color:V.panel}).stroke({color:V.cyan,width:3})
  const armor=new Graphics()
    .roundRect(-54,-28,106,56,9).fill({color:V.panel2}).stroke({color:V.line,width:2})
    .moveTo(-43,-18).lineTo(-20,-37).lineTo(24,-37).lineTo(43,-18).stroke({color:V.dim,width:2})
  const keyboard=new Graphics().roundRect(-46,4,92,28,5).fill({color:V.bg}).stroke({color:V.line,width:2})
  for(let row=0;row<3;row++)for(let col=0;col<9;col++)keyboard.roundRect(-40+col*9,-1+row*8,6,5,1).fill({color:(row+col)%5===0?V.cyan:V.dim,alpha:.7})
  const core=new Graphics().circle(0,-16,15).fill({color:V.cyan,alpha:.18}).stroke({color:V.cyan,width:3}).circle(0,-16,6).fill({color:V.cyan})
  const ring=new Graphics().circle(0,-16,25).stroke({color:V.cyan,width:2,alpha:.6}).moveTo(-30,-16).lineTo(-20,-16).moveTo(20,-16).lineTo(30,-16).stroke({color:V.cyan,width:2})
  const cannon=new Container(); cannon.position.set(28,-46)
  const mount=new Graphics().circle(0,0,17).fill({color:V.panel2}).stroke({color:V.cyan,width:2})
  const barrel=new Graphics().roundRect(5,-7,66,14,7).fill({color:V.panel2}).stroke({color:V.cyan,width:2}).roundRect(58,-10,20,20,5).fill({color:V.cyan})
  cannon.addChild(mount,barrel)
  const antennaLights=[-34,0,34].map((x)=>{const g=new Graphics().circle(x,-66,4).fill({color:V.green});root.addChild(g);return g})
  const antenna=new Graphics().moveTo(-34,-62).lineTo(-34,-47).moveTo(0,-62).lineTo(0,-52).moveTo(34,-62).lineTo(34,-47).stroke({color:V.dim,width:2})
  const integrity=new Graphics();integrity.y=70
  root.addChild(shadow,bunker,armor,keyboard,core,ring,antenna,cannon,integrity)
  return {root,cannon,barrel,core,ring,integrity,antennaLights}
}

function label(text:string,color:number,size=28){const t=new Text({text,style:{fill:color,fontFamily:"JetBrains Mono",fontSize:size,fontWeight:"700",dropShadow:{color:0x000000,alpha:.8,blur:3,distance:2}}});t.anchor.set(.5);return t}

export function createEnemy(stage:StageType,wordText:string):EnemyArt {
  const root=new Container(),body=new Container(),hitLayer=new Graphics(),thrusters:Graphics[]=[]
  const shadow=new Graphics().ellipse(0,48,78,14).fill({color:0x000000,alpha:.35});body.addChild(shadow)
  let eye:Graphics,ringA:Graphics|undefined,ringB:Graphics|undefined
  if(stage==="glitch"){
    const shell=new Graphics().moveTo(0,-60).lineTo(58,-30).lineTo(70,28).lineTo(0,62).lineTo(-70,28).lineTo(-58,-30).closePath().fill({color:0x24141b}).stroke({color:V.red,width:4})
    const inner=new Graphics().moveTo(0,-38).lineTo(38,-18).lineTo(44,20).lineTo(0,42).lineTo(-44,20).lineTo(-38,-18).closePath().fill({color:V.panel2}).stroke({color:V.violet,width:2})
    ringA=new Graphics().circle(0,0,78).stroke({color:V.red,width:3,alpha:.65}).moveTo(-90,0).lineTo(-70,0).moveTo(70,0).lineTo(90,0).stroke({color:V.red,width:3})
    ringB=new Graphics().circle(0,0,91).stroke({color:V.violet,width:2,alpha:.45})
    const claws=new Graphics();for(const a of [-2.35,-.78,.78,2.35]){const x=Math.cos(a)*70,y=Math.sin(a)*54;claws.moveTo(x,y).lineTo(x+Math.cos(a)*28,y+Math.sin(a)*28).lineTo(x+Math.cos(a+.45)*18,y+Math.sin(a+.45)*18).stroke({color:V.red,width:5})}
    eye=new Graphics().circle(0,0,18).fill({color:V.red,alpha:.22}).circle(0,0,9).fill({color:V.red}).circle(3,-3,3).fill({color:V.text})
    body.addChild(ringB,ringA,shell,inner,claws,eye)
  }else if(stage==="rush"){
    const ship=new Graphics().moveTo(72,0).lineTo(20,-34).lineTo(-58,-28).lineTo(-34,0).lineTo(-58,28).lineTo(20,34).closePath().fill({color:V.panel2}).stroke({color:V.pink,width:3})
    const wings=new Graphics().moveTo(12,-27).lineTo(-22,-58).lineTo(-42,-25).moveTo(12,27).lineTo(-22,58).lineTo(-42,25).fill({color:0x291426}).stroke({color:V.pink,width:2})
    eye=new Graphics().moveTo(36,-7).lineTo(52,0).lineTo(36,7).closePath().fill({color:V.cyan})
    for(const y of [-18,0,18]){const t=new Graphics().moveTo(-58,y-5).lineTo(-88,y).lineTo(-58,y+5).closePath().fill({color:V.pink,alpha:.75});thrusters.push(t)}
    body.addChild(...thrusters,wings,ship,eye)
  }else{
    const shell=new Graphics().moveTo(0,-48).lineTo(58,-14).lineTo(50,32).lineTo(0,50).lineTo(-50,32).lineTo(-58,-14).closePath().fill({color:V.panel2}).stroke({color:V.green,width:3})
    const fins=new Graphics().moveTo(-42,-20).lineTo(-76,-45).lineTo(-62,0).moveTo(-42,20).lineTo(-76,45).lineTo(-62,0).fill({color:0x10251c}).stroke({color:V.green,width:2})
    eye=new Graphics().roundRect(12,-9,28,18,8).fill({color:V.cyan,alpha:.25}).circle(27,0,6).fill({color:V.cyan})
    for(const y of [-17,17]){const t=new Graphics().moveTo(-58,y-6).lineTo(-84,y).lineTo(-58,y+6).closePath().fill({color:V.green,alpha:.7});thrusters.push(t)}
    body.addChild(...thrusters,fins,shell,eye)
  }
  hitLayer.circle(0,0,74).fill({color:0xffffff});hitLayer.alpha=0;body.addChild(hitLayer)
  const word=label(wordText,stage==="glitch"?V.red:stage==="rush"?V.pink:V.green);word.y=-86
  const hp=new Graphics();hp.y=68
  root.addChild(body,word,hp)
  return {root,body,hitLayer,eye,thrusters,ringA,ringB,word,hp}
}

export function createBackground(){
  const root=new Container(),stars=new Container(),grid=new Graphics(),lanes=new Graphics(),scanlines=new Graphics(),vignette=new Graphics()
  for(let i=0;i<90;i++){const star=new Graphics().circle(0,0,i%11===0?1.5:1).fill({color:i%7===0?V.cyan:V.text,alpha:.18+(i%5)*.08});star.position.set((i*97)%1600,(i*53)%900);stars.addChild(star)}
  const title=new Text({text:"TYPECADE DEFENSE NETWORK",style:{fill:V.dim,fontFamily:"JetBrains Mono",fontSize:11,letterSpacing:2}});title.position.set(18,16)
  root.addChild(stars,grid,lanes,scanlines,vignette,title)
  return {root,stars,grid,lanes,scanlines,vignette,redraw:(w:number,h:number)=>{
    grid.clear();const horizon=h*.68;for(let i=0;i<=12;i++){const x=w*i/12;grid.moveTo(w/2,horizon).lineTo(x,h).stroke({color:V.cyan,width:1,alpha:.08})}for(let i=0;i<7;i++){const y=horizon+(h-horizon)*(i/6)**1.7;grid.moveTo(0,y).lineTo(w,y).stroke({color:V.cyan,width:1,alpha:.07})}
    lanes.clear();for(const y of [.35,.5,.65])lanes.moveTo(w*.18,h*y).lineTo(w*.96,h*y).stroke({color:V.line,width:1,alpha:.5})
    scanlines.clear();for(let y=0;y<h;y+=5)scanlines.rect(0,y,w,1).fill({color:0xffffff,alpha:.012})
    vignette.clear().rect(0,0,w,h).stroke({color:V.bg,width:50,alpha:.65})
  }}
}
