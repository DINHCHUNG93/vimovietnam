
// Dữ liệu lịch sử — TỰ TÍCH LŨY qua các tháng.
// Template DEMO bắt đầu TRỐNG đúng spec (xem SKILL.md "History rules").
// Khi skill chạy thật: data tự append vào history.json từ cache kỳ trước.
// → Mọi nút [📊] sẽ ẩn cho đến khi history đủ 6+ điểm (feature ngủ chờ data).
const history=/*__HISTORY__*/{series:{}};
const INDICATOR_LABELS={
  cpi_yoy_pct:'CPI YoY (%)',pmi:'PMI Sản xuất',iip_yoy_pct:'IIP YoY (%)',
  trade_balance:'Cán cân thương mại (tỷ USD)',exports:'Xuất khẩu (tỷ USD)',
  imports:'Nhập khẩu (tỷ USD)',fdi_disbursed:'FDI thực hiện (tỷ USD)',
  interbank_on:'Lãi suất LNH qua đêm (%)',fx_central:'Tỷ giá trung tâm (VND/USD)',
  vn_index:'VN-Index',gold:'Vàng thế giới (USD/oz)',oil_brent:'Dầu Brent (USD/thùng)',
  us_10y:'Lợi suất TP Mỹ 10 năm (%)'
};

// ⚠️ OFFLINE GUARD: nếu Chart.js CDN không load được (mất mạng) → KHÔNG chạy cấu hình
// top-level, nếu không toàn bộ script chết (ReferenceError) → nav/sparkline/gauge hỏng theo.
// Guard PHẢI đặt trước mọi tham chiếu Chart ở cấp cao nhất.
const HAS_CHART_LIB = typeof Chart !== 'undefined';
if (HAS_CHART_LIB) {
  Chart.defaults.color='#8b8ba7';
  Chart.defaults.font.family="'Inter',sans-serif";
  Chart.defaults.borderColor='rgba(139,92,246,0.08)';
}

let modalChart=null;
function openModal(key){
  const series=history.series[key]||[];
  const label=INDICATOR_LABELS[key]||key;
  document.getElementById('modalTitle').textContent=label+' — Dữ liệu lịch sử';
  document.getElementById('chartModal').classList.add('active');
  if(modalChart){modalChart.destroy();modalChart=null;}
  // Offline guard: nếu Chart.js CDN không load được → thông báo nhẹ, không crash
  if(!HAS_CHART_LIB){
    document.getElementById('modalChart').style.display='none';
    const note=document.createElement('div');
    note.style.cssText='color:var(--text-dim);font-size:13px;padding:20px;text-align:center';
    note.textContent='Không tải được thư viện biểu đồ (cần internet). Mở lại khi có mạng.';
    document.getElementById('modalChart').parentNode.appendChild(note);
    return;
  }
  document.getElementById('modalChart').style.display='block';
  const ctx=document.getElementById('modalChart').getContext('2d');
  const grad=ctx.createLinearGradient(0,0,0,280);
  grad.addColorStop(0,'rgba(236,72,153,0.4)');
  grad.addColorStop(1,'rgba(236,72,153,0)');
  // Mốc 50 cho PMI — ranh giới mở rộng/thu hẹp.
  // Plugin annotation v3 KHÔNG set Chart.annotation — kiểm tra qua registry thay thế.
  const annotations={};
  const annRegistered = HAS_CHART_LIB &&
    typeof Chart.registry !== 'undefined' &&
    Chart.registry.plugins && Chart.registry.plugins.items &&
    'annotation' in Chart.registry.plugins.items;
  if(key==='pmi'&&annRegistered){
    annotations.threshold={type:'line',yMin:50,yMax:50,
      borderColor:'#fbbf24',borderWidth:2,borderDash:[6,4],
      label:{content:'50 = ranh giới',display:true,position:'start'}};
  }
  modalChart=new Chart(ctx,{
    type:'line',
    data:{labels:series.map(s=>s.month),datasets:[{
      label:label,data:series.map(s=>s.value),
      borderColor:'#ec4899',backgroundColor:grad,borderWidth:3,tension:0.4,fill:true,
      pointRadius:6,pointBackgroundColor:'#ec4899',pointBorderColor:'#fff',pointBorderWidth:2
    }]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false},annotation:annotations},
      scales:{x:{grid:{color:'rgba(139,92,246,0.06)'}},
              y:{grid:{color:'rgba(139,92,246,0.06)'}}}}
  });
}
function closeModal(){
  document.getElementById('chartModal').classList.remove('active');
  if(modalChart){modalChart.destroy();modalChart=null;}
}

