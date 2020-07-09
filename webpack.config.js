const path = require('path');
const htmlWebpackPlugin = require("html-webpack-plugin");
const openBrowserPlugin = require("open-browser-webpack-plugin")
const webpack = require("webpack");
const extractTextplugin = require("extract-text-webpack-plugin");   // 抽离样式  


module.exports = {
    //入口
    entry: ['./src/main.js'],
    //出口

    output: {
        path: path.resolve(__dirname, "dist"),  // __dirname 根路径 
        filename: "js/app.[hash:8].js",  // 长度为 8 的随机字符串  避免命名冲突  
        publicPath: '',    // 文件的相对路径 
    },
    //别名
    resolve: {
        alias: {
            '@': path.resolve("./src")
        }
    },
    //服务
    devServer: {
        contentBase: path.join(__dirname, "dist"),
        //压缩服务资源
        compress: true,
        //自动刷新和热替换
        //需配置插件webpack.HotModuleReplacementPlugin
        inline: true,
        hot: true,
        //
        host: "0.0.0.0",
        port: 5000,
        //publicPath: "/assets/"
        // 原本路径 --> 变换后的路径
        //http://localhost:8080/app.js --> http://localhost:8080/assets/app.js
        publicPath: "",
        //代理
        proxy: {
            "/yun": {
                target: "http://47.104.209.44:3333/",  // 服务器地址  
                pathRewrite: {
                    "^/yun": ""  // 需要将 /yun 重写为 / 
                }
            },
        }
    },

    //插件
    plugins: [
        // 启动热替换 
        new webpack.HotModuleReplacementPlugin(),
        //自动引入
        new htmlWebpackPlugin({
            template: "./public/index.html",
            inject: true,    // 自动引入打包的 css/js 
        }),
        //自动打开浏览器
        new openBrowserPlugin({
            url: "http://localhost:5000"
        }),
        //抽离样式 防止打包混乱
        new extractTextplugin({
            filename: 'css/app.[hash:8].css',
            allChunks: true, // 抽离所有样式
            disable: false   // 使插件不失效 
        }),
        // 自动引入 全局引入 
        new webpack.ProvidePlugin({
            React: 'React',
            Component: ['react', 'Component']
        }),

    ],
    //打包模块
    module: {
        rules: [
            //js
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: ["babel-loader"]
            },
            //图片
            {
                test: /\.(png|jpg|svg|gif|woff|woff2|ttf|eot)$/,
                use: [
                    {
                        loader: "url-loader",
                        options: {
                            limit: 8192,  // 8M 
                            name: "imgs/[name].[hash:8].[ext]" // 1.jpg 1.qwer1234.jpg
                        }
                    }
                ]
            },
            //CSS
            {
                test: /\.(css|scss|sass)$/,
                use: extractTextplugin.extract({
                    fallback: "style-loader", // 把样式代码 转换为 字符串的js代码 
                    use: [
                        "css-loader", // 编译为 commonJS 规范的模块 去暴露
                        {
                            loader: "postcss-loader", // 处理 css 代码 
                            options: {
                                plugins: function () {
                                    require("cssgrace"), // css 代码美化
                                        require("autoprefixer"), // 自动补全  -moz -webkit 
                                        require("postcss-px2rem")(  // app 
                                            {

                                            }
                                        )
                                }
                            }
                        },
                        "sass-loader"
                    ]
                })
            }
        ]
    }
}