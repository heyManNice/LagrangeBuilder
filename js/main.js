class LagrangeBuilder{
    constructor(){
        this.linearInputPanel = document.querySelector(".linearInput");
        this.customInputPanel = document.querySelector(".customInput");
        this.inputSwitcher = document.querySelector(".inputGroup fieldset");
        this.linearInputTitle = document.querySelector(".linearInputTitle");
        this.answerElement = document.querySelector(".answer");
        this.processButton = document.querySelector(".process");
        this.toggleDarkMode();
        window.copy = this.copy;
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', ()=>{
            this.toggleDarkMode();
        });
        this.inputSwitcher.addEventListener("change",(e)=>{
            this.switchInputPanel(e.target.value); 
        })
        this.initLinearInput();
    }
    /**
     * 构造拉格朗日插值多项式
     * @param {Array} points 插值点数组
     * @param {string} parame 插值参数名
     * @returns {string} 拉格朗日插值多项式
     */
    lagrangeInterpolation(points, param) {
        const terms = [];
        for (let i = 0; i < points.length; i++) {
            let term = String(points[i].y);
            for (let j = 0; j < points.length; j++) {
                if (i !== j) {
                    term += `*(${param}-${points[j].x})/(${points[i].x}-${points[j].x})`;
                }
            }
            terms.push(term);
        }
        return terms.join("+");
    }
    /**
     * 线性输入面板添加输入框
     */
    addLinearInput(element,value){
        const input = document.createElement("input");
        input.type = "text";
        input.className = "linearInputItem";
        input.addEventListener("change",(e)=>{
            this.linearInputChange(e);
        });
        if(value){
            input.value = value;
        }
        element.before(input);
    }
    /**
     * 线性输入面板变化时事件
     */
    linearInputChange(e){
        //判断当前输入值是否合法
        //只有数字和?是合法的
        const value = e.target.value;
        const element = e.target;
        if(isNaN(value)&&value!="?"){
            element.placeholder = value;
            element.value = "";
            element.classList.add("invalid");
        }else{
            element.placeholder = "";
            element.classList.remove("invalid");
        }
        const values = this.getLinearInputValues();
        if(values.includes("?")){
            this.linearInputTitle.innerText = "找规律";
        }else{
            this.linearInputTitle.innerText = "拉格朗日插值"; 
        }
        if(values.join("").split("?").length>2){
            Swal.fire({
                title: "错误",
                text: "输入错误，最多只能有一个问号",
                icon: "error",
                confirmButtonText: "确定"
            });
            element.placeholder = value;
            element.value = "";
            element.classList.add("invalid");
            return
        }
    }
    /**
     * 获取所有线性输入框的值
     * @returns {Array} 所有线性输入框的值
     */
    getLinearInputValues(){
        const inputs = document.querySelectorAll(".linearInputItem");
        const values = [];
        inputs.forEach((input)=>{
            values.push(input.value);
        });
        return values;
    }
    /**
     * 初始化输入面板的输入框和数据
     */
    initLinearInput(){
        const button =  document.createElement("input");
        button.type = "button";
        button.value = "+";
        button.className = "outline secondary";
        button.addEventListener("click",()=>{
            this.addLinearInput(button);
        });
        this.linearInputPanel.appendChild(button);
        const data = [2,3,4,5,"?",6]
        for(let i=0;i<data.length;i++){
            this.addLinearInput(button,data[i]); 
        }
    }
    /**
     * 切换输入面板
     */
    switchInputPanel(value){
        switch(value){
            case "linearInput":
                this.linearInputPanel.style.display = "flex";
                this.customInputPanel.style.display = "none";
                this.linearInputTitle.style.display = "block";
                break;
            case "customInput":
                this.linearInputPanel.style.display = "none";
                this.customInputPanel.style.display = "block";
                this.linearInputTitle.style.display = "none";
                break;
        }
    }
    hidePartRecursion(_in_parts,_out_partsRestore){
        const part = _in_parts.pop();
        part.setAttribute("data-display",part.style.display);
        part.style.display = "none";
        _out_partsRestore.push(part);
        if(_in_parts.length>0){
            this.hidePartRecursion(_in_parts,_out_partsRestore);
        }
    }
    showPartRecursion(parts){
        const part = parts.pop();
        part.style.display = part.getAttribute("data-display");
        window.scrollTo(0, document.body.scrollHeight);
        if(parts.length>0){
            setTimeout(()=>{
                this.showPartRecursion(parts);
            },30);
        }else{
            this.processButton.setAttribute("aria-busy","false");
            this.processButton.innerHTML = "求解";
        }
    }
    /**
     * 解析自定义输入
     */
    parseCustomInput(){
        const input = document.querySelector(".customInput textarea").value;
        const arr = input.split(" ");
        const points = {};
        for(let i=0;i<arr.length;i++){
            const item = arr[i];
            const point = item.split(',');
            if(point.length!=2||isNaN(point[1])){
                Swal.fire({
                    title: "错误",
                    text: "输入非法",
                    icon: "error",
                    confirmButtonText: "确定"
                });
                return null;
            }
            points[point[0]]=point[1];
        }
        const fpoints = [];
        for(let key in points){
            fpoints.push({
                x:key,
                y:points[key]
            });
        }
        return fpoints;
    }
    /**
     * 开始运算
     */
    async process(){
        const inputPanel = document.querySelectorAll(".inputGroup fieldset input");
        let switcher = "";
        for(let i=0;i<inputPanel.length;i++){
            if(inputPanel[i].checked){
                switcher = inputPanel[i].value;
                break;
            }
        }

        if(switcher==="customInput"){
            const points = this.parseCustomInput();
            if(!points){
                return;
            }
            this.processPromptly(points);
            return; 
        }
        if(switcher==="linearInput"){
            const points = await this.getPoints();
            if(!points){
                return; 
            }
            this.processWithsteps(points); 
        }
    }
    copy(str){
        const el = document.createElement('textarea');
        el.value = str;
        el.setAttribute('readonly', '');
        el.style.position = 'absolute';
        el.style.left = '-9999px';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        Swal.fire({
            title: "复制成功",
            text: str,
            icon: "success", 
        })
    }
    /**
     * 显示过程的求解
     */
    processWithsteps(points){
        this.processButton.setAttribute("aria-busy","true");
        this.processButton.innerHTML = "求解中...";
        
        const polynomial = this.lagrangeInterpolation(points,'x');
        const simplify = math.simplify(polynomial);
        const latexHtml = katex.renderToString("f(x)="+simplify.toTex(),{
            throwOnError: false,
            displayMode: true,
            output: "mathml"
        });
        //组装答案
        let html="";
        html += "<p>注意到，当</p>";
        html += latexHtml;
        html += `<span class="btn">
            <button onclick="copy('f(x)=${simplify.toTex()}')" class="secondary">复制Latex</button>
            <button onclick="copy('f(x)=${simplify.toString()}')" class="secondary">复制表达式</button>
        </span>`
        html += "<p>时，有</p>";
        html += "<p><span>";
        for(let i=0;i<points.length;i++){
            const x = points[i].x;
            html += katex.renderToString(`f(${x})=${math.evaluate(polynomial, {x})}`,{
                throwOnError: false,
                output: "mathml"
            }); 
        }
        html += "</span></p>";
        if(this.correctValue){
            html += "<p>所以正确答案是</p>";
            html += `<span class="answerValue">${this.correctValue}</span>`; 
        }
        this.correctValue = null;

        //显示答案和动画
        this.answerElement.innerHTML = html;

        const parts = Array.from(this.answerElement.querySelectorAll("*")).filter((part)=>{
            return part.children.length===0;
        });
        const partsRestore = [];
        this.hidePartRecursion(parts,partsRestore);
        this.showPartRecursion(partsRestore);
    }
    /**
     * 不显示过程的求解
     */
    processPromptly(points){
        const polynomial = this.lagrangeInterpolation(points,'x');
        const simplify = math.simplify(polynomial);
        const latexHtml = katex.renderToString("f(x)="+simplify.toTex(),{
            throwOnError: false,
            displayMode: true,
            output: "mathml"
        });
        let btmHtml = `<span class="btn">
            <button onclick="copy('f(x)=${simplify.toTex()}')" class="secondary">复制Latex</button>
            <button onclick="copy('f(x)=${simplify.toString()}')" class="secondary">复制表达式</button>
        </span>`
        this.answerElement.innerHTML = latexHtml+btmHtml;
    }
    /**
     * 获取点对象
     * @returns {Array} 点对象数组
     */
    async getPoints(){
        const points = [];
        const values = this.getLinearInputValues();

        for(let i=0;i<values.length;i++){
            if(values[i]==="?"){
                const value = await this.askQuestion();
                if(!value){
                    return null;
                }
                this.correctValue = value;
                points.push({x:i,y:value});
            }else if(values[i]!==""){
                points.push({x:i,y:values[i]}); 
            }
        }
        return points;
    }
    /**
     * 询问?的值
     */
    askQuestion(){
        return new Promise((resolve,reject)=>{
            Swal.fire({
                title: "你希望?的值是多少?",
                input: "number",
                confirmButtonText: "确认",
                inputAttributes: {
                    style: "width: 20rem;margin: 1rem auto;", 
                }
            })
            .then((result) => {
                if (!result.isConfirmed) {
                    resolve(null);
                    return;
                }
                resolve(result.value);
            });
        }) 
    }
    /**
     * 切换sweetalert主题
     */
    toggleDarkMode() {
        const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if(isDarkMode){
            if(window.darkMode){
               return; 
            }
            const link = document.createElement("link");
            link.id = "darkMode";
            link.rel = "stylesheet";
            link.href = "./css/dark.css";
            document.head.appendChild(link);
        }else{
           const link = window.darkMode;
           if(link){
                link.remove();
           }
        }
    }
}
const lb = new LagrangeBuilder();

