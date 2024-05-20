const DOMAIN = 'learn.01founders.co';

const JSESSIONID = 'GRAPHQL_JSESSIONID';

checkSession();

let chartColors = setChartColors();

function checkSession(){
    let token = getCookie(JSESSIONID);
    
    if(token){
        loadMainPage();
    }else{
        renderLogInPage();
    }
}

function renderLogInPage(){
    let content = `
    <div class="container">
        <div class="card log-in-container">
        <img src="images/logo.png" width="150px" height="150px">
            <form id="login-form">
                <input class="login-input" id="login-input-email" type="email" placeholder="Email or Username">
                <input class="login-input" id="login-input-password" type="password" placeholder="Password">
                <div class="error-message" id="log-in-error"></div>
                <input class="login-button" id="login-button-submit" type="submit" value="SIGN IN">
            </form>
        </div>     
    </div>
    `

    document.body.innerHTML = content;

    document.getElementById('login-button-submit').addEventListener('click', async (e)=>{
        e.preventDefault();
        
        let user = document.getElementById('login-input-email').value;
        let password = document.getElementById('login-input-password').value;
      
        const token = await getToken(user, password);
        if (token.error){
            showLogInError(token.error)
            return;
        }    
    
        setCookie(JSESSIONID, token, 1);   
    
        loadMainPage();  
    
    });

}

function showLogInError(error){
    let logInErrorElement = document.getElementById('log-in-error');
    logInErrorElement.style.display = 'block';
    logInErrorElement.innerText = error;

}

