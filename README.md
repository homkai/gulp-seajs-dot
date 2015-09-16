# gulp-seajs-dot
把dot模板包装成seajs的module

## Overview
- 自动进行压缩
- 配置参数prefix：文件名前缀，htmlMinifier：压缩html使用的html-minifier的配置

## Examples
### 1、多个子模板
    <script export="head" type="text/template">
        <div class="page-head">
            <b>Welcome to Homyit, {{= it.name }}</b>
        </div>
    </script>
暴露的方法名与export一致

### 2、普通HTML
    <div class="page-head">
        <b>Welcome to Homyit!</b>
    </div>
单个模板下，直接暴露字符串
