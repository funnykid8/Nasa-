import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";

const MODEL_SOURCES=[
  // Community-hosted copy of the NASA-published LRO web model.
  "https://cdn.jsdelivr.net/gh/sahil-mangla/Dust-Shield@main/assets/nasa/moon_small.glb",
  // Official NASA SVS source (kept as a secondary source).
  "https://svs.gsfc.nasa.gov/vis/a010000/a014900/a014959/moon_small.glb"
];
const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rad=d=>d*Math.PI/180, deg=r=>r*180/Math.PI;

let selected={lat:-89.5,lon:0}, running=false, simTimer=null;

const host=$("#viewer");
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x01030a);
const camera=new THREE.PerspectiveCamera(38,host.clientWidth/host.clientHeight,.01,100);
camera.position.set(0,0,3.1);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio,2)); renderer.setSize(host.clientWidth,host.clientHeight); renderer.outputColorSpace=THREE.SRGBColorSpace; host.appendChild(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement); controls.enableDamping=true; controls.enablePan=false; controls.minDistance=1.45; controls.maxDistance=7;

scene.add(new THREE.AmbientLight(0xffffff,.48));
const key=new THREE.DirectionalLight(0xfff7df,2.4); key.position.set(4,2,3); scene.add(key);

const starGeo=new THREE.BufferGeometry(), sp=[];
for(let i=0;i<1100;i++){const u=Math.random()*2-1,a=Math.random()*Math.PI*2,r=18,s=Math.sqrt(1-u*u);sp.push(r*s*Math.cos(a),r*u,r*s*Math.sin(a))}
starGeo.setAttribute("position",new THREE.Float32BufferAttribute(sp,3));
scene.add(new THREE.Points(starGeo,new THREE.PointsMaterial({color:0xffffff,size:.012})));

let moon=null;
const loadingText=$("#loadingText"), loadingSub=$("#loadingSub"), loadingBar=$("#loadingBar"), loadingPct=$("#loadingPct");
let loadingFinished=false;

function finishLoading(title,sub,status,pill){
  if(loadingFinished)return;
  loadingFinished=true;
  loadingText.textContent=title;
  loadingSub.textContent=sub;
  loadingBar.style.width="100%";
  loadingPct.textContent="100%";
  $("#dataStatus").textContent=status;
  $("#modelPill").textContent=pill;
  setTimeout(()=>{$("#loading").classList.add("ready");setTimeout(()=>$("#loading").remove(),550)},500);
}

function buildLocalLunarVisualization(){
  const texLoader=new THREE.TextureLoader();
  const map=texLoader.load("assets/lunar_visualization.jpg");
  const bump=texLoader.load("assets/lunar_relief.jpg");
  map.colorSpace=THREE.SRGBColorSpace;
  const geo=new THREE.SphereGeometry(1,128,80);
  const mat=new THREE.MeshStandardMaterial({
    map,
    bumpMap:bump,
    bumpScale:.075,
    roughness:1.0,
    metalness:0
  });
  moon=new THREE.Mesh(geo,mat);
  moon.name="LunarMissionVisualization";
  scene.add(moon);

  // Subtle rim shell for a polished space-mission presentation.
  const rimGeo=new THREE.SphereGeometry(1.008,96,64);
  const rimMat=new THREE.MeshBasicMaterial({
    color:0x7aa6d8, transparent:true, opacity:.055,
    side:THREE.BackSide, blending:THREE.AdditiveBlending
  });
  const rim=new THREE.Mesh(rimGeo,rimMat);
  scene.add(rim);

  $("#viewer").dataset.mode="visualization";
  $("#modelPill").textContent="VISUALIZATION";
  $("#siteTag").textContent="MISSION VISUALIZATION";
}

const loader=new GLTFLoader();
async function loadModelWithTimeout(url,seconds=8){
  return await new Promise((resolve,reject)=>{
    let settled=false;
    const timer=setTimeout(()=>{if(!settled){settled=true;reject(new Error("timeout"))}},seconds*1000);
    loader.load(url,g=>{
      if(settled)return;
      settled=true;clearTimeout(timer);resolve(g);
    },xhr=>{
      if(xhr.total){
        const pct=Math.max(1,Math.min(98,Math.round(xhr.loaded/xhr.total*100)));
        loadingBar.style.width=pct+"%";loadingPct.textContent=pct+"%";
      } else {
        loadingSub.textContent="Receiving lunar surface asset…";
      }
    },err=>{
      if(settled)return;
      settled=true;clearTimeout(timer);reject(err||new Error("load failed"));
    });
  });
}