async function loadMainPage(){

    document.body.innerHTML = '';


    let container = document.createElement('div');
    container.classList.add('container');

    let token = getCookie(JSESSIONID);
    const users = await getUser(token);
    if(!users){
       return;
    }
    let user = users.user[0];
    if(!user){        
        return;
    }

    let campus = user.campus;
    campus = campus.charAt(0).toUpperCase() + campus.slice(1);

    //Create top Element
    let welcomeElementContainer = document.createElement('div');
    welcomeElementContainer.classList.add('card');
    welcomeElementContainer.classList.add('welcome-container');

    let welcomeElement = document.createElement('div');    
    welcomeElement.classList.add('welcome-message');
    welcomeElement.innerText = `Welcome ${user.firstName} ${user.lastName}!
    Campus: ${campus}`;
    welcomeElementContainer.appendChild(welcomeElement);
    container.appendChild(welcomeElementContainer);

    let signOutButton = document.createElement('input');
    signOutButton.setAttribute('type', 'image');
    signOutButton.setAttribute('src', '/images/logout.svg');
    signOutButton.setAttribute('alt', 'Sign Out');
    signOutButton.setAttribute('width', '32');
    signOutButton.setAttribute('height', '32');
    signOutButton.setAttribute('id','sign-out-button');    
    welcomeElementContainer.appendChild(signOutButton);


    //Pie Chart

    let pieContainer = document.createElement('div');
    pieContainer.classList.add('card');
    pieContainer.classList.add('pie-container');
    
    let skillsLabel = document.createElement('div');
    skillsLabel.innerText = "Skills";
    skillsLabel.classList.add('welcome-message');
    pieContainer.appendChild(skillsLabel);
    
    let skills = await getSkills(token);
    let skillsArr = groupSkills(skills);
    let skillsSVG = calculateSkillsSVG(skillsArr);
    pieContainer.appendChild(skillsSVG);

    container.appendChild(pieContainer);


    //Audit
    let auditRaw = await getAudits(token);
    let audit = auditRaw.audit.map(item => {
        let grade = item.grade;
        let capitan = item.group.captain.login;
        let endAt = item.endAt;
        let code = item.private.code;
        let name = item.group.object.name;

        const milli = Date.parse(endAt);
        const now = Date.now();

        let status = undefined;
        if(grade === null){
            if(now<milli){
                status = 'PENDING';
                return {name, capitan, status, code}
            }else{
                status = 'EXPIRED';
            }
        }else{
            status = 'PASS';
        }
        return {name, capitan, status}

    });

    let auditContainer = document.createElement('div');
    auditContainer.classList.add('card-invert');
    auditContainer.classList.add('audit-container');
    
    //Create audit element
    let auditsContainer = `<ul class="audits-list">`;
    audit.forEach(item => {
        let textColor = '#FFF'
        switch(item.status){
            case 'PASS':
                textColor = 'green';
            break;
            case 'EXPIRED':
                textColor = 'red';
            break;
            case 'PENDING':
                textColor = '#FFA500';
            break;
        }

        if(item.code){                
            auditsContainer+=
            `<li>
            <div class="audit-item-project-name">${item.name}</div>
            <div class="audit-item-capitan-name">${item.capitan}</div>
            <div class="audit-item-status" style="color: ${textColor};">${item.status}</div>
            <div class="audit-item-code" style="color: ${textColor};"> ${item.code}</div>
            </li>`
        }else{
            auditsContainer+=
            `<li>
            <div class="audit-item-project-name">${item.name}</div>
            <div class="audit-item-capitan-name">${item.capitan}</div>
            <div class="audit-item-status" style="color: ${textColor};">${item.status}</div>
            </li>`
        }
    
    });
    auditsContainer += `</ul>`;
    auditContainer.innerHTML = auditsContainer;
    container.appendChild(auditContainer);


    //XPS
    let tabsContainer = document.createElement('div');
    tabsContainer.classList.add('card');
    tabsContainer.classList.add('tabs-container');


    //Get XP data
    const xpPiscineGoArray = await getXPBySection(token, '/london/piscine-go/');
    let piscineGoTotalXp = calculateXP(xpPiscineGoArray);
    let piscineGoSVGData = calculateSVG(xpPiscineGoArray);
    let piscineGoStat1 = createSVG(piscineGoSVGData);

    const weekFourArray = await getXPBySection(token, '/london/weekfour/');
    let weekFourTotalXp = calculateXP(weekFourArray);
    let weekFourSVGData = calculateSVG(weekFourArray);
    let weekFourStat1 = createSVG(weekFourSVGData);

    const div01Array = await getDiv01XP(token);
    let div01ArrayTotalXp = calculateXP(div01Array);
    let div01SVGData = calculateSVG(div01Array);
    let divO1Stat1 = createSVG(div01SVGData);
  
    const js2WeeksArray = await getXPBySection(token, '/london/div-01/piscine-js-2weeks/');
    let js2WeeksTotalXp = calculateXP(js2WeeksArray);
    let js2WeeksSVGData = calculateSVG(js2WeeksArray);
    let js2WeeksStat1 = createSVG(js2WeeksSVGData);
   
    const piscineJSArray = await getXPBySection(token, '/london/div-01/piscine-js/');
    let piscineJSTotalXp = calculateXP(piscineJSArray);
    let piscineJSSVGData = calculateSVG(piscineJSArray);
    let piscineJSStat1 = createSVG(piscineJSSVGData);

    //Make tabs
    let tabs = `
    <div class="tabs-parent">

        <div class="tab-buttons" id="tabs-buttons">
            <button class="tab-button tab-selected" id='piscine-go-button'>Piscine-Go</button>
            <button class="tab-button" id='week-four-button'>Week Four</button>
            <button class="tab-button" id='div-01-button'>Div-01</button>
            <button class="tab-button" id='piscine-js-2weeks-button'>Piscine-js-2weeks</button>
            <button class="tab-button" id='piscine-js-button'>Piscine-Js</button>
        </div> 

        <div id="piscine-go-content" class="tab-content">
            <h2>Piscine-Go</h2>
            <p>Total XP: ${formatXP(piscineGoTotalXp)}</p>
            <div class="stat-one-container">  ${piscineGoStat1.innerHTML} </div>
        </div>

        <div id="week-four-content" class="tab-content" style="display:none">
            <h2>Week Four</h2>
            <p>Total XP: ${formatXP(weekFourTotalXp)}</p>
            <div class="stat-one-container">  ${weekFourStat1.innerHTML} </div>
        </div>
        
        <div id="div-01-content" class="tab-content" style="display:none">
            <h2>Div-01</h2>
            <p>Total XP: ${formatXP(div01ArrayTotalXp)}</p>
            <div class="stat-one-container">  ${divO1Stat1.innerHTML} </div>
        </div>

        <div id="piscine-js-2weeks-content" class="tab-content" style="display:none">
            <h2>Piscine-js-2weeks</h2>
            <p>Total XP: ${formatXP(js2WeeksTotalXp)}</p>
            <div class="stat-one-container">  ${js2WeeksStat1.innerHTML} </div>
        </div>

        <div id="piscine-js-content" class="tab-content" style="display:none">
            <h2>Piscine-Js</h2>
            <p>Total XP: ${formatXP(piscineJSTotalXp)}</p>
            <div class="stat-one-container">  ${piscineJSStat1.innerHTML} </div>
        </div>

    </div>`;
    tabsContainer.innerHTML = tabs;

    container.appendChild(tabsContainer);

    document.body.appendChild(container);

    //Listeners
    
   //Sign out button listener    
    document.getElementById('sign-out-button').addEventListener('click', ()=>{
        deleteCookie(JSESSIONID);
        renderLogInPage();
    }); 

    
    //Point hover
    let infoBox = document.createElement('div');
    infoBox.classList.add('svg-graph-point-text');
    infoBox.style["color"] = "#9966ff";
    infoBox.style["font-size"] = "0.8rem";
    infoBox.style.position = 'absolute';
    infoBox.style.display = 'none';
    document.body.appendChild(infoBox);

    document.getElementsByClassName('tabs-parent')[0].addEventListener('mouseover', (e) => {
       let className = e.target.getAttribute('class');
       if(className === 'svg-graph-point'){
          infoBox.innerText = `Date: ${e.target.dataset.x}
          XP: ${e.target.dataset.y}`;
          infoBox.style.left = `${e.layerX+15}px`;
          infoBox.style.top = `${e.layerY+15}px`;
          infoBox.style.display = 'block';          
       }        
    });


     //Tabs listeners
     document.getElementById('tabs-buttons').addEventListener('click', e=>{

        if(e.target.className === 'tab-button'){
    
            infoBox.style.display = 'none';

            let x = document.getElementsByClassName("tab-button");

            for (let i = 0; i < x.length; i++) {
                x[i].classList.remove('tab-selected');
            }
            document.getElementById(e.target.id).classList.add('tab-selected');    
    
            switch(e.target.id){
                case "piscine-go-button":
                    openTab('piscine-go-content', piscineGoSVGData);                                       
                break;
                
                case "week-four-button":
                    openTab('week-four-content', weekFourSVGData);
                break;
                        
                case "div-01-button":
                    openTab('div-01-content', div01SVGData);
                break;
    
                case "piscine-js-2weeks-button":
                    openTab('piscine-js-2weeks-content', js2WeeksSVGData);
                break;
    
                case "piscine-js-button":
                    openTab('piscine-js-content', piscineJSSVGData);
                break;                    
            }
        }    
    }); 
}

