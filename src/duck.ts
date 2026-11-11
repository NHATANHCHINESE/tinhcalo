export const duckLabels = {
  hungry:'Vịt đang chờ bữa đầu tiên',
  fed:'Vịt vừa được cho ăn',
  proud:'Vịt vui vì đã đạt mục tiêu',
  overfull:'Vịt no căng bụng',
  short:'Vịt nhìn vụn cà rốt còn lại',
  relaxed:'Vịt đã no và đang thư giãn'
};
type DuckState=keyof typeof duckLabels;
export function duckMood(meals:readonly {at:number}[], calories:number, goal:number, now=Date.now()):{state:DuckState;caption:string;until?:number}{
  if(!meals.length)return {state:'hungry',caption:'Đang chờ bữa đầu tiên trong ngày.'};
  const delta=Math.round((calories-goal)*100)/100;
  if(delta>500)return {state:'overfull',caption:'No căng · Vượt mục tiêu hơn 500 kcal.'};
  if(delta===0)return {state:'proud',caption:'Vừa đủ · Đạt đúng mục tiêu calo.'};
  if(delta>300)return {state:'proud',caption:'Đã đạt mục tiêu · Dư trên 300 đến 500 kcal.'};
  if(delta>=-300)return {state:'relaxed',caption:'Thư giãn · Cách mục tiêu tối đa 300 kcal.'};
  const latest=meals.reduce((at,meal)=>Math.max(at,meal.at),0);
  const until=latest+10000;
  if(meals.length>=2&&now>=latest&&now<until)return {state:'fed',caption:'Vừa được ăn · Đã ghi bữa thứ '+meals.length+'.',until};
  return {state:'short',caption:'Vẫn còn đói · Thiếu hơn 300 kcal so với mục tiêu.'};
}
export const duckImage=(state:DuckState)=>'art/duck/'+state+'.webp';
