	// Об’єкт обмежень хімічного аналізу
	var Criteria = {
		Reactants: 100,  // максимальна кількість реагентів (лівий бік)
		Products: 100,   // максимальна кількість продуктів (правий бік)
		Reagents: 100,   // максимальна кількість всіх речовин разом
		Elements: 100,   // максимальна кількість елементів у системі
		Equations: 200  // максимальна кількість рівнянь для обчислень
	};

var Cur = {
		start_tm: 0,      // час початку розрахунку (timestamp або Date.now())
		end_tm: 0,        // кінцевий час (оновлюється на кожному кроці)
		clc_tm:0 ,		//час розрахунку
		step_e:[],			//кількість кроків для кожного з елементів
		
		ProcessTime: 0,    // тривалість розрахунку = CurTime - StartTime

		Equ_Text:[],		//вихідне рівняня у текстовому вигляді
		Elems_Arr:[], 		//масив імен елементів для розрахунків
		Elems_Excl:["Mat","Vat","Hat","Sat","Cat","Gat","Hh"],        //елементи, які не урівнюються
		Elems_Sys:[],			//елементи системні/розраховуються
		
		Reag_Set:[],			//масив набору реагентів (для однієї реакції)
		Reag_Rct:[],			//розібраний масив з реактантів
		Reag_Prd:[],			//розібраний масив з продуктів
		Reag_Val:[],			//розібране значення реагента
		r_rct:0,					//кількість реактантів
		p_prd:0,					//кількість продуктів
		
		Subst_L:{
			Src_Equ: "",		//вихідне рівняння
			Calc_Equ: "",		//вихідне рівняння		
			k:[],						// коефіцієнти у початковому рівнянні
			Src:[],					//оригінальна формула
			Brt:[],					//брутто формула
			Dir:[],					//напрямок
		end:0
		},
		
		Reag_Names:[],			//масив набору реагентів (для однієї реакції)
		Reag_K:[],				//коефіцієнти у вихідній строчці
		
		React_Set:[[[],[]],[]],			//масив реакцій
		React_T:[],				//масив типів реагентів [n_subst]
		React_C:[[],[]],				//масив склду сполуки [n_elem]
		React_L:[[],[]],				//масив саолук (index) - [n_elem][m_subst]
		React_N:[],				//наборі стехіометричних коефіцієнтів для реакції без урахування напрямку [n_subst]
		React_Ki:[],			//наборі стехіометричних коефіцієнтів для реакції з уразуванням напрямку [n_subst]
		React_D:[[],[]],				//масив балансу елементів [w_react][n_elem]
		React_R:[[],[]],				//маcив реакцій [w_react]
		
		n_elem: 0,     			// кількість елементів
		m_subst: 0,     			// кількість реагентів
		w_react: 0,				// кількість реакцій

		i_e: 0,     					// поточний елемент
		i_s: 0,						// поточний реагент
		i_r:0,					    // поточна реакція
	   
	   dbal: "",				//елемент який не збалансований
	   
		CurEquation: 0     // номер поточного рівняння/реакції в ітерації
	};


	var CalcState = {
		WideStat :true,  		//відображати статистику
		SourceText:"",		//повний текст для аналізу
		ReplacedText:"",	//після заміни
		Lines:"",					//масив рядків
		CurLine:"",	 			//текст після заміни	
		Elems_Arr:[], 		//масив імен елементів
		Equation_arr:[],      //масив з рядків для реактантів, продуктів та коментарів
		
		Result:"", //тектс для виводу
		Last:0
	};

	
///============================================================================================================

///============================================================================================================

function Cur_n_e(){ return Cur.Reag_Set[0].length-1;} //загальна кількість елементів
function Cur_m_s(){ return Cur.Reag_Set.length-1;} //загальна кількість речовин

function Cur_C(i_s){return Cur.Reag_Set[i_s];} //масив складу реагентів [m_subs]
function Cur_a(i_s, i_e){return Cur.Reag_Set[i_s][i_e];} //атомів у реагенті a[i_s][i_e]
function Cur_SName(i_s){return Cur.Reag_Set[i_s][0].split(" ")[1];} //масив складу реагентів [m_subst]
function Cur_ai(i_e){ let A=clone_(Cur_T()); for(let i_s=1; i_s<A.length; i_s++) A[i_s]=Cur_a(i_s, i_e); return A;} //кількості атомів для елементу [m_subst]
function Cur_ai_sum(i_r, i_e){ return sumN(AxB(Cur_ai(i_e), Cur_Nrct(i_r))); } //кількості атомів для i_e елементу [m_subst] для Кі=1
function Cur_a_sum(i_r){  let a=[0]; for(let i_e=1; i_e<=Cur_n_e() ; i_e++) { a[i_e] = sumN(AxB(Cur_ai(i_e),Cur_Nrct(i_r))); }  return a; } //кількості атомів для реактантів для i_r реакції [n_elem]

function Cur_T(){return Cur.React_T;} //масив типу розрахунку
function Cur_L(){return Cur.React_Set[0][0];} //масив кількостей атомів для 1 моль реагента
function Cur_Nr(i_r){return Cur.React_Set[i_r];} //масив кількостей реагентів у реакції
function Cur_Kr(i_r){ return AxB(clone_(Cur_Nr(i_r)),Cur_T());} //масив коефіцієнтів реагентів у реакції (з урахуванням напрямку)
function Cur_Nr_rct(i_r){let Ni_r=AxK(clone_(Cur_Nr(i_r)), 1/CurStat.rct_r); Ni_r = formatA(Ki_r);}

function Cur_Nrct(i_r) { let A=clone_(Cur_Nr(i_r)); A[0] =0;  A=AxB(A,Cur_T()); A= AsB(A, Cur_Nr(i_r)); A=AxK(A,1/2);  return A;} //масив коефіцієнтів реактантів
function Cur_Nprd(i_r) { let A=clone_(Cur_Nr(i_r)); A[0] =0;  A=AxB(A,Cur_T());  A=AxK(A,-1); A= AsB(A, Cur_Nr(i_r)); A=AxK(A,1/2);  return A;} //масив коефіцієнтів продуктів



function Cur_Krs(i_r, j_s){return  Cur.React_Set[i_r][j_s]*Cur_T()[j_s];} //коефіцієнт реакції

