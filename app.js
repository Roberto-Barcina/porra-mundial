const URL =
"https://script.google.com/macros/s/AKfycbxqZCwui_7fF1GUXKN0JcgJM99heBV5dAyN0907JEdAkZaAxc0fifVBvzdPkqKkjTrS7Q/exec";

let state = JSON.parse(localStorage.getItem("state") || "{}");
let history = JSON.parse(localStorage.getItem("history") || "{}");
let last = null;

function save(){
    localStorage.setItem("state", JSON.stringify(state));
    localStorage.setItem("history", JSON.stringify(history));
}

function pushHistory(name, value){
    if(!history[name]) history[name] = [];
    history[name].push(value);
    if(history[name].length > 25) history[name].shift();
}

function rankClass(i){
    if(i===0) return "row first";
    if(i===1) return "row second";
    if(i===2) return "row third";
    return "row";
}

function motion(p){
    const old = state[p.Participante];
    if(old === undefined) return "";
    if(p.TotalPuntos > old) return "up";
    if(p.TotalPuntos < old) return "down";
    return "";
}

function renderBoard(data){
    const el = document.getElementById("board");
    el.innerHTML="";
    data.forEach((p,i)=>{
        const div = document.createElement("div");
        div.className = rankClass(i) + " " + motion(p);
        div.innerHTML = `
            <div>🏅 ${i+1}. ${p.Participante}</div>
            <div><b>${p.TotalPuntos}</b> pts</div>
        `;
        el.appendChild(div);
    });
}

function draw(canvas, points){
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0,0,w,h);
    if(points.length < 2) return;
    const max = Math.max(...points);
    const min = Math.min(...points);
    const range = max - min || 1;
    ctx.strokeStyle = "#4da3ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((v,i)=>{
        const x = (i/(points.length-1))*w;
        const y = h - ((v-min)/range)*h;
        if(i===0) ctx.moveTo(x,y);
        else ctx.lineTo(x,y);
    });
    ctx.stroke();
}

function renderCards(data){
    const el = document.getElementById("cards");
    el.innerHTML="";
    data.forEach(p=>{
        pushHistory(p.Participante, p.TotalPuntos);
        const div = document.createElement("div");
        div.className="card";
        div.innerHTML=`
            <h3>${p.Participante} — ${p.TotalPuntos} pts</h3>
            <div class="grid">
                <div class="box">
                    <h4>⚽ Equipos</h4>
                    <div>${p["Equipo 1"]||""}</div>
                    <div>${p["Equipo 2"]||""}</div>
                    <div>${p["Equipo 3"]||""}</div>
                    <div>${p["Equipo 4"]||""}</div>
                    <div>${p["Equipo 5"]||""}</div>
                </div>
                <div class="box">
                    <h4>⭐ Jugadores</h4>
                    <div>${p["Jugador 1"]||""}</div>
                    <div>${p["Jugador 2"]||""}</div>
                    <div>${p["Jugador 3"]||""}</div>
                    <div>${p["Jugador 4"]||""}</div>
                    <div>${p["Jugador 5"]||""}</div>
                </div>
            </div>
            <canvas></canvas>
        `;
        el.appendChild(div);
        const canvas = div.querySelector("canvas");
        canvas.width = canvas.offsetWidth;
        canvas.height = 100;
        draw(canvas, history[p.Participante] || []);
    });
}

function changed(data){
    if(!last) return true;
    return JSON.stringify(data) !== JSON.stringify(last);
}

async function load(){
    const r = await fetch(URL);
    const d = await r.json();
    const data = d.participantes;
    data.sort((a,b)=>b.TotalPuntos-a.TotalPuntos);

    // PODIO
    document.getElementById("gold").innerText = data[0].Participante;
    document.getElementById("silver").innerText = data[1].Participante;
    document.getElementById("bronze").innerText = data[2].Participante;

    if(!changed(data)) return;

    renderBoard(data);
    renderCards(data);

    data.forEach(p=>{
        state[p.Participante] = p.TotalPuntos;
    });

    last = JSON.parse(JSON.stringify(data));
    save();
}

load();
setInterval(load,10000);
