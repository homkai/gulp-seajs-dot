# gulp-seajs-dot
把dot模板包装成HyMobile的module

## Examples
### 1、多个子模板
    <script id="head" type="text/template">
        <div class="page-head">
            <b>Welcome to Homyit, {{= it.name }}</b>
        </div>
    </script>
暴露的方法名与id一致

### 2、普通HTML
    <div class="page-head">
        <b>Welcome to Homyit!</b>
    </div>
单个模板下，直接暴露字符串