function openTab(tabName) {
    let x = document.getElementsByClassName("tab-content");
    for (let i = 0; i < x.length; i++) {
      x[i].style.display = "none";
    }
    let tab = document.getElementById(tabName);
    tab.style.display = 'block';
}

async function getToken(user, password){
    const endpoint = `https://${DOMAIN}/api/auth/signin`;    
    let headers = new Headers();
    const info ='Basic ' + btoa(user + ":" + password);
    headers.append('Authorization', info);
    headers.append('Accept', 'application/json');
    return await fetch(endpoint, {
        method: 'POST',
        headers: headers,
    })
    .then(response => response.json())
    .then(data => {
       return data;       
    })
}

async function getUser(token){

    let query = `
    {
        user {              
            firstName
            lastName
            campus
        }
      }
    `;

    return await fetchData(token, query)
    .then(data => {
        return data.data
    });

}

async function getXPBySection(token, arg){

    let query = 
    `
    query getXPs($arg: String)
    {
      transaction(where :{path:{_regex: $arg}, type :{_eq : "xp"}}){        
        amount
        createdAt      
      }
    }    
    `

    return await fetchData(token, query, arg)
    .then(data => {
        return data.data.transaction
    });

}

async function getDiv01XP(token){

   let query = `{
        transaction(where: {_and: [
              {path: {_like: "%div-01%"}},
              {path: {_nlike: "%div-01/piscine-js/%"}},
              {path: {_nlike: "%div-01/piscine-js-2weeks/%"}},
             
        ],type :{_eq : "xp"}}){      
              amount
                  createdAt
            }
      }`

    return await fetchData(token, query)
    .then(data => {
        return data.data.transaction;
    });

}

async function fetchData(token, query, arg){
    const endpoint = `https://${DOMAIN}/api/graphql-engine/v1/graphql`;
    if(arg){
        return fetch(endpoint, {
            method: 'POST',
            headers: new Headers({
                'Authorization': `Bearer ${token}`           
            }),
            body: JSON.stringify({
                query,
                variables: {arg}           
            })
        })
        .then(response => response.json())
    }

    return fetch(endpoint, {
        method: 'POST',
        headers: new Headers({
            'Authorization': `Bearer ${token}`           
        }),
        body: JSON.stringify({
            query         
        })
    })
    .then(response => response.json())   

}

function calculateXP(arr){
    let total = 0;
    arr.forEach(item => {
        total+=item.amount;
    });
    return  Math.round(total * 10) / 10;
}

function formatXP(xp){
    if(xp>1000000){
        let m = xp/1000000;
        let r = Math.round(m * 100) / 100;
        return `${r}M`
    }
    let m = xp/1000
    let r = Math.round(m * 10) / 10;
    return `${r}K`
}