//модифікація векторів
function AxB(A,B){for(let i=1; i<A.length; i++) A[i]*=B[i]; return A;}  //помноження двох масивів
function AsB(A,B){for(let i=1; i<A.length; i++) A[i]+=B[i]; return A;}  //сума двох масивів
function AxK(A,K){for(let i=0; i<A.length; i++) A[i]*=K; return A;}  //помноження на число  normalized to the least integer ratio (via division by the GCD greatest common divisor)
function B2A(B,A){for(let i=0; i<A.length; i++) A[i]=B[i]; return A;}  //присвоєння нових значень
function K2A(K,A){for(let i=0; i<A.length; i++) A[i]=K; return A;}  //заповнення масиву значенням K
function formatA(A){for(let i=0; i<A.length; i++) A[i]=format_x(A[i]); return A;}  //заповнення масиву значенням K

//логічні операції з векторами
function posN(A){for(let i=0; i<A.length; i++)  if (A[i]>0) A[i]=1; else A[i]=0; return A;}  //позитивні елементи
//function nzrN(A){for(let i=1; i<A.length; i++)  if (A[i]!=0) A[i]=1; else A[i]=0; return A;}  //ненульові елементи

function minK(A){	let min = A[1]; for(let i=2; i<A.length; i++) if (A[i]<min ) min=A[i]; return min;} //мінімальне значення
function maxK(A){	let max = A[1]; for(let i=2; i<A.length; i++) if (A[i]>max ) max=A[i]; return max;} //максимальне значення
function sumN(A){	let sum = 0; for(let i=1; i<A.length; i++) sum +=A[i]; return sum;} //сума значень
function difN(A){	let sum = 0; for(let i=1; i<A.length; i++) sum +=A[i]*Cur_T()[i]; return sum;} //різниця між сумою реактантів та продуктів

function format_x(x){ let r= Math.round(x); if(Math.abs(x - r) < 0.0001)  return r; else return x.toFixed(2); }

function Summary(r_a) {
		let A ={
		e_sum: 0, // сумарна кількість елементів що бере участь у реакції
		a_sum:0, //сумарна кількість атомів для реактантів у реакції
		ai_sum:[], //кількість атомів для реактантів по кожному елементу
		rct_sum:0, //кількість формульних одиниць реактантів
		prd_sum:0, //кількість формульних одиниць продуктів
		dif:0, //зменшення кількості формульних одиниць - чим менше тим більше продуктів
		sum:0, //загальна кількість формульних одиниць реагентів
		rct:[], //кількості формульних одиниць реактантів
		prd:[], //кількості формульних одиниць продуктів
		rct_r:0, //значення першого коефіцієнта ректантів
		prd_r:0 //значення першого коефіцієнта продуктів
	}
		
	  	A.rct = Cur_Nrct(r_a);
		A.prd = Cur_Nprd(r_a);
		A.rct_sum=sumN(A.rct);
		A.prd_sum=sumN(A.prd);
		A.sum=A.rct_sum+A.prd_sum;
		A.dif=A.rct_sum-A.prd_sum;
		
		A.ai_sum=Cur_a_sum(r_a); 
		A.a_sum=sumN(A.ai_sum);
		A.e_sum=sumN(posN(clone_(A.ai_sum)));
		
		for (let i=1; i<=Cur.m_subst; i++) if (A.rct[i]!=0) {A.rct_r=A.rct[i]; break;}  //значення першого коефіцієгу для реактрантів
		for (let i=1; i<=Cur.m_subst; i++) if (A.prd[i]!=0) {A.prd_r=A.prd[i]; break;} //значення першого коефіцієгу для продуктів
		
		return A;
}

// у цілі числа
// нормалізація
// 

//------------------------------------------------------
	// порівняння реакцій
	function A_more_B(React_Set, r_a, r_b) {
		
   let A=Summary(r_a);
   let B=Summary(r_b);

		if (A.e_sum > B.e_sum) return true; //якщо більше елементів то А вниз
    	if (A.e_sum < B.e_sum) return false; //якщо менше то А залишається як і було
		// якщо рівні порівнюємо далі

		if (A.a_sum > B.a_sum) return true; //якщо більше атомів то А вниз
    	if (A.a_sum < B.a_sum) return false; //якщо менше то А залишається як і було
		// якщо рівні порівнюємо далі

 
		if (A.sum > B.sum) return true; //якщо більше формульних одиниць (молекул, коефіцієнтів) то А вниз
    	if (A.sum < B.sum) return false; //якщо менше то А залишається як і було
		// якщо рівні порівнюємо далі
		
		if (A.dif < B.dif) return true; // якщо кількість продуктів більша то А вниз
    	if (A.dif > B.dif) return false; //якщо менше то А залишається як і було
		// якщо рівні порівнюємо далі
	 
	  return false;
	}


//---------------------------------------------------------------------------------------

// розрахована формула з коефіцієнтами
function get_CurFormula(i_r){
	let Ni = Cur_Nr(i_r); 	let Nm = Cur.Reag_Names; 	let Equ =["",""]; let Dlm =["",""];
	for (i_s =1; i_s<=Cur.m_subst; i_s++){
		let Ki = parseFloat(Math.abs(Ni[i_s]).toFixed(2)); 
		   if (Ki >= 0.02){
				if(Ki ==1) Ki="";
				if (Cur.React_T[i_s] >0) {Equ[0]+=Dlm[0]+Ki+" "+Nm[i_s]; if (Dlm[0] == "") Dlm[0] = " + ";}
				else if (Cur.React_T[i_s] <0) {Equ[1]+=Dlm[1]+Ki+" "+Nm[i_s];  if (Dlm[1] == "") Dlm[1] = " + ";}
				
		   }
	}
return Equ[0]+" = "+ Equ[1];
}

//початкова загальна формула
function get_BaseFormula(){return Cur.Subst_L.Src[0];}

//список реагентів
function get_Reagents(Dlm="delta"){
		let Nm = Cur.Reag_Names; 
		let Rg = []; if (Dlm == "delta") Dlm= " Δ "; 
		for (i_s =1; i_s<=Cur.m_subst; i_s++){
				if (Cur.React_T[i_s] >0) Rg.push(Nm[i_s]);	else if (Cur.React_T[i_s] <0) {  if (Rg.length == (i_s-1)) Rg.push(Dlm); Rg.push(Nm[i_s]);}
	   }
	return Rg;
}

