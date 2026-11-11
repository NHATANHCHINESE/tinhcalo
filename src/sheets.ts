import {norm,type Food} from './types';

type Table={cols:{label:string}[];rows:{c:({v:unknown}|null)[]}[]};
const plain=(s:string)=>norm(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9]/g,'');
const aliases=[
  ['name','ten','tenmon','ten thuc pham','thuc pham'],['baseGrams','khoi luong goc','khau phan goc'],
  ['calories','kcal','calo'],['protein','dam'],['carbs','carb','carbohydrate'],['fat','chat beo'],['fiber','fibre','chat xo']
];
export function parseTable(table:Table):Food[]{
  const headers=table.cols.map(c=>plain(c.label));
  const indices=aliases.map(names=>headers.findIndex(h=>names.some(name=>plain(name)===h)));
  if(indices.includes(-1)) throw Error('Thiếu cột. Cần name, baseGrams, calories, protein, carbs, fat, fiber.');
  const foods:Food[]=[];
  table.rows.forEach((r,i)=>{
    const cells=indices.map(index=>r.c[index]?.v);
    if(cells.every(v=>v==null||v===''))return;
    const name=String(cells[0]??'').trim();
    const numbers=cells.slice(1).map(v=>v==null||String(v).trim()===''?NaN:Number(String(v).trim().replace(',','.')));
    if(!name || !numbers.every(n=>Number.isFinite(n)&&n>=0) || numbers[0]<=0)throw Error('Dữ liệu không hợp lệ ở dòng '+(i+2)+'.');
    const [baseGrams,calories,protein,carbs,fat,fiber]=numbers;
    foods.push({name,baseGrams,nutrients:{calories,protein,carbs,fat,fiber}});
  });
  if(!foods.length)throw Error('Trang tính chưa có thực phẩm.');
  return foods;
}
export function importSheet(input:string):Promise<Food[]>{
  const source=new URL(input.trim());
  const match=source.pathname.match(/^\/spreadsheets\/d\/([\w-]+)(?:\/|$)/);
  if(source.hostname!=='docs.google.com'||!match)throw Error('Hãy dùng liên kết Google Sheets dạng /spreadsheets/d/…/edit.');
  const gid=source.searchParams.get('gid')??new URLSearchParams(source.hash.slice(1)).get('gid')??'0';
  if(!/^\d+$/.test(gid))throw Error('Mã trang tính không hợp lệ.');
  const cb='macrodaySheet'+crypto.randomUUID().replaceAll('-','');
  const url=new URL('https://docs.google.com/spreadsheets/d/'+match[1]+'/gviz/tq');
  url.search=new URLSearchParams({gid,headers:'1',tqx:'out:json;responseHandler:'+cb}).toString();
  return new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    const globals=window as unknown as Record<string,unknown>;
    function cleanup(){clearTimeout(timer);script.remove();delete globals[cb]}
    function failed(){cleanup();reject(Error('Không đọc được Sheet. Kiểm tra kết nối và quyền “Bất kỳ ai có liên kết đều xem được”.'))}
    const timer=window.setTimeout(failed,18000);
    globals[cb]=(response:{status:string;table:Table})=>{
      if(response.status!=='ok'||!response.table){failed();return}
      cleanup();try{resolve(parseTable(response.table))}catch(e){reject(e)}
    };
    script.onerror=failed;script.src=url.href;document.head.append(script);
  });
}
