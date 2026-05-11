# MBTI-test

一个基于开源项目 [MskTmi/MBTI](https://github.com/MskTmi/MBTI) 数据制作的纯静态 MBTI 测试页面。

## 使用方式

可以直接打开 `index.html`；也可以用本地静态服务器打开，例如：

```bash
cd MBTI-test
python -m http.server 8000
```

然后访问 `http://localhost:8000/`。

## 功能

- 每次开始测试都会随机打乱题目顺序
- 根据 E/I、S/N、T/F、J/P 四组维度计分
- 完成全部题目后展示人格类型、维度分数和详细人格介绍
- 无需构建工具，无第三方依赖

## 数据来源

题库与人格介绍来自 `MskTmi/MBTI`，原项目采用 MIT License，本项目保留了对应 `LICENSE` 文件。
