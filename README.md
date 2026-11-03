# dsh-panel-organizer · 面板整理

把 DeepSeek Harness 左侧栏里用不到的面板图标收起来，按「内置 / 插件」分组管理；点侧栏的「更多」可以把所有面板临时铺开，再点一次收起。

A small DeepSeek Harness plugin that hides unused panels from the left rail, grouped by origin, and turns the rail's **More** button into an expand/collapse toggle.

## 功能

- **逐面板显隐**：设置页里有每个面板的开关，关掉即从左侧栏消失。
- **按来源分组**：内置面板（DSH 本体自带）和插件面板（第三方插件注册的）分开展示，支持整组一键收起/展开。
- **「更多」= 展开全部**：点一下把被隐藏的、以及当前没固定的面板全部铺在左侧栏里；按钮同时换成折叠箭头，再点恢复原样。带 170ms 的高度/透明度过渡，并尊重系统的「减少动态效果」。
- **隐藏不等于删除**：展开态里被隐藏的面板照常可以点开；同名面板会安全跳过，不会误伤两个入口。
- **纯前端**：配置存在浏览器 localStorage，没有网络请求、没有遥测、不改宿主代码。

## 安装

```sh
dsh plugin --profile desktop add dsh-panel-organizer
```

或在 Harness 里打开 **设置 → 插件 → 添加插件**，填入 `dsh-panel-organizer`。安装后刷新页面，入口在 **设置 → 插件 → 面板整理**。

## 使用

1. **设置 → 插件 → 面板整理**。
2. 关掉不想看到的面板；可以按组一次收起。
3. 左侧栏点「更多」临时展开全部面板，再点折叠回去。
4. 想恢复默认：页脚的「恢复默认」按钮。

## 工作原理

- 只通过官方扩展点接入：注册 `settings.plugins.tab` 设置页，向 `shell.overlay` 注入一段 `<style>`（按面板 `aria-label` 精确隐藏已固定面板的行；同名面板不出规则，宁可不收也不误伤）。
- 「更多」按钮的点击在 document capture 阶段被拦截（`closest('button[aria-haspopup="menu"]')` 且位于 `[class*="panelList"]` 内），阻止默认菜单，改为切换 `<html data-dsh-panels-expanded>`；同时把不在 rail 里的面板补成同尺寸的按钮，点击走官方的 `ctx.layout.selectPanel(id)`。
- 不 monkey-patch 宿主函数，宿主升级时最多是补丁失效，不会把界面弄坏。

## 兼容性

- DSH 0.2.x Web UI（桌面客户端内置的 Web 界面同样适用）。
- 其他客户端只要实现了官方 sidebar slot 与 `layout.selectPanel` 即可用。

## 开发

```sh
git clone https://github.com/Asterlyra/dsh-panel-organizer
cd dsh-panel-organizer
dsh plugin --profile desktop add link:$PWD   # 本地链接开发
```

改 `client.js` 后刷新页面即可；`node --check client.js` 做语法检查。

## License

MIT