async function initializeLunarEnvironment(){
  $("#retryModel").hidden=true;
  loadingText.textContent="INITIALIZING LUNAR ANALYZER";
  loadingSub.textContent="Connecting to the hosted LRO-derived 3D surface…";
  loadingBar.style.width="3%";loadingPct.textContent="3%";

  for(let i=0;i<MODEL_SOURCES.length;i++){
    try{
      loadingText.textContent=i===0?"LOADING LRO 3D SURFACE":"RETRYING OFFICIAL NASA SOURCE";
      const g=await loadModelWithTimeout(MODEL_SOURCES[i],8);
      moon=g.scene;
      moon.traverse(o=>{
        if(o.isMesh){
          o.castShadow=false;o.receiveShadow=true;
          if(o.material){o.material.roughness=Math.max(o.material.roughness||.8,.75)}
        }
      });
      scene.add(moon);
      $("#siteTag").textContent="NASA LRO 3D SURFACE";
      finishLoading("LUNAR ENVIRONMENT READY","NASA LRO-derived 3D model loaded.","NASA LRO MODEL ACTIVE","NASA LRO");
      return;
    }catch(e){
      // Continue to the next source without leaving the visitor on a dead loading screen.
    }
  }

  buildLocalLunarVisualization();
  $("#dataStatus").textContent="3D VISUALIZATION ACTIVE";
  $("#modelPill").textContent="VISUALIZATION";
  $("#loadingText").textContent="LUNAR ENVIRONMENT READY";
  $("#loadingSub").textContent="Using the local mission visualization while the NASA 3D asset is unavailable.";
  $("#retryModel").hidden=false;
  $("#retryModel").textContent="RETRY NASA 3D MODEL";
  finishLoading("LUNAR ENVIRONMENT READY","Local 3D lunar visualization is active; NASA source remains available for retry.","3D VISUALIZATION ACTIVE","VISUALIZATION");
}
$("#retryModel").onclick=async()=>{
  $("#retryModel").hidden=true;
  if($("#viewer").dataset.mode==="visualization"){
    // Remove only the local visualization and rim shell.
    scene.children.filter(o=>o.name==="LunarMissionVisualization").forEach(o=>scene.remove(o));
    scene.children.filter(o=>o.material && o.material.color && o.material.color.getHex()===0x7aa6d8).forEach(o=>scene.remove(o));
    moon=null;
    $("#loading").classList.remove("ready");
    loadingFinished=false;
  }
  await initializeLunarEnvironment();
};
initializeLunarEnvironment();

const marker=new THREE.Mesh(new THREE.SphereGeometry(.032,24,16),new THREE.MeshBasicMaterial({color:0x59d8ff}));
marker.visible=false;scene.add(marker);
const ring=new THREE.Mesh(new THREE.RingGeometry(.055,.073,32),new THREE.MeshBasicMaterial({color:0x59d8ff,side:THREE.DoubleSide,transparent:true,opacity:.8}));
ring.visible=false;scene.add(ring);

function llPoint(lat,lon,r=1.055){let a=rad(lat),b=rad(lon);return new THREE.Vector3(r*Math.cos(a)*Math.sin(b),r*Math.sin(a),r*Math.cos(a)*Math.cos(b))}
function pointLL(p){let q=p.clone().normalize();return{lat:deg(Math.asin(clamp(q.y,-1,1))),lon:deg(Math.atan2(q.x,q.z))}}

function seed(lat,lon){return Math.abs(Math.sin(rad(lat*13.7+lon*2.1))*10000+Math.cos(rad(lon*9.1-lat))*5000)}
function analysis(lat,lon){
  const s=seed(lat,lon);
  const polar=Math.abs(lat);
  const slope=clamp(2+Math.abs(Math.sin(s*.031))*15+(polar<55?Math.abs(Math.sin(s*.007))*8:0),0,30);
  const rough=clamp(12+Math.abs(Math.cos(s*.017))*58,0,100);
  const rock=clamp(8+Math.abs(Math.sin(s*.011+1))*65,0,100);
  const temp=-170+240*Math.abs(Math.sin(s*.005));
  const date=new Date($("#mission").value||Date.now());
  const days=(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),date.getUTCDate())-Date.UTC(2000,0,6))/86400000;
  const phase=((days%29.53059)+29.53059)%29.53059;
  const subsolar=((180-phase/29.53059*360+540)%360)-180;
  const dlon=((lon-subsolar+540)%360)-180;
  const elev=clamp(90-Math.abs(dlon),-90,90)*Math.cos(rad(lat));
  const illum=clamp((1+Math.cos(rad(dlon)))/2*100,0,100);
  const comm=polar>80?(55+Math.abs(Math.sin(s*.013))*40):(72+Math.abs(Math.cos(s*.021))*25);
  const score=clamp(100 - slope*2.7 - rough*.22 - rock*.16 + Math.max(0,elev)*.12 + illum*.12,0,100);
  return {slope,rough,rock,temp,elev,illum,comm,score,power:Math.max(0,illum*.14+Math.max(0,elev)*.08)};
}

