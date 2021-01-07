import Module from "./module";
import { assert, forEachValue } from "../util";

export default class ModuleCollection {
  // 接收一个原始的module
  constructor(rawRootModule) {
    // register root module (Vuex.Store options)
    this.register([], rawRootModule, false);
  }

  // 根据path获取任意一个module, path的格式为['moduleA', 'moduleB'],
  // 此时该方法获取到的就是moduleB, 即path数组最后一个元素代表的module
  get(path) {
    return path.reduce((module, key) => {
      return module.getChild(key);
    }, this.root);
  }

  // 根据path获取带有斜杠的namespace名, 与上个方法类似
  getNamespace(path) {
    let module = this.root;
    return path.reduce((namespace, key) => {
      module = module.getChild(key);
      return namespace + (module.namespaced ? key + "/" : "");
    }, "");
  }

  // module树完全更新
  update(rawRootModule) {
    update([], this.root, rawRootModule);
  }

  // 注册所有module
  register(path, rawModule, runtime = true) {
    // TODO: __DEV__相关
    if (__DEV__) {
      assertRawModule(path, rawModule);
    }

    const newModule = new Module(rawModule, runtime);
    if (path.length === 0) {
      // 唯一一个给root赋值的地方, 确保整个module树根节点唯一
      this.root = newModule;
    } else {
      const parent = this.get(path.slice(0, -1));
      parent.addChild(path[path.length - 1], newModule);
    }

    // register nested modules
    // 递归注册所有子模块
    if (rawModule.modules) {
      forEachValue(rawModule.modules, (rawChildModule, key) => {
        this.register(path.concat(key), rawChildModule, runtime);
      });
    }
  }

  // 根据path移除某个module
  unregister(path) {
    const parent = this.get(path.slice(0, -1));
    const key = path[path.length - 1];
    const child = parent.getChild(key);

    if (!child) {
      if (__DEV__) {
        console.warn(
          `[vuex] trying to unregister module '${key}', which is ` +
            `not registered`
        );
      }
      return;
    }

    if (!child.runtime) {
      return;
    }

    parent.removeChild(key);
  }

  // 判断path是否被注册
  isRegistered(path) {
    const parent = this.get(path.slice(0, -1));
    const key = path[path.length - 1];

    if (parent) {
      return parent.hasChild(key)
    }

    return false
  }
}

// 根据path更新某个module
function update(path, targetModule, newModule) {
  if (__DEV__) {
    assertRawModule(path, newModule);
  }

  // update target module
  targetModule.update(newModule);

  // update nested modules
  if (newModule.modules) {
    for (const key in newModule.modules) {
      if (!targetModule.getChild(key)) {
        if (__DEV__) {
          console.warn(
            `[vuex] trying to add a new module '${key}' on hot reloading, ` +
              "manual reload is needed"
          );
        }
        return;
      }
      update(
        path.concat(key),
        targetModule.getChild(key),
        newModule.modules[key]
      );
    }
  }
}

/* 下面的都是断言, 用来决定是否要抛错
 **/
const functionAssert = {
  assert: (value) => typeof value === "function",
  expected: "function",
};

const objectAssert = {
  assert: (value) =>
    typeof value === "function" ||
    (typeof value === "object" && typeof value.handler === "function"),
  expected: 'function or object with "handler" function',
};

const assertTypes = {
  getters: functionAssert,
  mutations: functionAssert,
  actions: objectAssert,
};

function assertRawModule(path, rawModule) {
  Object.keys(assertTypes).forEach((key) => {
    if (!rawModule[key]) return;

    const assertOptions = assertTypes[key];

    forEachValue(rawModule[key], (value, type) => {
      assert(
        assertOptions.assert(value),
        makeAssertionMessage(path, key, type, value, assertOptions.expected)
      );
    });
  });
}

function makeAssertionMessage(path, key, type, value, expected) {
  let buf = `${key} should be ${expected} but "${key}.${type}"`;
  if (path.length > 0) {
    buf += ` in module "${path.join(".")}"`;
  }
  buf += ` is ${JSON.stringify(value)}.`;
  return buf;
}
