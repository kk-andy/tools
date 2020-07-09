
export default {
    verifyTooken() {
        //检查有没有登录信息 包括角色和token
        return new Promise((resolve, reject) => {
            if (!(localStorage.role && sessionStorage.token)) {
                this.toLogin("您还没有登录呦，请先进行登录");
                reject()
            } else if (!(localStorage.role * 1 === 1 || localStorage.role * 1 === 2)) {
                this.toLogin("严重网络波动，请重新登录");
                reject()
            } else {
                //先检查token是否失效
                //再检查localstorage的role是否有认为改动
                this.$axios
                    .get("/authentication", { role: localStorage.role })
                    .then(data => {
                        if (data.code * 1 === 3000) {
                            this.toLogin("您的登录信息已经失效，请重新登录");
                            reject()
                        } else if (data.code * 1 === 999) {
                            this.toLogin("请勿进行任何违规操作！");
                            reject()
                        } else {
                            resolve()
                        }
                    });
            }
        })
    }

}
