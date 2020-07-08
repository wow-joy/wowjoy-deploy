#!/usr/bin/env bash

# 　　echo -e "\033[30m 黑色字 \033[0m" 
# 　　31m 红色字 32m 绿色字 33m 黄色字 34m 蓝色字 35m 紫色字 36m 天蓝字 37m 白色字
#     echo -e "\033[40;37m 黑底白字 \033[0m" 
# 　　41;37m 红底白字 
# 　　42;37m 绿底白字 43;37m 黄底白字 44;37m 蓝底白字 45;37m 紫底白字 46;37m 天蓝底白字 47;30m 白底黑字
# 　　\33[0m 关闭所有属性 
# 　　\33[1m 设置高亮度 
# 　　\33[4m 下划线 
# 　　\33[5m 闪烁 
# 　　\33[7m 反显 
# 　　\33[8m 消隐 
# 　　\33[30m — \33[37m 设置前景色 
# 　　\33[40m — \33[47m 设置背景色 
# 　　\33[nA 光标上移n行 
# 　　\33[nB 光标下移n行 
# 　　\33[nC 光标右移n行 
# 　　\33[nD 光标左移n行 
# 　　\33[y;xH设置光标位置 
# 　　\33[2J 清屏 
# 　　\33[K 清除从光标到行尾的内容 
# 　　\33[s 保存光标位置 
# 　　\33[u 恢复光标位置 
# 　　\33[?25l 隐藏光标 
# 　　\33[?25h 显示光标


ROOT_DIR=$1
GIT_URL=$2
GIT_BRANCH=$3
TEMP_DIR=$ROOT_DIR/.temp
FRONT_DIR=$TEMP_DIR/src/main/resources
BUILD_DIR=$ROOT_DIR/$OUTPUT
TIME=$(date "+%Y-%m-%d %H:%M:%S")

rm -rf $TEMP_DIR

echo -e "\033[1;33m开始打包代码...\E[0m"
yarn build
echo -e "\033[1;32m打包结束.\E[2J"

echo -e "\033[1;33m拉取后台项目...\E[0m"
git clone -b ${GIT_BRANCH} ${GIT_URL} ${TEMP_DIR}
echo -e "\033[1;32m拉取成功.\E[0m"

if [ ! -d $BUILD_DIR ]; then
  echo -e "\E[31m请先打包项目\E[0m"
  exit
fi

remove_file() {
  rm -rf ${FRONT_DIR}/static/static
  rm ${FRONT_DIR}/templates/asset-manifest.json
  rm ${FRONT_DIR}/templates/index.html
  rm ${FRONT_DIR}/templates/precache-manifest*.js
}
copy_file() {
  mv $BUILD_DIR/static/ ${FRONT_DIR}/static/
  cp -r $BUILD_DIR/* ${FRONT_DIR}/templates/
}

echo -e "\033[1;33m开始注入前端代码...\E[0m"
remove_file
copy_file
echo -e "\033[1;32m注入完毕\E[0m"

cd $TEMP_DIR
git add .
echo -e "\033[1;33mgit add .\E[0m"
echo -e "${TIME}"
git commit -m "front: code push $TIME"
echo -e "\033[1;33mgit commit done.(front: code push $TIME)\E[2J"
echo -e "\033[1;33m开始推送前端代码...\E[0m"
git push
echo -e "\033[1;32m推送完毕.\E[0m"

rm -rf $TEMP_DIR




