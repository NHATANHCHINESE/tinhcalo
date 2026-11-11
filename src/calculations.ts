import {suppliedFoods} from './foodData';
import {catalog} from './catalog.js';
import {metrics,norm,zero,type Food,type Nutrients,type Portion} from './types';

// Recipe estimates in grams of protein, carbohydrate, fat and fibre per 100 g.
// A named recipe can be replaced with the user's actual label or Sheet values.
const recipes:Record<string,number[]> = {
'Hummus (đậu gà nghiền)':[8,14,10,6],'Xốt mè tahini':[17,21,54,9],'Couscous chín':[3.8,23,.2,1.4],
'Phở':[3.5,7,.9,.4],'Bún bò Huế':[4,9,2.7,.6],'Cơm tấm':[8,23,6,1],'Gỏi cuốn':[6,18,2,.8],'Chả giò':[7,22,14,1.4],'Bánh cuốn':[4,21,2.8,.7],'Bún riêu':[3.7,8.5,1.8,.6],'Bún ốc':[4,9,1.5,.6],'Bánh canh':[3,12,1.7,.5],'Bánh mì thịt':[11,30,9,2],'Bánh mì':[9,50,3.2,2.7],'Bánh xèo':[6,19,9.5,1.5],'Bánh bao':[7,29,6,.9],'Bánh chưng':[5,28,6,1.5],'Bánh bèo':[3,21,2.7,.6],'Bánh bột lọc':[4,32,2.3,.4],'Bò lúc lắc':[19,8,8.4,1],'Bò nướng lá lốt':[17,5,13,1],'Chả lụa':[18,4,10.8,0],'Thịt kho tàu':[15,5,17,0],'Xôi':[4,41,1.7,.8],'Mì Quảng':[5,13,3.6,.9],'Bún chả':[7,15,4.1,1],'Hủ tiếu':[3,10,1.4,.5],'Cơm trắng':[2.7,28.2,.3,.4],'Cơm gà':[9,22,5.5,.7],'Cơm chiên':[5,24,6.5,1],'Xôi xoài':[2.8,34,4.2,1.2],
'Salad rau':[1.5,5.5,.9,2],'Salad Caesar':[5,9,10.4,1.6],'Salad gà':[12,5,8.4,1.3],'Salad trái cây':[.7,15,.4,2],'Salad khoai tây':[2,15,8.5,1.6],'Cá hồi nướng':[22,0,12.4,0],'Trứng luộc':[12.6,1.1,10.6,0],'Trứng chiên':[13,1,15.4,0],'Ức gà chín':[31,0,3.6,0],'Đậu phụ':[8,2,4.7,.5],'Bún tươi':[1.8,25,.2,.5],
'Pizza':[11,32,10,2.3],'Hamburger':[13,25,11.5,1.6],'Khoai tây chiên':[3.4,41,15,3.8],'Gà rán':[21,10,15.6,.5],'Sushi':[6,25,2.9,.9],'Sashimi':[21,0,6.2,0],'Ramen':[3.5,12,2.5,.6],'Mì udon':[2.5,14,1,.5],'Mì xào':[5,23,5.9,1.5],'Pad Thái':[6,24,6.1,1.3],'Mì Ý sốt bò':[6,18,5.4,1.6],'Lasagna':[8,15,6.5,1.5],'Há cảo':[8,24,5.8,.9],'Súp miso':[2.5,3.5,1.2,.7],'Cháo trắng':[1,10,.3,.2],'Pancake':[6,28,10,1.4],'Bánh sừng bò':[8,46,21,2.6],'Kem':[3.5,24,10.5,.7],'Sữa chua':[3.5,5,3.5,0],'Bơ':[2,8.5,14.7,6.7],'Chuối':[1.1,22.8,.3,2.6],'Táo':[.3,13.8,.2,2.4],'Dưa hấu':[.6,7.6,.2,.4],'Đu đủ':[.5,10.8,.3,1.7],'Sữa tươi':[3.2,4.8,3.3,0],'Cà phê sữa':[2,13,2.2,0],'Cà ri gà':[10,7,9,.9],'Cơm cuộn':[5,23,3.7,1.3],'Cá chiên':[20,5,12.2,.3],'Cánh gà':[22,5,15.8,0],'Mì hoành thánh':[4,12,2.3,.7],'Chả cá':[14,9,8.1,.3],'Bánh kếp':[6,26,9,1],'Bít tết':[26,0,14.6,0],'Cơm vịt':[9,23,7.5,.6],'Ratatouille':[1.4,8,3.7,2.4],'Tabbouleh':[3,17,4.1,3],'Bibimbap':[5,17,3.6,1.7],'Falafel':[13,32,17.8,5],'Tiramisu':[5,27,19,1],'Bánh phô mai':[6,26,21.5,.6]
};
export const builtins:Food[] = catalog.map(item=>{
  const [protein,carbs,fat,fiber]=recipes[item.name];
  return {name:item.name,baseGrams:100,nutrients:{calories:item.density,protein,carbs,fat,fiber}};
});
export function database(sheet:Food[],custom:Food[],removed:string[]=[]):Food[]{
  const foods=new Map<string,Food>();
  for(const food of [...builtins,...suppliedFoods,...sheet,...custom]) foods.set(norm(food.name),food);
  const hidden=new Set(removed);
  return [...foods.values()].filter(f=>!hidden.has(norm(f.name))).sort((a,b)=>a.name.localeCompare(b.name,'vi'));
}
export function portion(food:Food,grams:number):Portion {
  return {name:food.name,grams,density:food.nutrients.calories*100/food.baseGrams,basis:food};
}
export function nutrition(row:Portion,foods:Food[]){
  const basis=row.basis??foods.find(f=>norm(f.name)===norm(row.name));
  const values:Nutrients={...zero};
  if(basis) for(const {key} of metrics) values[key]=(basis.nutrients[key]??0)*row.grams/basis.baseGrams;
  values.calories=row.density*row.grams/100;
  return {values,known:!!basis,fiberKnown:basis?.nutrients.fiber!=null};
}
export function summarize(rows:Portion[],foods:Food[]){
  const values={...zero};let missing=0,missingFiber=0;
  for(const row of rows){
    const result=nutrition(row,foods);
    for(const {key} of metrics) values[key]+=result.values[key];
    if(!result.known) missing++;
    if(!result.fiberKnown)missingFiber++;
  }
  return {values,missing,missingFiber};
}
