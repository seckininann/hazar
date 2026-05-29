import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Bookmark, Play, SkipForward, Music2, ChevronLeft, Sparkles, Star } from 'lucide-react'
import { useAppState } from '../../store/appState.jsx'
import HeartEmitter from '../memory/HeartEmitter.jsx'
import { fetchLoveMessages, fetchCoverTitle } from '../../lib/contentService.js'

const LS_TITLE_KEY    = 'hazar_cover_title'
const LS_MESSAGES_KEY = 'hazar_love_messages'
const TRACKS = [
  { src: '/audio/music1.mp3', title: 'Seninle' },
  { src: '/audio/music2.mp3', title: 'Her Zaman' },
  { src: '/audio/music3.mp3', title: 'Sonsuzluk' },
]
const DEFAULT_MSGS = [
  { id: 'm1', text: 'Seninle her an güzel', sub: 'her zaman, her yerde' },
  { id: 'm2', text: 'Dünyanın en tatlı insanısın', sub: 'sadece sen biliyorsun' },
  { id: 'm3', text: 'Seni çok seviyorum', sub: 'kalbimin derinliklerinden' },
  { id: 'm4', text: 'Yanında olmak yeter', sub: 'başka hiçbir şeye gerek yok' },
  { id: 'm5', text: 'Bir ömür yetmez', sub: 'hep daha fazlasını isterim' },
]
function loadMsgs() {
  try {
    const s = localStorage.getItem(LS_MESSAGES_KEY)
    const a = s ? JSON.parse(s) : null
    return Array.isArray(a) && a.length > 0 ? a : DEFAULT_MSGS
  } catch { return DEFAULT_MSGS }
}
function getSrc(p) { return p?.src || p?.url || p?.dataUrl || '' }

const CSS = `
*,*::before,*::after{-webkit-tap-highlight-color:transparent;box-sizing:border-box}
html,body{overscroll-behavior:none}
@keyframes eq{0%,100%{height:30%}50%{height:100%}}
@keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}
@keyframes twinkle{0%,100%{opacity:.1;transform:scale(1)}50%{opacity:.5;transform:scale(1.4)}}
@keyframes shimmer{0%{background-position:-200% center}100%{background-position:200% center}}
@keyframes drift{0%,100%{transform:translate(0,0)}33%{transform:translate(4px,-8px)}66%{transform:translate(-5px,4px)}}
`

// Swipe thresholds — favor vertical a bit to make down/up easier
const SWIPE = {
  LOCK_PX: 6,
  VERT_BIAS: 0.72,
  THR_H: 36,
  THR_V: 24,
  MUSIC_H: 90,
}