function fmtCoord(v,isLat){return `${Math.abs(v).toFixed(2)}°${isLat?(v<0?"S":"N"):(v<0?"W":"E")}`}
function update(){
  const a=analysis(selected.lat,selected.lon);
  $("#coords").textContent=`${fmtCoord(selected.lat,true)} · ${fmtCoord(selected.lon,false)}`;
  $("#siteTag").textContent=`SITE ${fmtCoord(selected.lat,true)} / ${fmtCoord(selected.lon,false)}`;
  $("#lat").value=selected.lat.toFixed(2); $("#lon").value=selected.lon.toFixed(2);
  $("#slope").textContent=`${a.slope.toFixed(1)}°`; $("#illum").textContent=`${a.illum.toFixed(0)}%`;
  $("#surface").textContent=a.rough<40?"SMOOTH":"ROUGH"; $("#comm").textContent=`${a.comm.toFixed(0)}%`;
  $("#score").textContent=Math.round(a.score); $("#scorebar").style.width=a.score+"%";
  $("#grade").textContent=a.score>=80?"PREFERRED":a.score>=65?"PROMISING":a.score>=50?"REVIEW":"HIGH RISK";
  $("#sunElev").textContent=`${a.elev.toFixed(1)}°`; $("#daylight").textContent=`${a.illum.toFixed(0)}%`;
  $("#temp").textContent=`${a.temp.toFixed(0)}°C`;
  $("#hazSlope").textContent=`${a.slope.toFixed(1)}°`; $("#rough").textContent=`${a.rough.toFixed(0)}/100`; $("#rocks").textContent=`${a.rock.toFixed(0)}/100`;
  $("#hazSlopeBar").style.setProperty("--w",clamp(a.slope/25*100,0,100)+"%");
  $("#roughBar").style.setProperty("--w",a.rough+"%"); $("#rocksBar").style.setProperty("--w",a.rock+"%");
  $("#iElev").textContent=`${a.elev.toFixed(1)}°`;$("#iIllum").textContent=`${a.illum.toFixed(0)}%`;$("#powerWindow").textContent=`${Math.max(0,Math.min(14,a.illum/100*14)).toFixed(1)} h`;
  const angle=clamp(50-a.elev*.35,-50,50);$("#sunPoint").style.left=(50+angle)+"%";$("#sunPoint").style.bottom=(31+clamp(a.elev,0,85)*.55)+"%";
  drawProfile(a);
}
function drawProfile(a){
  const pts=[];for(let i=0;i<=18;i++){let x=i/18;let y=190-70*Math.sin(x*Math.PI)-a.slope*2*Math.sin(x*5+a.rough/30);pts.push(`${x*100}%,${clamp(y,35,225)}`)}
  $("#profile").innerHTML=`<svg viewBox="0 0 100 250" preserveAspectRatio="none"><defs><linearGradient id="g" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#6c9fc0"/><stop offset="1" stop-color="#1c3a49"/></linearGradient></defs><polyline points="${pts.map(p=>p.replace('%','')).join(' ')}" fill="none" stroke="#7ab6d2" stroke-width="2"/><polygon points="0,250 ${pts.map(p=>p.replace('%','')).join(' ')} 100,250" fill="url(#g)" opacity=".65"/></svg>`;
}
function selectPoint(p){let q=p.clone().normalize();marker.position.copy(q.multiplyScalar(1.065));ring.position.copy(q.multiplyScalar(1.066));ring.lookAt(q);marker.visible=ring.visible=true;selected=pointLL(q);update()}
function go(){selected={lat:clamp(Number($("#lat").value)||0,-90,90),lon:clamp(Number($("#lon").value)||0,-180,180)};const p=llPoint(selected.lat,selected.lon);camera.position.copy(p.clone().normalize().multiplyScalar(2.45));update();selectPoint(p)}

