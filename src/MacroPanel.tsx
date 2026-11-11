import {format, metrics, type Metric, type Nutrients} from './types';

type Props = {partialFiber:boolean;values:Nutrients; goals:Nutrients; selected:Metric};

export function MacroPanel({values, goals, selected, partialFiber}:Props) {
  const metric = metrics.find(m => m.key === selected)!;
  const used = values[selected];
  const target = goals[selected];
  const percent = used / target * 100;
  return <div className="panel-side">
    <div className="metric-focus" aria-live="polite">
      <p className="focus-label"><i style={{background:metric.color}}/>Đang xem · {metric.label}</p>
      <div className="focus-amount"><strong>{partialFiber&&selected==='fiber'?'≥ ':''}{format(used)}</strong> <span>/ {format(target)} {metric.unit}</span></div>
      <div className="portion-meter" role="progressbar" aria-label={'Tiến độ '+metric.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100,Math.round(percent))} aria-valuetext={format(percent)+'%'}>
        <span style={{width:Math.min(100,percent)+'%'}}/>
      </div>
      <div className="focus-caption"><span>{used>target?'Vượt':'Còn lại'} <b>{partialFiber&&selected==='fiber'?(used>target?'≥ ':'≤ '):''}{format(Math.abs(target-used))} {metric.unit}</b></span><span>{partialFiber&&selected==='fiber'?'≥ ':''}{format(percent)}%</span></div>
    </div>
    <details className="all-macros"><summary>Còn lại hôm nay</summary>
      <table><thead><tr><th>Chỉ số</th><th>Mục tiêu</th><th>Còn lại</th></tr></thead>
        <tbody>{metrics.map(m=><tr key={m.key}><th scope="row">{m.label}</th><td>{format(goals[m.key])} {m.unit}</td><td>{partialFiber&&m.key==='fiber'?'≤ ':''}{format(Math.max(0,goals[m.key]-values[m.key]))} {m.unit}</td></tr>)}</tbody>
      </table>
    </details>
  </div>;
}
