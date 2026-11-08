export function parseNumericDraft(draft:string,min:number,max:number):{value:number;error?:never}|{value?:never;error:string}{
 const text=draft.trim().replace(',','.');
 if(!text)return {error:'값을 입력해 주세요.'};
 if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(text))return {error:'숫자를 확인해 주세요.'};
 const value=Number(text);
 if(!Number.isFinite(value)||value<min||value>max)return {error:`${min}–${max} 범위로 입력해 주세요.`};
 return {value};
}
