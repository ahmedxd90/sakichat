// 自定义进度方法
var loading = document.getElementById('loading');
var progressBar = loading.querySelector('.progress-bar span');
var progressText = loading.querySelector('.progress-text');
var lang = new URL(location.href).searchParams.get("lang"); // 语言
function onInitGameProgress(percent) {
    if (progressBar) {
        if (!this.percent || this.percent <= percent) {
            clearTimeout(this.timeOut);
            this.percent = (!this.percent || this.percent < percent) ? percent :  this.percent;
            if (this.percent >= 5 && this.percent <= 20) {
                if (this.percent == 5) {
                    console.log("onProgress >>>>>>>>>>>>> == 5%:", percent);
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
            console.log("setLoadingDisplay:  percent:100% ", percent);
        }
        var progress = this.percent + '%';
        progressBar.style.width = progress;
        if (lang == 2) { // 阿拉伯语
            progressBar.parentElement.style = "transform: scale(-1,1) translateX(50%)"
            progressText.style = "transform: translate(-40%,20%)"
            progressText.textContent = progress + " ... انتظار اللعبة ";
        }
        else if (lang == 3) { // 土耳其语
            progressText.textContent = "Oyun yükleniyor... " + progress;
        }
        else {
            progressText.textContent = "Game loading... " + progress;
        }
    }
}

window.onInitGameProgress = onInitGameProgress;
onInitGameProgress(5);


window.boot = function () {
    var settings = window._CCSettings;
    window._CCSettings = undefined;
    var onProgress = null;

    String.prototype.getQueryString = function (name) {
        undefined
        var reg = new RegExp("(^|&|\\?)" + name + "=([^&]*)(&|$)"), r;
        if (r = this.match(reg)) return r[2];
        return null;
    };

    var RESOURCES = cc.AssetManager.BuiltinBundleName.RESOURCES;
    var INTERNAL = cc.AssetManager.BuiltinBundleName.INTERNAL;
    var MAIN = cc.AssetManager.BuiltinBundleName.MAIN;
    function setLoadingDisplay() {
        onProgress = function (finish, total) {
            var percent = (100 * finish / total).toFixed(0); // 游戏引擎处理进度50%
            onInitGameProgress(percent)
        };

        cc.director.once(cc.Director.EVENT_AFTER_SCENE_LAUNCH, function () {
            // splash.style.display = 'none';
        });
    }

    var onStart = function () {

        var u = navigator.userAgent;
        var isIOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/);
        const canvas = document.querySelector("#GameCanvas");
        const gl = canvas.getContext("webgl");
        //检测WebGL支持
        if (!gl) {
            console.error("浏览器不支持WebGL");
            if (isIOS)
                window.webkit.messageHandlers.OpenLockdownTips.postMessage();
            return;
        }
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
            cc.view.enableAutoFullScreen([
                cc.sys.BROWSER_TYPE_BAIDU,
                cc.sys.BROWSER_TYPE_BAIDU_APP,
                cc.sys.BROWSER_TYPE_WECHAT,
                cc.sys.BROWSER_TYPE_MOBILE_QQ,
                cc.sys.BROWSER_TYPE_MIUI,
                cc.sys.BROWSER_TYPE_HUAWEI,
                cc.sys.BROWSER_TYPE_UC,
            ].indexOf(cc.sys.browserType) < 0);
        }

        cc.macro.CLEANUP_IMAGE_CACHE = false;
        cc.macro.ENABLE_MULTI_TOUCH = false;
        cc.resources.preload("gameconfig.json");

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
                    var container = document.getElementById('Cocos2dGameContainer');
                    container.width = window.innerWidth;
                    container.height = window.innerHeight;
                    var canvas = document.getElementById('GameCanvas');
                    canvas.width = window.innerWidth;
                    canvas.height = window.innerHeight;
                    console.log("输出手机上canvas高度:::::" + canvas.height);
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
                        window.globalNativeLog && window.globalNativeLog("场景加载成功");
                    }
                }else {
                    window.globalNativeLog && window.globalNativeLog("场景加载失败");
                }
            }
        );

        try {
            const currentUrl = new URL(location.href);
            const searchParams = currentUrl.searchParams;
            // 获取域名
            let domain = currentUrl.hostname; // 例如 "test.whis.chat"
            let uid = searchParams.get('uid'); 
            let token = searchParams.get('token'); 

            // let key = `SuperCarLoginInfo_2_PreLoadLoginInfo_` + uid;
            // let loginInfo = cc.sys.localStorage.getItem(key);
            // if (loginInfo) {
            //     loginInfo = JSON.parse(loginInfo);
            //     let minValidTime = 2 * 60 * 60; //2小时有效期
            //     let nowTime = new Date().getTime() / 1000;
            //     let goneTime = nowTime - loginInfo.clientTime;
            //     let curValidTime = loginInfo && (loginInfo.expired_time - loginInfo.server_time - goneTime);
            //     let isValid = curValidTime > minValidTime;
            //     if (isValid) {
            //         window.globalNativeLog && window.globalNativeLog("window.loginData >>>>>>>>>>>>> login_account saved ");
            //         window.loginData = loginInfo; 
            //         return;
            //     }  
            // }
        
            let loginReq = function (baseUrl) {
                console.log("loginReq >>>>>>>>>> baseUrl:" + baseUrl);
                let domain = "https://api.whisper.cc/";
                if (baseUrl && baseUrl.length > 0) {
                    let json = JSON.parse(baseUrl);
                    let newHost = json && json["api"];
                    if (newHost) {
                        window.globalNativeLog && window.globalNativeLog("替换域名前 domain：", domain + "  app newHost： " + newHost);
                        domain = domain.replace(/^(https?:\/\/)[^/]+/, "$1" + newHost);
                        let log = "域名替换后 domain: " + domain;
                        window.globalNativeLog && window.globalNativeLog(log);
                    }
                }

                let url = domain + "game/v2/spgame/login_account?account=" + uid + "&login_type=2&token="+ token + "&game_name=car";
                window.globalNativeLog && window.globalNativeLog("window.loginData >>>>>>>>>>>>> login_account req url： " + url + " currentUrl: " + currentUrl);
                let xhr = cc.loader.getXMLHttpRequest();
                xhr.open("GET", url, true);
                xhr.setRequestHeader("Content-Type", "text/plain;charset=UTF-8");
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        let response = xhr.responseText;
                        if (xhr.status >= 200 && xhr.status < 300 && response) {
                            let json = JSON.parse(response).Data;
                            if (json && !json.code) {
                                let clientTime = new Date().getTime() / 1000;
                                json.uid = uid;
                                json.clientTime = clientTime;
                                window.loginData = json; 
                            
                                // cc.sys.localStorage.setItem(key, JSON.stringify(json));
                                let log = "window.loginData >>>>>>>>>>>>>1 data: " // + JSON.stringify(json);
                                window.globalNativeLog && window.globalNativeLog(log);
                            } 
                        } else {
                            //错误不处理了
                            window.globalNativeLog && window.globalNativeLog("window.loginData >>>>>>>>>>>>> 2 status " + xhr.status + response);
                        }
                    }
                };
                xhr.send();
            }
            console.log("loginReq >>>>>>>>>> isAndroid:" + window.isAndroid + " window.isIOS: " + window.isIOS);
            if (window.isAndroid && window.AndroidWebView && window.AndroidWebView.getBaseUrl) {
                let baseUrl = window.AndroidWebView.getBaseUrl();
                console.log("loginReq >>>>>>>>>> isAndroid getBaseUrl");
                loginReq(baseUrl);
            } else if (window.isIOS && window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.getBaseUrl) {
                window.getBaseUrlfromIosbackFn = function(baseUrl) {
                    loginReq(JSON.stringify(baseUrl)); window.getBaseUrlfromIosbackFn = function(){};
                }
                console.log("loginReq >>>>>>>>>> isIOS getBaseUrl");
                window.webkit.messageHandlers.getBaseUrl.postMessage({});//走回调
            }else {
                loginReq(); //网页直接请求
            }     

        } catch (error) {
            window.globalNativeLog && window.globalNativeLog("window.loginData >>>>>>>>>>>>> login_account req error"); 
        }

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

    cc.macro.CLEANUP_IMAGE_CACHE = false;
    cc.macro.ENABLE_MULTI_TOUCH = false;
    window.boot();
}

window.gainLocalStorage = function (json) {
    console.warn("收到IOS返回的json数据：：：：：");
    window.StorageDataIOS = json;
}