function get_Ki(i_r, Dlm="delta"){
	let Ni = Cur_Nr(i_r);
	if (Dlm =="delta") Dlm = Ni[0]; 
	let K = ["","__",""];
	for (i_s =1; i_s<=Cur.m_subst; i_s++){
	let Ki = ""+format_x(Math.abs(Ni[i_s])); 
				if (Cur.React_T[i_s] >=0) K[0]+= Ki+" ";
				else {
					if  (K[1] == "__") K[1] = Dlm+" "; 
					K[2]+=Ki+" ";
				}
	}
	K=(K[0]+K[1]+K[2]).trim().split(" ");
	return K;
}

//-----------------------------------------------------------------------------------------------------------
// 
//------------------------------------------------------------------------------------------------------------
// рядок для списку реагентів 
function createHTML_Header(HVal,Val){
	let n_col=1; let n_val =Val.length-1; 
	let h =``; let hh=``;
	for (let i_v=0; i_v<=n_val; i_v++){
		let HVi = HVal[i_v]; 	let rs=``;  
		if (HVi == "") { h += `<th rowspan="2">`+createHTML_thset(Val[i_v])+`</th>`; } //розтягуємо на два рядки якщо значення відсутнє
		else   { let rc=``;  if (Array.isArray(Val[i_v])) { rc = ` colspan="`+Val[i_v].length+`" `; } //якщо це масив то збираємо колонки разом
					h += `<th`+rc+`>`+createHTML_thset(HVi)+`</th>`;  hh += `<th>`+createHTML_thset(Val[i_v])+`</th>`; } 	
	}
 return `<thead>\n<tr>\n` + h +`\n</tr>\n<tr>\n` + hh+ `</tr>\n</thead>\n`;
}


//створення рядка таблиці
function createHTML_row(Val, td = "td"){
	let n_col = Val.length-1; if (td == "th") td="th";
	let row =`<tr>`; 	for (let i_val=0; i_val<=n_col; i_val++){  row +=  `<`+td+`>` +  createHTML_tdset(Val[i_val]) +`</`+td+`>`;	}	row += `</tr>\n`;
return row;
}

//створення колонок з масиву для звичайного рядка 
function createHTML_tdset(Val){
	let row =``;	if (Array.isArray(Val)) { 	let n_col = Val.length-1;	   for (let i_val=0; i_val<=n_col; i_val++){ if (i_val) row += `<td>`; row +=  Val[i_val]; if(i_val<n_col) row+=`</td>`}	}	else  row+=Val;
return row;}
//створення колонок з масиву для рядка заголовку
function createHTML_thset(Val){
	let row =``;	if (Array.isArray(Val)) { 	let n_col = Val.length-1;	   for (let i_val=0; i_val<=n_col; i_val++){ if (i_val) row += `<th>`; row +=  Val[i_val]; if(i_val<n_col) row+=`</th>`}	}	else  row+=Val;
return row;}

//----------------------------------------------------------------------------------
	//створення списку рівнянь у вигляді HTML таблиці
	//React_Set - дані щодо набору реакцій

function tabHTML_equation(React_Set, Statistics = 0) {
	  const w_react = Cur.React_Set.length - 1; //кількість реакцій
	  const m_subst = Cur.React_Set[0].length - 1; //кількість реагентів

	 //for (let i_s = 1; i_s <= Cur.m_subst; i_s++)  Cur.Reag_Names[i_s]=Cur_SName(i_s); // формуємо список імен реагентів (глобальний)

	  
	 let result= '-'.repeat(70)+'<br>\n';
	  result += `${get_BaseFormula()}<br>\n`; //список реагентів як вводився
	  //якщо немає можливих реакцій
	  if (w_react < 1) {
	   result += '> > > N = 0 < < < ';
	   result += Cur.dbal;
	   result += '> > >  <br>';
	   result += '';	   
	   result += '\n *******************\n<br>';
	  } 
	  //якщо є реакції
	  else {
	   //result += `> > > N = ${w_react} < < < <br>\n *******************\n<br><table>\n`;
	   result += `> > > N = ${w_react} < < < `;
	   result += '> > > '+ Cur.clc_tm.toFixed(1) + '  ms < < < ';	   
	   result += '> > > '+ (sumN(Cur.step_e)+Cur.step_e[0]) + '  calc < < < ';	   
	   result += '<br>*******************<br>';
		 result+='<table>\n';
		 if (CalcState.WideStat==0){
			 result +=createHTML_Header([""],["Possible reactions"]);
				//для кожної формули
				  for (let i_r = 1; i_r <= w_react; i_r++) {
						let CurEqu= get_CurFormula(i_r);
						result+=createHTML_row([CurEqu]); 
				  }  		
		 } else {
				 let Rg = get_Reagents();
				 let StatHead =["Σν<sub>i</sub>","Σa","Σν<sub>i,j</sub>"];
				result +=createHTML_Header(["","","","Summary",""," ν<sub>i</sub>+ ... =  ν<sub>j</sub> + ... ",""," ν<sub>i</sub>/ν<sub>1</sub> + ... =  ν<sub>i</sub>/ν<sub>1</sub> + ... "],["#","Possible reactions","",StatHead,"",Rg,"",Rg]); //заголовок таблиц ν<sub>i</sub>/ν<sub>1</sub> + ...і
				result +=`<tbody>\n`;
				//для кожної формули
				  for (let i_r = 1; i_r <= w_react; i_r++) {
						let CurEqu= get_CurFormula(i_r);
						let CurStat=Summary(i_r); 
						let Si = [CurStat.rct_sum,CurStat.a_sum,CurStat.sum];
						let Ki = get_Ki(i_r); 
						let Ki_r=AxK(clone_(Ki), 1/CurStat.rct_r); Ki_r = formatA(Ki_r);
						result+=createHTML_row([i_r,CurEqu,"",Si,"",Ki,"",Ki_r]); 
				  }  	 
		 }
			result += `</tbody>\n</table><br>\n`;
	  }
	  
	  return result;
}
	
