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
    this.root.innerHTML = char;
  }
  setClass(className){
    this.#root.classList.add(...className);
  }
  removeClass(className){
    this.#root.classList.remove(...className);
  }
  get root() {return this.#root;}
}
class CharCard extends ElementBuilder {
  constructor(p, {height} = {}) {
    super('div', {});
    this.change(String(p).slice(0, 1));
    this.setClass(['char']);
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
  constructor(p, {height}) {
    super('div');
    this.#charCard = new CharCard(p, {height});
    this.#charCard.appendTo(this);
    
  }
  toBottom() {
    this.setStyle({
      top: '50%',
    });
    this.#charCard.toBottom();
  }
  change(char) {
    this.#charCard.change(char);
  }
}
class FlipCard extends ElementBuilder {
  #char;
  #width;
  #height;
  #backTop;
  #backBottom;
  #frontTop;
  #frontBottom;
  constructor(char = '', {width, height, fontSize}) {
    super('div');
    this.#char = char;
    this.#width = width;
    this.#height = height;
    this.setStyle({
      width, 
      height,
      fontSize
    });
    this.setClass(['card']);
    this.#backTop = new HalfCard(char, {height});
    this.#backBottom = new HalfCard(char, {height});
    this.#frontTop = new HalfCard(char, {height});
    this.#frontBottom = new HalfCard(char, {height});
    this.#backBottom.toBottom();
    this.#frontBottom.toBottom();
    this.#backTop.appendTo(this);
    this.#backBottom.appendTo(this);
    this.#frontTop.appendTo(this);
    this.#frontBottom.appendTo(this);

    this.#folded();
    this.#opened();
    this.#frontTop.setClass(['flip', 'front-top']);
    this.#frontBottom.setClass(['flip', 'front-bottom']);
    this.#backTop.setClass(['flip', 'back-top']);
    this.#backBottom.setClass(['flip', 'back-bottom']);
  }
  #folded() {
    this.#backTop.setStyle({
      transform: `perspective(${this.#height}) rotateX(0deg)`,
      transition: 'none',
      transformOrigin: '50% 50%',
      backfaceVisibility: 'unset',
      zIndex: 1
    });
    this.#backBottom.setStyle({
      transform: `perspective(${this.#height}) rotateX(180deg)`,
      transition: 'none',
      transformOrigin: '50% 0',
      backfaceVisibility: 'hidden',
      zIndex: 3
    });
    this.forceReflow();
    setTimeout(() => this.#backBottom.setStyle({
      transition: 'transform 0.5s',
    }));
    
  }
  #open() {
    this.#backBottom.setStyle({
      transform: `perspective(${this.#height}) rotateX(0deg)`
    });
  }
  #opened() {
    this.#frontTop.setStyle({
      transform: `perspective(${this.#height}) rotateX(0deg)`,
      transition: 'none',
      transformOrigin: '50% 100%',
      backfaceVisibility: 'hidden',
      zIndex: 2
    });
    this.#frontBottom.setStyle({
      transform: `perspective(${this.#height}) rotateX(0deg)`,
      transition: 'none',
      transformOrigin: '50% 50%',
      backfaceVisibility: 'unset',
      zIndex: 2
    });
    this.forceReflow();
    setTimeout(() => this.#frontTop.setStyle({
      transition: 'transform 0.5s',
    }));
  }
  #fold() {
    this.#frontTop.setStyle({
      transform: `perspective(${this.#height}) rotateX(-180deg)`
    });
  }
  #backChange(char) {
    this.#backTop.change(char);
    this.#backBottom.change(char);
  }
  #frontChange(char) {
    this.#frontTop.change(char);
    this.#frontBottom.change(char);
  }
  change(char) {
    if (this.#char === char) return;
    this.#char = String(char).slice(0, 1);
    this.#backChange(char);
    this.#open();
    this.#fold();
    setTimeout(() => {
      this.#frontChange(char);
      this.#folded();
      this.#opened();
    }, 500);
  }
}
class FlipList extends Set {
  constructor(char, length, {width, height, fontSize}) {
    super(Array.from({length}, () => char).map(c => new FlipCard(c, {width, height, fontSize})));
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
});
fl.appendTo(document.body);

let i = Math.floor(Math.random() * 1000000);
setInterval(() => fl.change(String(i++).padStart(8, '0')), 1000);

// const fc = new FlipCard(1, {
//   width: '150px',
//   height: '300px',
//   fontSize: '150px',
// });
// fc.appendTo(document.body);

// const sleep = ms => new Promise(res => setTimeout(res, ms));
// let i = 39282
// for (;;) {
//   fl.change(String(i++).padStart(8, '0'));
//   await sleep(1000);
// }

// const sleep = ms => new Promise(res => setTimeout(res, ms));
// for (;;) {
//   fl.change(String(Math.floor(Math.random() * 100000000)).padStart(8, '0'));
//   await sleep(1000);
// }
