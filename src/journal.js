import {confirmAction} from './confirmAction';
import {editPortion} from './editPortion';
import {duckMood,duckImage,duckLabels} from './duck';
import {defaults} from './types';
import {read,allMeals,addMeal,loadPhoto,removeMeal,savedFoods,changed} from './storage';
import {database} from './calculations';
import {findFood as findAlias} from './catalog.js';
const $ = id => document.getElementById(id);
const make = (tag,text) => Object.assign(document.createElement(tag),{textContent:text??''});
const paths = {home:'m3 10 9-7 9 7v10h-6v-6H9v6H3z',bars:'M4 20h16M6 16v-5m6 5V4m6 12V8',bowl:'M2 12h20c-1 5-4 8-10 8s-9-3-10-8Zm5 9h10M9 10l9-8m-5 8 8-7',phone:'M7 3h10v18H7zM11 17h2',sun:'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2 M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',camera:'M3 7h4l2-3h6l2 3h4v13H3z M16 13a4 4 0 1 1-8 0 4 4 0 0 1 8 0',image:'M3 4h18v16H3z M4 17l5-5 4 4 3-3 5 5 M9 9h.1',book:'M3 4q5-2 9 1 4-3 9-1v15q-5-2-9 1-4-3-9-1zM12 5v15',lock:'M5 10h14v11H5zM8 10V7a4 4 0 0 1 8 0v3',scan:'M3 8V3h5m8 0h5v5m0 8v5h-5m-8 0H3v-5M7 12h10',spark:'m11 3 2.3 6.7L20 12l-6.7 2.3L11 21l-2.3-6.7L2 12l6.7-2.3zM19 2v4m-2-2h4'};
document.querySelectorAll('[data-icon]').forEach(node=>{node.outerHTML='<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round"><path d="'+paths[node.dataset.icon]+'"/></svg>'});
let photoFoods = new Map();
function refreshPhotoFoods(){
  const {sheet,custom,removed}=savedFoods();
  const foods=database(sheet,custom,removed);
  photoFoods=new Map(foods.map(f=>[f.name.trim().toLocaleLowerCase('vi'),f]));
  $('catalog').replaceChildren(...foods.map(f=>new Option(f.name,f.name)));
}
function findFood(name){
  const alias=findAlias(name);
  const key=name.trim().toLocaleLowerCase('vi');
  const food=photoFoods.get(key)??photoFoods.get(alias?.name.toLocaleLowerCase('vi'));
  if(!food)return undefined;
  return {name:food.name,unit:food.unit,density:food.nutrients.calories*(food.unit?1:100)/food.baseGrams,
    grams:food.unit?food.baseGrams:alias?.grams??food.baseGrams};
}
refreshPhotoFoods();
const fmt = new Intl.NumberFormat('vi-VN',{maximumFractionDigits:1});
const day = date => date.toLocaleDateString('vi-VN');
const energy = f => f.grams*f.density/100;
const total = foods => foods.reduce((n,f)=>n+energy(f),0);
function info(title){$('info-title').textContent=title;$('info-body').replaceChildren();$('info').showModal();return $('info-body')}
$('help').onclick=()=>{const body=info('Dùng trên iPhone');body.append(make('p','Mở MacroDay trong Safari trên iPhone.'));const list=make('ol');for(const step of ['Chạm nút Chia sẻ trong Safari.','Chọn “Thêm vào Màn hình chính”. Nếu cần, cuộn xuống để thấy mục này.','Bật “Mở dưới dạng ứng dụng” nếu có, rồi chạm “Thêm”. Mở MacroDay từ biểu tượng vừa tạo để bắt đầu ghi bữa.'])list.append(make('li',step));body.append(list)};
$('method').onclick=()=>{const body=info('Cách tính calo');body.append(make('p','AI của Google AIY gợi ý tên món từ ảnh ngay trên thiết bị. Chụp gần một món mỗi lần để dễ nhận diện.'),make('p','Với món có trong bảng tham khảo, MacroDay điền sẵn khẩu phần và kcal/100 g. Đây là giá trị gần đúng theo món, có thể thay đổi theo công thức, nước dùng, dầu và sốt.'),make('p','Calo của món = số gam bạn ăn × kcal/100 g ÷ 100. Bạn có thể sửa cả hai số, hoặc dùng số liệu trên nhãn thực phẩm.'));};
document.querySelectorAll('.close').forEach(b=>b.onclick=()=>b.closest('dialog').close());
const mealKinds = ['Bữa sáng','Bữa trưa','Bữa tối','Bữa phụ'];
let selectedDate = null;
let lastRefresh = 0;