// ═══ VISUAL V2: mũi tên tăng/giảm tự động ═══
// Chèn ▲ (xanh) / ▼ (đỏ) vào mọi số có dấu + / - trong meta card
function decorateArrows(){
  document.querySelectorAll('.dc-meta strong, .dc-target-row, .kpi-delta, .panel-trend strong, .rc-item').forEach(el=>{
    const t=el.textContent||'';
    if(el.querySelector('.arrow-up,.arrow-down')) return;
    if(/^[+]\s?/.test(t.trim())||/^[+]/.test(t.trim())){
      el.insertAdjacentHTML('beforeend','<span class="arrow-up">▲</span>');
    }else if(/^[-]\s?/.test(t.trim())||/^[-]/.test(t.trim())){
      el.insertAdjacentHTML('beforeend','<span class="arrow-down">▼</span>');
    }
  });
}

// ═══ VISUAL V2: sparkline trong card (SVG thuần — không phụ thuộc Chart.js) ═══
// Hiện từ tháng 2+ (history ≥2 điểm) — không chờ 6 tháng như nút [📊]
const SPARK_MIN_POINTS=2;
function drawSparkline(svgEl, series, unit){
  const w=300,h=44,pad=6;
  const ns='http://www.w3.org/2000/svg';
  svgEl.setAttribute('viewBox',`0 0 ${w} ${h}`);
  svgEl.setAttribute('preserveAspectRatio','none');
  const vals=series.map(s=>s.value);
  const min=Math.min(...vals),max=Math.max(...vals);
  const span=(max-min)||1;
  const px=v=>pad+(v-min)/span*(w-2*pad);
  const py=v=>h-pad-(v-min)/span*(h-2*pad);
  const pts=vals.map((v,i)=>`${px(v)},${py(v)}`).join(' ');
  const up=vals[vals.length-1]>=vals[0];
  const color=up?'#10d98a':'#ff4d6d';
  // vùng gradient dưới đường
  const areaPts=`${w-pad},${h-pad} ${pts} ${pad},${h-pad}`;
  const g=document.createElementNS(ns,'polygon');
  g.setAttribute('points',areaPts);
  g.setAttribute('fill',up?'rgba(16,217,138,0.18)':'rgba(255,77,109,0.18)');
  const l=document.createElementNS(ns,'polyline');
  l.setAttribute('points',pts);
  l.setAttribute('fill','none');
  l.setAttribute('stroke',color);
  l.setAttribute('stroke-width','2.2');
  l.setAttribute('stroke-linejoin','round');
  l.setAttribute('stroke-linecap','round');
  // điểm cuối
  const c=document.createElementNS(ns,'circle');
  c.setAttribute('cx',px(vals[vals.length-1]));
  c.setAttribute('cy',py(vals[vals.length-1]));
  c.setAttribute('r','3.4');
  c.setAttribute('fill',color);
  svgEl.appendChild(g);svgEl.appendChild(l);svgEl.appendChild(c);
}
function injectSparklines(){
  // Với mỗi nút chart (chỉ số Cấp A), chèn sparkline phía trước
  document.querySelectorAll('.dc-chart-btn').forEach(btn=>{
    const key=btn.dataset.indicator;
    const series=history.series[key]||[];
    if(series.length<SPARK_MIN_POINTS) return; // chưa đủ 2 điểm → không vẽ
    if(btn.previousElementSibling&&btn.previousElementSibling.classList&&btn.previousElementSibling.classList.contains('dc-spark-wrap')) return;
    const ns='http://www.w3.org/2000/svg';
    const wrap=document.createElement('div');
    wrap.className='dc-spark-wrap';
    const svg=document.createElementNS(ns,'svg');
    svg.setAttribute('class','dc-spark');
    svg.setAttribute('data-indicator',key);
    const label=document.createElement('div');
    label.className='dc-spark-label';
    const last=series[series.length-1];
    label.innerHTML=`<span>Xu hướng (${series.length} kỳ)</span><span class="spark-newest">${key in INDICATOR_LABELS?INDICATOR_LABELS[key].split('(')[0].trim():key}: ${last.value}</span>`;
    wrap.appendChild(svg);wrap.appendChild(label);
    btn.parentNode.insertBefore(wrap,btn);
    drawSparkline(svg,series);
  });
}

