import { forEachValue } from "../util";

// Base data struct for store's module, package with some attribute and method
export default class Module {
  constructor(rawModule, runtime) {
    this.runtime = runtime;
    // Store some children item
    // 为了配合hasChild, 所以用这种方式创建一个空对象, 详情见hasChild
    this._children = Object.create(null);
    // Store the origin module object which passed by programmer
    // 保存传入的原始模块对象
    this._rawModule = rawModule;
    const rawState = rawModule.state;

    // Store the origin module's state
    this.state = (typeof rawState === "function" ? rawState() : rawState) || {};
  }

  // 获取namespaced
  get namespaced() {
    return !!this._rawModule.namespaced;
  }

  // 添加子模块
  addChild(key, module) {
    this._children[key] = module;
  }

  // 删除子模块
  removeChild(key) {
    delete this._children[key];
  }

  // 获取子模块
  getChild(key) {
    return this._children[key];
  }

  // 判断是否有某个模块, 注意, 这里首先在constructor中把_children初始化为一个没有原型的对象, 
  // 所以使用in操作符判断属性是否存在的时候就能避免被原型对象上的属性影响.
  hasChild(key) {
    return key in this._children;
  }

  // FIXME: 完全更新模块, 但这里存疑, 假如没传对应字段会不会删除原有的属性?
  update(rawModule) {
    this._rawModule.namespaced = rawModule.namespaced;
    if (rawModule.actions) {
      this._rawModule.actions = rawModule.actions;
    }
    if (rawModule.mutations) {
      this._rawModule.mutations = rawModule.mutations;
    }
    if (rawModule.getters) {
      this._rawModule.getters = rawModule.getters;
    }
  }

  // 遍历所有子模块
  forEachChild(fn) {
    forEachValue(this._children, fn);
  }

  // 遍历所有getters 
  forEachGetter(fn) {
    if (this._rawModule.getters) {
      forEachValue(this._rawModule.getters, fn);
    }
  }

  // 遍历所有actions
  forEachAction(fn) {
    if (this._rawModule.actions) {
      forEachValue(this._rawModule.actions, fn);
    }
  }

  // 遍历所有mutations
  forEachMutation(fn) {
    if (this._rawModule.mutations) {
      forEachValue(this._rawModule.mutations, fn);
    }
  }
}