function dateKey(date) {
  return [date.getFullYear(), String(date.getMonth()+1).padStart(2,'0'), String(date.getDate()).padStart(2,'0')].join('-');
}
function shiftDay(date,offset) {
  const next = new Date(date);
  next.setDate(next.getDate()+offset);
  return next;
}
function selectDay(next) {
  const key = dateKey(next);
  if (!Number.isFinite(next.getTime()) || key > dateKey(new Date())) return;
  selectedDate = key === dateKey(new Date()) ? null : key;
  refresh();
}
function viewingDay() {
  return selectedDate ? new Date(selectedDate+'T12:00:00') : new Date();
}
$('prev').onclick = () => selectDay(shiftDay(viewingDay(),-1));
$('next').onclick = () => selectDay(shiftDay(viewingDay(),1));
$('date').onchange = event => selectDay(new Date(event.target.value+'T12:00:00'));
const screens=['macro','personal','log','stats'];
function showScreen(screen){
  $('macro-root').hidden=screen!=='macro';
  $('personal-root').hidden=screen!=='personal';
  $('legacy').hidden=screen!=='log' && screen!=='stats';
  $('log-screen').hidden=screen!=='log';
  $('stats-screen').hidden=screen!=='stats';
  for(const id of screens) $(id+'-tab').setAttribute('aria-pressed',String(id===screen));
}
for(const screen of screens) $(screen+'-tab').onclick=()=>showScreen(screen);
window.addEventListener('macroday-camera',()=>{selectedDate=null;$('camera').click()});
window.addEventListener('macroday-gallery',()=>{selectedDate=null;$('gallery').click()});

