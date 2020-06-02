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


START_COLOR='\033[1;36m'
LOADING_COLOR='\033[1;33m'
DONE_COLOR='\033[1;32m'
ERR_COLOR='\033[1;31m'

ROOT_DIR=$1
GIT_URL=$2
GIT_BRANCH=$3
TEMP_DIR=$ROOT_DIR/.temp
FRONT_DIR=$TEMP_DIR/src/main/resources
BUILD_DIR=$ROOT_DIR/build
TIME=$(date "+%Y-%m-%d %H:%M:%S")

rm -rf $TEMP_DIR
if [[ ! $ROOT_DIR || ! $GIT_URL || ! $GIT_BRANCH]]; then
  echo -e "\033[31m请传入ROOT_DIR/GIT_URL/GIT_BRANCH\033[0m"
  exit
fi

echo -e "${START_COLOR}======   start build   ======\033[0m"
yarn build
echo -e "${DONE_COLOR}build done.\033[2J"

echo -e "${START_COLOR}======   start deploy   ======\33[0m"
echo -e "${LOADING_COLOR}start clone...\033[0m"
git clone -b ${GIT_BRANCH} ${GIT_URL} ${TEMP_DIR}
echo -e "${DONE_COLOR}clone done.\033[0m"

if [ ! -d $BUILD_DIR ]; then
  echo -e "\033[31m请先打包项目\033[0m"
  exit
fi

remove_file() {
  rm -rf ${FRONT_DIR}/static/static
  rm ${FRONT_DIR}/templates/asset-manifest.json
  rm ${FRONT_DIR}/templates/index.html
  rm ${FRONT_DIR}/templates/precache-manifest*.js
}
copy_file() {
  cp -r $BUILD_DIR/static/ ${FRONT_DIR}/static/static
  cp $BUILD_DIR/asset-manifest.json ${FRONT_DIR}/templates/
  cp $BUILD_DIR/index.html ${FRONT_DIR}/templates/
  cp $BUILD_DIR/precache-manifest*.js ${FRONT_DIR}/templates/
}

echo -e "${LOADING_COLOR}=====start remove-copy=====\033[0m"
remove_file
copy_file
echo -e "${DONE_COLOR}remove-copy done\033[0m"

cd $TEMP_DIR
echo -e "${LOADING_COLOR}start push\033[0m"
git add .
echo -e "${LOADING_COLOR}add done.\033[0m"
echo -e "${TIME}"
git commit -m "front: code push $TIME"
echo -e "${LOADING_COLOR}commit done.\033[2J"
echo -e "${LOADING_COLOR}===== start push =====\033[0m"
git push
echo -e "${DONE_COLOR}pull done.\033[0m"

rm -rf $TEMP_DIR