// ═══ VISUAL V2: Gauge PMI — nửa vòng tròn mốc 50 (SVG thuần) ═══
function drawGauge(id,value,min=35,max=65){
  const svg=document.getElementById(id);
  if(!svg) return;
  const ns='http://www.w3.org/2000/svg';
  const w=240,h=132,cx=120,cy=118,r=100;
  svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
  svg.innerHTML='';
  const aOf=v=>Math.PI*(1-(v-min)/(max-min)); // 180° → 0°
  const pt=(v,rad)=>[cx+rad*Math.cos(aOf(v)),cy-rad*Math.sin(aOf(v))];
  const arcPath=(v0,v1,rad)=>{
    const [x0,y0]=pt(v0,rad),[x1,y1]=pt(v1,rad);
    // Cung luôn vẽ theo chiều kim đồng hồ (sweep=1) từ TRÁI qua ĐỈNH sang PHẢI,
    // quét tối đa 180° (min→max) nên large-arc LUÔN = 0.
    // ⚠️ Đừng bật large-arc=1 — kim sẽ vòng QUA ĐÁY đồng hồ (bug đã gặp).
    return `M ${x0} ${y0} A ${rad} ${rad} 0 0 1 ${x1} ${y1}`;
  };
  const mkArc=(d,color,width)=>{
    const el=document.createElementNS(ns,'path');
    el.setAttribute('d',d);el.setAttribute('fill','none');
    el.setAttribute('stroke',color);el.setAttribute('stroke-width',width);
    el.setAttribute('stroke-linecap','round');
    return el;
  };
  // nền + vùng mở rộng (vẽ tĩnh)
  svg.appendChild(mkArc(arcPath(min,max,100),'rgba(139,92,246,0.14)',16));
  svg.appendChild(mkArc(arcPath(50,max,100),'rgba(16,217,138,0.16)',16));
  // kim — quay TỪ TỪ khi load (0.6s, ease-out); tôn trọng prefers-reduced-motion
  const cl=value>=50?'#10d98a':'#ff4d6d';
  const kim=mkArc(arcPath(min,min,100),cl,16);
  svg.appendChild(kim);
  const vClamped=Math.min(Math.max(value,min),max);
  const reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dur=reduce?0:600,t0=performance.now();
  (function anim(now){
    const p=reduce?1:Math.min(1,(now-t0)/dur);
    const eased=1-Math.pow(1-p,3);
    kim.setAttribute('d',arcPath(min,min+(vClamped-min)*eased,100));
    if(p<1) requestAnimationFrame(anim);
  })(t0);
  // mốc 50
  const [tx,ty]=pt(50,100);
  const tk=document.createElementNS(ns,'line');
  tk.setAttribute('x1',tx);tk.setAttribute('y1',ty-14);
  tk.setAttribute('x2',tx);tk.setAttribute('y2',ty+14);
  tk.setAttribute('stroke','#fbbf24');tk.setAttribute('stroke-width',2.5);
  svg.appendChild(tk);
  // KHÔNG thêm text node nào vào SVG — tránh chuỗi số dồn hàng ("356550") gây rối mắt.
  // Thông tin thang đo đã có: số lớn ở giữa (div .gauge-value) + chú thích mốc 50 (div .gauge-threshold).
}
function initGauge(){
  const wrap=document.getElementById('pmiGaugeWrap');
  if(!wrap) return;
  const pmiSeries=history.series['pmi']||[];
  // Không có data thật → ẩn gauge (feature ngủ chờ data, KHÔNG vẽ số mẫu)
  if(!pmiSeries.length){wrap.style.display='none';return;}
  const v=pmiSeries[pmiSeries.length-1].value;
  drawGauge('pmiGauge',v);
  const th=document.createElement('div');
  th.className='gauge-threshold';th.textContent='▼ 50 = ranh giới mở rộng/thu hẹp';
  wrap.appendChild(th);
}