///============================================================================================================



	///============================================================================================================
	//-------Головна функція при роботі з балансер 

	function main_Balancer(){
			CalcState.WideStat = document.getElementById('wide_stat').checked;
			var subst_list = document.querySelector('textarea[name="reagents"]').value;		//отримання даних з текстового вікна
			CalcState.SourceText = subst_list;
		
			subst_list=replaceSequences(subst_list, replacements);	CalcState.ReplacedText = subst_list;
			var subst_lines = subst_list.split('\n');			CalcState.Lines = subst_lines;	// Розбиття тексту на окремі рядки
			var result = '';		// Ініціалізація змінної для зберігання результату
			// Обробка кожного рядка окремо
			subst_lines.forEach(line => {  
					 if (line.trim() === '') return; // ⬅️ переходить до наступного, якщо рядок порожній
					if (line.startsWith('//') || line.startsWith('**')) {	result  += line + '<br>'; return;	} //коментарі
					 
							Cur.Elems_Arr = Elems_List(line);	 Cur.Equ_Text = Cur.Elems_Arr[0];     //створення списку елементів	
							CalcState.Equation_arr = Equation_Split(line);   // розподіл на реактанти та продукти
							Cur.Reag_Set = Subst_List(CalcState.Equation_arr, Cur.Elems_Arr); //масив набору реагентів (для однієї реакції)
							for (let i_s = 1; i_s <= Cur.m_subst; i_s++)  Cur.Reag_Names[i_s]=Cur_SName(i_s); // формуємо список імен реагентів (глобальний)

							//dbgLog("sssss");

							Cur.React_Set = generateReactions(); // генерація нових реакцій	

							Cur.w_react =  Cur.React_Set.length-1;			//кількість реакцій	
							Cur.React_T = Cur.React_Set[0];					//типи реагентів
							Cur.start_tm = performance.now();
							Cur.step_e[0]=0;
							Balance_React(); //балансуванння реакцій, головна частина	
							Cur.clc_tm = performance.now()-Cur.start_tm;
							
							//**** переведення коецієнтів у цілі (це впливає на сортування)
							 const Int_Reagent = document.getElementById('int_react').checked;
							if (Int_Reagent)  {
								Int_React(Cur.React_Set); 
								Equal_React(Cur.React_Set);  //на випадок якщо після перерахунку виникнуть однакові реакції
							}

							//**** переведення коецієнтів на перший реактант (це впливає на сортування)
							const FRel_Reagent = document.getElementById('frel_react').checked;
							if (FRel_Reagent)  {
							FRel_React(Cur.React_Set); 
							}
								
								
							//**** вилучення тотожних реагентів (на це не впливає сортування)
							const Equ_Reag = document.getElementById('equ_reag').checked;
							if (Equ_Reag) { 
								Equal_Reag(Cur.React_Set); 
								Equal_React(Cur.React_Set); 
							}

//!!!!!
							//**** сортування реакцій для подальшої обробки
							const Sort_React = document.getElementById('sort_react').checked;		
							if (Sort_React) { 	sortingReactions(Cur.React_Set);} //**** сортування реакцій для подальшої обробки
								
							//**** обмеження по кількості реакцій (ще не реалізовано)
							//**** обмеження по кількості реактантів (ще не реалізовано)
					
							//**** вилучення зворотніх (це може змінити сортування)
							const Inv_Remove = document.getElementById('inv_react').checked;
							if (Inv_Remove) {
								Inv_React(Cur.React_Set); 
								Equal_React(Cur.React_Set); 
								if (Sort_React) sortingReactions(Cur.React_Set);}		
							
							//****визначення реакцій які входять один в одну (ще не реалізовано)
							//** З реакції з більшою кількістю реагентів можна відняти реакцію з меншою кількістю реагентів
							//** З реакції з однаковими реагентами можна відняти реакцію з такою ж кількістю реагентів
							//**в обох випадках результатом буде реакція з меншою кількістю реагентів
							//**реакцю з якою віднімалась інша реакція необхідно видалити із списку
							//****сортування нового переліку реакцій (зараз не потрібно)
							//****повторення операції розділення до моменту відсутності послідовних реакцій
							
					result += tabHTML_equation(Cur.React_Set);
					
			});
			
			result=restoreSequences(result, replacements); 
			if (result == "") result=info_text;
			document.getElementById('reactions-output').innerHTML = result;	//виведення даних у вікно результату

	}

	//-----------------------------------------------------------------------			//dbgLog(React_Set);
	//балансування реакцій
	//i_e - елемент для якого ведеться розрахунок
	//Cur.Elems_Excl - для яких баланс не розраховується
	//-----------------------------------------------------------------------
	//балансування реакцій для всіх елементів
		function Balance_React(){
					 for (Cur.i_e = 1; Cur.i_e <=  Cur.n_elem; Cur.i_e++) { // послідовно для кожного елементу
						Cur.step_e[Cur.i_e ]=1;
						if (!Cur.Elems_Excl.includes(Cur.Elems_Arr[Cur.i_e])) {	Balance_Elem(); }// урівнювання реакцій з урахуванням виключень
					}
		return Cur.React_Set;
		}


//---------------------------------------------------------------------
//---------------------------------------------------------------------
//---------------------------------------------------------------------

