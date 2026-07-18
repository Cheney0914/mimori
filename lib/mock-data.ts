export type Language = "English" | "Japanese";
export const terms = { English: { term:"mug", pronunciation:"/mʌɡ/", broader:"cup", count:4 }, Japanese: { term:"マグカップ", pronunciation:"magukappu", broader:"カップ", count:3 } };
export const scenes = [
  ["Kitchen","14 names","mug · whisk · kettle","kitchen"],["Food & Drink","11 names","tea · rice · bread","food"],["Home","9 names","lamp · sofa · door","home"],["Bathroom","7 names","soap · towel · mirror","bathroom"],["Work & Study","13 names","pen · desk · book","work"],["Clothing & Personal","10 names","shirt · bag · shoes","clothing"],["Outside","8 names","tree · bicycle · bench","outside"],["Other","4 names","umbrella · key · box","other"]
] as const;