function calculateSVG(arr){

    let groups = new Map();

    //Group By Date
    arr.forEach(item => {
        let d = new Date(item.createdAt);
       
        const day = d.getDate();
        let dayStr = day.toString();
        if(day<10){
            dayStr = '0'+dayStr;
        }

        const month = d.getMonth() + 1;
        let monthStr = month.toString();
        if(month<10){
            monthStr = '0'+monthStr;
        }

        const year = d.getFullYear();
        let date =  `${year}-${monthStr}-${dayStr}`;

        if(groups.get(date)){
            groups.set(date, groups.get(date) + item.amount)
        }else{
            groups.set(date, item.amount)
        }
    });  

    //Map to Array
    let groupsArr = [];
    groups.forEach((amount, date) => {
        let milli =  Date.parse(date);
        groupsArr.push({date, amount, milli: milli/1000});        
       
      });

    //Sort
    groupsArr.sort((item1, item2) => {
        return item1.milli - item2.milli;
    });  
    
    //Range X
    let firstX = groupsArr[0].milli;
    let lastX = groupsArr[groupsArr.length-1].milli
    let rangeX = lastX - firstX;
    let xCef = 24/rangeX;  

    //RangeY
    let rangeY = 0;
    groupsArr.forEach(({amount}) =>{
        rangeY+=amount;
    });
    let yCef = 24/rangeY;
    let result = [];
    let cum = (groupsArr[0].amount)*yCef;
    let cumVal = groupsArr[0].amount;   
    let item = {
        X : {coordX: (groupsArr[0].milli - firstX)*xCef, valueX: groupsArr[0].date},
        Y : {coordY: cum, valueY: cumVal}
    }
    result.push(item);

    for(let i = 1; i<groupsArr.length; i++){
        cum +=groupsArr[i].amount*yCef;
        cumVal+=groupsArr[i].amount

        item = {
            X : {coordX: (groupsArr[i].milli - firstX)*xCef, valueX: groupsArr[i].date},
            Y : {coordY: cum, valueY: cumVal}
        }       
        result.push(item);
    }   
    return result;    
}

function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  let expires = "expires="+ d.toUTCString();
  let cookieString = cname + "=" + cvalue + ";" + expires + ";path=/";
  document.cookie = cookieString;
}