// ẨN nút đồ thị nếu lịch sử < 6 điểm
const MIN_POINTS_FOR_CHART=6;
document.querySelectorAll('.dc-chart-btn').forEach(btn=>{
  const key=btn.dataset.indicator;
  const series=history.series[key]||[];
  if(series.length<MIN_POINTS_FOR_CHART){
    btn.style.display='none';
  }else{
    btn.addEventListener('click',()=>openModal(key));
  }
});
document.getElementById('chartModal').addEventListener('click',e=>{
  if(e.target.id==='chartModal') closeModal();
});

// ═══ VISUAL V3: hiệu ứng chức năng — số đếm + thanh tiến độ ═══
// Chỉ animation MỘT LẦN khi load (0.5-0.6s, ease-out) — giúp mắt định vị số chính.
// Tôn trọng prefers-reduced-motion. KHÔNG animation lặp vô hạn (nhiễu, không in được).
function animateCountUp(){
  if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('.dc-value, .kpi-value').forEach(el=>{
    const text=el.textContent||'';
    const m=text.match(/^([-+]?[\d][\d.,]*)/);
    if(!m) return;
    const target=parseFloat(m[1].replace(/,/g,''));
    if(!isFinite(target)) return;
    const suffix=text.slice(m[0].length);
    const dur=500,t0=performance.now();
    const fmt=n=>m[1].includes(',')
      ? n.toLocaleString('en-US',{maximumFractionDigits:1})
      : String(+n.toFixed(2));
    (function tick(now){
      const p=Math.min(1,(now-t0)/dur);
      const eased=1-Math.pow(1-p,3);
      el.textContent=fmt(target*eased)+suffix;
      if(p<1) requestAnimationFrame(tick);
    })(t0);
  });
}
function animateProgress(){
  if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('.dc-progress-fill').forEach(f=>{
    const targetPct=parseFloat(f.style.width||'0')||0;
    if(!targetPct) return;
    f.style.width='0%';
    const dur=600,t0=performance.now();
    (function tick(now){
      const p=Math.min(1,(now-t0)/dur);
      const eased=1-Math.pow(1-p,3);
      f.style.width=(targetPct*eased).toFixed(1)+'%';
      if(p<1) requestAnimationFrame(tick);
    })(t0);
  });
}

// ═══ VISUAL V2: khởi động — mũi tên + sparkline + gauge ═══
decorateArrows();
injectSparklines();
initGauge();
animateCountUp();
animateProgress();

// NAV tabs
document.querySelectorAll('.nav-tab').forEach(tab=>{
  tab.addEventListener('click',()=>{
    document.querySelectorAll('.nav-tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.group-section').forEach(s=>s.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.target).classList.add('active');
    window.scrollTo({top:document.querySelector('.nav-tabs').offsetTop-20,behavior:'smooth'});
  });
});