const STARS = Array.from({length:14},(_, i)=>({
  id:i, size:1+(i%3)*.7, top:(i*17+5)%100, left:(i*23+7)%100,
  dur:2.4+(i%5)*.7, del:(i%7)*.55,
}))
function StarBg(){
  return(
    <div style={{position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden',zIndex:0}}>
      {STARS.map(s=>(
        <div key={s.id} style={{
          position:'absolute',borderRadius:'50%',background:'#fff',
          width:s.size,height:s.size,top:`${s.top}%`,left:`${s.left}%`,
          animation:`twinkle ${s.dur}s ${s.del}s ease-in-out infinite`,
        }}/>
      ))}
    </div>
  )
}

const TICKER=['her zaman böyle mutlu olalım','✦','seninle her an güzel','✦','bir ömrü yeter','✦','dünya senin için döner','✦']

// ─── Hero ─────────────────────────────────────────────────────────────────────
function HeroSlide({title}){
  return(
    <div style={{position:'absolute',inset:0,overflow:'hidden'}}>
      <img src="/assets/couple.jpg" alt="" style={{
        position:'absolute',inset:0,width:'100%',height:'100%',
        objectFit:'cover',filter:'brightness(.46) saturate(1.15)',
      }}/>
      <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(0,0,0,.85) 0%,rgba(0,0,0,.08) 50%,rgba(0,0,0,.28) 100%)',pointerEvents:'none'}}/>

      {/* Text — bottom */}
      <div style={{position:'absolute',left:0,right:0,bottom:145,textAlign:'center',padding:'0 28px',zIndex:2}}>
        <p style={{color:'rgba(255,255,255,.26)',fontSize:10,letterSpacing:'0.24em',textTransform:'uppercase',marginBottom:14}}>{title}</p>
        <h1 style={{margin:0,fontWeight:700,color:'rgba(255,255,255,.88)',lineHeight:1.25,fontSize:'clamp(1.5rem,6vw,2.3rem)',textShadow:'0 2px 28px rgba(0,0,0,.9)'}}>
          Dünya yıkılsa da<br/>
          <span style={{
            background:'linear-gradient(120deg,#f9d4a8,#f4b8cc,#c8b4f5,#f4b8cc,#f9d4a8)',
            backgroundSize:'200% auto',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',
            animation:'shimmer 4s linear infinite',
          }}>biz ayrılamayız</span>
        </h1>
      </div>

      {/* Ticker */}
      <div style={{position:'absolute',overflow:'hidden',width:'100%',bottom:130,height:17,pointerEvents:'none'}}>
        <div style={{display:'flex',alignItems:'center',whiteSpace:'nowrap',gap:32,animation:'ticker 28s linear infinite',width:'max-content'}}>
          {[...TICKER,...TICKER].map((w,j)=>(
            <span key={j} style={{fontStyle:'italic',fontSize:11,letterSpacing:'.05em',color:w==='✦'?'rgba(244,184,204,.4)':'rgba(255,255,255,.2)'}}>{w}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Photo card ───────────────────────────────────────────────────────────────
function PhotoCard({photo}){
  const [liked,setLiked]=useState(false)
  const [saved,setSaved]=useState(false)
  const [burst,setBurst]=useState([])
  const lastTap=useRef(0)
  const src=getSrc(photo)

  const handleTap=(e)=>{
    const now=Date.now()
    if(now-lastTap.current<350){
      setLiked(true)
      const rect=e.currentTarget.getBoundingClientRect()
      const cx=(e.changedTouches?.[0]?.clientX??e.clientX)-rect.left
      const cy=(e.changedTouches?.[0]?.clientY??e.clientY)-rect.top
      setBurst(b=>[...b,{id:now,cx,cy}])
      setTimeout(()=>setBurst(b=>b.filter(x=>x.id!==now)),900)
    }
    lastTap.current=now
  }

  return(
    <div style={{
      width:'100%',maxWidth:'min(calc(100vw - 32px),380px)',
      borderRadius:22,overflow:'hidden',
      background:'rgba(20,19,30,.97)',border:'1px solid rgba(255,255,255,.07)',
      boxShadow:'0 16px 48px rgba(0,0,0,.6)',
    }}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',gap:11,padding:'11px 14px'}}>
        <div style={{width:30,height:30,borderRadius:'50%',overflow:'hidden',flexShrink:0,border:'1.5px solid rgba(212,160,122,.35)'}}>
          <img src="/assets/couple.jpg" alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <p style={{color:'rgba(255,255,255,.88)',fontSize:13,fontWeight:600,lineHeight:1,marginBottom:2}}>Hazar &amp; Eda</p>
          {photo.date&&<p style={{color:'rgba(255,255,255,.26)',fontSize:10.5}}>{photo.date}</p>}
        </div>
        <Sparkles size={12} style={{color:'rgba(212,160,122,.3)',flexShrink:0}}/>
      </div>

      {/* Image */}
      <div style={{position:'relative',aspectRatio:'1/1',overflow:'hidden',userSelect:'none'}}
        onTouchEnd={handleTap} onClick={handleTap}>
        {src
          ?<img src={src} alt={photo.caption||''} draggable={false} style={{width:'100%',height:'100%',objectFit:'cover',pointerEvents:'none'}}/>
          :<div style={{width:'100%',height:'100%',background:'rgba(255,255,255,.03)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <span style={{color:'rgba(255,255,255,.18)',fontSize:12}}>Fotoğraf yok</span>
          </div>}
        <AnimatePresence>
          {burst.map(h=>(
            <motion.div key={h.id} style={{position:'absolute',left:h.cx-28,top:h.cy-28,pointerEvents:'none'}}
              initial={{scale:0,opacity:1}} animate={{scale:[0,1.5,1],opacity:[1,1,0],y:-55}}
              transition={{duration:.85}}>
              <Heart size={56} fill="#e84393" color="#e84393" style={{filter:'drop-shadow(0 0 10px rgba(232,67,147,.7))'}}/>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div style={{padding:'11px 14px 14px'}}>
        <div style={{display:'flex',justifyContent:'space-between',marginBottom:photo.caption?10:0}}>
          <motion.button onClick={()=>setLiked(l=>!l)} whileTap={{scale:1.35}}
            transition={{type:'spring',stiffness:380,damping:14}}
            style={{background:'none',border:'none',cursor:'pointer',padding:0}}>
            <Heart size={22} fill={liked?'#e84393':'none'} color={liked?'#e84393':'rgba(255,255,255,.55)'}
              style={liked?{filter:'drop-shadow(0 0 5px rgba(232,67,147,.6))'}:{}}/>
          </motion.button>
          <motion.button onClick={()=>setSaved(s=>!s)} whileTap={{scale:1.2}}
            style={{background:'none',border:'none',cursor:'pointer',padding:0}}>
            <Bookmark size={20} fill={saved?'rgba(212,160,122,.9)':'none'} color={saved?'rgba(212,160,122,.9)':'rgba(255,255,255,.35)'}/>
          </motion.button>
        </div>
        {photo.caption&&(
          <p style={{color:'rgba(255,255,255,.68)',fontSize:13,lineHeight:1.5,margin:0}}>
            <span style={{color:'rgba(255,255,255,.88)',fontWeight:600,marginRight:5}}>hazar</span>
            {photo.caption}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Love slide — pure CSS transition, zero JS animation cost ────────────────
const DECOS=['✦','◈','❋','✧','⟡']
function LoveSlide({msgs,idx,visible}){
  const msg=msgs[idx%msgs.length]
  return(
    <div style={{
      position:'absolute',inset:0,display:'flex',flexDirection:'column',
      alignItems:'center',justifyContent:'center',padding:'0 20px',paddingBottom:90,
      background:'linear-gradient(155deg,#0f0c1e,#160d22 45%,#0c0b14)',
      zIndex:58,pointerEvents:visible?'auto':'none',
      transform:visible?'translateY(0)':'translateY(100%)',
      transition:'transform 0.38s cubic-bezier(0.22,1,0.36,1)',
      willChange:'transform',
    }}>
      <StarBg/>
      <div style={{position:'absolute',width:200,height:200,top:'8%',left:'2%',background:'radial-gradient(circle,rgba(212,160,122,.05),transparent 70%)',filter:'blur(45px)',animation:'drift 9s ease-in-out infinite',pointerEvents:'none'}}/>
      <div style={{position:'absolute',width:160,height:160,bottom:'10%',right:'3%',background:'radial-gradient(circle,rgba(180,130,250,.05),transparent 70%)',filter:'blur(40px)',animation:'drift 11s 2.5s ease-in-out infinite',pointerEvents:'none'}}/>

      {/* Vertical pager track */}
      <div style={{position:'absolute',inset:0,overflow:'hidden',zIndex:1}}>
        <div style={{
          height:'100%',
          display:'grid',
          gridAutoRows:'100%',
          transform:`translateY(-${(idx%msgs.length)*100}%)`,
          transition:'transform 0.38s cubic-bezier(0.22,1,0.36,1)',
          willChange:'transform',
        }}>
          {msgs.map((m,i)=>(
            <div key={m.id||i} style={{
              width:'100%',height:'100%',
              display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
              padding:'0 20px',paddingBottom:90,
            }}>
              <div style={{
                width:'100%',maxWidth:'min(calc(100vw - 40px),360px)',
                borderRadius:26,padding:'36px 24px',textAlign:'center',position:'relative',
                background:'rgba(18,16,28,.94)',border:'1px solid rgba(212,160,122,.08)',
                boxShadow:'0 24px 70px rgba(0,0,0,.55)',
                backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)'
              }}>
                <div style={{display:'flex',justifyContent:'center',gap:11,marginBottom:18}}>
                  {DECOS.map((d,j)=>(
                    <span key={j} style={{fontSize:j===2?16:10,color:j===2?'rgba(244,184,204,.55)':'rgba(212,160,122,.25)',animation:`drift ${3+j*.6}s ${j*.4}s ease-in-out infinite`}}>{d}</span>
                  ))}
                </div>
                <div style={{width:40,height:40,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px',background:'linear-gradient(135deg,rgba(212,160,122,.12),rgba(200,150,245,.08))',border:'1px solid rgba(212,160,122,.12)'}}>
                  <Heart size={18} fill="rgba(212,160,122,.75)" color="rgba(212,160,122,.75)"/>
                </div>
                <p style={{fontStyle:'italic',color:'rgba(255,255,255,.84)',lineHeight:1.55,marginBottom:18,fontSize:'clamp(1.05rem,4.5vw,1.28rem)'}}>
                  &ldquo;{m.text}&rdquo;
                </p>
                <div style={{width:44,height:1,margin:'0 auto 14px',background:'linear-gradient(90deg,transparent,rgba(212,160,122,.35),transparent)'}}/>
                <p style={{color:'rgba(255,255,255,.24)',fontSize:10.5,letterSpacing:'0.2em',textTransform:'uppercase'}}>{m.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {msgs.length>1&&(
        <div style={{display:'flex',gap:5,marginTop:18,position:'relative',zIndex:2,alignItems:'center'}}>
          {msgs.map((_,i)=>(
            <div key={i} style={{height:4,borderRadius:2,width:i===idx%msgs.length?14:4,background:i===idx%msgs.length?'rgba(200,168,242,.8)':'rgba(255,255,255,.14)',transition:'all .28s'}}/>
          ))}
        </div>
      )}

      {/* swipe up/down hint */}
      <p style={{marginTop:12,color:'rgba(255,255,255,.18)',fontSize:10.5,letterSpacing:'.12em',pointerEvents:'none'}}>↑ önceki · ↓ sonraki</p>
    </div>
  )
}

// ─── Music bar ────────────────────────────────────────────────────────────────
function MusicBar({playing,track,onToggle,onNext}){
  return(
    <div style={{
      position:'fixed',bottom:0,left:0,right:0,zIndex:50,
      paddingBottom:'env(safe-area-inset-bottom,0px)',
      background:'rgba(6,5,14,.97)',borderTop:'1px solid rgba(255,255,255,.05)',
      backdropFilter:'blur(24px)',WebkitBackdropFilter:'blur(24px)',
    }}>
      <div style={{display:'flex'}}>
        {TRACKS.map((t,i)=>(
          <button key={i} onClick={()=>onNext(i)} style={{
            flex:1,display:'flex',alignItems:'center',justifyContent:'center',
            paddingTop:7,paddingBottom:5,background:'none',cursor:'pointer',
            borderBottom:i===track?'2px solid rgba(212,160,122,.72)':'2px solid transparent',
          }}>
            <span style={{fontSize:11,fontWeight:500,whiteSpace:'nowrap',color:i===track?'rgba(255,255,255,.8)':'rgba(255,255,255,.22)'}}>{t.title}</span>
          </button>
        ))}
      </div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:22,paddingTop:7,paddingBottom:10}}>
        <Music2 size={12} style={{color:playing?'rgba(212,160,122,.6)':'rgba(255,255,255,.14)'}}/>
        <motion.button onClick={onToggle} whileTap={{scale:.84}} style={{
          width:34,height:34,borderRadius:11,display:'flex',alignItems:'center',justifyContent:'center',
          background:playing?'linear-gradient(135deg,rgba(212,160,122,.2),rgba(200,160,245,.14))':'rgba(255,255,255,.06)',
          border:playing?'1px solid rgba(212,160,122,.26)':'1px solid rgba(255,255,255,.05)',cursor:'pointer',flexShrink:0,
        }}>
          {playing
            ?<div style={{display:'flex',alignItems:'flex-end',justifyContent:'center',gap:2,width:12,height:12}}>
               {[0,1,2].map(j=><div key={j} style={{width:2,borderRadius:2,background:'rgba(212,160,122,.9)',animation:`eq .6s ${j*.13}s ease-in-out infinite`}}/>)}
             </div>
            :<Play size={11} fill="rgba(255,255,255,.7)" color="rgba(255,255,255,.7)" style={{marginLeft:1}}/>}
        </motion.button>
        <motion.button onClick={()=>onNext((track+1)%TRACKS.length)} whileTap={{scale:.85}}
          style={{background:'none',border:'none',cursor:'pointer',padding:0}}>
          <SkipForward size={13} style={{color:'rgba(255,255,255,.26)'}}/>
        </motion.button>
      </div>
    </div>
  )
}

// ─── Nav dots ─────────────────────────────────────────────────────────────────
function NavDots({total,col,row}){
  const n=Math.min(total,9)
  return(
    <div style={{
      position:'fixed',
      bottom:'calc(72px + env(safe-area-inset-bottom,0px) + 10px)',
      left:'50%',transform:'translateX(-50%)',
      zIndex:99,display:'flex',flexDirection:'column',alignItems:'center',gap:5,
      pointerEvents:'none',
    }}>
      <div style={{display:'flex',gap:5}}>
        {Array.from({length:n}).map((_,i)=>(
          <div key={i} style={{height:3.5,borderRadius:2,transition:'all .25s',width:i===col?12:4,background:i===col?(row===1?'rgba(200,168,242,.8)':'rgba(212,160,122,.8)'):'rgba(255,255,255,.14)'}}/>
        ))}
      </div>
      {total>1&&(
        <div style={{display:'flex',gap:4}}>
          {[0,1].map(r=>(
            <div key={r} style={{width:3.5,borderRadius:2,transition:'all .25s',height:r===row?10:3.5,background:r===row?'rgba(188,160,238,.5)':'rgba(255,255,255,.1)'}}/>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MemoryUniverse(){
  const {state,dispatch}=useAppState()
  const photos=state.photos||[]
  const [MSGS,setMSGS]=useState(DEFAULT_MSGS)
  const [coverTitle,setCoverTitle]=useState('Özelimiz')

  const colRef   = useRef(0)
  const rowRef   = useRef(0)
  const busyRef  = useRef(false)
  const tsRef    = useRef(null)   // {x, y, isVert?}
  const trackRef = useRef(null)   // horizontal slides container
  const totalR   = useRef(1)

  const [col,   setCol]     = useState(0)
  const [row,   setRow]     = useState(0)
  const [loveIdx,setLoveIdx]= useState(0)
  const [hint,  setHint]    = useState(true)
  const [music, setMusic]   = useState(false)
  const [ended, setEnded]   = useState(false)
  const [track, setTrack]   = useState(0)
  const [snapping,setSnapping]=useState(false)

  const audioRef   = useRef(null)
  const touchedRef = useRef(false)

  const totalCols  = 1+photos.length
  totalR.current   = totalCols
  const msgsLen    = MSGS.length

  useEffect(()=>{ colRef.current=col },[col])
  useEffect(()=>{ rowRef.current=row },[row])

  useEffect(()=>{
    const t=setTimeout(()=>setHint(false),5000)
    return()=>clearTimeout(t)
  },[])

  // Fetch dynamic content (messages + cover title) with LS fallback if API fails
  useEffect(()=>{
    let alive=true
    ;(async()=>{
      try{
        const [m,t]=await Promise.allSettled([fetchLoveMessages(),fetchCoverTitle()])
        if(!alive) return
        if(m.status==='fulfilled' && Array.isArray(m.value) && m.value.length>0) setMSGS(m.value)
        else setMSGS(loadMsgs())
        if(t.status==='fulfilled' && typeof t.value==='string' && t.value) setCoverTitle(t.value)
        else setCoverTitle(localStorage.getItem(LS_TITLE_KEY)||'Özelimiz')
      }catch{
        if(!alive) return
        setMSGS(loadMsgs())
        setCoverTitle(localStorage.getItem(LS_TITLE_KEY)||'Özelimiz')
      }
    })()
    return()=>{alive=false}
  },[])

  // Music
  useEffect(()=>{
    const audio=audioRef.current; if(!audio)return
    const onEnd=()=>{setMusic(false);setEnded(true)}
    audio.addEventListener('ended',onEnd)
    const autoT=setTimeout(()=>{
      if(touchedRef.current)return
      audio.play().then(()=>{setMusic(true);touchedRef.current=true}).catch(()=>{})
    },2800)
    const onFirst=()=>{
      if(touchedRef.current)return
      touchedRef.current=true;clearTimeout(autoT)
      audio.play().then(()=>setMusic(true)).catch(()=>{})
    }
    document.addEventListener('touchstart',onFirst,{once:true})
    document.addEventListener('click',onFirst,{once:true})
    return()=>{
      audio.removeEventListener('ended',onEnd);clearTimeout(autoT)
      document.removeEventListener('touchstart',onFirst)
      document.removeEventListener('click',onFirst)
    }
  },[])

  const toggleMusic=useCallback(()=>{
    const audio=audioRef.current;if(!audio)return
    touchedRef.current=true
    if(music){audio.pause();setMusic(false)}
    else{
      if(ended){audio.currentTime=0;setEnded(false)}
      audio.play().then(()=>setMusic(true)).catch(()=>{})
    }
  },[music,ended])

  const pickTrack=useCallback((i)=>{
    const audio=audioRef.current;if(!audio)return
    setTrack(i);setEnded(false)
    audio.src=TRACKS[i].src;audio.load()
    if(music)audio.play().catch(()=>{})
  },[music])

  // Navigate state (called after drag)
  const navigate=useCallback((dc,dr)=>{
    if(busyRef.current)return
    busyRef.current=true
    setTimeout(()=>{busyRef.current=false},360)
    const curCol=colRef.current
    const curRow=rowRef.current
    // Vertical first — global pager behavior
    if(dr!==0){
      if(curRow===1){
        if(dr>0){ // down → next message
          setLoveIdx(i=> Math.min(msgsLen-1, i+1))
        }else{    // up → prev message or close when at first
          setLoveIdx(i=>{
            if(i>0) return i-1
            rowRef.current=0; setRow(0)
            return 0
          })
        }
      } else {
        // row=0: open love and adjust global index based on direction
        rowRef.current=1; setRow(1)
        if(dr>0) setLoveIdx(i=> Math.min(msgsLen-1, i+1))
        else     setLoveIdx(i=> Math.max(0, i-1))
      }
    }

    // Horizontal — when love is open, close it and change column; when closed, just change column
    if(dc!==0){
      if(curRow===1){
        rowRef.current=0; setRow(0)
      }
      const baseCol = curRow===1 ? colRef.current : curCol
      const nc=Math.max(0,Math.min(totalR.current-1,baseCol+dc))
      if(nc!==colRef.current){ colRef.current=nc; setCol(nc) }
      setHint(false)
    }
  },[msgsLen])

  const logout=useCallback(()=>{
    const audio=audioRef.current
    if(audio){audio.pause();audio.currentTime=0}
    dispatch({type:'RESET_TO_INTRO'})
  },[dispatch])

  // ── LIVE DRAG — direct DOM, zero React re-renders during swipe ──
  const onTouchStart=useCallback((e)=>{
    // Ignore touches on fixed elements (music bar area)
    if(e.touches[0].clientY > window.innerHeight-SWIPE.MUSIC_H) return
    tsRef.current={x:e.touches[0].clientX, y:e.touches[0].clientY, locked:null}
  },[])

  const onTouchMove=useCallback((e)=>{
    const ts=tsRef.current
    if(!ts)return
    const dx=e.touches[0].clientX-ts.x
    const dy=e.touches[0].clientY-ts.y
    const ax=Math.abs(dx), ay=Math.abs(dy)

    // Lock after a few px with vertical bias (easier down/up)
    if(!ts.locked){
      if(ax<SWIPE.LOCK_PX && ay<SWIPE.LOCK_PX) return
      ts.locked = (ay > ax * SWIPE.VERT_BIAS) ? 'v' : 'h'
    }

    if(ts.locked==='h'){
      // Only live-drag the track when love slide is NOT open
      if(rowRef.current===0&&trackRef.current){
        const base=-colRef.current*window.innerWidth
        trackRef.current.style.transition='none'
        trackRef.current.style.transform=`translateX(${base+dx}px)`
      } else {
        // Love open: do not drag the track; prevent scroll bounce
        if(e.cancelable) e.preventDefault()
      }
    }
    // vertical drag handled on touchEnd
  },[])

  const onTouchEnd=useCallback((e)=>{
    const ts=tsRef.current
    if(!ts){return}
    const dx=e.changedTouches[0].clientX-ts.x
    const dy=e.changedTouches[0].clientY-ts.y
    const ax=Math.abs(dx),ay=Math.abs(dy)
    const locked=ts.locked
    tsRef.current=null

    if(!locked&&ax<10&&ay<10)return // tap, no swipe

    // Love open: allow horizontal to close Love and move column; else allow vertical messages
    if(rowRef.current===1){
      if(ax>SWIPE.THR_H && ax>=ay){ dx<0?navigate(1,0):navigate(-1,0); return }
      if(ay>SWIPE.THR_V){ dy<0?navigate(0,1):navigate(0,-1); return }
      return
    }

    const isVertical = locked==='v' || ay > ax*0.85
    if(!isVertical){
      // Snap back to correct column (only when love is closed)
      if(trackRef.current){
        trackRef.current.style.transition='transform 0.34s cubic-bezier(0.22,1,0.36,1)'
        trackRef.current.style.transform=`translateX(${-colRef.current*window.innerWidth}px)`
      }
      if(ax>SWIPE.THR_H){ dx<0?navigate(1,0):navigate(-1,0) }
    } else {
      if(ay>SWIPE.THR_V){ dy<0?navigate(0,1):navigate(0,-1) }
    }
  },[navigate])

  // Keep track transform in sync when col changes (after navigate)
  useEffect(()=>{
    if(!trackRef.current)return
    trackRef.current.style.transition='transform 0.34s cubic-bezier(0.22,1,0.36,1)'
    trackRef.current.style.transform=`translateX(${-col*window.innerWidth}px)`
  },[col])

  const visibleSet=useMemo(()=>{
    const s=new Set([0])
    for(let c=Math.max(1,col-1);c<=Math.min(totalCols-1,col+1);c++)s.add(c)
    return s
  },[col,totalCols])

  return(
    <div
      style={{position:'relative',width:'100%',height:'100%',overflow:'hidden',background:'#0c0b12',touchAction:'none',userSelect:'none'}}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <style>{CSS}</style>
      <audio ref={audioRef} src={TRACKS[0].src} preload="metadata"/>

      {/* ── Horizontal track — all slides in one translateX container ── */}
      <div ref={trackRef} style={{
        position:'absolute',top:0,bottom:0,
        width:`${totalCols*100}vw`,
        display:'flex',
        transform:`translateX(${-col*window.innerWidth}px)`,
        willChange:'transform',
      }}>
        {/* Hero */}
        <div style={{width:'100vw',height:'100%',flexShrink:0,position:'relative'}}>
          <HeroSlide title={coverTitle}/>
        </div>

        {/* Photos */}
        {photos.map((photo,i)=>{
          const c=i+1
          return(
            <div key={photo.id||i} style={{
              width:'100vw',height:'100%',flexShrink:0,
              display:'flex',alignItems:'center',justifyContent:'center',
              padding:'0 16px',paddingBottom:88,background:'#0c0b12',
            }}>
              {visibleSet.has(c) && <PhotoCard photo={photo}/>}
            </div>
          )
        })}
      </div>

      {/* ── Love messages ── */}
      <LoveSlide msgs={MSGS} idx={loveIdx} visible={row===1}/>

      {/* ── Back button ── */}
      <motion.button onClick={logout}
        initial={{opacity:0}} animate={{opacity:1}} transition={{delay:1.2}}
        whileTap={{scale:.9}}
        style={{
          position:'fixed',top:16,left:16,zIndex:200,
          display:'flex',alignItems:'center',gap:6,
          padding:'7px 12px',borderRadius:14,
          background:'rgba(0,0,0,.52)',border:'1px solid rgba(255,255,255,.07)',
          backdropFilter:'blur(14px)',WebkitBackdropFilter:'blur(14px)',
          cursor:'pointer',
        }}>
        <ChevronLeft size={13} style={{color:'rgba(255,255,255,.44)'}}/>
        <span style={{color:'rgba(255,255,255,.38)',fontSize:11.5,fontWeight:500}}>Çıkış</span>
      </motion.button>

      {/* ── Swipe hint ── */}
      <AnimatePresence>
        {hint&&col===0&&(
          <motion.div style={{
            position:'fixed',
            bottom:'calc(84px + env(safe-area-inset-bottom,0px) + 36px)',
            left:'50%',transform:'translateX(-50%)',zIndex:99,pointerEvents:'none',
            display:'flex',alignItems:'center',gap:7,padding:'8px 15px',borderRadius:14,
            background:'rgba(0,0,0,.58)',border:'1px solid rgba(255,255,255,.08)',
            backdropFilter:'blur(16px)',whiteSpace:'nowrap',
          }}
          initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}}
          transition={{delay:1}}>
            <Star size={10} style={{color:'rgba(212,160,122,.55)',flexShrink:0}}/>
            <span style={{color:'rgba(255,255,255,.45)',fontSize:11}}>Fotoğraflar → sola · Mesajlar ↓ aşağı</span>
          </motion.div>
        )}
      </AnimatePresence>

      <NavDots total={totalCols} col={col} row={row}/>
      <MusicBar playing={music} track={track} onToggle={toggleMusic} onNext={pickTrack}/>
      <HeartEmitter/>
    </div>
  )
}