function renderWeek(meals,end) {
  const days = Array.from({length:7},(_,i)=>shiftDay(end,i-6));
  const sums = new Map(days.map(date=>[dateKey(date),0]));
  for (const meal of meals) {
    const key = dateKey(new Date(meal.at));
    if (sums.has(key)) sums.set(key,sums.get(key)+total(meal.foods));
  }
  const peak = Math.max(1,...sums.values());
  $('stats-range').textContent = day(days[0])+' – '+day(end);
  $('chart').replaceChildren();
  for (const date of days) {
    const sum = sums.get(dateKey(date));
    const column = make('div');
    column.className = 'column';
    column.setAttribute('aria-label',day(date)+', '+sum+' kcal');
    const bar = make('i');
    bar.style.height = Math.max(3,Math.round(sum/peak*110))+'px';
    column.append(make('strong',fmt.format(sum)),bar,make('small',date.getDate()+'/'+(date.getMonth()+1)));
    $('chart').append(column);
  }
  $('week-total').textContent = fmt.format([...sums.values()].reduce((a,b)=>a+b,0))+' kcal';
}
function renderBreakdown(meals,kcal) {
  const list = $('breakdown');
  list.replaceChildren();
  for (const kind of mealKinds) {
    const sum = meals.filter(m=>m.kind===kind).reduce((n,m)=>n+total(m.foods),0);
    const cell = make('div');
    cell.className = 'meal-stat';
    const track = make('div');
    track.className = 'track';
    const fill = make('i');
    fill.style.width = (kcal ? 100*sum/kcal : 0)+'%';
    track.append(fill);
    cell.append(make('span',kind.slice(4)),track,make('small',fmt.format(sum)+' kcal'));
    list.append(cell);
  }
}
function renderEntries(meals) {
  const list = $('entries');
  list.replaceChildren();
  if (!meals.length) {
    const p = make('p','Chưa có bữa ăn nào trong ngày này.');
    p.className = 'empty';
    list.append(p);
  }
  for (const meal of meals) {
    const button = make('button');
    button.className = 'entry';
    const top = make('div');
    top.className = 'entrytop';
    top.append(make('strong',meal.kind),make('span',fmt.format(total(meal.foods))+' kcal'));
    button.append(top,make('small',new Date(meal.at).toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})+' · '+meal.foods.map(f=>f.name).join(', ')));
    button.onclick = () => detail(meal);
    list.append(button);
  }
}
let duckTimer;
async function refresh() {
  const serial = ++lastRefresh;
  const now = new Date();
  const date = viewingDay();
  const key = dateKey(date);
  $('today').textContent = date.toLocaleDateString('vi-VN',{weekday:'short',day:'2-digit',month:'2-digit'});
  $('date').value = key;
  $('date').max = dateKey(now);
  $('today-tag').hidden = key !== dateKey(now);
  $('next').disabled = key >= dateKey(now);
  try {
    const meals = (await allMeals()).sort((a,b)=>b.at-a.at);
    if (serial !== lastRefresh) return;
    const matching = meals.filter(meal=>dateKey(new Date(meal.at))===key);
    const kcal = matching.reduce((n,m)=>n+total(m.foods),0);
    const foods = matching.flatMap(m=>m.foods);
    clearTimeout(duckTimer);
    const mood=duckMood(matching,kcal,read('goals',defaults).calories);
    const duck=$('journal-duck');
    duck.src=duckImage(mood.state);
    duck.alt=duckLabels[mood.state];
    duck.dataset.pose=mood.state;
    $('journal-duck-caption').textContent=mood.caption;
    if(mood.until)duckTimer=setTimeout(refresh,Math.max(0,mood.until-Date.now())+1);
    $('total').textContent = fmt.format(kcal);
    $('count').textContent = foods.length+' món';
    const amounts=new Map();
    for(const f of foods){const unit=f.basis?.unit??'g';amounts.set(unit,(amounts.get(unit)??0)+f.grams)}
    $('grams').textContent=[...amounts].map(([unit,value])=>fmt.format(value)+' '+unit).join(' + ')||'0 g';
    $('caption').textContent = 'Bạn đã ghi '+matching.length+' bữa trong ngày';
    renderBreakdown(matching,kcal);
    renderEntries(matching);
    renderWeek(meals,date);
  } catch {
    $('entries').textContent = 'Không mở được bộ nhớ nhật ký. Hãy cho phép Safari lưu dữ liệu của trang.';
  }
}
function detail(meal){
  const body=info(meal.kind);
  body.append(make('p',new Date(meal.at).toLocaleString('vi-VN')));
  if(meal.hasPhoto){
    const image=make('img');
    image.alt='Ảnh của bữa ăn';
    image.style.cssText='width:100%;max-height:210px;object-fit:contain';
    image.hidden=true;
    body.append(image);
    loadPhoto(meal.id).then(photo=>{
      if(photo){image.src=photo;image.hidden=false}
    }).catch(()=>{image.replaceWith(make('p','Chưa tải được ảnh bữa ăn.'))});
  }
  const sum=make('p');
  function updateTotal(){sum.textContent='Tổng ước tính: '+fmt.format(total(meal.foods))+' kcal'}
  meal.foods.forEach((food,index)=>{
    const row=make('div'),amount=make('small'),actions=make('div');
    row.className='detailrow';
    actions.className='portion-detail';
    const display=f=>{amount.textContent=fmt.format(f.grams)+' '+(f.basis?.unit??'g')+' · ≈ '+fmt.format(energy(f))+' kcal'};
    display(food);
    const edit=make('button','Sửa khẩu phần');
    edit.className='link-action';
    edit.setAttribute('aria-label','Sửa khẩu phần '+food.name);
    edit.onclick=async()=>{
      const grams=await editPortion(meal,index);
      if(grams===null)return;
      meal.foods[index]={...meal.foods[index],grams};
      display(meal.foods[index]);
      updateTotal();
    };
    actions.append(amount,edit);
    row.append(make('strong',food.name),actions);
    body.append(row);
  });
  updateTotal();
  const remove=make('button','Xóa bữa ăn');
  remove.className='secondary';
  remove.onclick=async()=>{
    if(!await confirmAction('Xóa bữa ăn này khỏi nhật ký?'))return;
    try{await removeMeal(meal);$('info').close();refresh()}
    catch{body.append(make('p','Chưa xóa được. Vui lòng thử lại.'))}
  };
  body.append(sum,remove);
}
let enginePromise,session=0,photo='',currentCanvas,saving=false;
async function engine(){if(!enginePromise){enginePromise=(async()=>{const {FilesetResolver,ImageClassifier}=await import(/* @vite-ignore */ new URL('ai/vision_bundle.mjs',document.baseURI).href);const files=await FilesetResolver.forVisionTasks(new URL('./ai/wasm',location.href).href);return ImageClassifier.createFromOptions(files,{baseOptions:{modelAssetPath:'./ai/food.tflite',delegate:'CPU'},runningMode:'IMAGE',maxResults:5,displayNamesLocale:'en'})})().catch(e=>{enginePromise=null;throw e})}return enginePromise}
function readFoods(){return [...$('foods').children].map(r=>({name:r.querySelector('.name').value.trim(),grams:Number(r.querySelector('.grams').value),density:Number(r.querySelector('.density').value)*(r.dataset.unit?100:1)}))}
function update(){const foods=readFoods();$('estimate').textContent=foods.every(f=>f.name&&f.grams>0&&f.density>0)?'≈ '+fmt.format(total(foods))+' kcal':'—'}
function applyFood(row,name,canonical=true){
  const food=findFood(name),unit=food?.unit;
  row.dataset.unit=unit??'';
  if(canonical) row.querySelector('.name').value=food?.name??name;
  row.querySelector('.amount-label').textContent=unit?'Số '+unit:'Khẩu phần (g)';
  row.querySelector('.density-label').textContent=unit?'kcal / '+unit:'kcal / 100 g';
  row.querySelector('.density').value=food?.density??'';
  row.querySelector('.grams').value=food?.grams??'';
  update();
}
function addRow(name=''){const row=make('div');row.className='food';row.innerHTML='<div class="foodhead"><strong>Món ăn</strong></div><label>Tên món<input class="name" list="catalog" maxlength="90" placeholder="Nhập hoặc chọn món" required></label><div class="weights"><label><span class="amount-label">Khẩu phần (g)</span><input class="grams" type="number" inputmode="decimal" min="0.1" max="10000" step="any" required></label><label><span class="density-label">kcal / 100 g</span><input class="density" type="number" inputmode="decimal" min="0.1" max="1000" step="any" required></label></div>';if($('foods').children.length){const del=make('button','Bỏ món');del.type='button';del.className='textbutton';del.onclick=()=>{row.remove();update()};row.firstChild.append(del)}$('foods').append(row);const n=row.querySelector('.name');n.oninput=()=>applyFood(row,n.value,false);row.oninput=update;applyFood(row,name);return row}
$('add').onclick=()=>addRow().querySelector('.name').focus();
async function analyze(token,canvas){$('status').textContent='Đang chuẩn bị AI trên thiết bị… Lần đầu cần tải khoảng 30 MB.';$('retry').hidden=true;$('form').hidden=true;$('candidates').replaceChildren();try{const classifier=await engine();if(token!==session)return;$('status').textContent='Đang nhận diện món ăn…';await new Promise(r=>setTimeout(r,45));if(token!==session)return;const cats=classifier.classify(canvas).classifications[0]?.categories??[];const choices=cats.filter(c=>c.score>=0.015&&c.displayName&&!/background/i.test(c.displayName));const confident=choices[0]?.score>=0.18;const choose=(c,b)=>{const food=findFood(c.displayName);applyFood($('foods').firstChild,food?.name??c.displayName);for(const btn of $('candidates').children)btn.setAttribute('aria-pressed',btn===b?'true':'false');$('status').textContent=food?'Hãy xác nhận tên món và chỉnh khẩu phần theo lượng bạn ăn.':'Chưa có số liệu cho món này. Chọn món tương tự trong bảng hoặc nhập kcal/100 g.'};for(const c of choices.slice(0,3)){const b=make('button',findFood(c.displayName)?.name??c.displayName);b.type='button';b.onclick=()=>choose(c,b);$('candidates').append(b)}if(confident)choose(choices[0],$('candidates').firstChild);else $('status').textContent='AI chưa chắc đây là món gì. Bạn có thể chọn gợi ý hoặc tự nhập tên món.'}catch{if(token!==session)return;$('status').textContent='Chưa chạy được AI. Kiểm tra mạng và thử lại, hoặc nhập món để ghi bữa.';$('retry').hidden=false}if(token===session)$('form').hidden=false}
async function selectPhoto(file){if(!file)return;refreshPhotoFoods();const token=++session;photo='';currentCanvas=null;$('preview').removeAttribute('src');$('preview-wrap').hidden=true;$('foods').replaceChildren();addRow();$('form').hidden=true;$('retry').hidden=true;$('candidates').replaceChildren();$('status').textContent='Đang đọc ảnh…';$('review').querySelector('h2').textContent=selectedDate?'Ghi bữa · '+day(viewingDay()):'Ghi bữa ăn';$('review').showModal();const hour=new Date().getHours();$('kind').selectedIndex=hour<10?0:hour<15?1:hour<22?2:3;const url=URL.createObjectURL(file);try{const img=new Image();img.src=url;await img.decode();if(token!==session)return;const scale=Math.min(1,880/Math.max(img.naturalWidth,img.naturalHeight));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);photo=canvas.toDataURL('image/jpeg',0.72);currentCanvas=canvas;$('preview').src=photo;$('preview-wrap').hidden=false;await analyze(token,canvas)}catch{if(token===session)$('status').textContent='Safari chưa đọc được ảnh này. Hãy đóng cửa sổ và chọn ảnh JPEG hoặc PNG.'}finally{URL.revokeObjectURL(url)}}
$('review').onclose=()=>{session++;currentCanvas=null;photo=''};
$('shoot').onclick=()=>$('camera').click();$('pick').onclick=()=>$('gallery').click();
for(const id of ['camera','gallery'])$(id).onchange=e=>{const file=e.target.files[0];e.target.value='';selectPhoto(file)};
$('retry').onclick=()=>analyze(session,currentCanvas);
$('form').onsubmit=async e=>{e.preventDefault();if(saving)return;const foods=readFoods();if(!foods.every(f=>f.name&&f.grams>0&&f.density>0))return;const id=Array.from(crypto.getRandomValues(new Uint32Array(4))).join('-');const at=viewingDay();const clock=new Date();at.setHours(clock.getHours(),clock.getMinutes(),clock.getSeconds(),clock.getMilliseconds());const saved=savedFoods();const items=database(saved.sheet,saved.custom,saved.removed);
  for(const food of foods)food.basis=items.find(item=>item.name.toLocaleLowerCase('vi')===(findFood(food.name)?.name??food.name).toLocaleLowerCase('vi'));
  const meal={id,at:at.getTime(),kind:$('kind').value,foods};saving=true;const button=e.submitter??$('form').querySelector('.save');button.disabled=true;try{await addMeal(meal,photo);$('review').close();await refresh()}catch{$('status').textContent='Chưa lưu được bữa ăn. Hãy kiểm tra dung lượng còn trống trên thiết bị.'}finally{saving=false;button.disabled=false}};
window.addEventListener(changed,refresh);window.addEventListener('storage',refresh);refresh();document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});window.addEventListener('focus',refresh);
