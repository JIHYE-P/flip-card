class ElementBuilder {
  #root = null;
  constructor(tagName, properties = {}) {
    if (tagName) this.init(tagName, properties);
  }
  init(tagName, properties) {
    return this.#root = Object.assign(document.createElement(tagName), properties);
  }
  appendTo(el) {
    if (el instanceof Node) el.appendChild(this.#root);
    else if (el instanceof ElementBuilder) el.root.appendChild(this.#root);
  }
  appendChild(el) {
    if (el instanceof Node) this.#root.appendChild(el);
    else if (el instanceof ElementBuilder) this.#root.appendChild(el.root);
  }
  setStyle(obj) {
    Object.assign(this.#root.style, obj);
  }
  forceReflow() {
    this.#root.offsetHeight;
  }
  change(char) {
    this.#root.innerHTML = char;
  }
  setClass(...className){
    this.#root.classList.add(...className);
  }
  removeClass(...className){
    this.#root.classList.remove(...className);
  }
  maskImage(url){
    this.#root.style.webkitMaskImage = `url(${url})`;
  }
  get root() {return this.#root;}
}
class AnimationFrame extends ElementBuilder {
  constructor(...p){
    super(...p);
  }
  animate(className, timeout){
    return new Promise(res => {
      this.forceReflow();
      if(!this.root.classList.contains(className)) this.setClass(className)

      setTimeout(() => {
        this.removeClass(className);
        res();
      }, timeout);
    });
  }
}
class Canvas {
  canvas
  ctx
  constructor(width, height){
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = width;
    this.canvas.height = height;
  }
  appendTo(el) {
    el.appendChild(this.canvas)
  }
  appendChild(el, child) {
    el.appendChild(child)
  }
  drawing(){
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0,0, this.canvas.width, this.canvas.height);
  }
}
class Mask extends Canvas {
  constructor(w, h, cw, ch){
    super(w, h)
    this.w = w;
    this.h = h;
    this.cw = cw;
    this.ch = ch;
  }
  top(){
    this.drawing();
    this.ctx.clearRect(0, this.h - this.ch, this.cw, this.ch);
    this.ctx.clearRect(this.w - this.cw, this.h - this.ch, this.cw, this.ch);
  }
  bottom(){
    this.drawing();
    this.ctx.clearRect(0, 0, this.cw, this.ch);
    this.ctx.clearRect(this.w - this.cw, 0, this.cw, this.ch);
  }
  dataURL(canvas = this.canvas){
    return new Promise(res => {
      canvas.toBlob(blob => {
        const img = new Image();
        const url = URL.createObjectURL(blob);
        img.onload = () => res(img); // URL.revokeObjectURL(url);
        img.src = url;
      });
    });
  }
  static create(w, h, cw, ch){
    return new this(w, h, cw, ch);
  }
  static top(w, h, cw, ch){
    const mask = this.create(w, h, cw, ch);
    mask.top();
    return mask.dataURL();
  }
  static bottom(w, h, cw, ch){
    const mask = this.create(w, h, cw, ch);
    mask.bottom();
    return mask.dataURL();
  }
}
class CharCard extends ElementBuilder {
  constructor(p, {height} = {}) {
    super('div', {});
    this.change(String(p).slice(0, 1));
    this.setClass('char');
    this.setStyle({ 
      height 
    });
  }
  change(char) {
    super.change(char);
  }
  toBottom() {
    this.setStyle({
      top: '-100%',
    });
  }
}
class HalfCard extends ElementBuilder {
  #charCard;
  #maskBottom;
  constructor(p, {height, maskTop, maskBottom}) {
    super('div');
    this.#charCard = new CharCard(p, {height});
    this.#charCard.appendTo(this);
    if(maskTop) maskTop.then(img => this.maskImage(img.src));
    this.#maskBottom = maskBottom;
  }
  toBottom() {
    this.setStyle({
      top: '50%',
    });
    this.#charCard.toBottom();
    if(this.#maskBottom) this.#maskBottom.then(img => this.maskImage(img.src));
  }
  change(char) {
    this.#charCard.change(char);
  }
}
class FlipCard extends AnimationFrame {
  #char;
  #width;
  #height;
  #backTop;
  #backBottom;
  #frontTop;
  #frontBottom;
  constructor(char = '', {width, height, fontSize, maskTop, maskBottom}) {
    super('div');
    this.#char = char;
    this.#width = width;
    this.#height = height;
    this.setStyle({
      width, 
      height,
      fontSize
    });
    this.setClass('card');
    this.#backTop = new HalfCard(char, {height, maskTop, maskBottom});
    this.#backBottom = new HalfCard(char, {height, maskTop, maskBottom});
    this.#frontTop = new HalfCard(char, {height, maskTop, maskBottom});
    this.#frontBottom = new HalfCard(char, {height, maskTop, maskBottom});
    this.#backBottom.toBottom();
    this.#frontBottom.toBottom();
    this.#backTop.appendTo(this);
    this.#backBottom.appendTo(this);
    this.#frontTop.appendTo(this);
    this.#frontBottom.appendTo(this);

    this.#frontTop.setClass('flip', 'front-top');
    this.#frontBottom.setClass('flip', 'front-bottom');
    this.#backTop.setClass('flip', 'back-top');
    this.#backBottom.setClass('flip', 'back-bottom');
  }
  #backChange(char) {
    this.#backTop.change(char);
    this.#backBottom.change(char);
  }
  #frontChange(char) {
    this.#frontTop.change(char);
    this.#frontBottom.change(char);
  }
  async change(char) {
    if (this.#char === char) return;
    this.#char = String(char).slice(0, 1);
    this.#backChange(char);
    await this.animate('active', 500);
    this.#frontChange(char);
  }
}
class FlipList extends Set {
  constructor(char, length, {width, height, fontSize, maskTop, maskBottom}) {
    super(Array.from({length}, () => char).map(c => new FlipCard(c, {width, height, fontSize, maskTop, maskBottom})));
  }
  change(str) {
    [...this].forEach((f, i) => f.change(str[i] === undefined ? ' ' : str[i]));
  }
  appendTo(el) {
    this.forEach(f => f.appendTo(el));
  }
}

const fl = new FlipList('0', 8, {
  width: '210px',
  height: '260px',
  fontSize: '170px',
  maskTop: Mask.top(210, 130, 8, 25),
  maskBottom: Mask.bottom(210, 130, 8, 25)
});
fl.appendTo(document.body);

let i = Math.floor(Math.random() * 1000000);
setInterval(() => fl.change(String(i++).padStart(8, '0')), 1000);