function deleteCookie(cname){
  document.cookie = `${cname}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

function createSVG(coords){
    let statOneContainer = document.createElement('div');

    const statOneSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    statOneSvg.setAttribute('fill', 'none');
    statOneSvg.setAttribute('viewBox', '0 0 24 24');
    statOneSvg.setAttribute('stroke', 'black');
    
    //LineX
    const lineX = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    lineX.setAttribute('x1', '0');
    lineX.setAttribute('y1', '24');
    lineX.setAttribute('x2', '24');
    lineX.setAttribute('y2', '24');
    lineX.setAttribute('style', 'stroke:rgb(255,255,255);stroke-width:0.2');
    statOneSvg.appendChild(lineX);

    //LineY
    const lineY = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    lineY.setAttribute('x1', '0');
    lineY.setAttribute('y1', '24');
    lineY.setAttribute('x2', '0');
    lineY.setAttribute('y2', '0');
    lineY.setAttribute('style', 'stroke:rgb(255,255,255);stroke-width:0.2');
    statOneSvg.appendChild(lineY);

    //Path
    const iconPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    
    let path = `M${coords[0].X.coordX} ${24 - coords[0].Y.coordY}`;
    for(let  i = 1; i<coords.length; i++){
        path += `L${coords[i].X.coordX} ${24 - coords[i].Y.coordY} `;
    }

    iconPath.setAttribute('d', path);
    iconPath.setAttribute('style', 'stroke:rgb(255,255,255);stroke-width:0.2');
    statOneSvg.appendChild(iconPath);



    //add points
    for(let  i = 0; i<coords.length; i++){
        let x = coords[i].X.coordX;
        let y =  coords[i].Y.coordY;
        let point =  document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        point.setAttribute('cx', `${x}`);
        point.setAttribute('cy', `${24-y}`);
        point.setAttribute('r', '0.2');
        point.setAttribute('stroke', 'blue');
        point.setAttribute('fill', 'blue');
        point.setAttribute('stroke-width', '0.05');
        point.setAttribute('class', 'svg-graph-point');
        point.dataset.x = `${coords[i].X.valueX}`;
        point.dataset.y = `${coords[i].Y.valueY}`;
        statOneSvg.appendChild(point);
    }



    statOneContainer.appendChild(statOneSvg);
    return statOneContainer;

}

async function getSkills(token){

    let query = 
    `
    {
        transaction(where : {type : {_like: "%skill%"}}){
        amount
        type
      }
    }    
    `

    return await fetchData(token, query)
    .then(data => {
        return data.data.transaction
    });

}

function groupSkills(skills){
    
    let skillsMap = new Map();
    
    skills.forEach(item =>{
        let type = item.type.replace("skill_","");

        if(skillsMap.get(type)){
            skillsMap.set(type, skillsMap.get(type) + item.amount);
        }else{
            skillsMap.set(type, item.amount);
        }
    });

   
    //Map to Array
    let skillsArr = [];
    skillsMap.forEach((amount, type) => {
       
        skillsArr.push({type, amount});       
       
      });

      return skillsArr;

    
}

function calculateSkillsSVG(skillsArr){   

    let pieSVGContainer = document.createElement('div');
    pieSVGContainer.style["width"] = "300px";
    pieSVGContainer.style["height"] = "300px";

    const pieSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    pieSvg.setAttribute('viewBox', '0 0 24 24');

    //Get total value of skills
    let total = 0;
    skillsArr.forEach(item => {
        total += item.amount;
    });

    //Draw sectors
    let currentAngle = 0;
    let newAngle = 0;      
    skillsArr.forEach(item => {
        newAngle = item.amount*360/total+currentAngle;
        let color = chartColors.get(item.type);
        if(!color) color = '#ddd';
        addSector(pieSvg, currentAngle, newAngle, color);      
        currentAngle = newAngle;     
    }); 


    let pieChartContainer = document.createElement('div');
    pieChartContainer.style["display"] = "flex";
    pieChartContainer.style["flex-direction"] = "row";
    pieChartContainer.style["justify-content"] = "space-between";
    pieChartContainer.style["width"] = "100%";
    pieSVGContainer.appendChild(pieSvg);    

    //Add describtion
    let desc = document.createElement('div');
    desc.style['margin-left'] = '32px';
    let ul = document.createElement('ul');
    ul.style["list-style-type"]="none"; 
    chartColors.forEach(function(value, key) {
        let item = document.createElement('div');
        item.style['margin-top'] = '8px';
        item.style["display"] = "flex";
        item.style["flex-direction"]="row";
        item.style["margin-right"] = '32px';
        let sq = document.createElement('div');
        sq.style["width"] = "16px";
        sq.style["height"] = "16px";
        sq.style["background-color"] = value;
        let name = document.createElement('div');
        name.style['margin-left'] = "16px";
        name.innerText = key;
        item.appendChild(sq);
        item.appendChild(name);
        let li = document.createElement('li');
        li.appendChild(item);
        ul.appendChild(li);
    });
    
    desc.appendChild(ul);
    pieSVGContainer.appendChild(desc);

    pieChartContainer.appendChild(pieSVGContainer);
    pieChartContainer.appendChild(desc)

    return pieChartContainer;
}
function addSector(parent, from, to, color){
    let path = describeArc(12, 12, 12, from, to);
    let pathSVG = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathSVG.setAttribute('d',path);
    pathSVG.setAttribute('fill', color);
    parent.appendChild(pathSVG);
}

async function getAudits(token){
    let query = `
    {
        audit(where:{private:{code: {_is_null: false}}}){
          grade
          endAt
          
          private{
            code
          }
            group{
            object{
              name      
            }
            captain{
              login
            }
          } 
          
        }
        }
    `;
    return await fetchData(token, query)
    .then(data => {
        return data.data
    });
}

function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;
  
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
}
  
function describeArc(x, y, radius, startAngle, endAngle){
  
      var start = polarToCartesian(x, y, radius, endAngle);
      var end = polarToCartesian(x, y, radius, startAngle);
  
      var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  
      var d = [
        "M", x, y, 
         "L", start.x, start.y,
         "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
         "L", x, y   
      ].join(" ");
  
      return d;       
}

function setChartColors(){
      let colors = new Map();
      colors.set('go', '#800000');
      colors.set('sql', '#00FFFF');
      colors.set('html', '#0000FF');
      colors.set('docker', '#00008B');
      colors.set('back-end', '#FF0000');
      colors.set('front-end', '#FFA500');
      colors.set('sys-admin', '#C0C0C0');
      colors.set('prog', '#008000');
      colors.set('js', '#FFFF00');
      colors.set('algo', '#800080');
      colors.set('c', '#FFFFFF');
      colors.set('stats', '#FFC0CB');
      return colors;

}