function Balance_Elem() {

	  // додаємо в кожний масив реакцій в 0 елемент значення балансу для данного елементу
	  	//розрахунок дебалансу для елемента
		for (let i_r = 1; i_r <= Cur.w_react; i_r++) { Cur.React_Set[i_r][0] =Cur_D(i_r, Cur.i_e);  } 
       let s_tm= performance.now();
	   
	  //балансування реакцій складанням
	   for (let i_react = 1; i_react <= Cur.w_react; i_react++) {
		let React_i = 	Cur.React_Set[i_react]; //поточна реакція
		if ( React_i[0] !== 0) { // якщо реакція не збалансована, шукаємо пару для балансування (це не обов'язково, але скорочує кільість обчислень)
			for (let ii_react = i_react + 1; ii_react <= Cur.w_react; ii_react++) { //перевіряємо всі реакції, що за ній у списку, оскільки попередні до неї реакції або збалансовані або вже використовувались
					let React_Bal = React_Balancing(React_i, Cur.React_Set[ii_react]);  // створення нового набору реагентів для сбалансованої реакції
					Cur.step_e[Cur.i_e ]+=1;					
					if (Array.isArray(React_Bal)) { // можна збалансувати тільки якщо обидві реакції незбалансовані і знаки в них протилежні
							  React_Bal = React_Norm(React_Bal);  //нормування коефіцієнтів
							  let r_react;   for (r_react = 1; r_react <= Cur.w_react; r_react++) {  if (React_Is_Match(Cur.React_Set[r_react], React_Bal)) break;  }		  // перевірка на унікальність
							  Cur.step_e[Cur.i_e ]+=1;
							  if (r_react >=  Cur.w_react){  addReaction(Cur.React_Set, React_Bal);  Cur.w_react++;	Cur.step_e[Cur.i_e ]+=1;}// якщо унікальна, то цикл добігає до кінція і додаємо її до списку
					}
			}	
		}
		if (performance.now()-s_tm > 5000) break; //виходимо з циклу якщо розрахунок більше 5000 мс
	  }

	  // перевіряємо, на можливість урівнювання 
	  d=[0,0,0]; //кількість реакцій 
	  for ( let i_react = 1; i_react <= Cur.w_react; i_react++){  if (Cur.React_Set[i_react][0] < 0)  d[0] +=1; if (Cur.React_Set[i_react][0] > 0)  d[2] +=1;  if (Cur.React_Set[i_react][0] == 0)  d[1]+=1;  }	
	  if (d[1] == 0) if(d[0]*d[2] == 0) if (d[0] != 0) Cur.dbal=" - "+Cur.Elems_Arr[Cur.i_e]+" | "; else Cur.dbal=" | - "+Cur.Elems_Arr[Cur.i_e];
	  
	  // викреслюємо всі ненульові реакції, вони були тільки для початкового набору
	  for ( let i_react = 1; i_react <= Cur.w_react; i_react++){  if (Cur.React_Set[i_react][0] !== 0) { delReactions(Cur.React_Set, i_react); Cur.w_react--; i_react--; }	  }

	 // обмежуємо молекулярність
	   let max_molecule = Criteria.Reactants; //максимальна кількість молекул реактантів
	for ( let i_react = 1; i_react <= Cur.w_react; i_react++){
				let React_i =  React_K(Cur.React_Set, i_react); //поточна реакція
				React_i = React_Int(React_i); //переведення у цілі
				let n_mole= React_MolReact(React_i); //кількість молей реактантів
				if (n_mole > max_molecule) {  Cur.step_e[Cur.i_e ]+=1;  delReactions(Cur.React_Set, i_react); Cur.w_react--; i_react--; }	  
		}

	   // обмежуємо кількість реакцій
	  let max_react=Criteria.Equations; //обмеження по кількості реакцій - розглядаємо лише перші, якщо більше не разглядаємо їх Math.min(Cur.w_react, max_react)
	  for ( let i_react = 1; i_react <= Cur.w_react; i_react++){ Cur.step_e[Cur.i_e ]+=1;  if (i_react > max_react) { delReactions(Cur.React_Set, i_react); Cur.w_react--; i_react--; }	  }

}

//-----------------------------------------------------------------------------------------------------------------------------------------------------
// дебаланс для кожної реакції по i_e елементу	
function Cur_D(i_r, i_e){
	let i_Elem_Diff=0; //дебаланс по елементу
	for (let i_s = 1; i_s <= Cur.m_subst; i_s++) {  i_Elem_Diff+=Cur_Kr(i_r)[i_s]*Cur_C(i_s)[i_e];	}
	return i_Elem_Diff;
}
	
	//-------генерація набору реакцій React_Set для початку розрахунків--------------------------------------------------------------------
	//--- Reag_Set - матриця набору реагентів, яка створюється у парсері
	//--- Reaction - перелік коефіцієнтів для реагентів з матриці набору реагентів (+,-)
	//--- React_Set - матриця коефіціентів для кожної з реакцій (кількість дорівнює кількості реагентів)

	function generateReactions() {
	  Cur.m_subst = Cur.Reag_Set.length - 1; // кількість речовин (Cur.m_subst), які беруть участь в реакції
	  Cur.n_elem = Cur.Reag_Set[0].length - 1; // кількість елементів (Cur.n_elem), які присутні в реакції
	   //матриця набору реагентів для подальших розрахунків 
	  //елементи - коефіцієнти рівняння + реактанти, - продукти
	   
	  const Reaction = New_Equation(); //початкова матриця елементного балансу
	  //dbgLog(Reaction,"*Nee Reaction");
	  //dbgLog(Cur.React_L,"*ReactL");
	  
	  Cur.React_Set = new Array(Cur.m_subst + 1); // масив з коефіцієнтами реакцій
	  for (let j = 1; j <= Cur.m_subst; j++) {let K_ = new Array(Cur.m_subst + 1).fill(0); K_[j] = 1; Cur.React_Set[j] = K_;}  //лінійно незалежна реакція може бути лише, якщо тільки один реагентів буде присутній
	  Cur.React_Set[0] = Reaction;
	   //внутрішній вміст матриці React_Set: стовпці - реагенти, рядки - елементи, значення - коефіцієнти
	  //в нульовому елементі знаходиться вихідна матриця набору реагентів 
	  return Cur.React_Set; //{0:Reaction,1:[1,1,]}
	}

	//-----створення початкової матриці Reaction елементного балансу для однієї реакції -----------------------------------------------------------
	//коефіцієнти беремо з матриці набору речовин Reag_Set
	//нульовий елемент - Indexes з вихідними значеннями коефіцієнтів
	 //внутрішня частина матриці необхідна для розрахунку елементного балансу
	  //стовпці - елементи, рядки - реагенти, значення - індекси елементів у реагенті
	  //в наборі реагентів інший порядок розташування, стовпці - реагенти, рядки - елементи, значення - індекси елементів у реагенті
	  
	function New_Equation() {
	   
	   // створення матриці матеріального балансу
	  let Equ = new Array(Cur.m_subst + 1).fill(0); // масив для коефіцієнтів кількостей речовин (для однієї реакції) [n_sust]
	  let Ind = new Array(Cur.n_elem + 1).fill(0);   //масив рядків для коефіцієнтів

	   for (let j_elem = 0; j_elem <= Cur.n_elem; j_elem++) {  //переносимо індекси з матриці набору реагентів, приймаємо початкові коефіцієнти Cur.React_L[0] = 1
		  Ind[j_elem] = new Array(Cur.m_subst + 1);  //масив кількості атомів для кожного з реагентів   
		  for (let i_subst = 0; i_subst <= Cur.m_subst; i_subst++)  Ind [j_elem][i_subst] = Cur.Reag_Set[i_subst][j_elem]; //значення кількостей атомів
	   }
	   
	   for (let i_subst = 1; i_subst <= Cur.m_subst; i_subst++)  Ind[0][i_subst] = 1;	// приймаємо початкову кількість кожного реагента рівну 1
	  
	 //!!! Винести вперед Cur.Reag_T = parseFloat(Cur.Reag_Set[i_subst][0]);
		for (let i_subst = 1; i_subst <= Cur.m_subst; i_subst++) Equ[i_subst] = parseFloat(Cur.Reag_Set[i_subst][0]);  // визначення типу реагента +1-реактант, -1-продукт
	 
 	    let CD = CalcD(Ind); 
		CD[0][0]=Array(27).fill(0);  //дані статистики
		//CD[0][0][15]=Cur.Subst_L.Src;  
		CD[0][0][17]=Cur.m_subst; 
		CD[0][0][23]="Header"; 
		Equ[0] = CD;

	  Cur.React_L=Equ;	  
	  return Equ;
	}

