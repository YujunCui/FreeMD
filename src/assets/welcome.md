# 欢迎使用 FreeMD

> 一款开源的所见即所得 Markdown 编辑器。

## 核心特性

- **所见即所得编辑** — 支持源码、分屏、预览三种模式
- **实时预览** — 输入即时渲染，毫秒级响应
- **数学公式** — 基于 KaTeX 渲染行内和块级公式
- **代码高亮** — 支持 180+ 编程语言语法高亮
- **导出功能** — 一键导出 PDF / HTML
- **深色 / 浅色主题** — 支持跟随系统

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl/Cmd + N` | 新建文件 |
| `Ctrl/Cmd + O` | 打开文件 |
| `Ctrl/Cmd + S` | 保存 |
| `Ctrl/Cmd + 1` | 预览模式 |
| `Ctrl/Cmd + 2` | 分屏模式 |
| `Ctrl/Cmd + 3` | 源码模式 |
| `Ctrl/Cmd + /` | 循环切换模式 |
| `Ctrl/Cmd + Shift + P` | 导出 PDF |
| `Ctrl/Cmd + Shift + H` | 导出 HTML |

## 数学公式示例

行内公式：$E = mc^2$，$\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$

块级公式：

$$
\frac{\partial f}{\partial x} = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}
$$

## 代码示例

```typescript
function greet(name: string): string {
  return `Hello, ${name}!`
}

console.log(greet('FreeMD'))
```

## 任务列表

- [x] 创建项目结构
- [x] 实现 Markdown 渲染
- [x] 集成 CodeMirror 编辑器
- [x] 添加 KaTeX 数学公式支持
- [ ] 开始使用 FreeMD 编辑你的文档

---

*提示：点击顶部工具栏的图标可切换编辑模式、主题和字体大小。*