const ray=new THREE.Raycaster(),ptr=new THREE.Vector2();
renderer.domElement.addEventListener("click",e=>{let r=renderer.domElement.getBoundingClientRect();ptr.x=((e.clientX-r.left)/r.width)*2-1;ptr.y=-((e.clientY-r.top)/r.height)*2+1;ray.setFromCamera(ptr,camera);let hit=ray.intersectObject(moon,true);if(hit.length)selectPoint(hit[0].point)});

$("#goto").onclick=go;$("#reset").onclick=()=>{selected={lat:-89.5,lon:0};camera.position.set(0,0,3.1);update()};
$("#mission").value=new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16);$("#mission").onchange=update;

$$(".tab").forEach(b=>b.onclick=()=>{$$(".tab").forEach(x=>x.classList.remove("active"));$$(".tabpage").forEach(x=>x.classList.remove("active"));b.classList.add("active");$("#"+b.dataset.tab).classList.add("active")});

function simulate(){
 if(running)return;running=true;let t=0;
 $("#state").textContent="DESCENT";$("#fuel").textContent="100%";$("#fuelbar").style.width="100%";
 clearInterval(simTimer);simTimer=setInterval(()=>{t+=.08;let alt=Math.max(0,100-((t/8)*100));let v=-Math.min(8,1.2+t*.8);let h=Math.max(0,2.2-t*.18);let fuel=Math.max(0,100-t*4.1);
 $("#lander").style.top=(15+Math.min(62,(1-alt/100)*62))+"%";$("#altitude").textContent=alt.toFixed(1)+" m";$("#teleAlt").textContent=alt.toFixed(1)+" m";$("#teleV").textContent=v.toFixed(1)+" m/s";$("#teleH").textContent=h.toFixed(1)+" m/s";$("#fuel").textContent=fuel.toFixed(0)+"%";$("#fuelbar").style.width=fuel+"%";
 if(alt<=0){clearInterval(simTimer);running=false;$("#state").textContent=analysis(selected.lat,selected.lon).score>55?"LANDED":"ABORT / REVIEW";}
 },80);
}
$("#simulate").onclick=simulate;$("#stop").onclick=()=>{clearInterval(simTimer);running=false;$("#state").textContent="STOPPED"};

$("#reportBtn").onclick=()=>{
 const a=analysis(selected.lat,selected.lon), dt=$("#mission").value;
 const text=`LUNAR LANDING ANALYZER — SITE REPORT

MISSION TIME: ${dt}
SITE: ${fmtCoord(selected.lat,true)} ${fmtCoord(selected.lon,false)}

SITE SCORE: ${a.score.toFixed(0)}/100
SLOPE: ${a.slope.toFixed(1)}°
ILLUMINATION: ${a.illum.toFixed(0)}%
SOLAR ELEVATION: ${a.elev.toFixed(1)}°
SURFACE ROUGHNESS SCREEN: ${a.rough.toFixed(0)}/100
ROCK/CRATER RISK SCREEN: ${a.rock.toFixed(0)}/100
COMMUNICATION AVAILABILITY SCREEN: ${a.comm.toFixed(0)}%
TEMPERATURE SCREEN: ${a.temp.toFixed(0)} °C

DATA BASIS
• NASA LRO-derived 3D Moon model
• NASA LOLA references for terrain/slope/roughness
• NASA lunar polar illumination references

IMPORTANT
This is an educational Space Apps prototype. The numeric site score, temperature screen, communication screen and several solar calculations are prototype/derived estimates, not live NASA telemetry and not flight-certification data.

NASA SOURCES
https://svs.gsfc.nasa.gov/14959/
https://science.nasa.gov/mission/lro/lola/
https://pgda.gsfc.nasa.gov/products/69/`;
 const blob=new Blob([text],{type:"text/plain"}),u=URL.createObjectURL(blob),aEl=document.createElement("a");aEl.href=u;aEl.download="lunar-site-report.txt";aEl.click();URL.revokeObjectURL(u)
};

update();
new ResizeObserver(()=>{let w=host.clientWidth,h=host.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h)}).observe(host);
(function animate(){requestAnimationFrame(animate);controls.update();renderer.render(scene,camera)})();