//----------------------------------------------------------
//----------------------------------------------------------
	//помноження на нові коефіцієнти 
	//повертає значення Indexes
	function multiplySet(Indexes, S1_) {
	  let CI = clone_(Cur.React_L);	  AxB(CI[0],S1_); 	 
	  CI = CalcD(CI); Cur.React_L=CI;  
	  return Cur.React_L; //перерахунок статистики
	}


//---------------------------------------------------
	// Indexes для значень коефіцієнтів певної реакації - 
	function Equ_KIndexes(i_react) {
		let CI = 	(Cur.React_L); 
		         //CI[0][0]=Cur.React_L[0][0];
		AxB(CI[0],Cur_T()); 	AxB(CI[0],Cur_Nr(i_react));   CI = CalcD(CI);
		CI[0][0][22]="<br>Рядок для таблиці";
		Cur.React_L = CI; 
	return Cur.React_L;
	}


function CalcD(Indexes){
			  // розрахунок кількості атомів та елементів по елементам

		  const n_elem = Cur.n_elem; //загальна кількість елементів
		  const m_subst =  Cur.m_subst; //загальна кількість речовин
			
		  for (let i = 1; i <= n_elem; i++) {
			//розрахунок по кожному елементу
			let i_Elem_Diff=0; //дебаланс по елементу
			for (let j = 1; j <= m_subst; j++) {
			  let Elem_Amount = Indexes[0][j];// кількість реагента в Indexes[0][j] - може бути від'ємна для продуктів
			  let i_Elem_Index = Indexes[i][j];//кількість елемента в речовині в Indexes[i][j]
			  let i_Elem = i_Elem_Index * Elem_Amount; //кількість одиниць елементу для речовини j
			  i_Elem_Diff+=i_Elem; // 
			  //кількість одиниць елементу окремо для реактанту та реагенту i
			}
			Indexes[i][0] = i_Elem_Diff; //значення дебалансу в 0 елемент Indexes
		  }
return Indexes;
}

	//-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	//-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	//-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
	//-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

	//-----------------------------------------------------------------------------------------------------------------------------------
	//Вектор фактичних коефіцієнтів реакції
	function React_K(React_Set, i_react){
		  const R_Mask = React_Set[0]; //маска реагентів
		  let Cur_K = clone_(React_Set[i_react]); //коефіцієнти реакції
		  for ( let i_subst = 1; i_subst <= Cur_K.length-1; i_subst++){  Cur_K[i_subst]*=R_Mask[i_subst]; }
	   return Cur_K;
	}

	function React_Indexes(React_Set){ return React_Equ(React_Set)[0]; } //Indexes - React_Set[0][0]
	//function React_Balance(React_Set, r_react){return React_Set[r_react][0];} //баланс для реакції
	function React_Equ(React_Set){ return React_Set[0]; } //базова реакція


	//розрахунок дебалансу для елемента
	function React_Init(){	
		 for (let r_react = 1; r_react <= Cur.w_react; r_react++) {
			 Cur.React_L =Cur.React_Set[0][0];
			 let Indexes = Equ_KIndexes(r_react);  //розрахунок балансу по елементам
			 Cur.React_Set[r_react][0] = Indexes[Cur.i_e][0]; 
		 } 
	//CalcD();
	return Cur.React_Set;
	}

	//збалансована реакція
	function React_Balancing(React_1,React_2){
		let Balance_1 = React_1[0]; //дебаланс для першої реакцї
		let Balance_2 = React_2[0]; //дебаланс для другої реакції
		if (Balance_1*Balance_2 >=0 )  return 0; //реакції не можуть бути урівняні
		let React_Bal = clone_(React_2); //збалансована реакція
		const m_subst = React_Bal.length - 1; // кількість реагентів
		for (let i_subst = 1; i_subst <= m_subst; i_subst++) { 
					React_Bal[i_subst] = React_1[i_subst] * Math.abs(Balance_2) + React_2[i_subst] * Math.abs(Balance_1);  //дебаланс саме для елементу
		}
		React_Bal[0] = 0; //позначаємо що реакція збалансована
		return React_Bal;
	}

	//нормована реакція
	function React_Norm(React){
		const m_subst = React.length - 1; // кількість реагентів
		let Min_K = 1000; //максимальне співвідношенння
		for (let i_subst = 1;i_subst <= m_subst;i_subst++) { 
				if (React[i_subst] > 0 && React[i_subst] < Min_K) Min_K = React[i_subst]; // мінімальне значення коефіцієнта
			  }
		// перераховуємо всі значення включно з дебалансом
		for (i_subst = 0;i_subst <= m_subst;i_subst++) { 
			React[i_subst]=React[i_subst]/Min_K; 
		}	
		return React;
	}

	//переведення до цілих коефіцієнтів
	function React_Int(React){
		const m_subst = React.length - 1; // кількість реагентів
		let Min_fract = 0; //значення дробової частини
		for(let i=0; i<5; i++){
				for (let i_subst = 1;i_subst <= m_subst;i_subst++) {  let fract = React[i_subst] % 1;  if (fract > Min_fract ) Min_fract = fract;  } 
				if (Min_fract < 1/100) break;
				for (let i_subst = 1;i_subst <= m_subst;i_subst++)  React[i_subst] /= Min_fract;
				Min_fract = 0;
		}
	   for (let i_subst = 1;i_subst <= m_subst;i_subst++)  React[i_subst]= format_x(React[i_subst]);
	   return React;
	}

	//переведення до першого реактанта
	function React_FRel(React){
		const m_subst = React.length - 1; // кількість реагентів
		let Krel = 0; //значення дробової частини
		for (let i_subst = 1;i_subst <= m_subst;i_subst++)  {Krel = React[i_subst]; if (Krel) break; }
	   for (let i_subst = 1;i_subst <= m_subst;i_subst++)  React[i_subst]= format_x(React[i_subst]/Krel);
	   return React;
	}

	//однакова реакція
	function React_Is_Match(React_1, React_2){
		let Rel = -1; //встановлюємо неможливе співвідношення
		let Diff= 0.01; //точність різниці
		let m_subst = React_1.length - 1; // кількість реагентів
		let i_subst; for (i_subst = 1;i_subst <= m_subst;i_subst++) {
				let K_1 = React_1[i_subst];  //коефіцієнт для рівняння у переліку
				let K_2 = React_2[i_subst];
				if (Math.abs(K_1 - K_2) > 0.01) {  //коефіцієнти відрізняються
					if (K_1 * K_2 === 0) break; // один із коефіцієнтів 0 - реакції відрізняються
					if (Rel === -1 && K_2 !== 0) Rel = K_1/ K_2; //встановлюємо співвідношення між коефіцієнтами для подальшого порівняння (обидва коефіцієнти мають не нульове значення, тому помилки /0 не буде)
					if (Math.abs(Rel - K_1/K_2)>Diff) break; //вважаємо не рівними якщо співвідношення відрізняються
				}
		}
		return (i_subst > m_subst); //реакції однакові, якщо цикл було виконано до кінця
	}

	//молекулярність реакції
	function React_MolReact(React){
		const m_subst = React.length - 1; // кількість реагентів
		let mole_react = 0;
		for (let i_subst = 1;i_subst <= m_subst;i_subst++) { if (React[i_subst]>0) mole_react +=React[i_subst];  } 
	   return mole_react;
	}


		
	//----------------------------------------------------------------------------------------------------------------------------------------------------------------------
	//-------------------------------------------------------------------------------------------------------------------------------------------------------------------
	//коефіцієнти у цілих числах
	function Int_React(React_Set){
		let w_reaction = React_Set.length - 1; // кількість реакцій
		for (let r_i = 1; r_i <= w_reaction; r_i++) {
		Cur.step_e[0 ]+=1;
		React_Int(React_Set[ r_i]);
		}
	return React_Set;
	}

	//-------------------------------------------------------------------------------------------------------------------------------------------------------------------
	//Коефіцієнти на 1й реактант
	function FRel_React(React_Set){
		let w_reaction = React_Set.length - 1; // кількість реакцій
		for (let r_i = 1; r_i <= w_reaction; r_i++) {
		Cur.step_e[0 ]+=1;
		React_FRel(React_Set[ r_i]);
		}
	return React_Set;
	}


	//------------------------------------------------------
	//скорочує однакоі реагенти зліва та справа
	function Equal_Reag(React_Set){
		for (let r_reaction = 1; r_reaction <= Cur.w_react; r_reaction++) {
			let Coeffs = Cur.React_Set[r_reaction]; //коефіцієнти реагентів для рівняння
			//цикл для реактантів - скорочуються речовини однакові за назвою
			for (let i_react = 1; i_react <= Cur.r_rct; i_react++) {
				//цикл для продуктів
				for (let j_prod = Cur.r_rct+1; j_prod <= Cur.r_rct+Cur.p_prd; j_prod++) {
						Cur.step_e[0 ]+=1;
						if (Cur.Reag_Names[i_react] == Cur.Reag_Names[j_prod]) { //якщо імена співпадають
						if  (Math.abs(Coeffs[i_react])<0.02) Coeffs[i_react] =0;
						if  (Math.abs(Coeffs[j_prod])<0.02) Coeffs[j_prod] =0;			
							
						if (Coeffs[i_react] && Coeffs[j_prod]) {
										if (Coeffs[i_react] < Coeffs[j_prod]) {
											Coeffs[j_prod]-=Coeffs[i_react]; Coeffs[i_react]=0;}
										else {
											Coeffs[i_react]-=Coeffs[j_prod]; Coeffs[j_prod]=0;}			
						} 
					}
				}
			}
			//підраховуємо суму всіх коефіцієнтів

			let sum_Coeff=0; for (let i_reag = 1; i_reag < Cur.r_rct+Cur.p_prd; i_reag++) sum_Coeff+=Coeffs[i_reag];
			//якщо всі коефіцієнти нульові то видаляємо цю реакцію
			if (sum_Coeff <= 0.02) {
					Cur.React_Set.splice(r_reaction,1);
					Cur.w_react-=1;
					r_reaction-=1;
			}
		}
	return Cur.React_Set;
	}

	//------------------------------------------------------
	//видалення однакових реакцій
	//порівнюються коефіцієнти
	function Equal_React(React_Set){
		//основний цикл - реакція зразок від 1 до w_reaction-1
		for (let r_sample = 1; r_sample <= Cur.w_react-1; r_sample++) {
			let Coeffs_s = Cur.React_Set[r_sample]; //коефіцієнти реагентів для рівняння
			//цикл для реакцій порівнянь - від r_sample+1 до w_reaction
			for (let r_comp = r_sample+1; r_comp <= Cur.w_react; r_comp++) {
			let Coeffs_c = Cur.React_Set[r_comp]; //коефіцієнти реагентів для рівняння
				//флаг повного спіпвпадіння - якщо ВСІ коефіцієнти однакові
				let isEqual=1; //приймаємо що вони тотожні
				let rel=0;
				for (let i_reag = 1; i_reag <= Cur.r_rct+Cur.p_prd; i_reag++) {
					Cur.step_e[0 ]+=1;
					if  (Coeffs_s[i_reag]<0.02 && Coeffs_c[i_reag]>0.02) {isEqual=0; break;} //якщо коефіцієнт зразку 0 а порівняння не нульовий, то не тотожні
					if(!rel && Coeffs_s[i_reag]>0.02) rel = Coeffs_c[i_reag]/Coeffs_s[i_reag]; //встановлюємо співвідношення якщо воно ще не було встановлено
					if(Coeffs_s[i_reag]>0.02) if (Math.abs(rel - Coeffs_c[i_reag]/Coeffs_s[i_reag])>0.02){isEqual=0; break;}  //якщо коефіцієнт не нульовий, перевіряємо на співвідношення
				}
			//якщо реаакції тотожні, то видаляємо реакцію порівняння
			if (isEqual == 1) {	
				Cur.step_e[0 ]+=1;
				Cur.React_Set.splice(r_comp,1); Cur.w_react-=1; r_comp-=1; }
			}
		}
	return Cur.React_Set;
	}

	//------------------------------------------------------
	//видалення протилежних реакцій
	//порівнюються коефіцієнти продуктів та реагентів
