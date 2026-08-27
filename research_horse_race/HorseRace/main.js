// 自定义进度方法
var loading = document.getElementById('loading');
var progressBar = loading.querySelector('.progress-bar span');
var progressText = loading.querySelector('.progress-text');
var gameIcon = loading.querySelector('.game-icon')
var lang = new URL(location.href).searchParams.get("lang"); // 语言
function onInitGameProgress(percent) {
    if (progressBar) {
        // console.log("onInitGamepercent:", percent);
        try {
            if (!this.percent || this.percent <= percent) {
                clearTimeout(this.timeOut);
                this.percent = (!this.percent || this.percent < percent) ? percent :  this.percent;
                if (this.percent >= 5 && this.percent <= 20) {
                    if (this.percent == 5) {
                        console.log("onInitGameProgress:", percent);
                    }
                    let delay = this.percent %2 == 0 ? 500 : 400;
                    this.timeOut = setTimeout(() => {
                        if (this.percent >= 20) {
                            clearTimeout(this.timeOut);
                            this.timeOut = null;
                        }else {
                            onInitGameProgress(this.percent+1);
                        }
                    }, delay);
                }
            }
            
            if (this.percent >= 99){ //iOS进度会超大数 有问题这里做个兜底
                this.percent = 100;
                console.log("onInitGameProgress:  percent: ", percent);
            }
            var progress = this.percent + '%';
            progressBar.style.width = progress; 
        
            if (lang == 2) { // 阿拉伯语
                progressBar.parentElement.style = "transform: scale(-1,1) translateX(50%)"
                progressText.style = "transform: translate(-40%,20%)"
                progressText.textContent = progress + " ... انتظار اللعبة ";
                gameIcon.setAttribute('style', 'content: url(./loading/loading_game_icon_ar.png)');
            }
            else if (lang == 3) { // 土耳其语
                progressText.textContent = "Oyun yükleniyor... " + progress;
                gameIcon.setAttribute('style', 'content: url(./loading/loading_game_icon_osm.png)');
            }
            else {
                progressText.textContent = "Game loading... " + progress;
                gameIcon.setAttribute('style', 'content: url(./loading/loading_game_icon_en.png)');
            }

            // if (this.percent >= 100) {
            //     clearTimeout(this.timeOut);            
            //     this.timeOut = setTimeout(function () {
            //         console.log("main.js >>>>>>>>>>>> onInitGameProgress hide loading...");
            //         let loading = document.getElementById('loading');
            //         if (loading) {
            //             loading.remove();
            //             clearTimeout(this.timeOut);   
            //         }
            //     }, 100);
            // }
        } catch (error) {
            console.log("onInitGameProgress error:", error);
        }
    }
}
window.onInitGameProgress = onInitGameProgress;
onInitGameProgress(5);
window.boot = function () {
    var settings = window._CCSettings;
    window._CCSettings = undefined;
    var onProgress = null;

    var RESOURCES = cc.AssetManager.BuiltinBundleName.RESOURCES;
    var INTERNAL = cc.AssetManager.BuiltinBundleName.INTERNAL;
    var MAIN = cc.AssetManager.BuiltinBundleName.MAIN;
    function setLoadingDisplay() {
        // Loading splash scene
        onProgress = function (finish, total) {
            var percent = (100 * finish / total).toFixed(0); // 游戏引擎处理进度50%
            onInitGameProgress(percent)
        };

        cc.director.once(cc.Director.EVENT_AFTER_SCENE_LAUNCH, function () {
            // splash.style.display = 'none';
        });
    }

    var onStart = function () {

        cc.view.enableRetina(true);
        cc.view.resizeWithBrowserSize(true);

        if (cc.sys.isBrowser) {
            setLoadingDisplay();
        }

        if (cc.sys.isMobile) {
            if (settings.orientation === 'landscape') {
                cc.view.setOrientation(cc.macro.ORIENTATION_LANDSCAPE);
            }
            else if (settings.orientation === 'portrait') {
                cc.view.setOrientation(cc.macro.ORIENTATION_PORTRAIT);
            }
            // cc.view.enableAutoFullScreen([
            //     cc.sys.BROWSER_TYPE_BAIDU,
            //     cc.sys.BROWSER_TYPE_BAIDU_APP,
            //     cc.sys.BROWSER_TYPE_WECHAT,
            //     cc.sys.BROWSER_TYPE_MOBILE_QQ,
            //     cc.sys.BROWSER_TYPE_MIUI,
            //     cc.sys.BROWSER_TYPE_HUAWEI,
            //     cc.sys.BROWSER_TYPE_UC,
            // ].indexOf(cc.sys.browserType) < 0);
        }

        // Limit downloading max concurrent task to 2,
        // more tasks simultaneously may cause performance draw back on some android system / browsers.
        // You can adjust the number based on your own test result, you have to set it before any loading process to take effect.
        if (cc.sys.isBrowser && cc.sys.os === cc.sys.OS_ANDROID) {
            cc.assetManager.downloader.maxConcurrency = 2;
            cc.assetManager.downloader.maxRequestsPerFrame = 2;
        }

        var launchScene = settings.launchScene;
        var bundle = cc.assetManager.bundles.find(function (b) {
            return b.getSceneInfo(launchScene);
        });

        bundle.loadScene(launchScene, null, onProgress,
            function (err, scene) {
                if (!err) {
                    cc.director.runSceneImmediate(scene);
                    if (cc.sys.isBrowser) {
                        // show canvas
                        var canvas = document.getElementById('GameCanvas');
                        canvas.style.visibility = '';
                        var div = document.getElementById('GameDiv');
                        if (div) {
                            div.style.backgroundImage = '';
                        }
                        console.log('Success to load scene: ' + launchScene);
                    }
                }
            }
        );

    };

    var option = {
        id: 'GameCanvas',
        debugMode: settings.debug ? cc.debug.DebugMode.INFO : cc.debug.DebugMode.ERROR,
        showFPS: settings.debug,
        frameRate: 60,
        groupList: settings.groupList,
        collisionMatrix: settings.collisionMatrix,
    };

    cc.assetManager.init({
        bundleVers: settings.bundleVers,
        remoteBundles: settings.remoteBundles,
        server: settings.server
    });

    var bundleRoot = [INTERNAL];
    settings.hasResourcesBundle && bundleRoot.push(RESOURCES);

    var count = 0;
    function cb(err) {
        if (err) return console.error(err.message, err.stack);
        count++;
        if (count === bundleRoot.length + 1) {
            cc.assetManager.loadBundle(MAIN, function (err) {
                if (!err) cc.game.run(option, onStart);
            });
        }
    }

    cc.assetManager.loadScript(settings.jsList.map(function (x) { return 'src/' + x; }), cb);

    for (var i = 0; i < bundleRoot.length; i++) {
        cc.assetManager.loadBundle(bundleRoot[i], cb);
    }
};

if (window.jsb) {
    var isRuntime = (typeof loadRuntime === 'function');
    if (isRuntime) {
        require('src/settings.js');
        require('src/cocos2d-runtime.js');
        if (CC_PHYSICS_BUILTIN || CC_PHYSICS_CANNON) {
            require('src/physics.js');
        }
        require('jsb-adapter/engine/index.js');
    }
    else {
        require('src/settings.js');
        require('src/cocos2d-jsb.js');
        if (CC_PHYSICS_BUILTIN || CC_PHYSICS_CANNON) {
            require('src/physics.js');
        }
        require('jsb-adapter/jsb-engine.js');
    }

    cc.macro.CLEANUP_IMAGE_CACHE = true;
    window.boot();
}


window.gainLocalStorage = function (json) {
    console.warn("收到IOS返回的json数据：：：：：" + JSON.stringify(json));
    window.StorageDataIOS = json;
    console.warn("StorageDataIOS: ", window.StorageDataIOS);
}
window.onerror = function (errorMessage, scriptURI, lineNumber, columnNumber, errorObj) {
    console.error("错误信息：", errorMessage);
    console.error("出错文件：", scriptURI);
    console.error("出错行号：", lineNumber);
    console.error("出错列号：", columnNumber);
    console.error("错误详情：", errorObj);
    return true;
}

//添加打印日志 记录关键阶段时间戳
const timings = {
    engineStart: performance.now(), //引擎开始时间
    directorInit: 0,                //场景开始时间
    sceneLoad: 0                    //场景loading时间
};

window["LogsOfScenes"] = {"EVENT_BEFORE_SCENE_LAUNCH": "" , "EVENT_BEFORE_DRAW": "" , "EVENT_AFTER_DRAW": ""};
addDebuggerCode = function () {

    //运行新场景之前所触发的事件
    cc.director.once(cc.Director.EVENT_BEFORE_SCENE_LAUNCH, () => {
        timings.sceneLoad = performance.now();
        let logInfo = `Main.js 1 运行新场景之前所触发的事件 ${timings.sceneLoad - timings.directorInit} ms ${timings.sceneLoad - timings.engineStart}ms` + "\n";
        window["LogsOfScenes"]["EVENT_BEFORE_SCENE_LAUNCH"] = logInfo;
    });

    //运行新场景之前所触发的事件
    cc.director.once(cc.Director.EVENT_BEFORE_DRAW, () => {
        timings.sceneLoad = performance.now();
        let logInfo = `2 渲染过程之前所触发的事件 ${timings.sceneLoad - timings.directorInit} ms ${timings.sceneLoad - timings.engineStart}ms` + "\n";
        window["LogsOfScenes"]["EVENT_BEFORE_DRAW"] = logInfo;
    });

    // 场景加载后
    cc.director.once(cc.Director.EVENT_AFTER_DRAW, () => {
        timings.sceneLoad = performance.now();
        let logInfo = `3 渲染过程之后所触发的事件 ${timings.sceneLoad - timings.directorInit} ms ${timings.sceneLoad - timings.engineStart}ms` + "\n";
        window["LogsOfScenes"]["EVENT_AFTER_DRAW"] = logInfo;
        // console.log(`Main.js GameStart  ==========1 渲染过程之后所触发的事件 加载耗时：${timings.sceneLoad - timings.directorInit}ms`);
        // console.log(`Main.js GameStart  ==========2 渲染过程之后所触发的事件 总启动耗时：${timings.sceneLoad - timings.engineStart}ms`);
    });
}