function Inv_React(React_Set){
		let wasDel;
		do{
			wasDel=0;
			//основний цикл - реакція зразок від 1 до w_reaction-1
			for (let r_1 = 1; r_1 <= Cur.w_react-1; r_1++) {
				//-------------------------------------------------------------------------------- реакції прямі r1
				let K_1 = Cur.React_Set[r_1]; //коефіцієнти реагентів для рівняння 1
				
				match_r = 0; //
				for (let r_2 = r_1+1; r_2 <= Cur.w_react; r_2++) {
				//===================================== реакції зворотні ? r2 	//цикл для реакцій порівнянь - від r_1+1 до Cur.w_react
				
						let K_2 = Cur.React_Set[r_2]; //коефіцієнти реагентів для рівняння 2
						let isInv=1; //приймаємо що вони інверсні
						
							no_one=1; //жодне ім'я не співпадає
							for (let i_reag = 1; i_reag <= Cur.r_rct; i_reag++) {
								//++++++++++++++++++++++++++++++++++++++++ співпадіння по реактантам
								if  (K_1[i_reag] !=0) no_one=1; 
								for (let j_prod= Cur.r_rct+1; j_prod<= Cur.r_rct+Cur.p_prd; j_prod++) {
											if (Cur.Reag_Names[i_reag] == Cur.Reag_Names[j_prod]) {  //назви співпадають
													Cur.step_e[0 ]+=1;
													isInv=1; //якщо співпадіння є то припускаємо що вони інверсні
													no_one = 0;
													//якщо коефіцієнти реактанта першої реакції відрізняються від коефіцієнтів продуктів другої то вони не інверсні
													if (K_1[i_reag] !== K_2[j_prod] || K_2[i_reag] !== K_1[j_prod])  isInv=0; 
													break; //переходимо до наступного реактанта
											}
											if (isInv == 0) break; //перше не співпадіння закінчує цикл як не інверсні
								}
								if (no_one == 1) isInv = 0; //було жодного співпадіння імен для пари реакцій
								if (isInv == 0) break; // якщо буле неспівпадіння то вважаємо що це не інверсні реакції
								//++++++++++++++++++++++++++++++++++++++++ співпадіння по реактантам
							}
		
							if (no_one == 1) continue; // якщо  жодного  співпадіння імен, то  перевіряти  далі  реакцію  не  потрібно, переходимо до наступної r2
							if (isInv == 0) continue; // якщо не  співпали  коефіцієнти,   то також  далі  не перевіряємо, переходимо до наступної r2
							
							//якщо співпадіння було, може бути  неспівпадіння по продуктам
							no_one=1; //приймаємо що імена не співпадають, 
							
							for (let j_prod= Cur.r_rct+1; j_prod<= Cur.r_rct+Cur.p_prd; j_prod++) {
								//++++++++++++++++++++++++++++++++++++++++ співпадіння по продуктам
								if  (K_1[j_prod] !=0) no_one=1; 
								for (let i_reag = 1; i_reag <= Cur.r_rct; i_reag++) {
											if (Cur.Reag_Names[j_prod] == Cur.Reag_Names[i_reag]) {  //назви співпадають
													Cur.step_e[0 ]+=1;
													isInv=1; //якщо співпадіння є то припускаємо що вони інверсні
													no_one = 0;
													//якщо коефіцієнти реактанта першої реакції відрізняються від коефіцієнтів продуктів другої то вони не інверсні
													if (K_1[i_reag] !== K_2[j_prod] || K_2[i_reag] !== K_1[j_prod])  isInv=0; 
													break; //переходимо до наступного реактанта
											}
											if (isInv == 0) break; //перше не співпадіння закінчує цикл як не інверсні
								}
								if (no_one == 1) isInv = 0; //було жодного співпадіння імен для пари реакцій
								if (isInv == 0) break; // якщо буле неспівпадіння то вважаємо що це не інверсні реакції
								//++++++++++++++++++++++++++++++++++++++++ співпадіння по продуктам
							}
							
							if (no_one == 1) isInv =	 0; //було жодного співпадіння імен для пари реакцій
							//якщо реаакції тотожні, то видаляємо реакцію порівняння
							if (isInv == 1) { Cur.step_e[0 ]+=1; Cur.React_Set.splice(r_2,1); Cur.w_react-=1; r_2-=1; wasDel=1; break;} //видаляємо реакцію r2 та переходимо до наступної r1
				//===================================== реакції зворотні ? r2			
				}
			   //-------------------------------------------------------------------------------- реакції прямі r1
			}
		}while(wasDel=0); //виходимо з циклу якщо не було жодної інверсної реакції
	return Cur.React_Set;
}

	//-----------------------------------------------------------------------
		//сортування реакцій по мірі їх ускладненн
	//i_e - елемент для якого ведеться розрахунок
	function sortingReactions(React_Set) {
	  let w_react = React_Set.length - 1; // кількість реакцій
	  let changed = 0; n_changes=w_react*w_react;
	  do {
		  let i = 2; changed = 0;
		  do { 
			Cur.step_e[0 ]+=1;
			if (i > w_react) break; // якщо номер реакції більше за початкову кількість, то вихід з циклу
			if (A_more_B(React_Set, i-1, i)){
				React_Set=swapReactions(React_Set, i-1, i); //обмінюємо положення двох реакцій
				changed = 1;
			}
			i++; n_changes-=1;
		   } while (1);
	 } while (changed > 0 && n_changes>0);
	 return React_Set;
	} 

	//------------------------------------------------------
	//------------------------------------------------------	
	//------------------------------------------------------
	//видаляє реакцію із списка реакцій
	function delReactions(React_Set, Del_R) {
	  const w_react = React_Set.length - 1; // кількість реакцій
	  for (let ii_react = Del_R; ii_react < w_react; ii_react++) React_Set[ii_react] = React_Set[ii_react + 1];
	  React_Set.pop();
	  return React_Set;
	}

	//------------------------------------------------------
	// додає нову реакцію до списку реакцій
	function addReaction(React_Set, new_React) { React_Set.push(new_React); }

	//------------------------------------------------------
	// Міняє місцями два елементи масиву
	function swapReactions(React_Set, React1, React2) {
	  const temp = React_Set[React1];   React_Set[React1] = React_Set[React2];   React_Set[React2] = temp;
	  return React_Set;
	}


	//----------------------------------------------------------------
	//службова функція для дублювання масивів
	function clone_(Old) {
   // null або примітив
    if (Old === null || typeof Old !== "object") {  return Old;  }
    // Масив
    if (Array.isArray(Old)) {  const n = Old.length;   let New = new Array(n);  for (let i = 0; i < n; i++) { New[i] = clone_(Old[i]); }     return New;  }
    // Об’єкт
    let New = {};   for (let key in Old) {  if (Object.prototype.hasOwnProperty.call(Old, key)) { New[key] = clone_(Old[key]); } }
	return New;
	}

